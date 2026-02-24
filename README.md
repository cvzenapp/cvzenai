# CVZen AI - Resume Builder Application

A full-stack resume builder application with AI-powered parsing and ATS optimization.

## Features

- Smart resume parsing with NLP
- DSPy-powered prompt optimization for better accuracy
- Interactive resume editor
- PDF generation
- User authentication
- Multi-resume management
- ATS optimization
- AI-powered skill and experience extraction

## Tech Stack

### Backend
- Python 3.11
- Flask
- SQLAlchemy
- JWT Authentication
- NLP (spaCy, transformers)

### Frontend
- React 19
- Vite
- TailwindCSS
- Radix UI
- React Router

## Quick Start with Docker

### Prerequisites
- Docker
- Docker Compose

### Running the Application

1. Clone the repository:
```bash
git clone https://github.com/cvzenapp/cvzenai.git
cd cvzenai
```

2. Start the application:
```bash
docker-compose up -d
```

3. Access the application:
- Frontend: http://localhost
- Backend API: http://localhost:5000
- DSPy Optimizer: http://localhost:5001

### Stopping the Application

```bash
docker-compose down
```

### View Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

## Development Setup

### Backend

```bash
cd resume_backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python src/main.py
```

### Frontend

```bash
cd resume_frontend
pnpm install
pnpm run dev
```

## Environment Variables

Create a `.env` file in the root directory:

```env
JWT_SECRET_KEY=your-jwt-secret-key
SECRET_KEY=your-flask-secret-key
OPENAI_API_KEY=your-openai-api-key  # Required for DSPy optimizer
```

## DSPy Prompt Optimization

This application includes a DSPy-based prompt optimizer that learns optimal prompts from the resume dataset.

### Quick Start

```bash
# Optimize prompts using CLI
cd resume_backend
python optimize_prompts.py --sample-size 50 --num-trials 10

# Or use the API
curl -X POST http://localhost:5001/api/dspy/optimize \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"num_trials": 10, "sample_size": 50}'
```

See [resume_backend/README_DSPY.md](resume_backend/README_DSPY.md) for detailed documentation.

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/resumes/parse` - Parse resume file
- `POST /api/resumes/save` - Save resume data
- `GET /api/resumes` - Get all user resumes
- `GET /api/resumes/:id` - Get specific resume

## License

MIT
