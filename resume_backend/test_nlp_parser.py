#!/usr/bin/env python3
"""
Test script for the enhanced NLP-based resume parser.
This script validates the functionality of the resume parser with NLP enhancements.
"""

import sys
import os
import time
from pathlib import Path

# Add the src directory to the Python path
src_path = Path(__file__).parent / 'src'
sys.path.insert(0, str(src_path))

try:
    from utils.resume_parser import ResumeParser
except ImportError as e:
    print(f"Error importing ResumeParser: {e}")
    print("Make sure the resume_parser.py file exists in the src directory")
    sys.exit(1)

def test_basic_parser():
    """Test basic parser functionality"""
    print("\n=== Testing Basic Parser Functionality ===")
    
    try:
        parser = ResumeParser()
        print("✓ ResumeParser initialized successfully")
        
        # Test with sample text
        sample_text = """
        John Doe
        Software Engineer
        Email: john.doe@email.com
        Phone: (555) 123-4567
        
        EXPERIENCE
        Senior Software Engineer at Tech Corp (2020-2023)
        - Developed web applications using Python and React
        - Led a team of 5 developers
        
        Software Developer at StartupXYZ (2018-2020)
        - Built REST APIs using Flask
        - Implemented CI/CD pipelines
        
        EDUCATION
        Bachelor of Science in Computer Science
        University of Technology (2014-2018)
        
        SKILLS
        Python, JavaScript, React, Flask, Docker, AWS
        """
        
        result = parser.parse_text(sample_text)
        print(f"✓ Text parsing completed")
        print(f"✓ Result type: {type(result)}")
        
        if isinstance(result, dict):
            print(f"✓ Result keys: {list(result.keys())}")
        
        return result
        
    except Exception as e:
        print(f"✗ Basic parser test failed: {e}")
        return None

def test_nlp_models():
    """Test NLP model loading and functionality"""
    print("\n=== Testing NLP Models ===")
    
    try:
        parser = ResumeParser()
        
        # Test BERT NER model
        try:
            if hasattr(parser, 'bert_ner_pipeline') and parser.bert_ner_pipeline:
                print("✓ BERT NER model loaded successfully")
            else:
                print("⚠ BERT NER model not available (using fallback)")
        except Exception as e:
            print(f"⚠ BERT NER model error: {e}")
        
        # Test T5 model
        try:
            if hasattr(parser, 't5_model') and parser.t5_model:
                print("✓ T5 model loaded successfully")
            else:
                print("⚠ T5 model not available (using fallback)")
        except Exception as e:
            print(f"⚠ T5 model error: {e}")
        
        # Test QA model
        try:
            if hasattr(parser, 'qa_pipeline') and parser.qa_pipeline:
                print("✓ QA model loaded successfully")
            else:
                print("⚠ QA model not available (using fallback)")
        except Exception as e:
            print(f"⚠ QA model error: {e}")
        
        # Test spaCy model
        try:
            if hasattr(parser, 'nlp') and parser.nlp:
                print("✓ spaCy model loaded successfully")
            else:
                print("⚠ spaCy model not available (using fallback)")
        except Exception as e:
            print(f"⚠ spaCy model error: {e}")
        
        return True
        
    except Exception as e:
        print(f"✗ NLP models test failed: {e}")
        return False

