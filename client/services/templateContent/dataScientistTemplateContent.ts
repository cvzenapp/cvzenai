import { TemplateSpecificContent, TEMPLATE_IDS } from '../templateSpecificContentService';

// Senior Data Scientist Template Content
export const seniorDataScientistContent: TemplateSpecificContent = {
  templateId: TEMPLATE_IDS.DATA_SCIENTIST_SENIOR,
  personalInfo: {
    name: 'Dr. Maria Rodriguez',
    title: 'Senior Data Scientist',
    email: 'maria.rodriguez@datascience.com',
    phone: '+1 (555) 789-0123',
    location: 'Seattle, WA',
    website: 'mariarodriguez.ai',
    linkedin: 'linkedin.com/in/mariarodriguez',
    github: 'github.com/mariarodriguez',
    avatar: '',
  },
  professionalSummary: 'Senior Data Scientist with 8+ years of experience developing and deploying machine learning models in production environments. Expert in Python, R, TensorFlow, and PyTorch with proven track record of building ML systems that drive $50M+ in business value. Led data science teams and architected scalable data pipelines processing 100TB+ of data daily.',
  objective: 'Seeking a Principal Data Scientist role where I can leverage my expertise in machine learning and data architecture to solve complex business problems while mentoring the next generation of data scientists and driving AI strategy.',
  skills: [
    {
      id: '1', name: 'Python', proficiency: 95, category: 'Programming Languages', level: 95, yearsOfExperience: 8, isCore: true, relevanceScore: 10
    },
    {
      id: '2', name: 'R', proficiency: 90, category: 'Programming Languages', level: 90, yearsOfExperience: 7, isCore: true, relevanceScore: 9
    },
    {
      id: '3', name: 'TensorFlow', proficiency: 92, category: 'Machine Learning Frameworks', level: 92, yearsOfExperience: 6, isCore: true, relevanceScore: 10
    },
    {
      id: '4', name: 'PyTorch', proficiency: 88, category: 'Machine Learning Frameworks', level: 88, yearsOfExperience: 5, isCore: true, relevanceScore: 9
    },
    {
      id: '5', name: 'SQL', proficiency: 93, category: 'Database Technologies', level: 93, yearsOfExperience: 8, isCore: true, relevanceScore: 9
    },
    {
      id: '6', name: 'Apache Spark', proficiency: 85, category: 'Big Data Technologies', level: 85, yearsOfExperience: 5, isCore: true, relevanceScore: 8
    },
    {
      id: '7', name: 'Scikit-learn', proficiency: 90, category: 'Machine Learning Libraries', level: 90, yearsOfExperience: 7, isCore: true, relevanceScore: 8
    },
    {
      id: '8', name: 'Pandas', proficiency: 95, category: 'Data Analysis Libraries', level: 95, yearsOfExperience: 8, isCore: true, relevanceScore: 8
    },
    {
      id: '9', name: 'NumPy', proficiency: 92, category: 'Data Analysis Libraries', level: 92, yearsOfExperience: 8, isCore: true, relevanceScore: 7
    },
    {
      id: '10', name: 'AWS', proficiency: 82, category: 'Cloud Platforms', level: 82, yearsOfExperience: 4, isCore: false, relevanceScore: 7
    },
    {
      id: '11', name: 'Docker', proficiency: 78, category: 'DevOps Tools', level: 78, yearsOfExperience: 3, isCore: false, relevanceScore: 6
    },
    {
      id: '12', name: 'MLflow', proficiency: 80, category: 'ML Operations', level: 80, yearsOfExperience: 3, isCore: false, relevanceScore: 7
    },
    {
      id: '13', name: 'Machine Learning', proficiency: 95, category: 'Core Skills', level: 95, yearsOfExperience: 8, isCore: true, relevanceScore: 10
    }
  ],
  experiences: [
    {
      id: '1',
      company: 'TechCorp AI Solutions',
      position: 'Senior Data Scientist',
      startDate: '2020-02',
      endDate: null,
      description: 'Leading machine learning initiatives for enterprise clients, developing production ML systems that process 100TB+ of data daily. Responsible for model architecture, team leadership, and strategic AI roadmap development.',
      achievements: [
        'Built recommendation system increasing customer engagement by 45% and revenue by $25M annually',
        'Led team of 6 data scientists delivering 12 production ML models with 99.5% uptime',
        'Architected real-time ML pipeline processing 1M+ predictions per second',
        'Reduced model training time by 70% through distributed computing optimization',
        'Published 8 research papers in top-tier ML conferences and journals'
      ],
      technologies: ['Python', 'TensorFlow', 'PyTorch', 'Apache Spark', 'AWS', 'Kubernetes'],
      location: 'Seattle, WA',
      employmentType: 'Full-time',
      industryContext: 'Technology',
      roleLevel: 'senior'
    },
    {
      id: '2',
      company: 'DataTech Analytics',
      position: 'Data Scientist',
      startDate: '2017-06',
      endDate: '2020-01',
      description: 'Developed predictive models and analytics solutions for financial services clients. Focused on fraud detection, risk assessment, and customer behavior analysis using advanced machine learning techniques.',
      achievements: [
        'Developed fraud detection model reducing false positives by 60% and saving $15M annually',
        'Built customer churn prediction system with 92% accuracy improving retention by 25%',
        'Implemented A/B testing framework used across 50+ product experiments',
        'Mentored 3 junior data scientists in ML best practices and model deployment'
      ],
      technologies: ['Python', 'R', 'Scikit-learn', 'SQL', 'Tableau', 'Apache Airflow'],
      location: 'San Francisco, CA',
      employmentType: 'Full-time',
      industryContext: 'Financial Services',
      roleLevel: 'mid'
    },
    {
      id: '3',
      company: 'Research Institute of Technology',
      position: 'Research Data Scientist',
      startDate: '2015-09',
      endDate: '2017-05',
      description: 'Conducted cutting-edge research in deep learning and natural language processing. Collaborated with academic partners and published research in peer-reviewed journals.',
      achievements: [
        'Published 12 research papers in top ML conferences (NeurIPS, ICML, ICLR)',
        'Developed novel neural architecture achieving state-of-the-art results in NLP tasks',
        'Secured $2M in research grants for deep learning projects',
        'Presented research at 15+ international conferences and workshops'
      ],
      technologies: ['Python', 'TensorFlow', 'PyTorch', 'R', 'CUDA', 'Linux'],
      location: 'Boston, MA',
      employmentType: 'Full-time',
      industryContext: 'Research',
      roleLevel: 'mid'
    }
  ],
  education: [
    {
      id: '1',
      institution: 'Stanford University',
      degree: 'Ph.D.',
      field: 'Computer Science (Machine Learning)',
      startDate: '2011-09',
      endDate: '2015-06',
      location: 'Stanford, CA',
      gpa: '3.9',
      honors: ['Summa Cum Laude', 'Outstanding Dissertation Award'],
      relevantCoursework: ['Advanced Machine Learning', 'Deep Learning', 'Statistical Learning Theory', 'Optimization for ML']
    },
    {
      id: '2',
      institution: 'MIT',
      degree: 'Master of Science',
      field: 'Applied Mathematics',
      startDate: '2009-09',
      endDate: '2011-06',
      location: 'Cambridge, MA',
      gpa: '3.8',
      relevantCoursework: ['Statistical Methods', 'Linear Algebra', 'Probability Theory', 'Computational Mathematics']
    }
  ],
  projects: [
    {
      id: '1',
      title: 'Real-time Fraud Detection System',
      description: 'Developed and deployed a real-time fraud detection system using deep learning and ensemble methods. The system processes 10M+ transactions daily with sub-100ms latency, achieving 99.2% accuracy and reducing fraud losses by $50M annually.',
      technologies: ['Python', 'TensorFlow', 'Apache Kafka', 'Redis', 'PostgreSQL', 'Docker', 'Kubernetes'],
      startDate: '2021-03-01',
      endDate: '2022-01-01',
      images: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: '$50M annual fraud loss reduction, 99.2% accuracy, <100ms latency',
      roleSpecific: true,
      metrics: {
        performance: '99.2% accuracy, <100ms latency',
        revenue: '$50M annual savings',
        adoption: '10M+ daily transactions processed'
      }
    },
    {
      id: '2',
      title: 'Customer Lifetime Value Prediction Platform',
      description: 'Built end-to-end MLOps platform for predicting customer lifetime value using gradient boosting and neural networks. Implemented automated model retraining, A/B testing framework, and real-time inference API serving 1M+ predictions daily.',
      technologies: ['Python', 'XGBoost', 'PyTorch', 'MLflow', 'Apache Airflow', 'AWS SageMaker', 'FastAPI'],
      startDate: '2020-08-01',
      endDate: '2021-02-01',
      images: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: '35% improvement in marketing ROI, $25M revenue increase',
      roleSpecific: true,
      metrics: {
        performance: '35% marketing ROI improvement',
        revenue: '$25M revenue increase',
        adoption: '1M+ daily predictions'
      }
    },
    {
      id: '3',
      title: 'Natural Language Processing for Legal Documents',
      description: 'Developed NLP system for automated legal document analysis using transformer models and named entity recognition. System processes 100K+ legal documents monthly, reducing manual review time by 80% and improving accuracy by 45%.',
      technologies: ['Python', 'Transformers', 'BERT', 'spaCy', 'Elasticsearch', 'FastAPI', 'PostgreSQL'],
      startDate: '2019-11-01',
      endDate: '2020-07-01',
      images: [
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: '80% reduction in manual review time, 45% accuracy improvement',
      roleSpecific: true,
      metrics: {
        efficiency: '80% reduction in manual review time',
        performance: '45% accuracy improvement',
        adoption: '100K+ documents processed monthly'
      }
    }
  ],
  achievements: [
    'Published 20+ research papers in top-tier ML conferences (NeurIPS, ICML, ICLR)',
    'Led data science teams delivering $100M+ in business value through ML solutions',
    'Keynote speaker at AI/ML conferences with 10K+ attendees',
    'Patent holder for 5 machine learning innovations',
    'Kaggle Grandmaster with 3 competition wins',
    'Mentor to 15+ junior data scientists and ML engineers'
  ],
  certifications: [
    {
      id: '1',
      name: 'AWS Certified Machine Learning - Specialty',
      issuer: 'Amazon Web Services',
      issueDate: '2021-03',
      credentialId: 'AWS-MLS-2021-001'
    },
    {
      id: '2',
      name: 'TensorFlow Developer Certificate',
      issuer: 'Google',
      issueDate: '2020-08',
      credentialId: 'TF-DEV-2020-001'
    }
  ],
  metadata: {
    targetRole: 'data-scientist',
    industry: 'technology',
    experienceLevel: 'senior',
    lastUpdated: new Date(),
    contentVersion: '1.0.0',
    tags: ['data-science', 'machine-learning', 'python', 'tensorflow', 'senior', 'ai']
  }
};

// Entry-Level Data Analyst Template Content
export const entryLevelDataAnalystContent: TemplateSpecificContent = {
  templateId: TEMPLATE_IDS.DATA_ANALYST_ENTRY,
  personalInfo: {
    name: 'Jordan Smith',
    title: 'Data Analyst',
    email: 'jordan.smith@dataanalyst.com',
    phone: '+1 (555) 890-1234',
    location: 'Austin, TX',
    website: 'jordansmith.dev',
    linkedin: 'linkedin.com/in/jordansmith',
    github: 'github.com/jordansmith',
    avatar: '',
  },
  professionalSummary: 'Entry-level Data Analyst with 2+ years of experience in data analysis, visualization, and reporting. Proficient in Python, SQL, and Excel with strong foundation in statistical analysis and data visualization. Passionate about transforming raw data into actionable business insights and continuously learning new data science techniques.',
  objective: 'Seeking a Data Analyst position where I can apply my analytical skills and technical knowledge to help organizations make data-driven decisions while growing my expertise in advanced analytics and machine learning.',
  skills: [
    {
      id: '1', name: 'Python', proficiency: 75, category: 'Programming Languages', level: 75, yearsOfExperience: 2, isCore: true, relevanceScore: 9
    },
    {
      id: '2', name: 'SQL', proficiency: 80, category: 'Database Technologies', level: 80, yearsOfExperience: 2, isCore: true, relevanceScore: 10
    },
    {
      id: '3', name: 'Pandas', proficiency: 78, category: 'Data Analysis Libraries', level: 78, yearsOfExperience: 2, isCore: true, relevanceScore: 9
    },
    {
      id: '4', name: 'Matplotlib', proficiency: 72, category: 'Data Visualization', level: 72, yearsOfExperience: 2, isCore: true, relevanceScore: 8
    },
    {
      id: '5', name: 'Seaborn', proficiency: 70, category: 'Data Visualization', level: 70, yearsOfExperience: 1.5, isCore: true, relevanceScore: 7
    },
    {
      id: '6', name: 'Excel', proficiency: 85, category: 'Spreadsheet Tools', level: 85, yearsOfExperience: 3, isCore: true, relevanceScore: 8
    },
    {
      id: '7', name: 'Tableau', proficiency: 68, category: 'Business Intelligence', level: 68, yearsOfExperience: 1, isCore: false, relevanceScore: 7
    },
    {
      id: '8', name: 'NumPy', proficiency: 70, category: 'Data Analysis Libraries', level: 70, yearsOfExperience: 1.5, isCore: false, relevanceScore: 6
    },
    {
      id: '9', name: 'Jupyter Notebooks', proficiency: 75, category: 'Development Tools', level: 75, yearsOfExperience: 2, isCore: false, relevanceScore: 6
    },
    {
      id: '10', name: 'Git', proficiency: 65, category: 'Version Control', level: 65, yearsOfExperience: 1, isCore: false, relevanceScore: 5
    },
    {
      id: '11', name: 'Statistics', proficiency: 72, category: 'Mathematical Skills', level: 72, yearsOfExperience: 2, isCore: true, relevanceScore: 8
    },
    {
      id: '12', name: 'Machine Learning Basics', proficiency: 60, category: 'Machine Learning', level: 60, yearsOfExperience: 1, isCore: false, relevanceScore: 6
    }
  ],
  experiences: [
    {
      id: '1',
      company: 'DataInsights Corp',
      position: 'Junior Data Analyst',
      startDate: '2022-06',
      endDate: null,
      description: 'Analyzing business data to identify trends, create reports, and support decision-making processes. Working with sales, marketing, and operations teams to provide data-driven insights and recommendations.',
      achievements: [
        'Created automated reporting dashboard reducing manual reporting time by 50%',
        'Analyzed customer behavior data leading to 15% increase in customer retention',
        'Developed data quality monitoring system improving data accuracy by 25%',
        'Collaborated with marketing team to optimize campaigns resulting in 20% higher ROI'
      ],
      technologies: ['Python', 'SQL', 'Pandas', 'Matplotlib', 'Excel', 'Tableau'],
      location: 'Austin, TX',
      employmentType: 'Full-time',
      industryContext: 'Technology',
      roleLevel: 'entry'
    },
    {
      id: '2',
      company: 'University Research Lab',
      position: 'Data Analysis Intern',
      startDate: '2021-09',
      endDate: '2022-05',
      description: 'Supported research projects by collecting, cleaning, and analyzing experimental data. Assisted in statistical analysis and created visualizations for research publications.',
      achievements: [
        'Processed and analyzed datasets with 100K+ records for 3 research studies',
        'Created data visualizations used in 2 published research papers',
        'Developed data cleaning pipeline reducing preprocessing time by 40%',
        'Presented findings at university research symposium'
      ],
      technologies: ['Python', 'R', 'Excel', 'SPSS', 'Matplotlib', 'Seaborn'],
      location: 'Austin, TX',
      employmentType: 'Internship',
      industryContext: 'Academic Research',
      roleLevel: 'entry'
    }
  ],
  education: [
    {
      id: '1',
      institution: 'University of Texas at Austin',
      degree: 'Bachelor of Science',
      field: 'Statistics',
      startDate: '2018-09',
      endDate: '2022-05',
      location: 'Austin, TX',
      gpa: '3.6',
      honors: ['Dean\'s List (4 semesters)', 'Statistics Department Honor Society'],
      relevantCoursework: ['Statistical Methods', 'Data Analysis', 'Probability Theory', 'Regression Analysis', 'Database Systems', 'Python Programming']
    }
  ],
  projects: [
    {
      id: '1',
      title: 'E-commerce Sales Analysis Dashboard',
      description: 'Built comprehensive sales analysis dashboard using Python and Tableau to analyze e-commerce transaction data. Dashboard provides insights into sales trends, customer segmentation, and product performance with interactive visualizations.',
      technologies: ['Python', 'Pandas', 'Matplotlib', 'Seaborn', 'Tableau', 'SQL'],
      startDate: '2023-01-01',
      endDate: '2023-04-01',
      github: 'github.com/jordansmith/ecommerce-analysis',
      impact: 'Identified $500K revenue opportunity through customer segmentation analysis',
      roleSpecific: true,
      metrics: {
        revenue: '$500K revenue opportunity identified',
        adoption: 'Used by 5 business stakeholders',
        performance: '20% faster decision-making process'
      }
    },
    {
      id: '2',
      title: 'Customer Churn Prediction Model',
      description: 'Developed machine learning model to predict customer churn using logistic regression and random forest algorithms. Analyzed customer behavior patterns and identified key factors contributing to churn.',
      technologies: ['Python', 'Scikit-learn', 'Pandas', 'Matplotlib', 'Jupyter Notebooks'],
      startDate: '2022-10-01',
      endDate: '2023-01-01',
      github: 'github.com/jordansmith/churn-prediction',
      impact: '78% model accuracy, identified top 5 churn risk factors',
      roleSpecific: true,
      metrics: {
        performance: '78% model accuracy',
        adoption: 'Presented to management team',
        efficiency: 'Identified top 5 churn risk factors'
      }
    },
    {
      id: '3',
      title: 'COVID-19 Data Visualization Project',
      description: 'Created interactive data visualizations analyzing COVID-19 trends across different regions using public health data. Built web dashboard showing infection rates, vaccination progress, and demographic impacts.',
      technologies: ['Python', 'Pandas', 'Plotly', 'Dash', 'HTML/CSS'],
      startDate: '2021-11-01',
      endDate: '2022-02-01',
      url: 'https://covid-dashboard-jordan.herokuapp.com',
      github: 'github.com/jordansmith/covid-dashboard',
      impact: '1000+ views, featured in university data science showcase',
      roleSpecific: true,
      metrics: {
        adoption: '1000+ dashboard views',
        performance: 'Featured in university showcase',
        efficiency: 'Real-time data updates'
      }
    }
  ],
  achievements: [
    'Completed Google Data Analytics Professional Certificate',
    'Winner of university data science competition (2022)',
    'Volunteer data analyst for local non-profit organization',
    'Published data analysis blog with 5K+ monthly readers'
  ],
  certifications: [
    {
      id: '1',
      name: 'Google Data Analytics Professional Certificate',
      issuer: 'Google',
      issueDate: '2022-03',
      credentialId: 'GDAC-2022-001'
    },
    {
      id: '2',
      name: 'Microsoft Excel Expert Certification',
      issuer: 'Microsoft',
      issueDate: '2021-11',
      credentialId: 'MS-EXCEL-2021-001'
    }
  ],
  metadata: {
    targetRole: 'data-analyst',
    industry: 'technology',
    experienceLevel: 'entry',
    lastUpdated: new Date(),
    contentVersion: '1.0.0',
    tags: ['data-analysis', 'python', 'sql', 'excel', 'entry-level', 'statistics']
  }
};