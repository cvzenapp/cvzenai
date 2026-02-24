#!/usr/bin/env python3
"""
Test script for DSPy optimizer
"""

import os
import sys
from dotenv import load_dotenv

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from services.dspy_optimizer import DSPyResumeOptimizer


def test_basic_functionality():
    """Test basic DSPy functionality"""
    print("=" * 60)
    print("Testing DSPy Resume Optimizer")
    print("=" * 60)
    
    # Load environment
    load_dotenv()
    api_key = os.getenv('OPENAI_API_KEY')
    
    if not api_key:
        print("⚠️  WARNING: OPENAI_API_KEY not set")
        print("   Some tests will be skipped")
    
    # Initialize optimizer
    print("\n1. Initializing optimizer...")
    optimizer = DSPyResumeOptimizer(
        dataset_path='data_sets/DataSet.csv',
        api_key=api_key
    )
    print("✓ Optimizer initialized")
    
    # Load dataset
    print("\n2. Loading dataset...")
    df = optimizer.load_dataset()
    print(f"✓ Loaded {len(df)} resumes")
    print(f"   Categories: {list(df['Category'].value_counts().index)}")
    
    # Prepare examples
    print("\n3. Preparing training examples...")
    examples = optimizer.prepare_training_examples(sample_size=5)
    print(f"✓ Prepared {len(examples)} examples")
    
    if api_key:
        # Test parsing with a sample resume
        print("\n4. Testing resume parsing...")
        sample_resume = df.iloc[0]['Resume'][:1000]  # First 1000 chars
        sample_category = df.iloc[0]['Category']
        
        print(f"   Category: {sample_category}")
        print(f"   Resume length: {len(sample_resume)} chars")
        
        try:
            result = optimizer.parse_resume(sample_resume, sample_category)
            print("✓ Parsing successful")
            print(f"   Skills found: {len(result.get('skills', [])) if isinstance(result.get('skills'), list) else 'N/A'}")
            print(f"   Experience found: {len(result.get('experience', [])) if isinstance(result.get('experience'), list) else 'N/A'}")
            print(f"   Education found: {len(result.get('education', [])) if isinstance(result.get('education'), list) else 'N/A'}")
        except Exception as e:
            print(f"✗ Parsing failed: {e}")
    else:
        print("\n4. Skipping parsing test (no API key)")
    
    print("\n" + "=" * 60)
    print("✓ All tests completed!")
    print("=" * 60)


def test_dataset_stats():
    """Display dataset statistics"""
    print("\n" + "=" * 60)
    print("Dataset Statistics")
    print("=" * 60)
    
    optimizer = DSPyResumeOptimizer(dataset_path='data_sets/DataSet.csv')
    df = optimizer.load_dataset()
    
    print(f"\nTotal Resumes: {len(df)}")
    print("\nCategory Distribution:")
    for category, count in df['Category'].value_counts().items():
        print(f"  {category}: {count}")
    
    print(f"\nAverage Resume Length: {df['Resume'].str.len().mean():.0f} characters")
    print(f"Min Resume Length: {df['Resume'].str.len().min()} characters")
    print(f"Max Resume Length: {df['Resume'].str.len().max()} characters")
    
    print("\nSample Resume (first 500 chars):")
    print("-" * 60)
    print(df.iloc[0]['Resume'][:500])
    print("...")
    print("-" * 60)


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Test DSPy optimizer')
    parser.add_argument('--stats', action='store_true', help='Show dataset statistics')
    parser.add_argument('--all', action='store_true', help='Run all tests')
    
    args = parser.parse_args()
    
    if args.stats or args.all:
        test_dataset_stats()
    
    if not args.stats or args.all:
        test_basic_functionality()
