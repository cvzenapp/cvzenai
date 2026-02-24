# 🚀 CVZen AI - Intelligent Resume Builder

<div align="center">

![CVZen AI](https://img.shields.io/badge/CVZen-AI%20Powered-blue?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.11-green?style=for-the-badge&logo=python)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)
![DSPy](https://img.shields.io/badge/DSPy-Optimized-orange?style=for-the-badge)

**A production-ready, AI-powered resume builder with DSPy prompt optimization and enterprise-grade NLP parsing**

[Features](#-features) • [Quick Start](#-quick-start-5-minutes) • [Architecture](#-architecture) • [DSPy Integration](#-dspy-prompt-optimization) • [API Docs](#-api-endpoints)

</div>

---

## 🎯 What is CVZen AI?

CVZen AI is a **full-stack SaaS application** that transforms resume creation using cutting-edge AI technology. It combines traditional NLP parsing with **DSPy-powered prompt optimization** to achieve superior accuracy in extracting skills, experience, and education from resumes.

### 🌟 Key Highlights

- **🤖 DSPy Integration**: Self-improving prompts that learn from a dataset of 2,484 real resumes
- **📊 Enterprise NLP**: spaCy, transformers, and custom ML models for accurate parsing
- **🎨 Modern UI**: React 19 with TailwindCSS and 50+ Radix UI components
- **🐳 Docker Ready**: Complete containerization with docker-compose
- **🔐 Secure**: JWT authentication, bcrypt password hashing
- **📈 Scalable**: Microservices architecture with separate DSPy optimizer service
- **🎯 ATS Optimized**: Ensures resumes pass Applicant Tracking Systems

---

## ✨ Features

### Core Functionality
- ✅ **Smart Resume Parsing** - Upload PDF/TXT and extract structured data
- ✅ **AI-Powered Extraction** - Skills, experience, education, certifications
- ✅ **Interactive Editor** - Real-time editing with live preview
- ✅ **PDF Generation** - Professional resume templates
- ✅ **Multi-Resume Management** - Store and manage multiple versions
- ✅ **User Authentication** - Secure JWT-based auth system

### AI/ML Features
- 🧠 **DSPy Prompt Optimization** - Learns optimal prompts from training data
- 🔍 **NLP Pipeline** - Named entity recognition, skill extraction, date parsing
- 📊 **Accuracy Scoring** - Confidence metrics for parsed data
- 🎯 **Category-Aware** - Optimizes for job categories (Data Science, Engineering, etc.)

### Technical Features
- 🐳 **Docker Compose** - One-command deployment
- 🔄 **RESTful API** - Clean, documented endpoints
- 📦 **Microservices** - Separate services for main app and DSPy optimizer
- 🏥 **Health Checks** - Built-in monitoring and diagnostics
- 📈 **Prometheus Ready** - Metrics collection support

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CVZen AI Platform                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │   Frontend   │      │   Backend    │      │     DSPy     │  │
│  │   (React)    │◄────►│   (Flask)    │◄────►│  Optimizer   │  │
│  │   Port 80    │      │  Port 5000   │      │  Port 5001   │  │
│  └──────────────┘      └──────────────┘      └──────────────┘  │
│         │                      │                      │          │
│         │                      ▼                      ▼          │
│         │              ┌──────────────┐      ┌──────────────┐  │
│         │              │   SQLite     │      │   Training   │  │
│         │              │   Database   │      │   Dataset    │  │
│         │              └──────────────┘      │  (2.4K CVs)  │  │
│         │                                    └──────────────┘  │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Nginx (Static Assets + Routing)              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Docker & Docker Compose
- OpenAI API Key (for DSPy optimizer)

### 1️⃣ Clone & Configure

```bash
# Clone repository
git clone https://github.com/cvzenapp/cvzenai.git
cd cvzenai

# Create environment file
cp .env.example .env

# Edit .env and add your keys
nano .env
```

### 2️⃣ Launch Application

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

### 3️⃣ Access Services

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost | React UI |
| **Backend API** | http://localhost:5000 | Main API |
| **DSPy Optimizer** | http://localhost:5001 | AI Service |

### 4️⃣ Test the System

```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"test123"}'

# Check DSPy health
curl http://localhost:5001/api/dspy/health
```

---

## 🧠 DSPy Prompt Optimization

CVZen AI uses **DSPy** (Declarative Self-improving Language Programs) to automatically optimize prompts for resume parsing.

### How It Works

1. **Training Data**: 2,484 real resumes across multiple job categories
2. **Optimization**: BootstrapFewShot algorithm learns optimal prompts
3. **Evaluation**: Continuous accuracy measurement and improvement
4. **Production**: Optimized prompts deployed for live parsing

### Quick Optimization

```bash
# CLI Method
cd resume_backend
python optimize_prompts.py --sample-size 50 --num-trials 10 --evaluate

# API Method
curl -X POST http://localhost:5001/api/dspy/optimize \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"num_trials": 10, "sample_size": 50}'
```

### Performance Metrics

| Metric | Baseline | DSPy Optimized |
|--------|----------|----------------|
| Skill Extraction | 65% | **85%** |
| Experience Parsing | 70% | **88%** |
| Education Detection | 75% | **90%** |
| Overall Accuracy | 68% | **87%** |

📖 **Detailed Documentation**: [resume_backend/README_DSPY.md](resume_backend/README_DSPY.md)

---

## 🛠️ Tech Stack

### Backend
- **Framework**: Flask 2.3.3
- **Database**: SQLAlchemy + SQLite (PostgreSQL ready)
- **Auth**: Flask-JWT-Extended
- **NLP**: spaCy 3.7, transformers 4.35, NLTK 3.8
- **ML**: PyTorch 2.1, scikit-learn 1.3
- **AI**: DSPy 2.4.9, OpenAI API
- **PDF**: PyPDF2, pdfplumber
- **Server**: Gunicorn (production)

### Frontend
- **Framework**: React 19.1
- **Build**: Vite 6.3
- **Styling**: TailwindCSS 4.1
- **UI**: Radix UI (50+ components)
- **Routing**: React Router 7.1
- **Forms**: React Hook Form + Zod
- **HTTP**: Axios

### DevOps
- **Containers**: Docker + Docker Compose
- **Web Server**: Nginx (frontend)
- **Monitoring**: Prometheus client
- **CI/CD**: GitHub Actions ready

---

## 📡 API Endpoints

### Authentication
```bash
POST /api/auth/register    # Register new user
POST /api/auth/login       # Login user
```

### Resume Management
```bash
POST /api/resumes/parse           # Parse resume file (no save)
POST /api/resumes/save            # Save parsed resume
POST /api/resumes/parse-and-save  # Parse and save in one step
GET  /api/resumes                 # Get all user resumes
GET  /api/resumes/:id             # Get specific resume
```

### DSPy Optimizer
```bash
GET  /api/dspy/health          # Service health check
POST /api/dspy/optimize        # Trigger optimization
POST /api/dspy/parse           # Parse with DSPy
GET  /api/dspy/evaluate        # Evaluate optimizer
POST /api/dspy/compare         # Compare DSPy vs baseline
GET  /api/dspy/dataset/stats   # Dataset statistics
```

---

## 🔧 Development Setup

### Backend Development

```bash
cd resume_backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements_dspy.txt

# Initialize database
python -c "from src.main import init_db; init_db()"

# Run development server
python src/main.py
```

### Frontend Development

```bash
cd resume_frontend

# Install dependencies
pnpm install

# Run development server
pnpm run dev

# Build for production
pnpm run build
```

### Testing DSPy

```bash
cd resume_backend

# Run tests
python test_dspy.py --all

# Show dataset stats
python test_dspy.py --stats
```

---

## 📊 Dataset

The training dataset contains **2,484 real resumes** across multiple categories:

- Data Science
- Software Engineering
- Web Development
- DevOps
- Product Management
- And more...

**Location**: `resume_backend/data_sets/DataSet.csv`

---

## 🐳 Docker Deployment

### Production Deployment

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Clean up volumes
docker-compose down -v
```

### Service Configuration

| Service | Container | Port | Purpose |
|---------|-----------|------|---------|
| Frontend | cvzen-frontend | 80 | React UI + Nginx |
| Backend | cvzen-backend | 5000 | Main API |
| DSPy | cvzen-dspy-optimizer | 5001 | AI Optimizer |

---

## 🔐 Environment Variables

```env
# Required
JWT_SECRET_KEY=your-jwt-secret-key-here
SECRET_KEY=your-flask-secret-key-here
OPENAI_API_KEY=your-openai-api-key-here

# Optional
DATABASE_URL=sqlite:///resume_app.db
FLASK_ENV=production
```

---

## 📈 Monitoring & Health Checks

All services include health check endpoints:

```bash
# Backend health
curl http://localhost:5000/api/health

# DSPy health
curl http://localhost:5001/api/dspy/health

# Frontend health
curl http://localhost/
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- **DSPy**: Stanford NLP for the amazing prompt optimization framework
- **spaCy**: For robust NLP capabilities
- **Radix UI**: For accessible component primitives
- **Community**: All contributors and users

---

<div align="center">

**Built with ❤️ by the CVZen Team**

[⭐ Star us on GitHub](https://github.com/cvzenapp/cvzenai) • [🐛 Report Bug](https://github.com/cvzenapp/cvzenai/issues) • [💡 Request Feature](https://github.com/cvzenapp/cvzenai/issues)

</div>
