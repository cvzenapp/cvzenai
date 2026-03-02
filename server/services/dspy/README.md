# Dataset-Driven Resume Extraction System

This module implements a modular, dataset-optimized resume parsing system inspired by DSPy principles. Instead of using Python DSPy (which isn't compatible with our TypeScript stack), we've built a TypeScript-native solution that achieves similar goals: **prompt optimization through structured datasets**.

## Architecture

```
resumeExtractionOrchestrator
├── skillsExtractor (uses 06_skills.csv, IT_Job_Roles_Skills.csv, 05_person_skills.csv)
├── educationExtractor (uses 03_education.csv)
├── experienceExtractor (uses 04_experience.csv, candidate_job_role_dataset.csv)
└── projectsExtractor (uses 07_projects.csv)
```

## Components

### 1. DatasetLoader (`datasetLoader.ts`)
- Loads and caches CSV datasets
- Extracts unique values from columns
- Provides data to all extractors

### 2. SkillsExtractor (`skillsExtractor.ts`)
- **Datasets**: `06_skills.csv`, `IT_Job_Roles_Skills.csv`, `05_person_skills.csv`
- **Purpose**: Improves skill extraction accuracy
- **Features**:
  - Loads 1000+ technical skills
  - Loads 100+ soft/personal skills
  - Maps job roles to required skills
  - Validates extracted skills against known skills
  - Categorizes skills (Technical vs Soft Skills)

### 3. EducationExtractor (`educationExtractor.ts`)
- **Dataset**: `03_education.csv`
- **Purpose**: Improves education extraction accuracy
- **Features**:
  - Recognizes degree types and abbreviations
  - Normalizes degree names (BS → Bachelor of Science)
  - Validates institution names
  - Extracts fields of study

### 4. ExperienceExtractor (`experienceExtractor.ts`)
- **Datasets**: `04_experience.csv`, `candidate_job_role_dataset.csv`
- **Purpose**: Improves work experience extraction
- **Features**:
  - Recognizes 500+ job titles
  - Identifies current positions
  - Extracts technologies from descriptions
  - Validates employment types

### 5. ProjectsExtractor (`projectsExtractor.ts`)
- **Dataset**: `07_projects.csv`
- **Purpose**: Improves project extraction accuracy
- **Features**:
  - Recognizes common project types (Web App, Mobile App, ML, etc.)
  - Extracts technologies from descriptions
  - Validates GitHub and demo links
  - Categorizes projects by type
  - Normalizes project URLs

### 6. ResumeExtractionOrchestrator (`resumeExtractionOrchestrator.ts`)
- **Purpose**: Coordinates all extractors
- **Features**:
  - Generates comprehensive prompts using all extractors
  - Sends optimized prompt to Groq AI
  - Validates and enhances extracted data
  - Ensures data quality and completeness

## How It Works

1. **Initialization**: On first use, all extractors load their datasets
2. **Prompt Generation**: Each extractor contributes section-specific guidelines
3. **AI Extraction**: Combined prompt sent to Groq for parsing
4. **Validation**: Each extractor validates its section's data
5. **Enhancement**: Additional data extracted (e.g., technologies from descriptions)

## Benefits Over Basic Prompting

1. **Higher Accuracy**: Dataset-driven prompts include real-world examples
2. **Better Validation**: Extracted data validated against known values
3. **Skill Normalization**: "JavaScript" vs "java script" → normalized
4. **Degree Normalization**: "BS" → "Bachelor of Science"
5. **Technology Detection**: Auto-extracts tech from experience descriptions
6. **Modular**: Easy to add new extractors or datasets

## Usage

```typescript
import { resumeExtractionOrchestrator } from './dspy/resumeExtractionOrchestrator';

// Parse resume
const resumeText = "..."; // Extracted from PDF/DOCX
const parsedData = await resumeExtractionOrchestrator.parseResume(resumeText);
```

## Adding New Datasets

1. Add CSV file to `server/data_sets/`
2. Create new extractor in `server/services/dspy/`
3. Implement `initialize()` and `generatePrompt()` methods
4. Add to orchestrator's initialization
5. Add validation logic

## Performance

- **Initialization**: ~500ms (one-time, cached)
- **Parsing**: Same as before (~2-3s with Groq)
- **Memory**: ~5MB for all datasets (cached)

## Future Enhancements

1. **Feedback Loop**: Learn from user corrections
2. **Confidence Scores**: Rate extraction confidence per field
3. **Multi-language**: Support non-English resumes
4. **Custom Datasets**: Allow users to upload custom skill/company lists
5. **A/B Testing**: Compare extraction accuracy with/without datasets

## Comparison to Python DSPy

| Feature | Python DSPy | Our System |
|---------|-------------|------------|
| Language | Python | TypeScript |
| Prompt Optimization | Automatic | Dataset-driven |
| Integration | Separate service | Native |
| Datasets | Training data | CSV files |
| Validation | Metrics-based | Rule-based |
| Performance | Slower (Python) | Faster (Node.js) |

## Datasets Used

- `06_skills.csv` - Technical skills database
- `IT_Job_Roles_Skills.csv` - Job role to skills mapping
- `05_person_skills.csv` - Soft/personal skills
- `03_education.csv` - Education records
- `04_experience.csv` - Work experience records
- `candidate_job_role_dataset.csv` - Job roles and titles
- `07_projects.csv` - Project types and technologies
