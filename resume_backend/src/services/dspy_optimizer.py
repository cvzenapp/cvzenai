"""
DSPy-based Prompt Optimizer for Resume Parsing
Uses the resume dataset to optimize prompts for better extraction accuracy
"""

import os
import dspy
import pandas as pd
from typing import List, Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class ResumeExample:
    """Training example for DSPy"""
    category: str
    resume_text: str
    extracted_skills: Optional[List[str]] = None
    extracted_experience: Optional[List[Dict]] = None
    extracted_education: Optional[List[Dict]] = None


class ResumeParserSignature(dspy.Signature):
    """Signature for resume parsing task"""
    resume_text = dspy.InputField(desc="Raw resume text to parse")
    category = dspy.InputField(desc="Job category (e.g., Data Science, Software Engineer)")
    
    skills = dspy.OutputField(desc="List of technical skills extracted from resume")
    experience = dspy.OutputField(desc="Work experience details with company, role, duration")
    education = dspy.OutputField(desc="Education details with degree, institution, dates")
    summary = dspy.OutputField(desc="Professional summary or objective")


class OptimizedResumeParser(dspy.Module):
    """DSPy module for optimized resume parsing"""
    
    def __init__(self):
        super().__init__()
        self.parser = dspy.ChainOfThought(ResumeParserSignature)
    
    def forward(self, resume_text: str, category: str):
        """Parse resume using optimized prompts"""
        result = self.parser(resume_text=resume_text, category=category)
        return result


class SkillExtractionSignature(dspy.Signature):
    """Focused signature for skill extraction"""
    resume_text = dspy.InputField(desc="Resume text containing skills section")
    category = dspy.InputField(desc="Job category for context")
    
    technical_skills = dspy.OutputField(desc="Technical skills (programming languages, frameworks, tools)")
    soft_skills = dspy.OutputField(desc="Soft skills (leadership, communication, etc.)")
    certifications = dspy.OutputField(desc="Professional certifications")


class ExperienceExtractionSignature(dspy.Signature):
    """Focused signature for experience extraction"""
    resume_text = dspy.InputField(desc="Resume text containing work experience")
    
    companies = dspy.OutputField(desc="List of companies worked at")
    roles = dspy.OutputField(desc="Job titles/roles held")
    durations = dspy.OutputField(desc="Employment duration for each role")
    responsibilities = dspy.OutputField(desc="Key responsibilities and achievements")


