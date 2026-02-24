import os
from flask import Blueprint, jsonify, request, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from datetime import datetime
from src.models.user import User, Resume, ResumeSection, WorkExperience, Education, Skill, db
from src.utils.resume_parser import ResumeParser

resume_bp = Blueprint('resume', __name__)

# Configure upload settings
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'txt'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_upload_folder():
    """Create upload folder if it doesn't exist"""
    upload_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), UPLOAD_FOLDER)
    if not os.path.exists(upload_path):
        os.makedirs(upload_path)
    return upload_path

@resume_bp.route('/resumes', methods=['GET'])
@jwt_required()
def get_resumes():
    """Get all resumes for the authenticated user"""
    try:
        user_id = int(get_jwt_identity())  # Convert string back to int
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        sort_by = request.args.get('sort_by', 'created_at')
        order = request.args.get('order', 'desc')
        
        # Build query
        query = Resume.query.filter_by(user_id=user_id, is_active=True)
        
        # Apply sorting
        if hasattr(Resume, sort_by):
            if order.lower() == 'desc':
                query = query.order_by(getattr(Resume, sort_by).desc())
            else:
                query = query.order_by(getattr(Resume, sort_by))
        
        # Paginate results
        resumes = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'resumes': [resume.to_dict() for resume in resumes.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': resumes.total,
                'pages': resumes.pages,
                'has_next': resumes.has_next,
                'has_prev': resumes.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@resume_bp.route("/resumes/upload", methods=["POST"])
@jwt_required()
def upload_resume():
    """Upload and parse a new resume file with comprehensive field extraction"""
    try:
        user_id = int(get_jwt_identity())  # Convert string back to int

        # Check if file is present
        if "file" not in request.files:
            print("Error: No file provided")
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]
        title = request.form.get("title", "")

        if file.filename == "":
            print("Error: No file selected")
            return jsonify({"error": "No file selected"}), 400

        if not allowed_file(file.filename):
            print(f"Error: File type not allowed: {file.filename}")
            return jsonify({"error": "File type not allowed"}), 400

        # Create upload folder
        upload_path = create_upload_folder()

        # Generate secure filename
        filename = secure_filename(file.filename)
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{user_id}_{timestamp}_{filename}"
        file_path = os.path.join(upload_path, filename)

        # Save file
        file.save(file_path)
        print(f"File saved to: {file_path}")

        # Parse resume with enhanced parser
        parser = ResumeParser()
        parsed_data = parser.parse_resume(file_path)
        print(f"Parsed Data Keys: {list(parsed_data.keys())}")

        # Create resume record with personal info
        personal_info = parsed_data.get("personal_info", {})
        resume_title = title or personal_info.get('name', '') or ("Resume - " + datetime.utcnow().strftime("%Y-%m-%d"))
        
        resume = Resume(
            user_id=user_id,
            title=resume_title,
            original_filename=file.filename,
            file_path=file_path,
            parsed_content=parsed_data["cleaned_text"]
        )

        db.session.add(resume)
        db.session.flush()  # Get the resume ID

        # Create resume sections with enhanced data
        sections_data = parsed_data.get("sections", {})
        
        # Add personal info as a section
        if personal_info:
            personal_section = ResumeSection(
                resume_id=resume.id,
                section_type="personal_info",
                section_title="Personal Information",
                content=f"Name: {personal_info.get('name', '')}\nTitle: {personal_info.get('title', '')}\nSummary: {personal_info.get('summary', '')}",
                display_order=0
            )
            db.session.add(personal_section)

        # Create sections for each identified section
        for section_type, content_list in sections_data.items():
            if content_list:
                section = ResumeSection(
                    resume_id=resume.id,
                    section_type=section_type,
                    section_title=section_type.replace("_", " ").title(),
                    content="\n".join(content_list) if isinstance(content_list, list) else str(content_list),
                    display_order=len(sections_data)
                )
                db.session.add(section)

        # Create detailed work experience entries
        work_experiences = parsed_data.get("work_experience", [])
        for i, exp in enumerate(work_experiences):
            work_exp = WorkExperience(
                resume_id=resume.id,
                company_name=exp.get("company_name"),
                job_title=exp.get("job_title"),
                location=exp.get("location"),
                description=exp.get("description"),
                is_current=exp.get("is_current", False),
                display_order=i
            )
            
            # Parse dates if available
            if exp.get("start_date"):
                try:
                    # Simple date parsing - can be enhanced
                    start_date_str = exp["start_date"]
                    if start_date_str.isdigit() and len(start_date_str) == 4:
                        work_exp.start_date = datetime(int(start_date_str), 1, 1).date()
                except:
                    pass
            
            if exp.get("end_date") and exp["end_date"].lower() not in ['present', 'current']:
                try:
                    end_date_str = exp["end_date"]
                    if end_date_str.isdigit() and len(end_date_str) == 4:
                        work_exp.end_date = datetime(int(end_date_str), 12, 31).date()
                except:
                    pass
            
            db.session.add(work_exp)

        # Create detailed education entries
        educations = parsed_data.get("education", [])
        for i, edu in enumerate(educations):
            education = Education(
                resume_id=resume.id,
                institution_name=edu.get("institution_name"),
                degree_type=edu.get("degree_type"),
                field_of_study=edu.get("field_of_study"),
                description=edu.get("description"),
                display_order=i
            )
            
            # Parse graduation year if available
            if edu.get("graduation_year"):
                try:
                    grad_year = int(edu["graduation_year"])
                    education.end_date = datetime(grad_year, 6, 1).date()  # Assume June graduation
                except:
                    pass
            
            # Parse GPA if available
            if edu.get("gpa"):
                try:
                    education.gpa = float(edu["gpa"])
                except:
                    pass
            
            db.session.add(education)

        # Create detailed skill entries
        skills = parsed_data.get("skills", [])
        for i, skill_data in enumerate(skills):
            skill = Skill(
                resume_id=resume.id,
                skill_name=skill_data.get("skill_name", skill_data.get("name", "")),
                skill_category=skill_data.get("skill_category", skill_data.get("category", "")),
                proficiency_level=skill_data.get("proficiency_level"),
                display_order=i
            )
            db.session.add(skill)

        # Create sections for additional data
        additional_sections = [
            ("certifications", "Certifications"),
            ("projects", "Projects"),
            ("languages", "Languages")
        ]
        
        for section_key, section_title in additional_sections:
            section_data = parsed_data.get(section_key, [])
            if section_data:
                content_lines = []
                for item in section_data:
                    if isinstance(item, dict):
                        if section_key == "certifications":
                            content_lines.append(item.get("name", ""))
                        elif section_key == "projects":
                            content_lines.append(f"{item.get('name', '')}: {item.get('description', '')}")
                        elif section_key == "languages":
                            lang_line = item.get("language", "")
                            if item.get("proficiency"):
                                lang_line += f" ({item['proficiency']})"
                            content_lines.append(lang_line)
                    else:
                        content_lines.append(str(item))
                
                if content_lines:
                    additional_section = ResumeSection(
                        resume_id=resume.id,
                        section_type=section_key,
                        section_title=section_title,
                        content="\n".join(content_lines),
                        display_order=len(sections_data) + len(additional_sections)
                    )
                    db.session.add(additional_section)

        db.session.commit()

        print("Success: Resume uploaded and parsed successfully with comprehensive field extraction")
        return jsonify({
            "message": "Resume uploaded and parsed successfully",
            "resume": resume.to_dict(),
            "parsed_data": {
                "personal_info": parsed_data.get("personal_info", {}),
                "contact_info": parsed_data.get("contact_info", {}),
                "sections_count": len(parsed_data.get("sections", {})),
                "work_experience_count": len(parsed_data.get("work_experience", [])),
                "education_count": len(parsed_data.get("education", [])),
                "skills_count": len(parsed_data.get("skills", [])),
                "certifications_count": len(parsed_data.get("certifications", [])),
                "projects_count": len(parsed_data.get("projects", [])),
                "languages_count": len(parsed_data.get("languages", []))
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        # Clean up uploaded file on error
        if "file_path" in locals() and os.path.exists(file_path):
            os.remove(file_path)
        print(f"Error during upload: {e}")
        return jsonify({"error": str(e)}), 500

@resume_bp.route('/resumes/<int:resume_id>', methods=['GET'])
@jwt_required()
def get_resume(resume_id):
    """Get specific resume with all sections and comprehensive data"""
    try:
        user_id = int(get_jwt_identity())  # Convert string back to int
        
        resume = Resume.query.filter_by(
            id=resume_id, 
            user_id=user_id, 
            is_active=True
        ).first()
        
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        # Get all related data
        sections = [section.to_dict() for section in resume.sections]
        work_experiences = [exp.to_dict() for exp in resume.work_experiences]
        educations = [edu.to_dict() for edu in resume.educations]
        skills = [skill.to_dict() for skill in resume.skills]
        
        return jsonify({
            'resume': resume.to_dict(),
            'sections': sections,
            'work_experiences': work_experiences,
            'educations': educations,
            'skills': skills
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@resume_bp.route('/resumes/<int:resume_id>', methods=['PUT'])
@jwt_required()
def update_resume(resume_id):
    """Update resume metadata"""
    try:
        user_id = int(get_jwt_identity())  # Convert string back to int
        
        resume = Resume.query.filter_by(
            id=resume_id, 
            user_id=user_id, 
            is_active=True
        ).first()
        
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'title' in data:
            resume.title = data['title']
        
        resume.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Resume updated successfully',
            'resume': resume.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@resume_bp.route('/resumes/<int:resume_id>', methods=['DELETE'])
@jwt_required()
def delete_resume(resume_id):
    """Delete resume and all associated data"""
    try:
        user_id = int(get_jwt_identity())  # Convert string back to int
        
        resume = Resume.query.filter_by(
            id=resume_id, 
            user_id=user_id, 
            is_active=True
        ).first()
        
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        # Soft delete
        resume.is_active = False
        resume.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Clean up file
        if resume.file_path and os.path.exists(resume.file_path):
            try:
                os.remove(resume.file_path)
            except Exception as e:
                print(f"Warning: Could not delete file {resume.file_path}: {e}")
        
        return jsonify({'message': 'Resume deleted successfully'}), 204
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Resume Sections endpoints
@resume_bp.route('/resumes/<int:resume_id>/sections', methods=['GET'])
@jwt_required()
def get_resume_sections(resume_id):
    """Get all sections for a specific resume"""
    try:
        user_id = int(get_jwt_identity())  # Convert string back to int
        
        resume = Resume.query.filter_by(
            id=resume_id, 
            user_id=user_id, 
            is_active=True
        ).first()
        
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        section_type = request.args.get('section_type')
        
        query = ResumeSection.query.filter_by(resume_id=resume_id)
        if section_type:
            query = query.filter_by(section_type=section_type)
        
        sections = query.order_by(ResumeSection.display_order).all()
        
        return jsonify({
            'sections': [section.to_dict() for section in sections]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@resume_bp.route('/resumes/<int:resume_id>/sections', methods=['POST'])
@jwt_required()
def create_resume_section(resume_id):
    """Create a new resume section"""
    try:
        user_id = int(get_jwt_identity())  # Convert string back to int
        
        resume = Resume.query.filter_by(
            id=resume_id, 
            user_id=user_id, 
            is_active=True
        ).first()
        
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        if not data.get('section_type'):
            return jsonify({'error': 'section_type is required'}), 400
        
        section = ResumeSection(
            resume_id=resume_id,
            section_type=data['section_type'],
            section_title=data.get('section_title', ''),
            content=data.get('content', ''),
            display_order=data.get('display_order', 0)
        )
        
        db.session.add(section)
        db.session.commit()
        
        return jsonify({
            'message': 'Section created successfully',
            'section': section.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@resume_bp.route('/resumes/<int:resume_id>/sections/<int:section_id>', methods=['PUT'])
@jwt_required()
def update_resume_section(resume_id, section_id):
    """Update a specific resume section"""
    try:
        user_id = int(get_jwt_identity())  # Convert string back to int
        
        # Verify resume ownership
        resume = Resume.query.filter_by(
            id=resume_id, 
            user_id=user_id, 
            is_active=True
        ).first()
        
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        section = ResumeSection.query.filter_by(
            id=section_id, 
            resume_id=resume_id
        ).first()
        
        if not section:
            return jsonify({'error': 'Section not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'section_title' in data:
            section.section_title = data['section_title']
        if 'content' in data:
            section.content = data['content']
        if 'display_order' in data:
            section.display_order = data['display_order']
        
        section.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Section updated successfully',
            'section': section.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@resume_bp.route('/resumes/<int:resume_id>/sections/<int:section_id>', methods=['DELETE'])
@jwt_required()
def delete_resume_section(resume_id, section_id):
    """Delete a specific resume section"""
    try:
        user_id = int(get_jwt_identity())  # Convert string back to int
        
        # Verify resume ownership
        resume = Resume.query.filter_by(
            id=resume_id, 
            user_id=user_id, 
            is_active=True
        ).first()
        
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        section = ResumeSection.query.filter_by(
            id=section_id, 
            resume_id=resume_id
        ).first()
        
        if not section:
            return jsonify({'error': 'Section not found'}), 404
        
        db.session.delete(section)
        db.session.commit()
        
        return jsonify({'message': 'Section deleted successfully'}), 204
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Work Experience endpoints
@resume_bp.route('/resumes/<int:resume_id>/work-experience', methods=['GET'])
@jwt_required()
def get_work_experiences(resume_id):
    """Get all work experiences for a specific resume"""
    try:
        user_id = int(get_jwt_identity())
        
        resume = Resume.query.filter_by(
            id=resume_id, 
            user_id=user_id, 
            is_active=True
        ).first()
        
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        work_experiences = WorkExperience.query.filter_by(
            resume_id=resume_id
        ).order_by(WorkExperience.display_order).all()
        
        return jsonify({
            'work_experiences': [exp.to_dict() for exp in work_experiences]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@resume_bp.route('/resumes/<int:resume_id>/work-experience/<int:exp_id>', methods=['PUT'])
@jwt_required()
def update_work_experience(resume_id, exp_id):
    """Update a specific work experience"""
    try:
        user_id = int(get_jwt_identity())
        
        # Verify resume ownership
        resume = Resume.query.filter_by(
            id=resume_id, 
            user_id=user_id, 
            is_active=True
        ).first()
        
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        work_exp = WorkExperience.query.filter_by(
            id=exp_id, 
            resume_id=resume_id
        ).first()
        
        if not work_exp:
            return jsonify({'error': 'Work experience not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        updatable_fields = [
            'company_name', 'job_title', 'location', 'description', 
            'achievements', 'is_current', 'display_order'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(work_exp, field, data[field])
        
        # Handle date fields
        if 'start_date' in data and data['start_date']:
            try:
                work_exp.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            except:
                pass
        
        if 'end_date' in data and data['end_date']:
            try:
                work_exp.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
            except:
                pass
        
        work_exp.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Work experience updated successfully',
            'work_experience': work_exp.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Education endpoints
@resume_bp.route('/resumes/<int:resume_id>/education', methods=['GET'])
@jwt_required()
def get_educations(resume_id):
    """Get all education entries for a specific resume"""
    try:
        user_id = int(get_jwt_identity())
        
        resume = Resume.query.filter_by(
            id=resume_id, 
            user_id=user_id, 
            is_active=True
        ).first()
        
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        educations = Education.query.filter_by(
            resume_id=resume_id
        ).order_by(Education.display_order).all()
        
        return jsonify({
            'educations': [edu.to_dict() for edu in educations]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@resume_bp.route('/resumes/<int:resume_id>/education/<int:edu_id>', methods=['PUT'])
@jwt_required()
def update_education(resume_id, edu_id):
    """Update a specific education entry"""
    try:
        user_id = int(get_jwt_identity())
        
        # Verify resume ownership
        resume = Resume.query.filter_by(
            id=resume_id, 
            user_id=user_id, 
            is_active=True
        ).first()
        
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        education = Education.query.filter_by(
            id=edu_id, 
            resume_id=resume_id
        ).first()
        
        if not education:
            return jsonify({'error': 'Education entry not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        updatable_fields = [
            'institution_name', 'degree_type', 'field_of_study', 
            'location', 'description', 'gpa', 'display_order'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(education, field, data[field])
        
        # Handle date fields
        if 'start_date' in data and data['start_date']:
            try:
                education.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            except:
                pass
        
        if 'end_date' in data and data['end_date']:
            try:
                education.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
            except:
                pass
        
        education.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Education updated successfully',
            'education': education.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Skills endpoints
@resume_bp.route('/resumes/<int:resume_id>/skills', methods=['GET'])
@jwt_required()
def get_skills(resume_id):
    """Get all skills for a specific resume"""
    try:
        user_id = int(get_jwt_identity())
        
        resume = Resume.query.filter_by(
            id=resume_id, 
            user_id=user_id, 
            is_active=True
        ).first()
        
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        skills = Skill.query.filter_by(
            resume_id=resume_id
        ).order_by(Skill.display_order).all()
        
        return jsonify({
            'skills': [skill.to_dict() for skill in skills]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@resume_bp.route('/resumes/<int:resume_id>/skills/<int:skill_id>', methods=['PUT'])
@jwt_required()
def update_skill(resume_id, skill_id):
    """Update a specific skill"""
    try:
        user_id = int(get_jwt_identity())
        
        # Verify resume ownership
        resume = Resume.query.filter_by(
            id=resume_id, 
            user_id=user_id, 
            is_active=True
        ).first()
        
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        skill = Skill.query.filter_by(
            id=skill_id, 
            resume_id=resume_id
        ).first()
        
        if not skill:
            return jsonify({'error': 'Skill not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        updatable_fields = [
            'skill_name', 'skill_category', 'proficiency_level', 
            'years_experience', 'description', 'display_order'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(skill, field, data[field])
        
        skill.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Skill updated successfully',
            'skill': skill.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@resume_bp.route('/<int:resume_id>/download', methods=['GET'])
@jwt_required()
def download_resume_pdf(resume_id):
    """Download resume as PDF"""
    try:
        current_user_id = int(get_jwt_identity())  # Convert string back to int
        
        # Get resume and verify ownership
        resume = Resume.query.filter_by(id=resume_id, user_id=current_user_id).first()
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        # Prepare resume data for PDF generation
        resume_data = {
            'user': resume.user.to_dict(),
            'sections': [section.to_dict() for section in resume.sections],
            'work_experiences': [exp.to_dict() for exp in resume.work_experiences],
            'educations': [edu.to_dict() for edu in resume.educations],
            'skills': [skill.to_dict() for skill in resume.skills]
        }
        
        # Generate PDF
        from ..utils.pdf_generator import generate_resume_pdf
        
        # Create temporary file path
        pdf_filename = f"resume_{resume_id}_{current_user_id}.pdf"
        pdf_path = os.path.join(current_app.config.get('UPLOAD_FOLDER', '/tmp'), pdf_filename)
        
        # Generate the PDF
        success = generate_resume_pdf(resume_data, pdf_path)
        
        if not success:
            return jsonify({'error': 'Failed to generate PDF'}), 500
        
        # Return the PDF file
        return send_file(
            pdf_path,
            as_attachment=True,
            download_name=f"{resume.title}.pdf",
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

