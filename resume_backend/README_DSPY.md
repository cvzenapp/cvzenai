# DSPy Resume Parser Optimization

This module uses DSPy (Declarative Self-improving Language Programs) to optimize prompts for resume parsing based on the training dataset.

## Overview

DSPy is a framework for algorithmically optimizing LM prompts and weights. Instead of manually crafting prompts, DSPy learns the best prompts from your data.

## Features

- **Automated Prompt Optimization**: Uses the resume dataset to learn optimal prompts
- **Multi-task Learning**: Optimizes for skills, experience, and education extraction
- **Evaluation Metrics**: Built-in evaluation to measure parsing accuracy
- **API Integration**: RESTful API for production use
- **CLI Tool**: Command-line interface for training and testing

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     DSPy Optimizer Service                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │   Dataset    │─────▶│  Training    │                     │
│  │  (CSV)       │      │  Examples    │                     │
│  └──────────────┘      └──────────────┘                     │
│                              │                               │
│                              ▼                               │
│                    ┌──────────────────┐                     │
│                    │  BootstrapFewShot│                     │
│                    │    Optimizer     │                     │
│                    └──────────────────┘                     │
│                              │                               │
│                              ▼                               │
│                    ┌──────────────────┐                     │
│                    │  Optimized       │                     │
│                    │  Prompts         │                     │
│                    └──────────────────┘                     │
│                              │                               │
│                              ▼                               │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐ │
│  │  Resume Text │─────▶│   Parser     │─────▶│  Result  │ │
│  └──────────────┘      └──────────────┘      └──────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Installation

### Install DSPy Dependencies

```bash
cd resume_backend
pip install -r requirements_dspy.txt
```

### Set OpenAI API Key

```bash
export OPENAI_API_KEY='your-openai-api-key'
```

Or add to `.env` file:
```
OPENAI_API_KEY=your-openai-api-key
```

## Usage

### 1. CLI Tool - Optimize Prompts

```bash
# Basic optimization
python optimize_prompts.py

# With custom parameters
python optimize_prompts.py \
  --dataset data_sets/DataSet.csv \
  --sample-size 100 \
  --num-trials 20 \
  --output models/optimized_prompts.json \
  --evaluate

# Test on a specific resume
python optimize_prompts.py \
  --test-resume path/to/resume.txt \
  --category "Data Science"
```

### 2. Docker Service

Start the DSPy optimizer service:

```bash
docker-compose up -d dspy-optimizer
```

The service will be available at `http://localhost:5001`

### 3. API Endpoints

#### Health Check
```bash
curl http://localhost:5001/api/dspy/health
```

#### Get Dataset Statistics
```bash
curl http://localhost:5001/api/dspy/dataset/stats
```

#### Optimize Prompts
```bash
curl -X POST http://localhost:5001/api/dspy/optimize \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "num_trials": 10,
    "sample_size": 50
  }'
```

#### Parse Resume with DSPy
```bash
curl -X POST http://localhost:5001/api/dspy/parse \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "Your resume text here...",
    "category": "Data Science"
  }'
```

#### Evaluate Optimizer
```bash
curl http://localhost:5001/api/dspy/evaluate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Compare Parsers
```bash
curl -X POST http://localhost:5001/api/dspy/compare \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "Your resume text here...",
    "category": "Data Science"
  }'
```

## Python API

### Basic Usage

```python
from services.dspy_optimizer import DSPyResumeOptimizer

# Initialize optimizer
optimizer = DSPyResumeOptimizer(
    dataset_path='data_sets/DataSet.csv',
    api_key='your-openai-api-key'
)

# Load and prepare data
optimizer.load_dataset()
optimizer.prepare_training_examples(sample_size=50)

# Optimize prompts
optimized_parser = optimizer.optimize_prompts(num_trials=10)

# Save optimized prompts
optimizer.save_optimized_prompts('models/optimized_prompts.json')

# Parse a resume
result = optimizer.parse_resume(
    resume_text="Your resume text...",
    category="Data Science"
)

