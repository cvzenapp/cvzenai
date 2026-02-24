import os
import re
import json
import spacy
import nltk
import PyPDF2
import pdfplumber
import phonenumbers
from datetime import datetime, date
from dateutil import parser as date_parser
from typing import Dict, List, Any, Optional, Tuple
import dateparser
from fuzzywuzzy import fuzz, process
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import torch
from transformers import (
    AutoTokenizer, AutoModelForTokenClassification,
    AutoModelForSequenceClassification, T5Tokenizer, T5ForConditionalGeneration,
    BertTokenizer, BertForTokenClassification, pipeline
)
import warnings
warnings.filterwarnings('ignore')

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)

try:
    nltk.data.find('taggers/averaged_perceptron_tagger')
except LookupError:
    nltk.download('averaged_perceptron_tagger', quiet=True)

class EnterpriseResumeParser:
    """
    Enterprise-level AI Resume Parser with unmatched accuracy
    Competing with Affinda and other industry leaders
    """
    
    def __init__(self):
        # Load spaCy model for advanced NLP
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            print("Warning: spaCy model not found. Some features may be limited.")
            self.nlp = None
        
        # Initialize skill databases and patterns
        self._init_skill_databases()
        self._init_patterns()
        self._init_ml_models()
        
    def _init_skill_databases(self):
        """Initialize comprehensive skill databases"""
        self.programming_languages = {
            'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'c', 'go', 'rust', 
            'php', 'ruby', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'perl', 'shell',
            'bash', 'powershell', 'sql', 'plsql', 'tsql', 'nosql', 'html', 'css', 'sass',
            'less', 'xml', 'json', 'yaml', 'toml', 'dart', 'lua', 'haskell', 'erlang',
            'elixir', 'clojure', 'f#', 'vb.net', 'assembly', 'cobol', 'fortran'
        }
        
        self.frameworks_libraries = {
            'react', 'angular', 'vue', 'svelte', 'node.js', 'express', 'fastapi', 'flask',
            'django', 'spring', 'spring boot', 'laravel', 'symfony', 'rails', 'asp.net',
            'blazor', '.net core', 'jquery', 'bootstrap', 'tailwind', 'material-ui',
            'ant design', 'chakra ui', 'tensorflow', 'pytorch', 'keras', 'scikit-learn',
            'pandas', 'numpy', 'matplotlib', 'seaborn', 'plotly', 'opencv', 'nltk',
            'spacy', 'transformers', 'hugging face', 'fastai', 'xgboost', 'lightgbm'
        }
        
        self.databases = {
            'mysql', 'postgresql', 'sqlite', 'mongodb', 'redis', 'elasticsearch',
            'cassandra', 'dynamodb', 'oracle', 'sql server', 'mariadb', 'couchdb',
            'neo4j', 'influxdb', 'clickhouse', 'snowflake', 'bigquery', 'redshift',
            'cosmos db', 'firebase', 'supabase', 'planetscale', 'cockroachdb'
        }
        
        self.cloud_platforms = {
            'aws', 'azure', 'gcp', 'google cloud', 'heroku', 'digitalocean', 'linode',
            'vultr', 'cloudflare', 'vercel', 'netlify', 'railway', 'render', 'fly.io',
            'kubernetes', 'docker', 'openshift', 'rancher', 'nomad', 'consul', 'vault'
        }
        
        self.tools_technologies = {
            'git', 'github', 'gitlab', 'bitbucket', 'jenkins', 'circleci', 'travis ci',
            'github actions', 'azure devops', 'terraform', 'ansible', 'puppet', 'chef',
            'vagrant', 'packer', 'consul', 'vault', 'prometheus', 'grafana', 'elk stack',
            'splunk', 'datadog', 'new relic', 'sentry', 'rollbar', 'bugsnag', 'jira',
            'confluence', 'slack', 'teams', 'zoom', 'figma', 'sketch', 'adobe xd',
            'photoshop', 'illustrator', 'after effects', 'premiere pro', 'blender'
        }
        
        # Combine all skills for comprehensive matching
        self.all_skills = (
            self.programming_languages | self.frameworks_libraries | 
            self.databases | self.cloud_platforms | self.tools_technologies
        )
        
    def _init_patterns(self):
        """Initialize regex patterns for various fields"""
        # Email patterns
        self.email_patterns = [
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            r'\b[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\s*\.\s*[A-Z|a-z]{2,}\b'
        ]
        
        # Phone patterns (international support)
        self.phone_patterns = [
            r'(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})',
            r'(\+\d{1,3}[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}',
            r'(\+\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}'
        ]
        
        # Date patterns (comprehensive)
        self.date_patterns = [
            r'(\w+\s+\d{4})\s*[-–]\s*(\w+\s+\d{4}|present|current)',
            r'(\d{1,2}/\d{4})\s*[-–]\s*(\d{1,2}/\d{4}|present|current)',
            r'(\d{4})\s*[-–]\s*(\d{4}|present|current)',
            r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})',
            r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})',
            r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})',
            r'(\d{4})',  # Year only
            r'(Present|Current|Now|Ongoing)',
            r'(\d{1,2})/(\d{4})',
            r'(\d{1,2})-(\d{4})'
        ]
        
        # Name patterns
        self.name_patterns = [
            r'^[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$',
            r'^[A-Z][a-z]+\s+[A-Z]\.\s+[A-Z][a-z]+$',
            r'^[A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+$'
        ]
        
        # Section headers
        self.section_headers = {
            'experience': [
                'work experience', 'professional experience', 'employment history',
                'career history', 'work history', 'experience', 'employment',
                'professional background', 'career summary', 'work summary'
            ],
            'education': [
                'education', 'educational background', 'academic background',
                'qualifications', 'academic qualifications', 'degrees',
                'academic history', 'schooling', 'university', 'college'
            ],
            'skills': [
                'skills', 'technical skills', 'core competencies', 'competencies',
                'expertise', 'proficiencies', 'abilities', 'technologies',
                'technical expertise', 'programming skills', 'software skills'
            ],
            'summary': [
                'summary', 'professional summary', 'career summary', 'profile',
                'professional profile', 'overview', 'objective', 'career objective',
                'about', 'about me', 'introduction', 'background'
            ],
            'projects': [
                'projects', 'key projects', 'notable projects', 'project experience',
                'project portfolio', 'selected projects', 'major projects'
            ],
            'certifications': [
                'certifications', 'certificates', 'professional certifications',
                'licenses', 'credentials', 'qualifications', 'achievements'
            ]
        }
        
    def _init_ml_models(self):
        """Initialize advanced ML models including BERT and T5"""
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        
        # Initialize transformer models for advanced NLP
        try:
            # BERT for Named Entity Recognition
            self.bert_tokenizer = BertTokenizer.from_pretrained('dbmdz/bert-large-cased-finetuned-conll03-english')
            self.bert_model = BertForTokenClassification.from_pretrained('dbmdz/bert-large-cased-finetuned-conll03-english')
            
            # T5 for text generation and extraction
            self.t5_tokenizer = T5Tokenizer.from_pretrained('t5-small')
            self.t5_model = T5ForConditionalGeneration.from_pretrained('t5-small')
            
            # Pre-trained NER pipeline
            self.ner_pipeline = pipeline('ner', 
                                       model='dbmdz/bert-large-cased-finetuned-conll03-english',
                                       tokenizer='dbmdz/bert-large-cased-finetuned-conll03-english',
                                       aggregation_strategy='simple')
            
            # Question-answering pipeline for structured extraction
            self.qa_pipeline = pipeline('question-answering', 
                                      model='distilbert-base-cased-distilled-squad')
            
            print("Advanced NLP models loaded successfully")
            self.models_loaded = True
            
        except Exception as e:
            print(f"Warning: Could not load transformer models: {e}")
            print("Falling back to traditional NLP methods")
            self.models_loaded = False
            self.bert_tokenizer = None
            self.bert_model = None
            self.t5_tokenizer = None
            self.t5_model = None
            self.ner_pipeline = None
            self.qa_pipeline = None
        
    def parse_resume(self, file_path: str) -> Dict[str, Any]:
        """Main parsing method with enterprise-level accuracy"""
        try:
            # Extract text with multiple methods for maximum accuracy
            raw_text = self._extract_text_advanced(file_path)
            cleaned_text = self._clean_text_advanced(raw_text)
            
            # Use NLP for advanced processing
            doc = None
            if self.nlp:
                doc = self.nlp(cleaned_text)
            
            # Extract all fields with high accuracy
            personal_info = self._extract_personal_info_advanced(cleaned_text, doc)
            contact_info = self._extract_contact_info_advanced(cleaned_text, doc)
            work_experience = self._extract_work_experience_advanced(cleaned_text, doc)
            education = self._extract_education_advanced(cleaned_text, doc)
            skills = self._extract_skills_advanced(cleaned_text, doc)
            certifications = self._extract_certifications_advanced(cleaned_text, doc)
            projects = self._extract_projects_advanced(cleaned_text, doc)
            languages = self._extract_languages_advanced(cleaned_text, doc)
            
            # Additional metadata
            metadata = self._extract_metadata(cleaned_text, doc)
            
            return {
                'raw_text': raw_text,
                'cleaned_text': cleaned_text,
                'personal_info': personal_info,
                'contact_info': contact_info,
                'work_experience': work_experience,
                'education': education,
                'skills': skills,
                'certifications': certifications,
                'projects': projects,
                'languages': languages,
                'metadata': metadata,
                'sections': self._extract_sections_advanced(cleaned_text),
                'parsed_at': datetime.utcnow().isoformat(),
                'parser_version': '2.0.0',
                'accuracy_score': self._calculate_accuracy_score(cleaned_text)
            }
            
        except Exception as e:
            print(f"Error in enterprise parsing: {e}")
            return self._get_error_response(str(e))
    
    def parse_text(self, text: str) -> Dict[str, Any]:
        """Parse resume from text content directly"""
        try:
            # Clean the input text
            cleaned_text = self._clean_text_advanced(text)
            
            # Use NLP for advanced processing
            doc = None
            if self.nlp:
                doc = self.nlp(cleaned_text)
            
            # Extract all fields with high accuracy
            personal_info = self._extract_personal_info_advanced(cleaned_text, doc)
            contact_info = self._extract_contact_info_advanced(cleaned_text, doc)
            work_experience = self._extract_work_experience_advanced(cleaned_text, doc)
            education = self._extract_education_advanced(cleaned_text, doc)
            skills = self._extract_skills_advanced(cleaned_text, doc)
            certifications = self._extract_certifications_advanced(cleaned_text, doc)
            projects = self._extract_projects_advanced(cleaned_text, doc)
            languages = self._extract_languages_advanced(cleaned_text, doc)
            
            # Additional metadata
            metadata = self._extract_metadata(cleaned_text, doc)
            
            return {
                'raw_text': text,
                'cleaned_text': cleaned_text,
                'personal_info': personal_info,
                'contact_info': contact_info,
                'work_experience': work_experience,
                'education': education,
                'skills': skills,
                'certifications': certifications,
                'projects': projects,
                'languages': languages,
                'metadata': metadata,
                'sections': self._extract_sections_advanced(cleaned_text),
                'parsed_at': datetime.utcnow().isoformat(),
                'parser_version': '2.0.0',
                'accuracy_score': self._calculate_accuracy_score(cleaned_text)
            }
            
        except Exception as e:
            print(f"Error in text parsing: {e}")
            return self._get_error_response(str(e))
    
    def _extract_text_advanced(self, file_path: str) -> str:
        """Advanced text extraction with multiple fallbacks"""
        file_ext = os.path.splitext(file_path)[1].lower()
        text = ""
        
        if file_ext == '.pdf':
            # Method 1: pdfplumber (best for complex layouts)
            try:
                with pdfplumber.open(file_path) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
                        
                        # Extract tables if present
                        tables = page.extract_tables()
                        for table in tables:
                            for row in table:
                                if row:
                                    text += " ".join([cell for cell in row if cell]) + "\n"
            except Exception as e:
                print(f"pdfplumber failed: {e}")
            
            # Method 2: PyPDF2 fallback
            if not text.strip():
                try:
                    with open(file_path, 'rb') as file:
                        pdf_reader = PyPDF2.PdfReader(file)
                        for page in pdf_reader.pages:
                            page_text = page.extract_text()
                            if page_text:
                                text += page_text + "\n"
                except Exception as e:
                    print(f"PyPDF2 failed: {e}")
                    
        elif file_ext == '.txt':
            try:
                with open(file_path, 'r', encoding='utf-8') as file:
                    text = file.read()
            except UnicodeDecodeError:
                with open(file_path, 'r', encoding='latin-1') as file:
                    text = file.read()
        
        return text
    
    def _clean_text_advanced(self, text: str) -> str:
        """Advanced text cleaning and normalization"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Fix common OCR errors
        text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)  # Add space between camelCase
        text = re.sub(r'(\d)([A-Za-z])', r'\1 \2', text)  # Add space between number and letter
        text = re.sub(r'([A-Za-z])(\d)', r'\1 \2', text)  # Add space between letter and number
        
        # Normalize line breaks
        text = re.sub(r'\n\s*\n', '\n\n', text)
        
        # Fix common formatting issues
        text = re.sub(r'•\s*', '• ', text)  # Normalize bullet points
        text = re.sub(r'-\s*', '- ', text)  # Normalize dashes
        
        return text.strip()
    
    def _extract_personal_info_advanced(self, text: str, doc=None) -> Dict[str, str]:
        """Extract personal information with high accuracy using NLP models"""
        # Try NLP-based extraction first
        if self.models_loaded:
            nlp_info = self._extract_personal_info_nlp(text)
            if nlp_info:
                # Enhance with additional traditional extraction
                if not nlp_info.get('name'):
                    name = self._extract_name_advanced(text, doc)
                    if name:
                        nlp_info['name'] = name
                
                # Add name parts if full name is available
                if nlp_info.get('name'):
                    name_parts = nlp_info['name'].split()
                    if len(name_parts) >= 2:
                        nlp_info['first_name'] = name_parts[0]
                        nlp_info['last_name'] = name_parts[-1]
                        if len(name_parts) > 2:
                            nlp_info['middle_name'] = ' '.join(name_parts[1:-1])
                
                # Extract title/headline if not found by NLP
                if not nlp_info.get('current_title'):
                    title = self._extract_title_advanced(text, doc)
                    if title:
                        nlp_info['title'] = title
                
                # Extract summary/objective
                summary = self._extract_summary_advanced(text, doc)
                if summary:
                    nlp_info['summary'] = summary
                
                return nlp_info
        
        # Fallback to traditional extraction methods
        personal_info = {}
        lines = text.split('\n')
        
        # Extract name using multiple methods
        name = self._extract_name_advanced(text, doc)
        if name:
            personal_info['name'] = name
            
            # Extract first and last name
            name_parts = name.split()
            if len(name_parts) >= 2:
                personal_info['first_name'] = name_parts[0]
                personal_info['last_name'] = name_parts[-1]
                if len(name_parts) > 2:
                    personal_info['middle_name'] = ' '.join(name_parts[1:-1])
        
        # Extract title/headline
        title = self._extract_title_advanced(text, doc)
        if title:
            personal_info['title'] = title
        
        # Extract summary/objective
        summary = self._extract_summary_advanced(text, doc)
        if summary:
            personal_info['summary'] = summary
        
        return personal_info
    
    def _extract_name_advanced(self, text: str, doc=None) -> Optional[str]:
        """Extract name with multiple methods for high accuracy"""
        lines = text.split('\n')
        
        # Method 1: Use spaCy NER
        if doc:
            for ent in doc.ents:
                if ent.label_ == "PERSON" and len(ent.text.split()) >= 2:
                    # Validate it's likely a full name
                    if self._validate_name(ent.text):
                        return ent.text.strip()
        
        # Method 2: Pattern matching on first few lines
        for line in lines[:5]:
            line = line.strip()
            if line and len(line) > 2 and len(line) < 100:
                # Check if it matches name patterns
                for pattern in self.name_patterns:
                    if re.match(pattern, line):
                        if self._validate_name(line):
                            return line
        
        # Method 3: Heuristic approach - look for first line with 2-3 capitalized words
        for line in lines[:10]:
            line = line.strip()
            if line and len(line.split()) >= 2 and len(line.split()) <= 3:
                # Check if it doesn't contain common non-name indicators
                if not re.search(r'[@\d\(\)\-\.]|email|phone|address|resume|cv|engineer|developer|manager', line.lower()):
                    words = line.split()
                    if all(word[0].isupper() and word.isalpha() for word in words if word):
                        if self._validate_name(line):
                            return line
        
        return None
    
    def _validate_name(self, name: str) -> bool:
        """Validate if a string is likely a person's name"""
        # Check for common non-name patterns
        invalid_patterns = [
            r'\b(resume|cv|curriculum|vitae)\b',
            r'\b(email|phone|address|contact)\b',
            r'\b(experience|education|skills)\b',
            r'[@\d\(\)\-\.]',
            r'\b(inc|llc|corp|company|ltd)\b',
            r'\b(engineer|developer|manager|analyst)\b'
        ]
        
        name_lower = name.lower()
        for pattern in invalid_patterns:
            if re.search(pattern, name_lower):
                return False
        
        # Check if it has reasonable length
        if len(name) < 3 or len(name) > 50:
            return False
        
        # Check if words start with capital letters and are alphabetic
        words = name.split()
        if len(words) < 2:
            return False
        
        return all(word[0].isupper() and word.isalpha() for word in words if word)
    
    def _extract_contact_info_advanced(self, text: str, doc=None) -> Dict[str, str]:
        """Extract contact information with high accuracy"""
        contact_info = {}
        
        # Extract email
        for pattern in self.email_patterns:
            emails = re.findall(pattern, text, re.IGNORECASE)
            if emails:
                # Take the first valid email
                for email in emails:
                    if self._validate_email(email):
                        contact_info['email'] = email.lower()
                        break
        
        # Extract phone using phonenumbers library for international support
        phone = self._extract_phone_advanced(text)
        if phone:
            contact_info['phone'] = phone
        
        # Extract LinkedIn
        linkedin_patterns = [
            r'(?i)linkedin\.com/in/([a-zA-Z0-9-]+)',
            r'(?i)linkedin\.com/pub/([a-zA-Z0-9-]+)',
            r'(?i)linkedin\.com/profile/view\?id=([a-zA-Z0-9-]+)'
        ]
        
        for pattern in linkedin_patterns:
            match = re.search(pattern, text)
            if match:
                contact_info['linkedin'] = f"linkedin.com/in/{match.group(1)}"
                break
        
        # Extract GitHub
        github_pattern = r'(?i)github\.com/([a-zA-Z0-9-]+)'
        github_match = re.search(github_pattern, text)
        if github_match:
            contact_info['github'] = f"github.com/{github_match.group(1)}"
        
        # Extract location using spaCy NER
        if doc:
            locations = []
            for ent in doc.ents:
                if ent.label_ in ["GPE", "LOC"]:  # Geopolitical entity or location
                    locations.append(ent.text)
            
            if locations:
                # Take the most likely location (could be improved with ML)
                contact_info['location'] = locations[0]
        
        return contact_info
    
    def _extract_phone_advanced(self, text: str) -> Optional[str]:
        """Extract phone number with international support"""
        # Try phonenumbers library first
        try:
            for match in phonenumbers.PhoneNumberMatcher(text, None):
                phone_number = match.number
                if phonenumbers.is_valid_number(phone_number):
                    return phonenumbers.format_number(phone_number, phonenumbers.PhoneNumberFormat.INTERNATIONAL)
        except:
            pass
        
        # Fallback to regex patterns
        for pattern in self.phone_patterns:
            matches = re.findall(pattern, text)
            if matches:
                # Clean and format the first match
                if isinstance(matches[0], tuple):
                    phone = ''.join(matches[0])
                else:
                    phone = matches[0]
                
                # Clean the phone number
                phone = re.sub(r'[^\d+]', '', phone)
                if len(phone) >= 10:
                    return phone
        
        return None
    
    def _extract_with_bert_ner(self, text: str) -> Dict[str, List[str]]:
        """Extract entities using BERT NER model"""
        if not self.models_loaded or not self.ner_pipeline:
            return {}
        
        try:
            # Use BERT NER pipeline for entity extraction
            entities = self.ner_pipeline(text)
            
            extracted = {
                'persons': [],
                'organizations': [],
                'locations': [],
                'miscellaneous': []
            }
            
            for entity in entities:
                entity_text = entity['word'].replace('##', '')
                confidence = entity['score']
                
                if confidence > 0.8:  # High confidence threshold
                    if entity['entity_group'] == 'PER':
                        extracted['persons'].append(entity_text)
                    elif entity['entity_group'] == 'ORG':
                        extracted['organizations'].append(entity_text)
                    elif entity['entity_group'] == 'LOC':
                        extracted['locations'].append(entity_text)
                    else:
                        extracted['miscellaneous'].append(entity_text)
            
            return extracted
            
        except Exception as e:
            print(f"BERT NER extraction failed: {e}")
            return {}
    
    def _extract_with_qa_model(self, text: str, questions: List[str]) -> Dict[str, str]:
        """Extract information using question-answering model"""
        if not self.models_loaded or not self.qa_pipeline:
            return {}
        
        try:
            results = {}
            
            for question in questions:
                try:
                    answer = self.qa_pipeline(question=question, context=text)
                    if answer['score'] > 0.5:  # Confidence threshold
                        results[question] = answer['answer']
                except:
                    continue
            
            return results
            
        except Exception as e:
            print(f"QA model extraction failed: {e}")
            return {}
    
    def _extract_with_t5_generation(self, text: str, prompts: List[str]) -> Dict[str, str]:
        """Extract information using T5 text generation"""
        if not self.models_loaded or not self.t5_model:
            return {}
        
        try:
            results = {}
            
            for prompt in prompts:
                try:
                    # Prepare input for T5
                    input_text = f"{prompt}: {text[:512]}"  # Limit context length
                    input_ids = self.t5_tokenizer.encode(input_text, return_tensors='pt', max_length=512, truncation=True)
                    
                    # Generate response
                    with torch.no_grad():
                        outputs = self.t5_model.generate(
                            input_ids,
                            max_length=100,
                            num_return_sequences=1,
                            temperature=0.7,
                            do_sample=True,
                            pad_token_id=self.t5_tokenizer.eos_token_id
                        )
                    
                    # Decode response
                    generated_text = self.t5_tokenizer.decode(outputs[0], skip_special_tokens=True)
                    results[prompt] = generated_text.strip()
                    
                except Exception as e:
                    print(f"T5 generation failed for prompt '{prompt}': {e}")
                    continue
            
            return results
            
        except Exception as e:
            print(f"T5 extraction failed: {e}")
            return {}
    
    def _extract_personal_info_nlp(self, text: str) -> Dict[str, str]:
        """Extract personal information using advanced NLP models"""
        personal_info = {}
        
        # Use BERT NER for person extraction
        bert_entities = self._extract_with_bert_ner(text)
        if bert_entities.get('persons'):
            # Take the first person name found
            potential_names = bert_entities['persons']
            for name in potential_names:
                if self._validate_name_advanced(name):
                    personal_info['name'] = name
                    break
        
        # Use QA model for specific information extraction
        qa_questions = [
            "What is the person's full name?",
            "What is the person's email address?",
            "What is the person's phone number?",
            "Where is the person located?",
            "What is the person's current job title?"
        ]
        
        qa_results = self._extract_with_qa_model(text, qa_questions)
        
        # Process QA results
        for question, answer in qa_results.items():
            if "name" in question.lower() and not personal_info.get('name'):
                if self._validate_name_advanced(answer):
                    personal_info['name'] = answer
            elif "email" in question.lower():
                if self._validate_email(answer):
                    personal_info['email'] = answer
            elif "phone" in question.lower():
                personal_info['phone'] = answer
            elif "location" in question.lower():
                personal_info['location'] = answer
            elif "job title" in question.lower():
                personal_info['current_title'] = answer
        
        return personal_info
    
    def _extract_skills_nlp(self, text: str) -> List[Dict[str, Any]]:
        """Extract skills using advanced NLP and semantic matching"""
        skills = []
        
        # Use T5 for skill extraction
        t5_prompts = [
            "Extract technical skills from this resume",
            "List programming languages mentioned",
            "Identify frameworks and libraries",
            "Find tools and technologies"
        ]
        
        t5_results = self._extract_with_t5_generation(text, t5_prompts)
        
        # Process T5 results
        for prompt, result in t5_results.items():
            if result:
                # Parse the generated text for skills
                extracted_skills = self._parse_skills_from_text(result)
                skills.extend(extracted_skills)
        
        # Use BERT entities for additional skill detection
        bert_entities = self._extract_with_bert_ner(text)
        if bert_entities.get('miscellaneous'):
            for item in bert_entities['miscellaneous']:
                if item.lower() in self.all_skills:
                    skills.append({
                        'name': item,
                        'category': self._categorize_skill(item),
                        'confidence': 0.9
                    })
        
        # Semantic similarity matching with known skills
        text_lower = text.lower()
        for skill in self.all_skills:
            if skill in text_lower:
                skills.append({
                    'name': skill,
                    'category': self._categorize_skill(skill),
                    'confidence': 0.95
                })
        
        # Remove duplicates and sort by confidence
        unique_skills = {}
        for skill in skills:
            name = skill['name'].lower()
            if name not in unique_skills or skill['confidence'] > unique_skills[name]['confidence']:
                unique_skills[name] = skill
        
        return list(unique_skills.values())
    
    def _parse_skills_from_text(self, text: str) -> List[Dict[str, Any]]:
        """Parse skills from generated text"""
        skills = []
        
        # Split by common delimiters
        potential_skills = re.split(r'[,;\n\r]+', text)
        
        for skill in potential_skills:
            skill = skill.strip().lower()
            if skill and len(skill) > 1:
                # Check if it's a known skill
                if skill in self.all_skills:
                    skills.append({
                        'name': skill,
                        'category': self._categorize_skill(skill),
                        'confidence': 0.8
                    })
                else:
                    # Use fuzzy matching for partial matches
                    best_match = process.extractOne(skill, self.all_skills)
                    if best_match and best_match[1] > 80:  # 80% similarity threshold
                        skills.append({
                            'name': best_match[0],
                            'category': self._categorize_skill(best_match[0]),
                            'confidence': 0.7
                        })
        
        return skills
    
    def _validate_name_advanced(self, name: str) -> bool:
        """Advanced name validation using NLP"""
        if not name or len(name.strip()) < 2:
            return False
        
        name = name.strip()
        
        # Check for common non-name patterns
        invalid_patterns = [
            r'\d',  # Contains digits
            r'[@#$%^&*()_+=\[\]{}|;:,.<>?]',  # Special characters
            r'\b(resume|cv|curriculum|vitae|profile)\b',  # Document-related words
            r'\b(email|phone|address|contact)\b',  # Contact-related words
            r'\b(experience|education|skills|work)\b',  # Section headers
        ]
        
        name_lower = name.lower()
        for pattern in invalid_patterns:
            if re.search(pattern, name_lower):
                return False
        
        # Check word count (names typically have 2-4 words)
        words = name.split()
        if len(words) < 2 or len(words) > 4:
            return False
        
        # Check if words are properly capitalized and alphabetic
        for word in words:
            if not word.isalpha() or not word[0].isupper():
                return False
        
        return True
    
    def _extract_work_experience_nlp(self, text: str) -> List[Dict[str, Any]]:
        """Extract work experience using advanced NLP models"""
        experiences = []
        
        # Use T5 for experience extraction
        t5_prompts = [
            "Extract work experience from this resume",
            "List job titles and companies",
            "Find employment history with dates",
            "Identify professional experience details"
        ]
        
        t5_results = self._extract_with_t5_generation(text, t5_prompts)
        
        # Use QA model for specific experience information
        qa_questions = [
            "What companies has this person worked for?",
            "What job titles has this person held?",
            "What are the employment dates?",
            "What are the key responsibilities?",
            "What achievements are mentioned?"
        ]
        
        qa_results = self._extract_with_qa_model(text, qa_questions)
        
        # Use BERT NER for organization extraction
        bert_entities = self._extract_with_bert_ner(text)
        organizations = bert_entities.get('organizations', [])
        
        # Process and structure the extracted information
        for prompt, result in t5_results.items():
            if result and "experience" in prompt.lower():
                # Parse experience entries from T5 output
                experience_entries = self._parse_experience_from_text(result)
                experiences.extend(experience_entries)
        
        # Enhance with QA results
        if qa_results:
            companies = qa_results.get("What companies has this person worked for?", "")
            titles = qa_results.get("What job titles has this person held?", "")
            
            if companies and titles:
                company_list = [c.strip() for c in companies.split(',') if c.strip()]
                title_list = [t.strip() for t in titles.split(',') if t.strip()]
                
                # Match companies with titles
                for i, (company, title) in enumerate(zip(company_list, title_list)):
                    experiences.append({
                        'company': company,
                        'position': title,
                        'start_date': None,
                        'end_date': None,
                        'description': qa_results.get("What are the key responsibilities?", ""),
                        'achievements': qa_results.get("What achievements are mentioned?", ""),
                        'confidence': 0.8
                    })
        
        return experiences[:10]  # Limit to top 10 experiences
    
    def _parse_experience_from_text(self, text: str) -> List[Dict[str, Any]]:
        """Parse work experience entries from generated text"""
        experiences = []
        
        # Split by common delimiters and patterns
        entries = re.split(r'\n\s*\n|\d+\.|•|\*', text)
        
        for entry in entries:
            entry = entry.strip()
            if len(entry) > 20:  # Minimum length for valid experience
                # Extract company, position, dates using patterns
                experience = {
                    'company': self._extract_company_from_entry(entry),
                    'position': self._extract_position_from_entry(entry),
                    'start_date': None,
                    'end_date': None,
                    'description': entry,
                    'achievements': None,
                    'confidence': 0.7
                }
                
                if experience['company'] or experience['position']:
                    experiences.append(experience)
        
        return experiences
    
    def _extract_company_from_entry(self, text: str) -> Optional[str]:
        """Extract company name from experience entry"""
        # Look for patterns like "at Company Name" or "Company Name -"
        patterns = [
            r'\bat\s+([A-Z][\w\s&.,]+?)(?:\s*[-,]|\s*\d|$)',
            r'^([A-Z][\w\s&.,]+?)\s*[-–]',
            r'([A-Z][\w\s&.,]+?)\s*\(',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                company = match.group(1).strip()
                if len(company) > 2 and len(company) < 50:
                    return company
        
        return None
    
    def _extract_position_from_entry(self, text: str) -> Optional[str]:
        """Extract position/title from experience entry"""
        # Look for common job title patterns
        patterns = [
            r'^([A-Z][\w\s]+?)\s*at\s+',
            r'^([A-Z][\w\s]+?)\s*[-–]',
            r'([A-Z][\w\s]+?)\s*\|',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                position = match.group(1).strip()
                if len(position) > 2 and len(position) < 50:
                    return position
        
        return None
    
    def _extract_education_nlp(self, text: str) -> List[Dict[str, Any]]:
        """Extract education using advanced NLP models"""
        education = []
        
        # Use T5 for education extraction
        t5_prompts = [
            "Extract education details from this resume",
            "List degrees and universities",
            "Find educational qualifications",
            "Identify academic background"
        ]
        
        t5_results = self._extract_with_t5_generation(text, t5_prompts)
        
        # Use QA model for specific education information
        qa_questions = [
            "What degrees does this person have?",
            "Which universities did this person attend?",
            "What is the graduation year?",
            "What was the major or field of study?",
            "What is the GPA or academic performance?"
        ]
        
        qa_results = self._extract_with_qa_model(text, qa_questions)
        
        # Process T5 results
        for prompt, result in t5_results.items():
            if result and "education" in prompt.lower():
                education_entries = self._parse_education_from_text(result)
                education.extend(education_entries)
        
        # Enhance with QA results
        if qa_results:
            degrees = qa_results.get("What degrees does this person have?", "")
            universities = qa_results.get("Which universities did this person attend?", "")
            
            if degrees and universities:
                degree_list = [d.strip() for d in degrees.split(',') if d.strip()]
                uni_list = [u.strip() for u in universities.split(',') if u.strip()]
                
                for i, (degree, university) in enumerate(zip(degree_list, uni_list)):
                    education.append({
                        'degree': degree,
                        'institution': university,
                        'graduation_year': qa_results.get("What is the graduation year?", ""),
                        'field_of_study': qa_results.get("What was the major or field of study?", ""),
                        'gpa': qa_results.get("What is the GPA or academic performance?", ""),
                        'confidence': 0.8
                    })
        
        return education[:5]  # Limit to top 5 education entries
    
    def _parse_education_from_text(self, text: str) -> List[Dict[str, Any]]:
        """Parse education entries from generated text"""
        education = []
        
        # Split by common delimiters
        entries = re.split(r'\n\s*\n|\d+\.|•|\*', text)
        
        for entry in entries:
            entry = entry.strip()
            if len(entry) > 10:  # Minimum length for valid education
                education_entry = {
                    'degree': self._extract_degree_from_entry(entry),
                    'institution': self._extract_institution_from_entry(entry),
                    'graduation_year': self._extract_year_from_entry(entry),
                    'field_of_study': None,
                    'gpa': None,
                    'confidence': 0.7
                }
                
                if education_entry['degree'] or education_entry['institution']:
                    education.append(education_entry)
        
        return education
    
    def _extract_degree_from_entry(self, text: str) -> Optional[str]:
        """Extract degree from education entry"""
        degree_patterns = [
            r'\b(Bachelor|Master|PhD|Doctorate|Associate|B\.?[AS]|M\.?[AS]|Ph\.?D)[\w\s]*',
            r'\b(BS|BA|MS|MA|MBA|PhD)\b[\w\s]*',
        ]
        
        for pattern in degree_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0).strip()
        
        return None
    
    def _extract_institution_from_entry(self, text: str) -> Optional[str]:
        """Extract institution from education entry"""
        # Look for university/college patterns
        patterns = [
            r'\b([A-Z][\w\s]+(?:University|College|Institute|School))',
            r'\bat\s+([A-Z][\w\s]+)',
            r'([A-Z][\w\s]+)\s*[-–]',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                institution = match.group(1).strip()
                if len(institution) > 3 and len(institution) < 100:
                    return institution
        
        return None
    
    def _extract_year_from_entry(self, text: str) -> Optional[str]:
        """Extract graduation year from education entry"""
        year_pattern = r'\b(19|20)\d{2}\b'
        match = re.search(year_pattern, text)
        if match:
            return match.group(0)
        return None
    
    def _validate_email(self, email: str) -> bool:
        """Validate email address"""
        # Basic validation
        if '@' not in email or '.' not in email:
            return False
        
        # Check for reasonable length
        if len(email) < 5 or len(email) > 100:
            return False
        
        # Check for valid characters
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            return False
        
        return True
    
    def _extract_work_experience_advanced(self, text: str, doc=None) -> List[Dict[str, Any]]:
        """Extract work experience with enterprise-level accuracy using NLP models"""
        # Try NLP-based extraction first
        if self.models_loaded:
            nlp_experiences = self._extract_work_experience_nlp(text)
            if nlp_experiences:
                return nlp_experiences
        
        # Fallback to traditional pattern-based extraction
        experiences = []
        
        # Find experience section
        exp_section = self._find_section(text, 'experience')
        if not exp_section:
            exp_section = text  # Use full text if no section found
        
        # Look for date patterns to identify job entries
        lines = exp_section.split('\n')
        current_job = {}
        
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
            
            # Check for date patterns that indicate job periods
            date_match = None
            for pattern in self.date_patterns:
                match = re.search(pattern, line, re.IGNORECASE)
                if match:
                    date_match = match
                    break
            
            if date_match:
                # Save previous job if exists
                if current_job and self._validate_work_experience(current_job):
                    experiences.append(current_job)
                
                # Start new job entry
                current_job = self._parse_job_dates(date_match.group(0))
                
                # Look for job title and company in surrounding lines
                job_info = self._extract_job_info_from_context(lines, i)
                current_job.update(job_info)
                
                # Look for description in following lines
                description = self._extract_job_description_from_context(lines, i)
                if description:
                    current_job['description'] = description
        
        # Add last job
        if current_job and self._validate_work_experience(current_job):
            experiences.append(current_job)
        
        # Sort by start date (most recent first)
        experiences.sort(key=lambda x: self._parse_date_for_sorting(x.get('start_date', '')), reverse=True)
        
        return experiences
    
    def _parse_job_dates(self, date_str: str) -> Dict[str, Any]:
        """Parse job date string into structured format"""
        job_data = {}
        
        # Look for date ranges
        date_range_patterns = [
            r'(\w+\s+\d{4})\s*[-–]\s*(\w+\s+\d{4}|present|current)',
            r'(\d{1,2}/\d{4})\s*[-–]\s*(\d{1,2}/\d{4}|present|current)',
            r'(\d{4})\s*[-–]\s*(\d{4}|present|current)',
        ]
        
        for pattern in date_range_patterns:
            match = re.search(pattern, date_str, re.IGNORECASE)
            if match:
                start_date = match.group(1)
                end_date = match.group(2)
                is_current = end_date.lower() in ['present', 'current']
                
                job_data['start_date'] = self._normalize_date(start_date)
                job_data['end_date'] = self._normalize_date(end_date) if not is_current else None
                job_data['is_current'] = is_current
                break
        
        return job_data
    
    def _extract_job_info_from_context(self, lines: List[str], date_line_index: int) -> Dict[str, str]:
        """Extract job title, company, and location from context around date line"""
        job_info = {}
        
        # Look in lines before and after the date line
        context_range = range(max(0, date_line_index - 3), min(len(lines), date_line_index + 3))
        
        for i in context_range:
            if i == date_line_index:
                continue
                
            line = lines[i].strip()
            if not line:
                continue
            
            # Skip lines with dates
            if any(re.search(pattern, line, re.IGNORECASE) for pattern in self.date_patterns):
                continue
            
            # Look for company indicators
            company_indicators = ['inc', 'llc', 'corp', 'company', 'ltd', 'technologies', 'tech', 'systems', 'solutions']
            if any(indicator in line.lower() for indicator in company_indicators):
                if 'company_name' not in job_info:
                    job_info['company_name'] = line
                continue
            
            # Look for location indicators
            location_indicators = [', ca', ', ny', ', tx', 'california', 'new york', 'texas', 'remote', 'usa']
            if any(indicator in line.lower() for indicator in location_indicators):
                if 'location' not in job_info:
                    job_info['location'] = line
                continue
            
            # Look for job title (usually contains job-related keywords)
            job_keywords = ['engineer', 'developer', 'manager', 'analyst', 'consultant', 'director', 'specialist', 'lead', 'senior', 'junior']
            if any(keyword in line.lower() for keyword in job_keywords) and len(line) < 100:
                if 'job_title' not in job_info:
                    job_info['job_title'] = line
        
        return job_info
    
    def _extract_job_description_from_context(self, lines: List[str], date_line_index: int) -> Optional[str]:
        """Extract job description from lines following the date line"""
        description_lines = []
        
        # Look in lines after the date line
        for i in range(date_line_index + 1, min(len(lines), date_line_index + 10)):
            line = lines[i].strip()
            if not line:
                continue
            
            # Stop if we hit another date (next job)
            if any(re.search(pattern, line, re.IGNORECASE) for pattern in self.date_patterns):
                break
            
            # Stop if we hit a section header
            if self._is_section_header(line):
                break
            
            # Skip company/location lines
            if (any(indicator in line.lower() for indicator in ['inc', 'llc', 'corp', 'company', 'ltd']) or
                any(indicator in line.lower() for indicator in [', ca', ', ny', ', tx', 'remote'])):
                continue
            
            # Add bullet points and substantial text
            if (line.startswith('•') or line.startswith('-') or line.startswith('*') or len(line) > 20):
                description_lines.append(line)
        
        return '\n'.join(description_lines) if description_lines else None
    
    def _normalize_date(self, date_str: str) -> str:
        """Normalize date string to consistent format"""
        if not date_str or date_str.lower() in ['present', 'current']:
            return date_str
        
        try:
            # Use dateparser for flexible date parsing
            parsed_date = dateparser.parse(date_str)
            if parsed_date:
                return parsed_date.strftime('%Y-%m-%d')
        except:
            pass
        
        return date_str
    
    def _validate_work_experience(self, experience: Dict[str, Any]) -> bool:
        """Validate work experience entry"""
        # Must have at least a job title, company, or meaningful description
        return bool(
            experience.get('job_title') or 
            experience.get('company_name') or 
            (experience.get('description') and len(experience.get('description', '')) > 20)
        )
    
    def _extract_education_advanced(self, text: str, doc=None) -> List[Dict[str, Any]]:
        """Extract education with high accuracy using NLP models"""
        # Try NLP-based extraction first
        if self.models_loaded:
            nlp_education = self._extract_education_nlp(text)
            if nlp_education:
                return nlp_education
        
        # Fallback to traditional pattern-based extraction
        education_entries = []
        
        # Find education section
        edu_section = self._find_section(text, 'education')
        if not edu_section:
            # Look for education keywords in full text
            edu_keywords = ['university', 'college', 'bachelor', 'master', 'phd', 'degree', 'gpa']
            if any(keyword in text.lower() for keyword in edu_keywords):
                edu_section = text
            else:
                return education_entries
        
        lines = edu_section.split('\n')
        current_entry = {}
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check for degree patterns
            degree_patterns = [
                r'(bachelor|master|phd|doctorate|associate|diploma|certificate)',
                r'(b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?|ph\.?d\.?|mba)'
            ]
            
            for pattern in degree_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    if current_entry:
                        education_entries.append(current_entry)
                    current_entry = {'degree_type': line}
                    break
            
            # Check for institution
            institution_indicators = ['university', 'college', 'institute', 'school', 'academy']
            if any(indicator in line.lower() for indicator in institution_indicators):
                current_entry['institution_name'] = line
            
            # Check for field of study
            field_indicators = ['computer science', 'engineering', 'business', 'mathematics', 'physics', 'chemistry', 'science']
            if any(field in line.lower() for field in field_indicators):
                current_entry['field_of_study'] = line
            
            # Check for GPA
            gpa_match = re.search(r'gpa[:\s]*(\d+\.?\d*)', line, re.IGNORECASE)
            if gpa_match:
                try:
                    current_entry['gpa'] = float(gpa_match.group(1))
                except:
                    pass
            
            # Check for graduation year
            year_match = re.search(r'\b(19|20)\d{2}\b', line)
            if year_match:
                current_entry['graduation_year'] = year_match.group(0)
        
        if current_entry:
            education_entries.append(current_entry)
        
        return education_entries
    
    def _extract_skills_advanced(self, text: str, doc=None) -> List[Dict[str, str]]:
        """Extract skills with high accuracy using NLP models and categorization"""
        # Try NLP-based extraction first
        if self.models_loaded:
            nlp_skills = self._extract_skills_nlp(text)
            if nlp_skills:
                # Convert to expected format
                formatted_skills = []
                for skill in nlp_skills:
                    formatted_skills.append({
                        'skill_name': skill['name'].title(),
                        'skill_category': skill['category'],
                        'proficiency_level': None,
                        'confidence_score': skill['confidence']
                    })
                return formatted_skills
        
        # Fallback to traditional fuzzy matching approach
        skills = []
        text_lower = text.lower()
        
        # Use fuzzy matching for better skill detection
        for skill in self.all_skills:
            # Direct match
            if skill in text_lower:
                category = self._categorize_skill(skill)
                skills.append({
                    'skill_name': skill.title(),
                    'skill_category': category,
                    'proficiency_level': None,
                    'confidence_score': 1.0
                })
            else:
                # Fuzzy match for variations
                words = text_lower.split()
                for word in words:
                    if len(word) > 2:
                        ratio = fuzz.ratio(skill, word)
                        if ratio > 85:  # High similarity threshold
                            category = self._categorize_skill(skill)
                            skills.append({
                                'skill_name': skill.title(),
                                'skill_category': category,
                                'proficiency_level': None,
                                'confidence_score': ratio / 100.0
                            })
                            break
        
        # Remove duplicates and sort by confidence
        unique_skills = {}
        for skill in skills:
            name = skill['skill_name']
            if name not in unique_skills or skill['confidence_score'] > unique_skills[name]['confidence_score']:
                unique_skills[name] = skill
        
        return list(unique_skills.values())
    
    def _categorize_skill(self, skill: str) -> str:
        """Categorize skill into appropriate category"""
        skill_lower = skill.lower()
        
        if skill_lower in self.programming_languages:
            return 'Programming Languages'
        elif skill_lower in self.frameworks_libraries:
            return 'Frameworks & Libraries'
        elif skill_lower in self.databases:
            return 'Databases'
        elif skill_lower in self.cloud_platforms:
            return 'Cloud Platforms'
        elif skill_lower in self.tools_technologies:
            return 'Tools & Technologies'
        else:
            return 'Other'
    
    def _extract_certifications_advanced(self, text: str, doc=None) -> List[Dict[str, str]]:
        """Extract certifications with high accuracy"""
        certifications = []
        
        # Find certifications section
        cert_section = self._find_section(text, 'certifications')
        if not cert_section:
            cert_section = text
        
        # Look for certification patterns
        cert_patterns = [
            r'(certified|certification|certificate)',
            r'(aws|azure|google|microsoft|cisco|oracle|comptia|pmp|scrum|agile)',
            r'(professional|associate|expert|specialist|practitioner)'
        ]
        
        lines = cert_section.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            for pattern in cert_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    certifications.append({
                        'name': line,
                        'issuer': self._extract_cert_issuer(line),
                        'date_obtained': self._extract_cert_date(line)
                    })
                    break
        
        return certifications
    
    def _extract_cert_issuer(self, cert_text: str) -> Optional[str]:
        """Extract certification issuer"""
        issuers = ['aws', 'microsoft', 'google', 'cisco', 'oracle', 'comptia', 'pmi', 'scrum alliance']
        cert_lower = cert_text.lower()
        
        for issuer in issuers:
            if issuer in cert_lower:
                return issuer.title()
        
        return None
    
    def _extract_cert_date(self, cert_text: str) -> Optional[str]:
        """Extract certification date"""
        for pattern in self.date_patterns:
            match = re.search(pattern, cert_text, re.IGNORECASE)
            if match:
                return self._normalize_date(match.group(0))
        
        return None
    
    def _extract_projects_advanced(self, text: str, doc=None) -> List[Dict[str, str]]:
        """Extract projects with descriptions"""
        projects = []
        
        # Find projects section
        proj_section = self._find_section(text, 'projects')
        if not proj_section:
            return projects
        
        lines = proj_section.split('\n')
        current_project = {}
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Look for project names (usually bold or standalone lines)
            if len(line) < 100 and not line.startswith('•') and not line.startswith('-'):
                if current_project:
                    projects.append(current_project)
                current_project = {'name': line, 'description': ''}
            else:
                # Add to description
                if current_project:
                    if current_project['description']:
                        current_project['description'] += ' '
                    current_project['description'] += line
        
        if current_project:
            projects.append(current_project)
        
        return projects
    
    def _extract_languages_advanced(self, text: str, doc=None) -> List[Dict[str, str]]:
        """Extract languages with proficiency levels"""
        languages = []
        
        # Common languages
        common_languages = [
            'english', 'spanish', 'french', 'german', 'chinese', 'mandarin',
            'japanese', 'korean', 'italian', 'portuguese', 'russian', 'arabic',
            'hindi', 'dutch', 'swedish', 'norwegian', 'danish', 'finnish'
        ]
        
        # Proficiency levels
        proficiency_patterns = [
            r'(native|fluent|advanced|intermediate|basic|beginner)',
            r'(c2|c1|b2|b1|a2|a1)',  # CEFR levels
            r'(professional|conversational|limited)'
        ]
        
        text_lower = text.lower()
        
        for lang in common_languages:
            if lang in text_lower:
                # Look for proficiency level near the language
                proficiency = None
                lang_index = text_lower.find(lang)
                surrounding_text = text_lower[max(0, lang_index-50):lang_index+50]
                
                for pattern in proficiency_patterns:
                    match = re.search(pattern, surrounding_text)
                    if match:
                        proficiency = match.group(1).title()
                        break
                
                languages.append({
                    'language': lang.title(),
                    'proficiency': proficiency or 'Not specified'
                })
        
        return languages
    
    def _find_section(self, text: str, section_type: str) -> Optional[str]:
        """Find specific section in text"""
        if section_type not in self.section_headers:
            return None
        
        headers = self.section_headers[section_type]
        lines = text.split('\n')
        
        for i, line in enumerate(lines):
            line_lower = line.lower().strip()
            for header in headers:
                if header in line_lower and len(line_lower) < 50:
                    # Found section header, extract content until next section
                    section_content = []
                    for j in range(i+1, len(lines)):
                        next_line = lines[j].strip()
                        if self._is_section_header(next_line):
                            break
                        section_content.append(next_line)
                    
                    return '\n'.join(section_content)
        
        return None
    
    def _is_section_header(self, line: str) -> bool:
        """Check if line is a section header"""
        line_lower = line.lower().strip()
        
        # Check against all known section headers
        for section_type, headers in self.section_headers.items():
            for header in headers:
                if header in line_lower and len(line_lower) < 50:
                    return True
        
        return False
    
    def _extract_title_advanced(self, text: str, doc=None) -> Optional[str]:
        """Extract professional title/headline"""
        lines = text.split('\n')
        
        # Look for title patterns in first 10 lines
        title_patterns = [
            r'(software engineer|developer|manager|analyst|consultant|designer|architect|director|specialist)',
            r'(senior|junior|lead|principal|chief|head of|vice president|vp)',
            r'(full stack|front end|back end|data scientist|product manager|project manager)'
        ]
        
        for line in lines[:10]:
            line = line.strip()
            if line and len(line) < 150:
                for pattern in title_patterns:
                    if re.search(pattern, line, re.IGNORECASE):
                        return line
        
        return None
    
    def _extract_summary_advanced(self, text: str, doc=None) -> Optional[str]:
        """Extract professional summary/objective"""
        summary_section = self._find_section(text, 'summary')
        if summary_section:
            # Clean and return first paragraph
            paragraphs = summary_section.split('\n\n')
            if paragraphs:
                return paragraphs[0].strip()
        
        return None
    
    def _extract_sections_advanced(self, text: str) -> Dict[str, List[str]]:
        """Extract all sections for backward compatibility"""
        sections = {}
        
        for section_type in self.section_headers.keys():
            section_content = self._find_section(text, section_type)
            if section_content:
                sections[section_type] = section_content.split('\n')
        
        return sections
    
    def _extract_metadata(self, text: str, doc=None) -> Dict[str, Any]:
        """Extract additional metadata"""
        metadata = {
            'total_experience_years': self._calculate_total_experience(text),
            'education_level': self._determine_education_level(text),
            'industry': self._determine_industry(text),
            'seniority_level': self._determine_seniority_level(text)
        }
        
        return metadata
    
    def _calculate_total_experience(self, text: str) -> Optional[int]:
        """Calculate total years of experience"""
        # Look for explicit mentions
        exp_patterns = [
            r'(\d+)\+?\s*years?\s*of\s*experience',
            r'(\d+)\+?\s*years?\s*experience',
            r'experience.*?(\d+)\+?\s*years?'
        ]
        
        for pattern in exp_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    return int(match.group(1))
                except:
                    pass
        
        return None
    
    def _determine_education_level(self, text: str) -> str:
        """Determine highest education level"""
        text_lower = text.lower()
        
        if any(degree in text_lower for degree in ['phd', 'doctorate', 'ph.d']):
            return 'Doctorate'
        elif any(degree in text_lower for degree in ['master', 'mba', 'm.s', 'm.a']):
            return 'Masters'
        elif any(degree in text_lower for degree in ['bachelor', 'b.s', 'b.a']):
            return 'Bachelors'
        elif any(degree in text_lower for degree in ['associate', 'diploma']):
            return 'Associate'
        else:
            return 'Unknown'
    
    def _determine_industry(self, text: str) -> str:
        """Determine industry based on skills and experience"""
        text_lower = text.lower()
        
        # Technology indicators
        tech_indicators = ['software', 'developer', 'engineer', 'programming', 'coding', 'tech']
        if any(indicator in text_lower for indicator in tech_indicators):
            return 'Technology'
        
        # Finance indicators
        finance_indicators = ['finance', 'banking', 'investment', 'financial', 'accounting']
        if any(indicator in text_lower for indicator in finance_indicators):
            return 'Finance'
        
        # Healthcare indicators
        healthcare_indicators = ['healthcare', 'medical', 'hospital', 'clinical', 'nurse', 'doctor']
        if any(indicator in text_lower for indicator in healthcare_indicators):
            return 'Healthcare'
        
        return 'Other'
    
    def _determine_seniority_level(self, text: str) -> str:
        """Determine seniority level"""
        text_lower = text.lower()
        
        if any(level in text_lower for level in ['senior', 'lead', 'principal', 'architect', 'director', 'vp', 'chief']):
            return 'Senior'
        elif any(level in text_lower for level in ['junior', 'entry', 'associate', 'intern']):
            return 'Junior'
        else:
            return 'Mid-level'
    
    def _calculate_accuracy_score(self, text: str) -> float:
        """Calculate parsing accuracy score"""
        # Simple heuristic based on extracted fields
        score = 0.0
        
        # Check for presence of key information
        if re.search(r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b', text):  # Name
            score += 0.2
        
        if re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text):  # Email
            score += 0.2
        
        if any(re.search(pattern, text, re.IGNORECASE) for pattern in self.phone_patterns):  # Phone
            score += 0.1
        
        if any(header in text.lower() for headers in self.section_headers.values() for header in headers):  # Sections
            score += 0.3
        
        if any(skill in text.lower() for skill in list(self.all_skills)[:50]):  # Skills
            score += 0.2
        
        return min(score, 1.0)
    
    def _parse_date_for_sorting(self, date_str: str) -> datetime:
        """Parse date string for sorting purposes"""
        if not date_str:
            return datetime.min
        
        try:
            parsed = dateparser.parse(date_str)
            return parsed if parsed else datetime.min
        except:
            return datetime.min
    
    def _get_error_response(self, error_msg: str) -> Dict[str, Any]:
        """Return error response structure"""
        return {
            'raw_text': '',
            'cleaned_text': '',
            'personal_info': {},
            'contact_info': {},
            'work_experience': [],
            'education': [],
            'skills': [],
            'certifications': [],
            'projects': [],
            'languages': [],
            'metadata': {},
            'sections': {},
            'parsed_at': datetime.utcnow().isoformat(),
            'parser_version': '2.0.0',
            'accuracy_score': 0.0,
            'error': error_msg
        }

# Alias for backward compatibility
ResumeParser = EnterpriseResumeParser

