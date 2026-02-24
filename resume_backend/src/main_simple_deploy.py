import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from datetime import datetime
import sqlite3
import hashlib
import json

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'production-secret-key')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Initialize CORS
CORS(app, origins="*", allow_headers=["Content-Type", "Authorization"])

# Database setup
DATABASE = os.path.join(os.path.dirname(__file__), 'database', 'simple_app.db')

def init_db():
    """Initialize the database"""
    os.makedirs(os.path.dirname(DATABASE), exist_ok=True)
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1
        )
    ''')
    
    # Create resumes table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS resumes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            original_filename TEXT,
            file_path TEXT,
            parsed_content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def hash_password(password):
    """Hash a password"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, password_hash):
    """Verify a password"""
    return hashlib.sha256(password.encode()).hexdigest() == password_hash

# Initialize database
init_db()

@app.route('/api/auth/register', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Username, email, and password are required'}), 400
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Check if user already exists
        cursor.execute('SELECT id FROM users WHERE username = ? OR email = ?', 
                      (data['username'], data['email']))
        if cursor.fetchone():
            return jsonify({'error': 'Username or email already exists'}), 409
        
        # Create new user
        password_hash = hash_password(data['password'])
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, first_name, last_name)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['username'], data['email'], password_hash, 
              data.get('first_name', ''), data.get('last_name', '')))
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'User created successfully',
            'user': {
                'id': user_id,
                'username': data['username'],
                'email': data['email'],
                'first_name': data.get('first_name', ''),
                'last_name': data.get('last_name', '')
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Find user
        cursor.execute('''
            SELECT id, username, email, password_hash, first_name, last_name
            FROM users WHERE email = ? AND is_active = 1
        ''', (data['email'],))
        
        user = cursor.fetchone()
        if not user or not verify_password(data['password'], user[3]):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        conn.close()
        
        return jsonify({
            'message': 'Login successful',
            'access_token': f'simple_token_{user[0]}',  # Simple token for demo
            'user': {
                'id': user[0],
                'username': user[1],
                'email': user[2],
                'first_name': user[4],
                'last_name': user[5]
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/resumes', methods=['GET'])
def get_resumes():
    """Get all resumes for the authenticated user"""
    try:
        # Simple auth check
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer simple_token_'):
            return jsonify({'error': 'Invalid token'}), 401
        
        user_id = int(auth_header.replace('Bearer simple_token_', ''))
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, title, original_filename, created_at, updated_at
            FROM resumes WHERE user_id = ? AND is_active = 1
            ORDER BY created_at DESC
        ''', (user_id,))
        
        resumes = []
        for row in cursor.fetchall():
            resumes.append({
                'id': row[0],
                'title': row[1],
                'original_filename': row[2],
                'created_at': row[3],
                'updated_at': row[4]
            })
        
        conn.close()
        
        return jsonify({'resumes': resumes}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/resumes/upload', methods=['POST'])
def upload_resume():
    """Upload and parse a new resume file"""
    try:
        # Simple auth check
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer simple_token_'):
            return jsonify({'error': 'Invalid token'}), 401
        
        user_id = int(auth_header.replace('Bearer simple_token_', ''))
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        title = request.form.get('title', '')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Simple text extraction (for demo)
        try:
            if file.filename.endswith('.txt'):
                content = file.read().decode('utf-8')
            else:
                content = f"File uploaded: {file.filename} (parsing not implemented in simple version)"
        except:
            content = f"File uploaded: {file.filename} (could not extract text)"
        
        # Save to database
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO resumes (user_id, title, original_filename, parsed_content)
            VALUES (?, ?, ?, ?)
        ''', (user_id, title or f"Resume - {datetime.now().strftime('%Y-%m-%d')}", 
              file.filename, content))
        
        resume_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'message': 'Resume uploaded successfully',
            'resume': {
                'id': resume_id,
                'title': title,
                'original_filename': file.filename
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/resumes/<int:resume_id>', methods=['GET'])
def get_resume(resume_id):
    """Get specific resume"""
    try:
        # Simple auth check
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer simple_token_'):
            return jsonify({'error': 'Invalid token'}), 401
        
        user_id = int(auth_header.replace('Bearer simple_token_', ''))
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, title, original_filename, parsed_content, created_at, updated_at
            FROM resumes WHERE id = ? AND user_id = ? AND is_active = 1
        ''', (resume_id, user_id))
        
        resume = cursor.fetchone()
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        conn.close()
        
        return jsonify({
            'resume': {
                'id': resume[0],
                'title': resume[1],
                'original_filename': resume[2],
                'parsed_content': resume[3],
                'created_at': resume[4],
                'updated_at': resume[5]
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/resumes/<int:resume_id>', methods=['PUT'])
def update_resume(resume_id):
    """Update resume"""
    try:
        # Simple auth check
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer simple_token_'):
            return jsonify({'error': 'Invalid token'}), 401
        
        user_id = int(auth_header.replace('Bearer simple_token_', ''))
        data = request.get_json()
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE resumes SET title = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ? AND is_active = 1
        ''', (data.get('title', ''), resume_id, user_id))
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Resume not found'}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Resume updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/resumes/<int:resume_id>', methods=['DELETE'])
def delete_resume(resume_id):
    """Delete resume"""
    try:
        # Simple auth check
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer simple_token_'):
            return jsonify({'error': 'Invalid token'}), 401
        
        user_id = int(auth_header.replace('Bearer simple_token_', ''))
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE resumes SET is_active = 0, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ? AND is_active = 1
        ''', (resume_id, user_id))
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Resume not found'}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Resume deleted successfully'}), 204
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    """Serve static files"""
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return jsonify({'message': 'cvZen Resume Builder API', 'status': 'running'}), 200

@app.errorhandler(413)
def too_large(e):
    return {'error': 'File too large. Maximum size is 16MB.'}, 413

@app.errorhandler(404)
def not_found(e):
    return {'error': 'Endpoint not found'}, 404

@app.errorhandler(500)
def internal_error(e):
    return {'error': 'Internal server error'}, 500

if __name__ == '__main__':
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)

