from inertia import Inertia
from flask import Flask, render_template, session
import os

def setup_inertia(app: Flask):
    """Configure Inertia.js for the Flask application"""
    
    # Initialize Inertia
    inertia = Inertia()
    inertia.init_app(app)
    
    # Set the root template
    inertia.set_root_template('app.html')
    
    # Configure asset versioning for cache busting
    def asset_version():
        manifest_path = os.path.join(app.static_folder, 'manifest.json')
        if os.path.exists(manifest_path):
            return str(os.path.getmtime(manifest_path))
        return '1'
    
    inertia.set_asset_version(asset_version)
    
    # Share data globally with all Inertia responses
    @inertia.share
    def share_auth_user():
        from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            if user_id:
                from src.models.user import User
                user = User.query.get(user_id)
                return {
                    'auth': {
                        'user': user.to_dict() if user else None
                    }
                }
        except:
            pass
        return {'auth': {'user': None}}
    
    # Share flash messages
    @inertia.share
    def share_flash():
        return {
            'flash': {
                'success': session.pop('flash_success', None),
                'error': session.pop('flash_error', None),
                'info': session.pop('flash_info', None)
            }
        }
    
    # Share CSRF token if needed
    @inertia.share
    def share_csrf():
        return {
            'csrf_token': session.get('csrf_token')
        }
    
    return inertia

def flash_message(message, category='info'):
    """Helper function to set flash messages"""
    session[f'flash_{category}'] = message