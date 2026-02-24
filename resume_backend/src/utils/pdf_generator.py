import os
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from datetime import datetime

class ResumePDFGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_custom_styles()
    
    def setup_custom_styles(self):
        """Setup custom styles for the resume"""
        # Header style for name
        self.styles.add(ParagraphStyle(
            name='ResumeHeader',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=6,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#2c3e50')
        ))
        
        # Contact info style
        self.styles.add(ParagraphStyle(
            name='ContactInfo',
            parent=self.styles['Normal'],
            fontSize=10,
            alignment=TA_CENTER,
            spaceAfter=12
        ))
        
        # Section header style
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceBefore=12,
            spaceAfter=6,
            textColor=colors.HexColor('#34495e'),
            borderWidth=1,
            borderColor=colors.HexColor('#bdc3c7'),
            borderPadding=3
        ))
        
        # Job title style
        self.styles.add(ParagraphStyle(
            name='JobTitle',
            parent=self.styles['Normal'],
            fontSize=12,
            spaceBefore=6,
            spaceAfter=2,
            textColor=colors.HexColor('#2c3e50'),
            fontName='Helvetica-Bold'
        ))
        
        # Company/Institution style
        self.styles.add(ParagraphStyle(
            name='Company',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceAfter=2,
            textColor=colors.HexColor('#7f8c8d'),
            fontName='Helvetica-Oblique'
        ))
        
        # Date style
        self.styles.add(ParagraphStyle(
            name='DateStyle',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=4,
            textColor=colors.HexColor('#95a5a6')
        ))
    
    def generate_resume_pdf(self, resume_data, output_path):
        """Generate a professional resume PDF"""
        try:
            # Create the PDF document
            doc = SimpleDocTemplate(
                output_path,
                pagesize=letter,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=18
            )
            
            # Build the story (content)
            story = []
            
            # Add header with name and contact info
            self._add_header(story, resume_data)
            
            # Add sections
            self._add_sections(story, resume_data)
            
            # Add work experience
            self._add_work_experience(story, resume_data)
            
            # Add education
            self._add_education(story, resume_data)
            
            # Add skills
            self._add_skills(story, resume_data)
            
            # Build the PDF
            doc.build(story)
            return True
            
        except Exception as e:
            print(f"Error generating PDF: {str(e)}")
            return False
    
    def _add_header(self, story, resume_data):
        """Add header with name and contact information"""
        user = resume_data.get('user', {})
        
        # Name
        name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
        if name:
            story.append(Paragraph(name, self.styles['ResumeHeader']))
        
        # Contact information
        contact_info = []
        if user.get('email'):
            contact_info.append(user['email'])
        if user.get('phone'):
            contact_info.append(user['phone'])
        if user.get('location'):
            contact_info.append(user['location'])
        
        if contact_info:
            contact_text = " | ".join(contact_info)
            story.append(Paragraph(contact_text, self.styles['ContactInfo']))
        
        story.append(Spacer(1, 12))
    
    def _add_sections(self, story, resume_data):
        """Add custom sections from parsed content"""
        sections = resume_data.get('sections', [])
        
        for section in sections:
            if section.get('section_title') and section.get('content'):
                # Skip work experience and education as they have special formatting
                if section.get('section_type') in ['work_experience', 'education']:
                    continue
                
                story.append(Paragraph(section['section_title'], self.styles['SectionHeader']))
                
                # Split content into paragraphs
                content_paragraphs = section['content'].split('\n\n')
                for para in content_paragraphs:
                    if para.strip():
                        story.append(Paragraph(para.strip(), self.styles['Normal']))
                        story.append(Spacer(1, 6))
    
    def _add_work_experience(self, story, resume_data):
        """Add work experience section"""
        work_experiences = resume_data.get('work_experiences', [])
        
        if work_experiences:
            story.append(Paragraph("Professional Experience", self.styles['SectionHeader']))
            
            for exp in work_experiences:
                # Job title
                if exp.get('job_title'):
                    story.append(Paragraph(exp['job_title'], self.styles['JobTitle']))
                
                # Company and dates
                company_line = []
                if exp.get('company_name'):
                    company_line.append(exp['company_name'])
                
                date_range = self._format_date_range(exp.get('start_date'), exp.get('end_date'))
                if date_range:
                    company_line.append(date_range)
                
                if company_line:
                    story.append(Paragraph(" | ".join(company_line), self.styles['Company']))
                
                # Description
                if exp.get('description'):
                    # Split description into bullet points if it contains line breaks
                    desc_lines = exp['description'].split('\n')
                    for line in desc_lines:
                        if line.strip():
                            if line.strip().startswith('•') or line.strip().startswith('-'):
                                story.append(Paragraph(line.strip(), self.styles['Normal']))
                            else:
                                story.append(Paragraph(f"• {line.strip()}", self.styles['Normal']))
                
                story.append(Spacer(1, 12))
    
    def _add_education(self, story, resume_data):
        """Add education section"""
        educations = resume_data.get('educations', [])
        
        if educations:
            story.append(Paragraph("Education", self.styles['SectionHeader']))
            
            for edu in educations:
                # Degree
                if edu.get('degree_type'):
                    story.append(Paragraph(edu['degree_type'], self.styles['JobTitle']))
                
                # Institution and dates
                institution_line = []
                if edu.get('institution_name'):
                    institution_line.append(edu['institution_name'])
                
                date_range = self._format_date_range(edu.get('start_date'), edu.get('end_date'))
                if date_range:
                    institution_line.append(date_range)
                
                if institution_line:
                    story.append(Paragraph(" | ".join(institution_line), self.styles['Company']))
                
                # Description
                if edu.get('description'):
                    story.append(Paragraph(edu['description'], self.styles['Normal']))
                
                story.append(Spacer(1, 12))
    
    def _add_skills(self, story, resume_data):
        """Add skills section"""
        skills = resume_data.get('skills', [])
        
        if skills:
            story.append(Paragraph("Skills", self.styles['SectionHeader']))
            
            # Group skills by category
            skill_categories = {}
            for skill in skills:
                category = skill.get('skill_category', 'General')
                if category not in skill_categories:
                    skill_categories[category] = []
                skill_categories[category].append(skill.get('skill_name', ''))
            
            # Display skills by category
            for category, skill_list in skill_categories.items():
                if skill_list:
                    skill_text = f"<b>{category}:</b> {', '.join(filter(None, skill_list))}"
                    story.append(Paragraph(skill_text, self.styles['Normal']))
                    story.append(Spacer(1, 6))
    
    def _format_date_range(self, start_date, end_date):
        """Format date range for display"""
        if not start_date:
            return ""
        
        try:
            if isinstance(start_date, str):
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            
            start_str = start_date.strftime('%b %Y')
            
            if end_date:
                if isinstance(end_date, str):
                    end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                end_str = end_date.strftime('%b %Y')
                return f"{start_str} - {end_str}"
            else:
                return f"{start_str} - Present"
                
        except (ValueError, AttributeError):
            return ""

def generate_resume_pdf(resume_data, output_path):
    """Convenience function to generate resume PDF"""
    generator = ResumePDFGenerator()
    return generator.generate_resume_pdf(resume_data, output_path)

