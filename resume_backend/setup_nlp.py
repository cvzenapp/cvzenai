#!/usr/bin/env python3
"""
Setup script for NLP models and data required by the enhanced resume parser.
Run this script after installing requirements.txt to download necessary models.
"""

import subprocess
import sys
import nltk
import spacy
from transformers import pipeline

def download_spacy_model():
    """Download spaCy English language model"""
    print("Downloading spaCy English language model...")
    try:
        subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
        print("✓ spaCy model downloaded successfully")
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to download spaCy model: {e}")
        return False
    return True

def download_nltk_data():
    """Download required NLTK data"""
    print("Downloading NLTK data...")
    try:
        nltk.download('punkt', quiet=True)
        nltk.download('stopwords', quiet=True)
        nltk.download('wordnet', quiet=True)
        nltk.download('averaged_perceptron_tagger', quiet=True)
        nltk.download('maxent_ne_chunker', quiet=True)
        nltk.download('words', quiet=True)
        print("✓ NLTK data downloaded successfully")
    except Exception as e:
        print(f"✗ Failed to download NLTK data: {e}")
        return False
    return True

def test_transformers_models():
    """Test if transformers models can be loaded"""
    print("Testing transformers models...")
    try:
        # Test BERT NER pipeline
        ner_pipeline = pipeline("ner", 
                               model="dbmdz/bert-large-cased-finetuned-conll03-english",
                               aggregation_strategy="simple")
        print("✓ BERT NER model loaded successfully")
        
        # Test QA pipeline
        qa_pipeline = pipeline("question-answering",
                              model="distilbert-base-cased-distilled-squad")
        print("✓ QA model loaded successfully")
        
        # Test T5 model (smaller version for testing)
        from transformers import T5Tokenizer, T5ForConditionalGeneration
        tokenizer = T5Tokenizer.from_pretrained("t5-small")
        model = T5ForConditionalGeneration.from_pretrained("t5-small")
        print("✓ T5 model loaded successfully")
        
    except Exception as e:
        print(f"✗ Failed to load transformers models: {e}")
        return False
    return True

def verify_spacy_installation():
    """Verify spaCy installation and model"""
    print("Verifying spaCy installation...")
    try:
        nlp = spacy.load("en_core_web_sm")
        doc = nlp("Test sentence for verification.")
        print("✓ spaCy verification successful")
    except Exception as e:
        print(f"✗ spaCy verification failed: {e}")
        return False
    return True

def main():
    """Main setup function"""
    print("Setting up NLP models for enhanced resume parser...\n")
    
    success = True
    
    # Download spaCy model
    if not download_spacy_model():
        success = False
    
    # Download NLTK data
    if not download_nltk_data():
        success = False
    
    # Verify spaCy installation
    if not verify_spacy_installation():
        success = False
    
    # Test transformers models (optional, may take time)
    print("\nTesting transformers models (this may take a few minutes)...")
    if not test_transformers_models():
        print("⚠ Transformers models test failed, but they will be downloaded on first use")
    
    if success:
        print("\n🎉 NLP setup completed successfully!")
        print("\nThe enhanced resume parser is now ready to use with:")
        print("- BERT for Named Entity Recognition")
        print("- T5 for text generation and extraction")
        print("- Question-Answering models for information extraction")
        print("- spaCy for advanced NLP processing")
        print("- NLTK for text processing utilities")
    else:
        print("\n❌ Some components failed to install. Please check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()