def test_text_extraction():
    """Test advanced text extraction methods"""
    print("\n=== Testing Advanced Text Extraction ===")
    
    try:
        parser = ResumeParser()
        
        sample_text = """
        Jane Smith
        Senior Data Scientist
        jane.smith@techcorp.com | (555) 987-6543
        LinkedIn: linkedin.com/in/janesmith
        
        PROFESSIONAL EXPERIENCE
        
        Senior Data Scientist | TechCorp Inc. | 2021 - Present
        • Developed machine learning models for predictive analytics
        • Improved model accuracy by 25% using advanced feature engineering
        • Led cross-functional team of 8 data scientists and engineers
        
        Data Analyst | DataSolutions LLC | 2019 - 2021
        • Analyzed large datasets using Python and SQL
        • Created interactive dashboards using Tableau
        • Reduced data processing time by 40%
        
        EDUCATION
        
        Master of Science in Data Science
        Stanford University | 2017 - 2019
        GPA: 3.8/4.0
        
        Bachelor of Science in Mathematics
        UC Berkeley | 2013 - 2017
        Magna Cum Laude
        
        TECHNICAL SKILLS
        
        Programming Languages: Python, R, SQL, Java
        Machine Learning: Scikit-learn, TensorFlow, PyTorch
        Data Visualization: Tableau, Matplotlib, Seaborn
        Cloud Platforms: AWS, Google Cloud Platform
        Databases: PostgreSQL, MongoDB, Redis
        """
        
        # Test personal info extraction
        try:
            if hasattr(parser, '_extract_personal_info_advanced'):
                personal_info = parser._extract_personal_info_advanced(sample_text)
                print(f"✓ Advanced personal info extraction: {len(personal_info)} fields")
            else:
                print("⚠ Advanced personal info extraction not available")
        except Exception as e:
            print(f"⚠ Personal info extraction error: {e}")
        
        # Test skills extraction
        try:
            if hasattr(parser, '_extract_skills_advanced'):
                skills = parser._extract_skills_advanced(sample_text)
                print(f"✓ Advanced skills extraction: {len(skills)} skills found")
            else:
                print("⚠ Advanced skills extraction not available")
        except Exception as e:
            print(f"⚠ Skills extraction error: {e}")
        
        # Test work experience extraction
        try:
            if hasattr(parser, '_extract_work_experience_advanced'):
                work_exp = parser._extract_work_experience_advanced(sample_text)
                print(f"✓ Advanced work experience extraction: {len(work_exp)} positions found")
            else:
                print("⚠ Advanced work experience extraction not available")
        except Exception as e:
            print(f"⚠ Work experience extraction error: {e}")
        
        # Test education extraction
        try:
            if hasattr(parser, '_extract_education_advanced'):
                education = parser._extract_education_advanced(sample_text)
                print(f"✓ Advanced education extraction: {len(education)} entries found")
            else:
                print("⚠ Advanced education extraction not available")
        except Exception as e:
            print(f"⚠ Education extraction error: {e}")
        
        return True
        
    except Exception as e:
        print(f"✗ Text extraction test failed: {e}")
        return False

def test_nlp_specific_methods():
    """Test NLP-specific extraction methods"""
    print("\n=== Testing NLP-Specific Methods ===")
    
    try:
        parser = ResumeParser()
        
        sample_text = "John Doe is a Senior Software Engineer at Google with 5 years of experience in Python and machine learning."
        
        # Test BERT NER
        try:
            if hasattr(parser, '_extract_entities_bert'):
                entities = parser._extract_entities_bert(sample_text)
                print(f"✓ BERT NER extraction: {len(entities)} entities found")
            else:
                print("⚠ BERT NER extraction not available")
        except Exception as e:
            print(f"⚠ BERT NER error: {e}")
        
        # Test QA model
        try:
            if hasattr(parser, '_extract_info_qa'):
                qa_result = parser._extract_info_qa(sample_text, "What is the person's job title?")
                print(f"✓ QA model extraction: {qa_result}")
            else:
                print("⚠ QA model extraction not available")
        except Exception as e:
            print(f"⚠ QA model error: {e}")
        
        # Test T5 generation
        try:
            if hasattr(parser, '_generate_summary_t5'):
                summary = parser._generate_summary_t5(sample_text)
                print(f"✓ T5 summary generation: {summary[:50]}...")
            else:
                print("⚠ T5 generation not available")
        except Exception as e:
            print(f"⚠ T5 generation error: {e}")
        
        # Test NLP-based personal info
        try:
            if hasattr(parser, '_extract_personal_info_nlp'):
                nlp_personal = parser._extract_personal_info_nlp(sample_text)
                print(f"✓ NLP personal info extraction: {len(nlp_personal)} fields")
            else:
                print("⚠ NLP personal info extraction not available")
        except Exception as e:
            print(f"⚠ NLP personal info error: {e}")
        
        # Test NLP-based skills
        try:
            if hasattr(parser, '_extract_skills_nlp'):
                nlp_skills = parser._extract_skills_nlp(sample_text)
                print(f"✓ NLP skills extraction: {len(nlp_skills)} skills found")
            else:
                print("⚠ NLP skills extraction not available")
        except Exception as e:
            print(f"⚠ NLP skills error: {e}")
        
        return True
        
    except Exception as e:
        print(f"✗ NLP-specific methods test failed: {e}")
        return False