print(result['skills'])
print(result['experience'])
print(result['education'])
```

### Advanced Usage

```python
from services.dspy_optimizer import (
    DSPyResumeOptimizer,
    DSPySkillExtractor,
    DSPyExperienceExtractor
)

# Use specialized extractors
skill_extractor = DSPySkillExtractor()
experience_extractor = DSPyExperienceExtractor()

# Extract skills
skills = skill_extractor(
    resume_text="Python, Java, Machine Learning...",
    category="Data Science"
)

# Extract experience
experience = experience_extractor(
    resume_text="Software Engineer at Google..."
)
```

## Dataset Format

The training dataset should be a CSV file with the following columns:

- `Category`: Job category (e.g., "Data Science", "Software Engineer")
- `Resume`: Full resume text

Example:
```csv
Category,Resume
Data Science,"Skills: Python, Machine Learning, SQL..."
Software Engineer,"Experience: Senior Developer at Tech Corp..."
```

## Optimization Process

1. **Data Loading**: Load resumes from CSV dataset
2. **Example Preparation**: Convert resumes to DSPy training examples
3. **Metric Definition**: Define evaluation metrics for parsing quality
4. **Bootstrap Optimization**: Use BootstrapFewShot to optimize prompts
5. **Evaluation**: Test optimized parser on validation set
6. **Persistence**: Save optimized prompts for production use

## Performance Metrics

The optimizer tracks:

- **Success Rate**: Percentage of resumes successfully parsed
- **Average Score**: Overall parsing quality (0.0 - 1.0)
- **Field Coverage**: Percentage of required fields extracted
  - Skills: 30%
  - Experience: 30%
  - Education: 20%
  - Summary: 20%

## Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=your-openai-api-key

# Optional
JWT_SECRET_KEY=your-jwt-secret
FLASK_ENV=production
```

### Optimization Parameters

- `num_trials`: Number of optimization iterations (default: 10)
- `sample_size`: Number of training examples (default: 50)
- `metric_threshold`: Minimum acceptable score (default: 0.7)
- `max_bootstrapped_demos`: Max examples per prompt (default: 4)

## Troubleshooting

### API Key Issues

```bash
# Check if API key is set
echo $OPENAI_API_KEY

# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Dataset Issues

```python
# Verify dataset format
import pandas as pd
df = pd.read_csv('data_sets/DataSet.csv')
print(df.columns)  # Should have 'Category' and 'Resume'
print(df.head())
```

### Memory Issues

If optimization runs out of memory:
- Reduce `sample_size`
- Reduce `max_bootstrapped_demos`
- Use a smaller model (gpt-3.5-turbo instead of gpt-4)

## Best Practices

1. **Start Small**: Begin with 20-30 examples for quick iteration
2. **Iterate**: Run multiple optimization cycles with different parameters
3. **Evaluate**: Always evaluate on a held-out test set
4. **Version Control**: Save optimized prompts with version numbers
5. **Monitor**: Track parsing accuracy in production
6. **Update**: Re-optimize periodically with new data

## Integration with Main Application

The DSPy optimizer can be integrated into the main resume parsing pipeline:

```python
# In resume_parser.py
from services.dspy_optimizer import DSPyResumeOptimizer

class EnhancedResumeParser:
    def __init__(self):
        self.dspy_optimizer = DSPyResumeOptimizer(...)
        self.dspy_optimizer.load_optimized_prompts('models/optimized_prompts.json')
    
    def parse_resume(self, file_path):
        # Try DSPy first
        try:
            with open(file_path, 'r') as f:
                text = f.read()
            return self.dspy_optimizer.parse_resume(text)
        except:
            # Fallback to traditional parser
            return self.traditional_parse(file_path)
```

## References

- [DSPy Documentation](https://dspy-docs.vercel.app/)
- [DSPy GitHub](https://github.com/stanfordnlp/dspy)
- [DSPy Paper](https://arxiv.org/abs/2310.03714)

## License

MIT
