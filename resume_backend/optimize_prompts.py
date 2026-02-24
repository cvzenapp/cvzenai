#!/usr/bin/env python3
"""
CLI tool for optimizing resume parsing prompts using DSPy
"""

import os
import sys
import argparse
from dotenv import load_dotenv

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from services.dspy_optimizer import DSPyResumeOptimizer


def main():
    parser = argparse.ArgumentParser(
        description='Optimize resume parsing prompts using DSPy'
    )
    
    parser.add_argument(
        '--dataset',
        type=str,
        default='data_sets/DataSet.csv',
        help='Path to resume dataset CSV'
    )
    
    parser.add_argument(
        '--sample-size',
        type=int,
        default=50,
        help='Number of examples to use for training'
    )
    
    parser.add_argument(
        '--num-trials',
        type=int,
        default=10,
        help='Number of optimization trials'
    )
    
    parser.add_argument(
        '--output',
        type=str,
        default='models/optimized_prompts.json',
        help='Output path for optimized prompts'
    )
    
    parser.add_argument(
        '--evaluate',
        action='store_true',
        help='Evaluate the optimized parser'
    )
    
    parser.add_argument(
        '--test-resume',
        type=str,
        help='Path to a test resume file to parse'
    )
    
    parser.add_argument(
        '--category',
        type=str,
        default='General',
        help='Job category for test resume'
    )
    
    args = parser.parse_args()
    
    # Load environment variables
    load_dotenv()
    
    # Check for API key
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("ERROR: OPENAI_API_KEY not found in environment variables")
        print("Please set it in .env file or export it:")
        print("  export OPENAI_API_KEY='your-api-key'")
        sys.exit(1)
    
    # Initialize optimizer
    print(f"Initializing DSPy Resume Optimizer...")
    print(f"Dataset: {args.dataset}")
    
    optimizer = DSPyResumeOptimizer(
        dataset_path=args.dataset,
        api_key=api_key
    )
    
    # Load dataset
    print("\nLoading dataset...")
    df = optimizer.load_dataset()
    print(f"Loaded {len(df)} resumes")
    print(f"Categories: {df['Category'].value_counts().to_dict()}")
    
    # Prepare training examples
    print(f"\nPreparing {args.sample_size} training examples...")
    optimizer.prepare_training_examples(sample_size=args.sample_size)
    
    # Optimize prompts
    print(f"\nOptimizing prompts with {args.num_trials} trials...")
    print("This may take several minutes...")
    
    try:
        optimized_parser = optimizer.optimize_prompts(
            num_trials=args.num_trials
        )
        print("\n✓ Optimization completed successfully!")
        
        # Save optimized prompts
        os.makedirs(os.path.dirname(args.output), exist_ok=True)
        optimizer.save_optimized_prompts(args.output)
        print(f"✓ Optimized prompts saved to: {args.output}")
        
    except Exception as e:
        print(f"\n✗ Optimization failed: {e}")
        sys.exit(1)
    
    # Evaluate if requested
    if args.evaluate:
        print("\nEvaluating optimized parser...")
        metrics = optimizer.evaluate_parser()
        print(f"\nEvaluation Results:")
        print(f"  Total examples: {metrics['total']}")
        print(f"  Successful: {metrics['successful']}")
        print(f"  Success rate: {metrics['success_rate']:.2%}")
        print(f"  Average score: {metrics['avg_score']:.2f}")
    
    # Test on a specific resume if provided
    if args.test_resume:
        print(f"\nTesting on resume: {args.test_resume}")
        
        with open(args.test_resume, 'r', encoding='utf-8') as f:
            resume_text = f.read()
        
        result = optimizer.parse_resume(resume_text, args.category)
        
        print("\nParsing Results:")
        print(f"\nSkills: {result.get('skills', 'N/A')}")
        print(f"\nExperience: {result.get('experience', 'N/A')}")
        print(f"\nEducation: {result.get('education', 'N/A')}")
        print(f"\nSummary: {result.get('summary', 'N/A')}")
    
    print("\n✓ All done!")


if __name__ == '__main__':
    main()