class DSPyResumeOptimizer:
    """
    Main optimizer class that uses DSPy to optimize prompts
    based on the resume dataset
    """
    
    def __init__(self, dataset_path: str, api_key: Optional[str] = None):
        """
        Initialize the optimizer
        
        Args:
            dataset_path: Path to the resume dataset CSV
            api_key: OpenAI API key (optional, will use env var if not provided)
        """
        self.dataset_path = dataset_path
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        
        # Initialize DSPy with OpenAI
        if self.api_key:
            self.lm = dspy.OpenAI(
                model='gpt-3.5-turbo',
                api_key=self.api_key,
                max_tokens=2000
            )
            dspy.settings.configure(lm=self.lm)
        
        self.dataset = None
        self.training_examples = []
        self.optimized_parser = None
        
    def load_dataset(self) -> pd.DataFrame:
        """Load and preprocess the resume dataset"""
        try:
            df = pd.read_csv(self.dataset_path)
            print(f"Loaded {len(df)} resumes from dataset")
            self.dataset = df
            return df
        except Exception as e:
            print(f"Error loading dataset: {e}")
            raise
    
    def prepare_training_examples(self, sample_size: Optional[int] = None) -> List[ResumeExample]:
        """
        Prepare training examples from the dataset
        
        Args:
            sample_size: Number of examples to use (None = all)
        """
        if self.dataset is None:
            self.load_dataset()
        
        df = self.dataset
        if sample_size:
            df = df.sample(n=min(sample_size, len(df)), random_state=42)
        
        examples = []
        for _, row in df.iterrows():
            example = ResumeExample(
                category=row['Category'],
                resume_text=row['Resume']
            )
            examples.append(example)
        
        self.training_examples = examples
        print(f"Prepared {len(examples)} training examples")
        return examples
    
    def create_dspy_examples(self) -> List[dspy.Example]:
        """Convert training examples to DSPy format"""
        dspy_examples = []
        
        for example in self.training_examples:
            dspy_ex = dspy.Example(
                resume_text=example.resume_text,
                category=example.category
            ).with_inputs('resume_text', 'category')
            dspy_examples.append(dspy_ex)
        
        return dspy_examples
    
    def optimize_prompts(self, 
                        num_trials: int = 10,
                        metric_threshold: float = 0.7) -> OptimizedResumeParser:
        """
        Optimize prompts using DSPy's BootstrapFewShot
        
        Args:
            num_trials: Number of optimization trials
            metric_threshold: Minimum metric score to accept
        """
        if not self.training_examples:
            self.prepare_training_examples(sample_size=50)
        
        # Create DSPy examples
        train_examples = self.create_dspy_examples()
        
        # Split into train and validation
        split_idx = int(len(train_examples) * 0.8)
        train_set = train_examples[:split_idx]
        val_set = train_examples[split_idx:]
        
        print(f"Training on {len(train_set)} examples, validating on {len(val_set)}")
        
        # Define metric
        def resume_parsing_metric(example, prediction, trace=None):
            """Metric to evaluate parsing quality"""
            # Check if required fields are present and non-empty
            score = 0.0
            
            if hasattr(prediction, 'skills') and prediction.skills:
                score += 0.3
            if hasattr(prediction, 'experience') and prediction.experience:
                score += 0.3
            if hasattr(prediction, 'education') and prediction.education:
                score += 0.2
            if hasattr(prediction, 'summary') and prediction.summary:
                score += 0.2
            
            return score
        
        # Initialize optimizer
        from dspy.teleprompt import BootstrapFewShot
        
        optimizer = BootstrapFewShot(
            metric=resume_parsing_metric,
            max_bootstrapped_demos=4,
            max_labeled_demos=4,
            max_rounds=1
        )
        
        # Compile the optimized program
        base_parser = OptimizedResumeParser()
        
        try:
            self.optimized_parser = optimizer.compile(
                base_parser,
                trainset=train_set
            )
            print("Prompt optimization completed successfully!")
        except Exception as e:
            print(f"Optimization error: {e}")
            self.optimized_parser = base_parser
        
        return self.optimized_parser
    
    def parse_resume(self, resume_text: str, category: str = "General") -> Dict[str, Any]:
        """
        Parse a resume using the optimized prompts
        
        Args:
            resume_text: Raw resume text
            category: Job category
            
        Returns:
            Parsed resume data
        """
        if self.optimized_parser is None:
            print("No optimized parser available, using base parser")
            self.optimized_parser = OptimizedResumeParser()
        
        try:
            result = self.optimized_parser(
                resume_text=resume_text,
                category=category
            )
            
            return {
                'skills': result.skills if hasattr(result, 'skills') else [],
                'experience': result.experience if hasattr(result, 'experience') else [],
                'education': result.education if hasattr(result, 'education') else [],
                'summary': result.summary if hasattr(result, 'summary') else ""
            }
        except Exception as e:
            print(f"Parsing error: {e}")
            return {
                'skills': [],
                'experience': [],
                'education': [],
                'summary': "",
                'error': str(e)
            }
    
    def save_optimized_prompts(self, output_path: str):
        """Save optimized prompts to file"""
        if self.optimized_parser is None:
            raise ValueError("No optimized parser to save")
        
        try:
            self.optimized_parser.save(output_path)
            print(f"Optimized prompts saved to {output_path}")
        except Exception as e:
            print(f"Error saving prompts: {e}")
    
    def load_optimized_prompts(self, input_path: str):
        """Load previously optimized prompts"""
        try:
            self.optimized_parser = OptimizedResumeParser()
            self.optimized_parser.load(input_path)
            print(f"Optimized prompts loaded from {input_path}")
        except Exception as e:
            print(f"Error loading prompts: {e}")
    
    def evaluate_parser(self, test_examples: Optional[List[dspy.Example]] = None) -> Dict[str, float]:
        """
        Evaluate the optimized parser
        
        Args:
            test_examples: Test examples (uses validation set if None)
            
        Returns:
            Evaluation metrics
        """
        if self.optimized_parser is None:
            raise ValueError("No optimized parser to evaluate")
        
        if test_examples is None:
            # Use a subset of training examples for evaluation
            test_examples = self.create_dspy_examples()[:10]
        
        results = {
            'total': len(test_examples),
            'successful': 0,
            'avg_score': 0.0
        }
        
        total_score = 0.0
        for example in test_examples:
            try:
                prediction = self.optimized_parser(
                    resume_text=example.resume_text,
                    category=example.category
                )
                
                # Simple scoring
                score = 0.0
                if hasattr(prediction, 'skills') and prediction.skills:
                    score += 0.25
                if hasattr(prediction, 'experience') and prediction.experience:
                    score += 0.25
                if hasattr(prediction, 'education') and prediction.education:
                    score += 0.25
                if hasattr(prediction, 'summary') and prediction.summary:
                    score += 0.25
                
                total_score += score
                if score > 0.5:
                    results['successful'] += 1
                    
            except Exception as e:
                print(f"Evaluation error: {e}")
        
        results['avg_score'] = total_score / len(test_examples) if test_examples else 0.0
        results['success_rate'] = results['successful'] / results['total'] if results['total'] > 0 else 0.0
        
        return results


class DSPySkillExtractor(dspy.Module):
    """Specialized module for skill extraction"""
    
    def __init__(self):
        super().__init__()
        self.extractor = dspy.ChainOfThought(SkillExtractionSignature)
    
    def forward(self, resume_text: str, category: str):
        return self.extractor(resume_text=resume_text, category=category)


class DSPyExperienceExtractor(dspy.Module):
    """Specialized module for experience extraction"""
    
    def __init__(self):
        super().__init__()
        self.extractor = dspy.ChainOfThought(ExperienceExtractionSignature)
    
    def forward(self, resume_text: str):
        return self.extractor(resume_text=resume_text)
