# CVZen AI - Resume Builder Application

A full-stack resume builder application with AI-powered parsing and ATS optimization.

## Features

- Smart resume parsing with NLP
- Interactive resume editor
- PDF generation
- User authentication
- Multi-resume management
- ATS optimization

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
```

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/resumes/parse` - Parse resume file
- `POST /api/resumes/save` - Save resume data
- `GET /api/resumes` - Get all user resumes
- `GET /api/resumes/:id` - Get specific resume

## License

MIT
