import os
import sqlite3
import hashlib
import jwt
import tempfile
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Import the enterprise parser
import sys
sys.path.append('/home/ubuntu/resume_backend/src/utils')
from ResumeParser import EnterpriseResumeParser

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

def get_user_from_token():
    """Extract user ID from Authorization header"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    return verify_token(token)

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

# Initialize enterprise parser
parser = EnterpriseResumeParser()

@app.route('/api/resumes/parse', methods=['POST'])
def parse_resume():
    """Parse resume without storing to database"""
    try:
        user_id = get_user_from_token()
        if not user_id:
            return jsonify({"error": "Authentication required"}), 401
        
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
            # Parse the resume using enterprise parser
            print(f"Parsing resume: {filename}")
            parsed_data = parser.parse_resume(temp_path)
            print(f"Parsing completed. Accuracy: {parsed_data.get('accuracy_score', 0)}")
            
            # Return parsed data without storing
            return jsonify({
                "message": "Resume parsed successfully",
                "parsed_data": parsed_data,
                "filename": filename
            }), 200
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
            os.rmdir(temp_dir)
            
    except Exception as e:
        print(f"Parse error: {e}")
        return jsonify({"error": f"Failed to parse resume: {str(e)}"}), 500

@app.route('/api/resumes/save', methods=['POST'])
def save_resume():
    """Save user-reviewed resume data to database"""
    try:
        user_id = get_user_from_token()
        if not user_id:
            return jsonify({"error": "Authentication required"}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        title = data.get('title', 'Untitled Resume')
        resume_data = data.get('resume_data', {})
        
        with get_db() as conn:
            # Save resume
            cursor = conn.execute(
                'INSERT INTO resumes (user_id, title, content) VALUES (?, ?, ?)',
                (user_id, title, str(resume_data))
            )
            resume_id = cursor.lastrowid
            conn.commit()
            
            return jsonify({
                "message": "Resume saved successfully",
                "resume_id": resume_id
            }), 200
            
    except Exception as e:
        print(f"Save error: {e}")
        return jsonify({"error": "Failed to save resume"}), 500

if __name__ == '__main__':
    init_db()
    print("Starting Resume Backend API...")
    print("Database initialized")
    app.run(host='0.0.0.0', port=5002, debug=True)

