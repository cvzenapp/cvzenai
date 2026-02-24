import sys
import os
# DON'T CHANGE THE ABOVE LINES

import sys
import sqlite3
import json
from datetime import datetime
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_jwt_extended import JWTManager

# Add the src directory to Python path
sys.path.append(os.path.dirname(__file__))

# Import Inertia configuration
from inertia_config import setup_inertia
from inertia import inertia

app = Flask(__name__, template_folder='templates', static_folder='../static')
CORS(app)

# Configure JWT
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False
jwt = JWTManager(app)

# Configure Flask session for flash messages
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')

# Setup Inertia.js
inertia_instance = setup_inertia(app)

DATABASE = os.path.join(os.path.dirname(__file__), 'resume_app.db')

def init_db():
    """Initialize database with required tables"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Resumes table (simplified - only stores final saved data)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS resumes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            original_filename TEXT,
            file_path TEXT,
            parsed_content TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Work experiences table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS work_experiences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resume_id INTEGER NOT NULL,
            company_name TEXT,
            job_title TEXT,
            location TEXT,
            start_date TEXT,
            end_date TEXT,
            is_current BOOLEAN DEFAULT 0,
            description TEXT,
            display_order INTEGER DEFAULT 0,
            FOREIGN KEY (resume_id) REFERENCES resumes (id)
        )
    ''')
    
    # Education table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS educations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resume_id INTEGER NOT NULL,
            institution_name TEXT,
            degree_type TEXT,
            field_of_study TEXT,
            start_date TEXT,
            end_date TEXT,
            gpa REAL,
            description TEXT,
            display_order INTEGER DEFAULT 0,
            FOREIGN KEY (resume_id) REFERENCES resumes (id)
        )
    ''')
    
    # Skills table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS skills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resume_id INTEGER NOT NULL,
            skill_name TEXT NOT NULL,
            skill_category TEXT,
            proficiency_level TEXT,
            display_order INTEGER DEFAULT 0,
            FOREIGN KEY (resume_id) REFERENCES resumes (id)
        )
    ''')
    
    # Resume sections table (for additional sections)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS resume_sections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resume_id INTEGER NOT NULL,
            section_type TEXT NOT NULL,
            section_title TEXT,
            content TEXT,
            display_order INTEGER DEFAULT 0,
            FOREIGN KEY (resume_id) REFERENCES resumes (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized successfully!")

# Inertia Routes (for SSR and page rendering)
@app.route('/')
def landing_page():
    """Landing page route using Inertia"""
    return inertia.render('LandingPage', {
        'features': [
            {
                'title': 'Smart Resume Builder',
                'description': 'AI-powered resume creation with ATS optimization',
                'icon': 'FileText'
            },
            {
                'title': 'Video Resumes',
                'description': 'Stand out with professional video introductions',
                'icon': 'Video'
            },
            {
                'title': 'Job Matching',
                'description': 'Get matched with relevant tech opportunities',
                'icon': 'Target'
            }
        ]
    })

@app.route('/login')
def login_page():
    """Login page route using Inertia"""
    return inertia.render('LoginPage')

@app.route('/register')
def register_page():
    """Register page route using Inertia"""
    return inertia.render('RegisterPage')

@app.route('/dashboard')
@jwt_required()
def dashboard_page():
    """Dashboard page route using Inertia"""
    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    
    # Get user's resumes
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, title, original_filename, created_at, updated_at, is_active
        FROM resumes 
        WHERE user_id = ? AND is_active = 1
        ORDER BY updated_at DESC
    ''', (user_id,))
    
    resumes = []
    for row in cursor.fetchall():
        resumes.append({
            'id': row[0],
            'title': row[1],
            'filename': row[2],
            'created_at': row[3],
            'updated_at': row[4],
            'is_active': bool(row[5])
        })
    
    conn.close()
    
    return inertia.render('Dashboard', {
        'resumes': resumes
    })

@app.route('/upload')
@jwt_required()
def upload_page():
    """Resume upload page route using Inertia"""
    return inertia.render('ResumeUpload')

@app.route('/resume/<int:resume_id>/edit')
@jwt_required()
def resume_edit_page(resume_id):
    """Resume editor page route using Inertia"""
    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    
    # Get resume data
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, title, parsed_content, original_filename
        FROM resumes 
        WHERE id = ? AND user_id = ? AND is_active = 1
    ''', (resume_id, user_id))
    
    resume_data = cursor.fetchone()
    conn.close()
    
    if not resume_data:
        from inertia_config import flash_message
        flash_message('Resume not found', 'error')
        return inertia.redirect('/dashboard')
    
    resume = {
        'id': resume_data[0],
        'title': resume_data[1],
        'content': json.loads(resume_data[2]) if resume_data[2] else {},
        'filename': resume_data[3]
    }
    
    return inertia.render('ResumeEditor', {
        'resume': resume
    })

# Catch-all route for SPA routing
@app.route('/<path:path>')
def catch_all(path):
    """Catch-all route for client-side routing"""
    # If it's an API request, return 404
    if path.startswith('api/'):
        return jsonify({'error': 'API endpoint not found'}), 404
    
    # Otherwise, let the frontend handle routing
    return inertia.render('App')

def get_user_from_token(token):
    """Simple token validation - returns user_id"""
    # For demo purposes, extract user_id from token
    if token.startswith('simple_token_'):
        try:
            return int(token.split('_')[-1])
        except:
            return None
    return None

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": datetime.utcnow().isoformat()})

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register new user"""
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not all([username, email, password]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO users (username, email, password_hash)
                VALUES (?, ?, ?)
            ''', (username, email, password))  # In production, hash the password
            
            user_id = cursor.lastrowid
            conn.commit()
            
            return jsonify({
                'message': 'User registered successfully',
                'user': {'id': user_id, 'username': username, 'email': email},
                'token': f'simple_token_{user_id}'
            }), 201
            
        except sqlite3.IntegrityError:
            return jsonify({'error': 'Username or email already exists'}), 409
        finally:
            conn.close()
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not all([email, password]):
            return jsonify({'error': 'Missing email or password'}), 400
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, username, email FROM users 
            WHERE email = ? AND password_hash = ?
        ''', (email, password))  # In production, verify hashed password
        
        user = cursor.fetchone()
        conn.close()
        
        if user:
            user_id, username, email = user
            return jsonify({
                'message': 'Login successful',
                'user': {'id': user_id, 'username': username, 'email': email},
                'token': f'simple_token_{user_id}'
            })
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/resumes/parse', methods=['POST'])
def parse_resume_only():
    """Parse resume and return structured data WITHOUT storing to database"""
    try:
        # Get user from token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token required'}), 401
        
        token = auth_header.split(' ')[1]
        user_id = get_user_from_token(token)
        if not user_id:
            return jsonify({'error': 'Invalid token'}), 401

        # Check if file is present
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]
        title = request.form.get("title", "")

        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        # Create temporary upload folder
        upload_dir = os.path.join(os.path.dirname(__file__), 'temp_uploads')
        os.makedirs(upload_dir, exist_ok=True)

        # Generate secure filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"temp_{user_id}_{timestamp}_{file.filename}"
        file_path = os.path.join(upload_dir, filename)

        # Save file temporarily
        file.save(file_path)
        print(f"DEBUG: Temporary file saved to {file_path}")

        try:
            # Parse resume with enterprise parser
            from utils.resume_parser import EnterpriseResumeParser
            parser = EnterpriseResumeParser()
            parsed_data = parser.parse_resume(file_path)
            
            print(f"DEBUG: Enterprise parsing completed")
            print(f"DEBUG: Personal info: {parsed_data.get('personal_info', {})}")
            print(f"DEBUG: Contact info: {parsed_data.get('contact_info', {})}")
            print(f"DEBUG: Work experience count: {len(parsed_data.get('work_experience', []))}")
            print(f"DEBUG: Education count: {len(parsed_data.get('education', []))}")
            print(f"DEBUG: Skills count: {len(parsed_data.get('skills', []))}")
            
            # Clean up temporary file
            os.remove(file_path)
            
            # Return parsed data directly to frontend for field population
            return jsonify({
                "message": "Resume parsed successfully",
                "parsed_data": {
                    "personal_info": parsed_data.get("personal_info", {}),
                    "contact_info": parsed_data.get("contact_info", {}),
                    "work_experience": parsed_data.get("work_experience", []),
                    "education": parsed_data.get("education", []),
                    "skills": parsed_data.get("skills", []),
                    "certifications": parsed_data.get("certifications", []),
                    "projects": parsed_data.get("projects", []),
                    "languages": parsed_data.get("languages", []),
                    "metadata": parsed_data.get("metadata", {}),
                    "raw_text": parsed_data.get("raw_text", ""),
                    "parser_version": parsed_data.get("parser_version", "2.0.0"),
                    "accuracy_score": parsed_data.get("accuracy_score", 0.0),
                    "parsed_at": parsed_data.get("parsed_at", datetime.utcnow().isoformat())
                },
                "original_filename": file.filename,
                "suggested_title": title or parsed_data.get("personal_info", {}).get("name", "") or "New Resume"
            }), 200
            
        except Exception as parse_error:
            # Clean up temporary file on error
            if os.path.exists(file_path):
                os.remove(file_path)
            print(f"DEBUG: Parsing error: {parse_error}")
            return jsonify({"error": f"Parsing failed: {str(parse_error)}"}), 500
        
    except Exception as e:
        print(f"DEBUG: Upload error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/resumes/save', methods=['POST'])

def save_resume():
    """Save user-reviewed resume data to database"""
    try:
        # Get user from token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token required'}), 401
        
        token = auth_header.split(' ')[1]
        user_id = get_user_from_token(token)
        if not user_id:
            return jsonify({'error': 'Invalid token'}), 401

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Extract data from request
        title = data.get('title', 'New Resume')
        personal_info = data.get('personal_info', {})
        contact_info = data.get('contact_info', {})
        work_experience = data.get('work_experience', [])
        education = data.get('education', [])
        skills = data.get('skills', [])
        raw_text = data.get('raw_text', '')
        original_filename = data.get('original_filename', '')

        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        try:
            # Create resume record
            cursor.execute('''
                INSERT INTO resumes (user_id, title, original_filename, parsed_content)
                VALUES (?, ?, ?, ?)
            ''', (user_id, title, original_filename, raw_text))
            
            resume_id = cursor.lastrowid
            print(f"DEBUG: Created resume with ID: {resume_id}")

            # Save work experiences
            for i, exp in enumerate(work_experience):
                cursor.execute('''
                    INSERT INTO work_experiences (resume_id, company_name, job_title, location, start_date, end_date, is_current, description, display_order)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (resume_id, exp.get("company_name"), exp.get("job_title"), 
                      exp.get("location"), exp.get("start_date"), exp.get("end_date"),
                      exp.get("is_current", False), exp.get("description"), i))

            # Save education entries
            for i, edu in enumerate(education):
                cursor.execute('''
                    INSERT INTO educations (resume_id, institution_name, degree_type, field_of_study, start_date, end_date, gpa, description, display_order)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (resume_id, edu.get("institution_name"), edu.get("degree_type"), 
                      edu.get("field_of_study"), edu.get("start_date"), edu.get("end_date"),
                      edu.get("gpa"), edu.get("description"), i))

            # Save skills
            for i, skill in enumerate(skills):
                cursor.execute('''
                    INSERT INTO skills (resume_id, skill_name, skill_category, proficiency_level, display_order)
                    VALUES (?, ?, ?, ?, ?)
                ''', (resume_id, skill.get("skill_name"), skill.get("skill_category"), 
                      skill.get("proficiency_level"), i))

            # Save personal info as section
            if personal_info:
                personal_content = f"Name: {personal_info.get('name', '')}\nTitle: {personal_info.get('title', '')}\nSummary: {personal_info.get('summary', '')}"
                cursor.execute('''
                    INSERT INTO resume_sections (resume_id, section_type, section_title, content, display_order)
                    VALUES (?, ?, ?, ?, ?)
                ''', (resume_id, "personal_info", "Personal Information", personal_content, 0))

            # Save contact info as section
            if contact_info:
                contact_content = f"Email: {contact_info.get('email', '')}\nPhone: {contact_info.get('phone', '')}\nLocation: {contact_info.get('location', '')}\nLinkedIn: {contact_info.get('linkedin', '')}\nGitHub: {contact_info.get('github', '')}"
                cursor.execute('''
                    INSERT INTO resume_sections (resume_id, section_type, section_title, content, display_order)
                    VALUES (?, ?, ?, ?, ?)
                ''', (resume_id, "contact_info", "Contact Information", contact_content, 1))

            conn.commit()
            print(f"DEBUG: Successfully saved resume {resume_id}")
            
            return jsonify({
                "message": "Resume saved successfully",
                "resume": {
                    "id": resume_id,
                    "title": title,
                    "original_filename": original_filename
                }
            }), 201
            
        except Exception as e:
            print(f"DEBUG: Database error: {e}")
            conn.rollback()
            raise e
        finally:
            conn.close()
        
    except Exception as e:
        print(f"DEBUG: Save error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/resumes/parse-and-save', methods=['POST'])
def parse_and_save_resume():
    """Parse resume file and save to database in one step"""
    try:
        # Get user from token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token required'}), 401
        
        token = auth_header.split(' ')[1]
        user_id = get_user_from_token(token)
        if not user_id:
            return jsonify({'error': 'Invalid token'}), 401

        # Check if file is present
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]
        title = request.form.get("title", "")

        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        # Create temporary upload folder
        upload_dir = os.path.join(os.path.dirname(__file__), 'temp_uploads')
        os.makedirs(upload_dir, exist_ok=True)

        # Generate secure filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"temp_{user_id}_{timestamp}_{file.filename}"
        file_path = os.path.join(upload_dir, filename)

        # Save file temporarily
        file.save(file_path)
        print(f"DEBUG: Temporary file saved to {file_path}")

        try:
            # Parse resume with enterprise parser
            from utils.resume_parser import EnterpriseResumeParser
            parser = EnterpriseResumeParser()
            parsed_data = parser.parse_resume(file_path)
            
            print(f"DEBUG: Enterprise parsing completed")
            
            # Clean up temporary file
            os.remove(file_path)
            
            # Extract data for saving
            suggested_title = title or parsed_data.get("personal_info", {}).get("name", "") or "New Resume"
            personal_info = parsed_data.get("personal_info", {})
            contact_info = parsed_data.get("contact_info", {})
            work_experience = parsed_data.get("work_experience", [])
            education = parsed_data.get("education", [])
            skills = parsed_data.get("skills", [])
            raw_text = parsed_data.get("raw_text", "")

            # Save to database
            conn = sqlite3.connect(DATABASE)
            cursor = conn.cursor()
            
            try:
                # Create resume record
                cursor.execute('''
                    INSERT INTO resumes (user_id, title, original_filename, parsed_content)
                    VALUES (?, ?, ?, ?)
                ''', (user_id, suggested_title, file.filename, raw_text))
                
                resume_id = cursor.lastrowid
                print(f"DEBUG: Created resume with ID: {resume_id}")

                # Save work experiences
                for i, exp in enumerate(work_experience):
                    cursor.execute('''
                        INSERT INTO work_experiences (resume_id, company_name, job_title, location, start_date, end_date, is_current, description, display_order)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (resume_id, exp.get("company_name"), exp.get("job_title"), 
                          exp.get("location"), exp.get("start_date"), exp.get("end_date"),
                          exp.get("is_current", False), exp.get("description"), i))

                # Save education entries
                for i, edu in enumerate(education):
                    cursor.execute('''
                        INSERT INTO educations (resume_id, institution_name, degree_type, field_of_study, start_date, end_date, gpa, description, display_order)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (resume_id, edu.get("institution_name"), edu.get("degree_type"), 
                          edu.get("field_of_study"), edu.get("start_date"), edu.get("end_date"),
                          edu.get("gpa"), edu.get("description"), i))

                # Save skills
                for i, skill in enumerate(skills):
                    cursor.execute('''
                        INSERT INTO skills (resume_id, skill_name, skill_category, proficiency_level, display_order)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (resume_id, skill.get("skill_name"), skill.get("skill_category"), 
                          skill.get("proficiency_level"), i))

                # Save personal info as section
                if personal_info:
                    personal_content = f"Name: {personal_info.get('name', '')}\nTitle: {personal_info.get('title', '')}\nSummary: {personal_info.get('summary', '')}"
                    cursor.execute('''
                        INSERT INTO resume_sections (resume_id, section_type, section_title, content, display_order)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (resume_id, "personal_info", "Personal Information", personal_content, 0))

                # Save contact info as section
                if contact_info:
                    contact_content = f"Email: {contact_info.get('email', '')}\nPhone: {contact_info.get('phone', '')}\nLocation: {contact_info.get('location', '')}\nLinkedIn: {contact_info.get('linkedin', '')}\nGitHub: {contact_info.get('github', '')}"
                    cursor.execute('''
                        INSERT INTO resume_sections (resume_id, section_type, section_title, content, display_order)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (resume_id, "contact_info", "Contact Information", contact_content, 1))

                conn.commit()
                print(f"DEBUG: Successfully saved resume {resume_id}")
                
                return jsonify({
                    "message": "Resume parsed and saved successfully",
                    "resume": {
                        "id": resume_id,
                        "title": suggested_title,
                        "original_filename": file.filename
                    },
                    "parsed_data": {
                        "personal_info": personal_info,
                        "contact_info": contact_info,
                        "work_experience": work_experience,
                        "education": education,
                        "skills": skills,
                        "certifications": parsed_data.get("certifications", []),
                        "projects": parsed_data.get("projects", []),
                        "languages": parsed_data.get("languages", []),
                        "metadata": parsed_data.get("metadata", {}),
                        "accuracy_score": parsed_data.get("accuracy_score", 0.0)
                    }
                }), 201
                
            except Exception as e:
                print(f"DEBUG: Database error: {e}")
                conn.rollback()
                raise e
            finally:
                conn.close()
            
        except Exception as parse_error:
            # Clean up temporary file on error
            if os.path.exists(file_path):
                os.remove(file_path)
            print(f"DEBUG: Parsing error: {parse_error}")
            return jsonify({"error": f"Parsing failed: {str(parse_error)}"}), 500
        
    except Exception as e:
        print(f"DEBUG: Upload error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/resumes', methods=['GET'])
def get_resumes():
    """Get all resumes for user"""
    try:
        # Get user from token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token required'}), 401
        
        token = auth_header.split(' ')[1]
        user_id = get_user_from_token(token)
        if not user_id:
            return jsonify({'error': 'Invalid token'}), 401

        conn = sqlite3.connect(DATABASE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, title, original_filename, created_at, updated_at
            FROM resumes 
            WHERE user_id = ? AND is_active = 1
            ORDER BY updated_at DESC
        ''', (user_id,))
        
        resumes = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({"resumes": resumes})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/resumes/<int:resume_id>', methods=['GET'])
def get_resume(resume_id):
    """Get specific resume with all data"""
    try:
        # Get user from token
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token required'}), 401
        
        token = auth_header.split(' ')[1]
        user_id = get_user_from_token(token)
        if not user_id:
            return jsonify({'error': 'Invalid token'}), 401

        conn = sqlite3.connect(DATABASE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get resume
        cursor.execute('''
            SELECT * FROM resumes 
            WHERE id = ? AND user_id = ? AND is_active = 1
        ''', (resume_id, user_id))
        
        resume = cursor.fetchone()
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404

        # Get work experiences
        cursor.execute('''
            SELECT * FROM work_experiences 
            WHERE resume_id = ? 
            ORDER BY display_order
        ''', (resume_id,))
        work_experiences = [dict(row) for row in cursor.fetchall()]

        # Get education
        cursor.execute('''
            SELECT * FROM educations 
            WHERE resume_id = ? 
            ORDER BY display_order
        ''', (resume_id,))
        educations = [dict(row) for row in cursor.fetchall()]

        # Get skills
        cursor.execute('''
            SELECT * FROM skills 
            WHERE resume_id = ? 
            ORDER BY display_order
        ''', (resume_id,))
        skills = [dict(row) for row in cursor.fetchall()]

        # Get sections
        cursor.execute('''
            SELECT * FROM resume_sections 
            WHERE resume_id = ? 
            ORDER BY display_order
        ''', (resume_id,))
        sections = [dict(row) for row in cursor.fetchall()]

        conn.close()
        
        # Parse personal and contact info from sections
        personal_info = {}
        contact_info = {}
        
        for section in sections:
            if section['section_type'] == 'personal_info':
                # Parse personal info from content
                lines = section['content'].split('\n')
                for line in lines:
                    if ':' in line:
                        key, value = line.split(':', 1)
                        personal_info[key.strip().lower()] = value.strip()
            elif section['section_type'] == 'contact_info':
                # Parse contact info from content
                lines = section['content'].split('\n')
                for line in lines:
                    if ':' in line:
                        key, value = line.split(':', 1)
                        contact_info[key.strip().lower()] = value.strip()

        return jsonify({
            "resume": dict(resume),
            "personal_info": personal_info,
            "contact_info": contact_info,
            "work_experience": work_experiences,
            "education": educations,
            "skills": skills,
            "sections": sections
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    init_db()
    print("🚀 Starting Enterprise Resume Parser Backend")
    print("📊 Parse-only mode: Upload → Parse → Populate Fields → User Review → Save")
    app.run(host='0.0.0.0', port=5001, debug=True)