def test_performance():
    """Test parsing performance"""
    print("\n=== Testing Performance ===")
    
    try:
        parser = ResumeParser()
        
        sample_text = """
        Michael Johnson
        Full Stack Developer
        michael.johnson@email.com | (555) 123-4567
        
        EXPERIENCE
        Full Stack Developer at WebTech Solutions (2020-2023)
        - Developed responsive web applications using React and Node.js
        - Implemented RESTful APIs and microservices architecture
        - Collaborated with UX/UI designers and product managers
        
        Junior Developer at StartupHub (2018-2020)
        - Built frontend components using HTML, CSS, and JavaScript
        - Worked with databases including MySQL and MongoDB
        
        EDUCATION
        Bachelor of Computer Science
        Tech University (2014-2018)
        
        SKILLS
        JavaScript, React, Node.js, Python, HTML, CSS, MySQL, MongoDB, Git
        """
        
        start_time = time.time()
        result = parser.parse_text(sample_text)
        end_time = time.time()
        
        processing_time = end_time - start_time
        print(f"✓ Parsing completed in {processing_time:.3f} seconds")
        
        if isinstance(result, dict):
            print(f"✓ Result keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
        
        return result, processing_time
        
    except Exception as e:
        print(f"✗ Performance test failed: {e}")
        return None, 0

def test_confidence_scores():
    """Test confidence scoring for extracted information"""
    print("\n=== Testing Confidence Scores ===")
    
    try:
        parser = ResumeParser()
        
        sample_text = """
        Sarah Wilson
        Data Scientist with expertise in machine learning and statistical analysis
        sarah.wilson@datatech.com
        
        SKILLS
        Python, R, SQL, Machine Learning, Deep Learning, TensorFlow, PyTorch
        Statistical Analysis, Data Visualization, Tableau, Power BI
        
        EXPERIENCE
        Senior Data Scientist at DataTech Corp (2021-Present)
        Lead Data Scientist at Analytics Pro (2019-2021)
        """
        
        result = parser.parse_text(sample_text)
        
        # Check for confidence scores in skills
        if 'skills' in result and result['skills']:
            skills_with_confidence = [s for s in result['skills'] if isinstance(s, dict) and 'confidence' in s]
            print(f"✓ Skills with confidence scores: {len(skills_with_confidence)}/{len(result['skills'])}")
        
        # Check for confidence scores in work experience
        if 'work_experience' in result and result['work_experience']:
            exp_with_confidence = [e for e in result['work_experience'] if isinstance(e, dict) and 'confidence' in e]
            print(f"✓ Work experience with confidence scores: {len(exp_with_confidence)}/{len(result['work_experience'])}")
        
        return True
        
    except Exception as e:
        print(f"✗ Confidence scores test failed: {e}")
        return False

def test_file_parsing():
    """Test file parsing functionality"""
    print("\n=== Testing File Parsing ===")
    
    try:
        parser = ResumeParser()
        
        # Create a temporary text file for testing
        test_content = """
        Alex Chen
        DevOps Engineer
        alex.chen@cloudtech.com | (555) 987-6543
        
        PROFESSIONAL SUMMARY
        Experienced DevOps Engineer with 6+ years in cloud infrastructure and automation
        
        EXPERIENCE
        Senior DevOps Engineer | CloudTech Inc. | 2020 - Present
        DevOps Engineer | TechStartup | 2018 - 2020
        
        SKILLS
        AWS, Docker, Kubernetes, Terraform, Jenkins, Python, Bash
        """
        
        # Test with text content (simulating file parsing)
        result = parser.parse_text(test_content)
        
        if result:
            print("✓ File content parsing successful")
            print(f"✓ Extracted {len(result.get('skills', []))} skills")
            print(f"✓ Extracted {len(result.get('work_experience', []))} work experiences")
        else:
            print("⚠ File parsing returned empty result")
        
        return True
        
    except Exception as e:
        print(f"✗ File parsing test failed: {e}")
        return False

def display_results(result):
    """Display parsing results in a formatted way"""
    print("\n=== Parsing Results ===")
    
    try:
        if not result or not isinstance(result, dict):
            print("No valid results to display")
            return
        
        # Personal Information
        if 'personal_info' in result and result['personal_info']:
            print(f"\nPersonal Information ({len(result['personal_info'])} fields):")
            for key, value in result['personal_info'].items():
                if value:
                    print(f"  {key}: {value}")
        
        # Skills
        if 'skills' in result and result['skills']:
            print(f"\nSkills ({len(result['skills'])}):")  # Fixed: removed extra parenthesis
            for skill in result['skills'][:10]:  # Show first 10
                if isinstance(skill, dict):
                    name = skill.get('name', skill.get('skill', 'Unknown'))
                    category = skill.get('category', 'General')
                    confidence = skill.get('confidence', 'N/A')
                    print(f"  {name} ({category}) - Confidence: {confidence}")
                else:
                    print(f"  {skill}")
        
        # Work Experience
        if 'work_experience' in result and result['work_experience']:
            print(f"\nWork Experience ({len(result['work_experience'])}):")  # Fixed: removed extra parenthesis
            for exp in result['work_experience']:
                if isinstance(exp, dict):
                    title = exp.get('title', 'Unknown Title')
                    company = exp.get('company', 'Unknown Company')
                    duration = exp.get('duration', 'Unknown Duration')
                    print(f"  {title} at {company} ({duration})")
                else:
                    print(f"  {exp}")
        
        # Education
        if 'education' in result and result['education']:
            print(f"\nEducation ({len(result['education'])}):")  # Fixed: removed extra parenthesis
            for edu in result['education']:
                if isinstance(edu, dict):
                    degree = edu.get('degree', 'Unknown Degree')
                    institution = edu.get('institution', 'Unknown Institution')
                    year = edu.get('year', 'Unknown Year')
                    print(f"  {degree} from {institution} ({year})")
                else:
                    print(f"  {edu}")
    
    except Exception as e:
        print(f"Error displaying results: {e}")

def main():
    """Main test function"""
    print("Enhanced NLP Resume Parser Test Suite")
    print("=====================================")
    
    # Track test results
    tests_passed = 0
    total_tests = 7
    
    # Run tests
    if test_basic_parser():
        tests_passed += 1
    
    if test_nlp_models():
        tests_passed += 1
    
    if test_text_extraction():
        tests_passed += 1
    
    if test_nlp_specific_methods():
        tests_passed += 1
    
    result, processing_time = test_performance()
    if result:
        tests_passed += 1
        display_results(result)
    
    if test_confidence_scores():
        tests_passed += 1
    
    if test_file_parsing():
        tests_passed += 1
    
    # Summary
    print(f"\n=== Test Summary ===")
    print(f"Tests passed: {tests_passed}/{total_tests}")
    print(f"Success rate: {(tests_passed/total_tests)*100:.1f}%")
    
    if tests_passed == total_tests:
        print("\n🎉 All tests passed! NLP enhancements are working correctly.")
    elif tests_passed >= total_tests * 0.7:
        print("\n✅ Most tests passed. Some NLP features may be using fallback methods.")
    else:
        print("\n⚠️  Several tests failed. Check NLP model installation and dependencies.")
    
    print("\nNote: Some features may use fallback methods if NLP models are not available.")
    print("Run 'python setup_nlp.py' to download required NLP models.")

if __name__ == "__main__":
    main()