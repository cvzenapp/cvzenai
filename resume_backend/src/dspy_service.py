"""
Standalone DSPy service for resume parsing optimization
Runs on a separate port from the main application
"""

import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from routes.dspy_routes import dspy_bp

app = Flask(__name__)
CORS(app)

# Configure JWT
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False
jwt = JWTManager(app)

# Register DSPy blueprint
app.register_blueprint(dspy_bp)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return {'status': 'healthy', 'service': 'dspy-optimizer'}, 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)
