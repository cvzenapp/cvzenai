"""
API routes for DSPy-based resume parsing optimization
"""

import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.dspy_optimizer import DSPyResumeOptimizer

dspy_bp = Blueprint('dspy', __name__, url_prefix='/api/dspy')

# Initialize optimizer (singleton pattern)
DATASET_PATH = os.path.join(os.path.dirname(__file__), '../../data_sets/DataSet.csv')
optimizer = None


def get_optimizer():
    """Get or create optimizer instance"""
    global optimizer
    if optimizer is None:
        optimizer = DSPyResumeOptimizer(
            dataset_path=DATASET_PATH,
            api_key=os.getenv('OPENAI_API_KEY')
        )
    return optimizer


@dspy_bp.route('/health', methods=['GET'])
def health_check():
    """Check if DSPy service is available"""
    try:
        opt = get_optimizer()
        return jsonify({
            'status': 'healthy',
            'dataset_loaded': opt.dataset is not None,
            'optimizer_ready': opt.optimized_parser is not None
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500


@dspy_bp.route('/optimize', methods=['POST'])
@jwt_required()
def optimize_prompts():
    """
    Trigger prompt optimization
    Requires admin privileges in production
    """
    try:
        data = request.get_json() or {}
        num_trials = data.get('num_trials', 10)
        sample_size = data.get('sample_size', 50)
        
        opt = get_optimizer()
        opt.prepare_training_examples(sample_size=sample_size)
        optimized_parser = opt.optimize_prompts(num_trials=num_trials)
        
        # Save optimized prompts
        output_path = os.path.join(
            os.path.dirname(__file__), 
            '../../models/optimized_prompts.json'
        )
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        opt.save_optimized_prompts(output_path)
        
        return jsonify({
            'message': 'Prompt optimization completed',
            'num_trials': num_trials,
            'sample_size': sample_size,
            'saved_to': output_path
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dspy_bp.route('/parse', methods=['POST'])
@jwt_required()
def parse_with_dspy():
    """
    Parse resume using DSPy-optimized prompts
    """
    try:
        data = request.get_json()
        
        if not data or 'resume_text' not in data:
            return jsonify({'error': 'resume_text is required'}), 400
        
        resume_text = data['resume_text']
        category = data.get('category', 'General')
        
        opt = get_optimizer()
        
        # Load optimized prompts if available
        if opt.optimized_parser is None:
            prompts_path = os.path.join(
                os.path.dirname(__file__), 
                '../../models/optimized_prompts.json'
            )
            if os.path.exists(prompts_path):
                opt.load_optimized_prompts(prompts_path)
        
        # Parse resume
        result = opt.parse_resume(resume_text, category)
        
        return jsonify({
            'message': 'Resume parsed successfully',
            'parsed_data': result,
            'category': category
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dspy_bp.route('/evaluate', methods=['GET'])
@jwt_required()
def evaluate_optimizer():
    """
    Evaluate the current optimized parser
    """
    try:
        opt = get_optimizer()
        
        if opt.optimized_parser is None:
            return jsonify({
                'error': 'No optimized parser available. Run /optimize first.'
            }), 400
        
        # Prepare test examples
        opt.prepare_training_examples(sample_size=20)
        
        # Evaluate
        metrics = opt.evaluate_parser()
        
        return jsonify({
            'message': 'Evaluation completed',
            'metrics': metrics
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dspy_bp.route('/dataset/stats', methods=['GET'])
def get_dataset_stats():
    """Get statistics about the training dataset"""
    try:
        opt = get_optimizer()
        df = opt.load_dataset()
        
        stats = {
            'total_resumes': len(df),
            'categories': df['Category'].value_counts().to_dict(),
            'avg_resume_length': df['Resume'].str.len().mean(),
            'sample_resume': df.iloc[0]['Resume'][:500] + '...' if len(df) > 0 else None
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dspy_bp.route('/compare', methods=['POST'])
@jwt_required()
def compare_parsers():
    """
    Compare DSPy-optimized parser with baseline
    """
    try:
        data = request.get_json()
        
        if not data or 'resume_text' not in data:
            return jsonify({'error': 'resume_text is required'}), 400
        
        resume_text = data['resume_text']
        category = data.get('category', 'General')
        
        opt = get_optimizer()
        
        # Parse with optimized parser
        optimized_result = opt.parse_resume(resume_text, category)
        
        # Parse with baseline (simple extraction)
        from utils.resume_parser import EnterpriseResumeParser
        baseline_parser = EnterpriseResumeParser()
        
        # For comparison, we'll use a simple text file
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(resume_text)
            temp_path = f.name
        
        try:
            baseline_result = baseline_parser.parse_resume(temp_path)
        finally:
            os.unlink(temp_path)
        
        return jsonify({
            'message': 'Comparison completed',
            'dspy_result': optimized_result,
            'baseline_result': {
                'skills': baseline_result.get('skills', []),
                'experience': baseline_result.get('work_experience', []),
                'education': baseline_result.get('education', []),
                'summary': baseline_result.get('personal_info', {}).get('summary', '')
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
