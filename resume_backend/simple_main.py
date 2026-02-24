import os
import sqlite3
import hashlib
import jwt
import tempfile
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from src.utils.resume_parser import EnterpriseResumeParser

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

@app.after_request
def add_csp_headers(response):
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "connect-src 'self' http://localhost:5173 http://localhost:5001; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline';"
    )
    return response

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-here'
DATABASE = 'simple_resume.db'

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                first_name TEXT,
                last_name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS resumes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                content TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        conn.commit()

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, password_hash):
    return hashlib.sha256(password.encode()).hexdigest() == password_hash

def generate_token(user_id):
    payload = {
        'user_id': str(user_id),
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Resume Backend API", "status": "running"})

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "timestamp": datetime.utcnow().isoformat()})

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400
        
        username = data['username']
        email = data['email']
        password = data['password']
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        
        # Validate email format
        if '@' not in email:
            return jsonify({"error": "Invalid email format"}), 400
        
        # Validate password length
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400
        
        with get_db() as conn:
            # Check if user already exists
            existing_user = conn.execute(
                'SELECT id FROM users WHERE username = ? OR email = ?',
                (username, email)
            ).fetchone()
            
            if existing_user:
                return jsonify({"error": "Username or email already exists"}), 400
            
            # Create new user
            password_hash = hash_password(password)
            cursor = conn.execute(
                'INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
                (username, email, password_hash, first_name, last_name)
            )
            user_id = cursor.lastrowid
            conn.commit()
            
            # Generate token
            token = generate_token(user_id)
            
            # Get user data
            user = conn.execute(
                'SELECT id, username, email, first_name, last_name FROM users WHERE id = ?',
                (user_id,)
            ).fetchone()
            
            return jsonify({
                "message": "Registration successful",
                "access_token": token,
                "user": {
                    "id": user['id'],
                    "username": user['username'],
                    "email": user['email'],
                    "first_name": user['first_name'],
                    "last_name": user['last_name']
                }
            }), 201
            
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({"error": "Registration failed"}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({"error": "Email and password are required"}), 400
        
        email = data['email']
        password = data['password']
        
        with get_db() as conn:
            # Find user by email
            user = conn.execute(
                'SELECT id, username, email, password_hash, first_name, last_name FROM users WHERE email = ?',
                (email,)
            ).fetchone()
            
            if not user:
                return jsonify({"error": "Invalid email or password"}), 401
            
            # Verify password
            if not verify_password(password, user['password_hash']):
                return jsonify({"error": "Invalid email or password"}), 401
            
            # Generate token
            token = generate_token(user['id'])
            
            return jsonify({
                "message": "Login successful",
                "access_token": token,
                "user": {
                    "id": user['id'],
                    "username": user['username'],
                    "email": user['email'],
                    "first_name": user['first_name'],
                    "last_name": user['last_name']
                }
            }), 200
            
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({"error": "Login failed"}), 500

@app.route('/api/auth/profile', methods=['GET'])
def profile():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization token required"}), 401
        
        token = auth_header.split(' ')[1]
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        with get_db() as conn:
            user = conn.execute(
                'SELECT id, username, email, first_name, last_name FROM users WHERE id = ?',
                (user_id,)
            ).fetchone()
            
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            return jsonify({
                "user": {
                    "id": user['id'],
                    "username": user['username'],
                    "email": user['email'],
                    "first_name": user['first_name'],
                    "last_name": user['last_name']
                }
            }), 200
            
    except Exception as e:
        print(f"Profile error: {e}")
        return jsonify({"error": "Failed to get profile"}), 500

@app.route('/api/resumes', methods=['GET'])
def get_resumes():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization token required"}), 401
        
        token = auth_header.split(' ')[1]
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        with get_db() as conn:
            resumes = conn.execute(
                'SELECT id, title, created_at, updated_at FROM resumes WHERE user_id = ? ORDER BY updated_at DESC',
                (user_id,)
            ).fetchall()
            
            resume_list = []
            for resume in resumes:
                resume_list.append({
                    "id": resume['id'],
                    "title": resume['title'],
                    "created_at": resume['created_at'],
                    "updated_at": resume['updated_at']
                })
            
            return jsonify({"resumes": resume_list}), 200
            
    except Exception as e:
        print(f"Get resumes error: {e}")
        return jsonify({"error": "Failed to get resumes"}), 500

@app.route('/api/resumes/parse', methods=['POST'])
def parse_resume():
    """Parse resume without storing to database"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization token required"}), 401
        
        token = auth_header.split(' ')[1]
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        temp_dir = tempfile.mkdtemp()
        temp_path = os.path.join(temp_dir, filename)
        file.save(temp_path)
        
        try:
            # Use the enterprise resume parser for actual parsing
            parser = EnterpriseResumeParser()
            parsed_result = parser.parse_resume(temp_path)
            
            # Transform the parsed result to match frontend expectations
            parsed_data = {
                "personal_info": {
                    "name": parsed_result.get('personal_info', {}).get('name', ''),
                    "email": parsed_result.get('contact_info', {}).get('email', ''),
                    "phone": parsed_result.get('contact_info', {}).get('phone', '')
                },
                "experience": parsed_result.get('work_experience', []),
                "education": parsed_result.get('education', []),
                "skills": parsed_result.get('skills', []),
                "certifications": parsed_result.get('certifications', []),
                "projects": parsed_result.get('projects', []),
                "languages": parsed_result.get('languages', []),
                "accuracy_score": parsed_result.get('accuracy_score', 0.0),
                "raw_text": parsed_result.get('raw_text', ''),
                "sections": parsed_result.get('sections', {})
            }
            
            return jsonify({
                "message": "Resume parsed successfully",
                "data": parsed_data
            })
            
        except Exception as e:
            print(f"Parsing error: {e}")
            return jsonify({"error": f"Failed to parse resume: {str(e)}"}), 500
        finally:
            # Clean up temporary files
            try:
                os.remove(temp_path)
                os.rmdir(temp_dir)
            except:
                pass
                
    except Exception as e:
        print(f"Parse resume error: {e}")
        return jsonify({"error": "Failed to parse resume"}), 500

@app.route('/api/resumes/parse-and-save', methods=['POST'])
def parse_and_save_resume():
    """Parse resume file and save to database in one step"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization token required"}), 401
        
        token = auth_header.split(' ')[1]
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        temp_dir = tempfile.mkdtemp()
        temp_path = os.path.join(temp_dir, filename)
        file.save(temp_path)
        
        try:
            # Use the enterprise resume parser for actual parsing
            parser = EnterpriseResumeParser()
            parsed_result = parser.parse_resume(temp_path)
            
            # Transform the parsed result to match frontend expectations
            parsed_data = {
                "personal_info": {
                    "name": parsed_result.get('personal_info', {}).get('name', ''),
                    "email": parsed_result.get('contact_info', {}).get('email', ''),
                    "phone": parsed_result.get('contact_info', {}).get('phone', '')
                },
                "experience": parsed_result.get('work_experience', []),
                "education": parsed_result.get('education', []),
                "skills": parsed_result.get('skills', []),
                "certifications": parsed_result.get('certifications', []),
                "projects": parsed_result.get('projects', []),
                "languages": parsed_result.get('languages', []),
                "accuracy_score": parsed_result.get('accuracy_score', 0.0),
                "raw_text": parsed_result.get('raw_text', ''),
                "sections": parsed_result.get('sections', {})
            }
            
            # Get optional title from form data
            title = request.form.get('title', f"Resume - {filename}")
            
            # Save to database
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    'INSERT INTO resumes (user_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
                    (user_id, title, str(parsed_data), datetime.utcnow(), datetime.utcnow())
                )
                resume_id = cursor.lastrowid
                conn.commit()
            
            return jsonify({
                "message": "Resume parsed and saved successfully",
                "resume_id": resume_id,
                "title": title,
                "parsed_data": parsed_data,
                "filename": filename
            }), 201
            
        finally:
            # Clean up temporary file
            try:
                os.remove(temp_path)
                os.rmdir(temp_dir)
            except:
                pass
                
    except Exception as e:
        print(f"Parse resume error: {e}")
        return jsonify({"error": "Failed to parse resume"}), 500

@app.route('/api/resumes/save', methods=['POST'])
def save_resume():
    """Save parsed resume data to database"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization token required"}), 401
        
        token = auth_header.split(' ')[1]
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        title = data.get('title', 'Untitled Resume')
        parsed_content = data.get('parsed_data', {})
        
        if not parsed_content:
            return jsonify({"error": "No parsed content provided"}), 400
        
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                'INSERT INTO resumes (user_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
                (user_id, title, str(parsed_content), datetime.utcnow(), datetime.utcnow())
            )
            resume_id = cursor.lastrowid
            conn.commit()
            
            return jsonify({
                "message": "Resume saved successfully",
                "resume_id": resume_id,
                "title": title
            }), 201
            
    except Exception as e:
        print(f"Save resume error: {e}")
        return jsonify({"error": "Failed to save resume"}), 500



if __name__ == '__main__':
    init_db()
    print("Starting Resume Backend API...")
    print("Database initialized")
    app.run(host='0.0.0.0', port=5001, debug=True)

