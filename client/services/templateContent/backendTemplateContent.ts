import { TemplateSpecificContent } from '../templateSpecificContentService';

// Senior Backend Developer Template Content
export const seniorBackendDeveloperContent: TemplateSpecificContent = {
  templateId: 'backend-developer-senior',
  personalInfo: {
    name: 'David Rodriguez',
    title: 'Senior Backend Developer',
    email: 'david.rodriguez@backend.dev',
    phone: '+1 (555) 456-7890',
    location: 'Austin, TX',
    website: 'davidrodriguez.dev',
    linkedin: 'linkedin.com/in/davidrodriguez',
    github: 'github.com/davidrodriguez',
    avatar: '',
  },
  professionalSummary: 'Senior Backend Developer with 8+ years of experience designing and building scalable, high-performance server-side applications and APIs. Expert in Node.js, Python, and distributed systems architecture. Led backend teams and architected systems handling 50M+ requests per day with 99.99% uptime and sub-100ms response times.',
  objective: 'Seeking a Lead Backend Developer or Backend Architect role where I can leverage my expertise in distributed systems, microservices architecture, and team leadership to build robust, scalable backend solutions while mentoring the next generation of backend engineers.',
  skills: [
    {
      id: '1', name: 'Node.js', proficiency: 95, category: 'Runtime Environments', level: 95, yearsOfExperience: 8, isCore: true, relevanceScore: 10
    },
    {
      id: '2', name: 'Python', proficiency: 92, category: 'Programming Languages', level: 92, yearsOfExperience: 7, isCore: true, relevanceScore: 10
    },
    {
      id: '3', name: 'PostgreSQL', proficiency: 90, category: 'Databases', level: 90, yearsOfExperience: 8, isCore: true, relevanceScore: 9
    },
    {
      id: '4', name: 'Redis', proficiency: 88, category: 'Caching Systems', level: 88, yearsOfExperience: 6, isCore: true, relevanceScore: 9
    },
    {
      id: '5', name: 'Docker', proficiency: 90, category: 'Containerization', level: 90, yearsOfExperience: 6, isCore: true, relevanceScore: 9
    },
    {
      id: '6', name: 'AWS', proficiency: 88, category: 'Cloud Platforms', level: 88, yearsOfExperience: 7, isCore: true, relevanceScore: 9
    },
    {
      id: '7', name: 'Express.js', proficiency: 95, category: 'Web Frameworks', level: 95, yearsOfExperience: 8, isCore: true, relevanceScore: 9
    },
    {
      id: '8', name: 'MongoDB', proficiency: 85, category: 'NoSQL Databases', level: 85, yearsOfExperience: 6, isCore: false, relevanceScore: 8
    },
    {
      id: '9', name: 'GraphQL', proficiency: 82, category: 'API Technologies', level: 82, yearsOfExperience: 4, isCore: false, relevanceScore: 8
    },
    {
      id: '10', name: 'REST APIs', proficiency: 95, category: 'API Design', level: 95, yearsOfExperience: 8, isCore: true, relevanceScore: 10
    },
    {
      id: '11', name: 'Microservices', proficiency: 90, category: 'Architecture Patterns', level: 90, yearsOfExperience: 5, isCore: true, relevanceScore: 9
    },
    {
      id: '12', name: 'Kubernetes', proficiency: 80, category: 'Container Orchestration', level: 80, yearsOfExperience: 4, isCore: false, relevanceScore: 8
    },
    {
      id: '13', name: 'TypeScript', proficiency: 88, category: 'Programming Languages', level: 88, yearsOfExperience: 5, isCore: false, relevanceScore: 8
    },
    {
      id: '14', name: 'Jest', proficiency: 85, category: 'Testing Frameworks', level: 85, yearsOfExperience: 6, isCore: false, relevanceScore: 7
    },
    {
      id: '15', name: 'Elasticsearch', proficiency: 78, category: 'Search Engines', level: 78, yearsOfExperience: 3, isCore: false, relevanceScore: 7
    }
  ],
  experiences: [
    {
      id: '1',
      company: 'CloudScale Technologies',
      position: 'Senior Backend Developer',
      startDate: '2020-02',
      endDate: null,
      description: 'Leading backend development for enterprise SaaS platform serving 10M+ users. Responsible for system architecture, API design, database optimization, and mentoring junior developers. Built scalable microservices handling 50M+ requests per day.',
      achievements: [
        'Architected microservices system reducing response times from 500ms to 80ms',
        'Led team of 6 backend developers delivering 20+ major features with 99.99% uptime',
        'Implemented caching strategy reducing database load by 70% and costs by $50K annually',
        'Built real-time notification system handling 1M+ concurrent connections',
        'Mentored 10 junior developers, with 8 receiving promotions within 2 years'
      ],
      technologies: ['Node.js', 'Python', 'PostgreSQL', 'Redis', 'Docker', 'AWS', 'Kubernetes'],
      location: 'Austin, TX',
      employmentType: 'Full-time',
      industryContext: 'SaaS Technology',
      roleLevel: 'senior'
    },
    {
      id: '2',
      company: 'DataFlow Systems',
      position: 'Backend Developer',
      startDate: '2017-08',
      endDate: '2020-01',
      description: 'Developed and maintained backend services for data processing platform handling terabytes of data daily. Focused on API development, database design, and system performance optimization using Python and Node.js.',
      achievements: [
        'Built data processing pipeline handling 10TB+ daily with 99.9% reliability',
        'Optimized database queries reducing processing time by 60%',
        'Implemented automated testing pipeline reducing production bugs by 80%',
        'Designed RESTful APIs serving 500K+ requests per hour',
        'Led migration from monolith to microservices architecture'
      ],
      technologies: ['Python', 'Node.js', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker'],
      location: 'Austin, TX',
      employmentType: 'Full-time',
      industryContext: 'Data Technology',
      roleLevel: 'mid'
    },
    {
      id: '3',
      company: 'TechStart Solutions',
      position: 'Backend Developer',
      startDate: '2015-06',
      endDate: '2017-07',
      description: 'Built backend systems for early-stage startup products using Node.js and Python. Collaborated with frontend developers and product managers to create robust APIs and database solutions for rapid product development.',
      achievements: [
        'Developed backend for 5 successful product launches',
        'Built authentication and authorization system used across all products',
        'Implemented automated deployment pipeline reducing deployment time by 75%',
        'Achieved 99.5% API uptime across all services',
        'Optimized database performance improving query speeds by 40%'
      ],
      technologies: ['Node.js', 'Express.js', 'MongoDB', 'PostgreSQL', 'AWS'],
      location: 'Austin, TX',
      employmentType: 'Full-time',
      industryContext: 'Startup',
      roleLevel: 'mid'
    }
  ],
  education: [
    {
      id: '1',
      institution: 'University of Texas at Austin',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2011-09',
      endDate: '2015-05',
      location: 'Austin, TX',
      gpa: '3.8',
      honors: ['Magna Cum Laude', 'Computer Science Honor Society', 'Dean\'s List (6 semesters)'],
      relevantCoursework: ['Database Systems', 'Software Engineering', 'Distributed Systems', 'Algorithms', 'Data Structures', 'Computer Networks']
    }
  ],
  projects: [
    {
      id: '1',
      title: 'Distributed Task Processing System',
      description: 'Built high-performance distributed task processing system using Node.js, Redis, and PostgreSQL. Handles 100K+ concurrent tasks with automatic scaling, fault tolerance, and real-time monitoring. Features include job queuing, retry mechanisms, and comprehensive analytics.',
      technologies: ['Node.js', 'Redis', 'PostgreSQL', 'Docker', 'Kubernetes', 'Prometheus'],
      startDate: '2022-03-01',
      endDate: '2023-01-01',
      github: 'github.com/davidrodriguez/distributed-tasks',
      images: [
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: '100K+ concurrent tasks, 99.99% reliability, 50% cost reduction vs existing solutions',
      roleSpecific: true,
      metrics: {
        performance: '99.99% uptime, <50ms task processing',
        adoption: '100K+ concurrent tasks processed',
        efficiency: '50% cost reduction vs previous system'
      }
    },
    {
      id: '2',
      title: 'Real-time Analytics API',
      description: 'Developed real-time analytics API serving 1M+ requests per hour using Python, FastAPI, and ClickHouse. Features include real-time data aggregation, custom query builder, and sub-second response times for complex analytical queries.',
      technologies: ['Python', 'FastAPI', 'ClickHouse', 'Redis', 'Docker', 'AWS'],
      startDate: '2021-09-01',
      endDate: '2022-08-01',
      images: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: '1M+ requests/hour, <200ms response time, 90% faster than previous solution',
      roleSpecific: true,
      metrics: {
        performance: '<200ms response time for complex queries',
        adoption: '1M+ requests per hour',
        efficiency: '90% faster than previous analytics solution'
      }
    },
    {
      id: '3',
      title: 'Microservices E-commerce Platform',
      description: 'Architected and built complete e-commerce backend using microservices architecture with Node.js, PostgreSQL, and Docker. Includes user management, product catalog, order processing, payment integration, and inventory management services.',
      technologies: ['Node.js', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'Stripe API'],
      startDate: '2020-11-01',
      endDate: '2021-08-01',
      github: 'github.com/davidrodriguez/ecommerce-microservices',
      images: [
        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: '10K+ orders processed daily, 99.9% uptime, $2M+ in transactions processed',
      roleSpecific: true,
      metrics: {
        performance: '99.9% uptime, <100ms API response time',
        revenue: '$2M+ in transactions processed',
        adoption: '10K+ orders processed daily'
      }
    }
  ],
  achievements: [
    'Led backend architecture for systems handling 50M+ requests per day',
    'Speaker at 3+ backend development conferences and Node.js meetups',
    'Open source contributor with 1.5K+ GitHub stars across projects',
    'Mentor to 20+ junior backend developers',
    'Technical blog with 25K+ monthly readers focusing on backend architecture',
    'Winner of company innovation award for microservices architecture design'
  ],
  certifications: [
    {
      id: '1',
      name: 'AWS Certified Solutions Architect - Professional',
      issuer: 'Amazon Web Services',
      issueDate: '2022-06',
      credentialId: 'AWS-SAP-2022-001'
    },
    {
      id: '2',
      name: 'MongoDB Certified Developer',
      issuer: 'MongoDB',
      issueDate: '2021-09',
      credentialId: 'MDB-DEV-2021-001'
    }
  ],
  metadata: {
    targetRole: 'backend-developer',
    industry: 'technology',
    experienceLevel: 'senior',
    lastUpdated: new Date(),
    contentVersion: '1.0.0',
    tags: ['backend', 'nodejs', 'python', 'postgresql', 'redis', 'docker', 'aws', 'senior', 'architecture']
  }
};

// Junior Backend Developer Template Content
export const juniorBackendDeveloperContent: TemplateSpecificContent = {
  templateId: 'backend-developer-junior',
  personalInfo: {
    name: 'Sarah Kim',
    title: 'Backend Developer',
    email: 'sarah.kim@backend.dev',
    phone: '+1 (555) 567-8901',
    location: 'Seattle, WA',
    website: 'sarahkim.dev',
    linkedin: 'linkedin.com/in/sarahkim',
    github: 'github.com/sarahkim',
    avatar: '',
  },
  professionalSummary: 'Motivated Backend Developer with 2+ years of experience building REST APIs and server-side applications using Node.js, Express, and MongoDB. Strong foundation in database design, API development, and modern backend development practices. Passionate about writing clean, efficient code and continuously learning new technologies.',
  objective: 'Seeking a Backend Developer position where I can apply my technical skills in API development and database management while growing my expertise in distributed systems, cloud technologies, and advanced backend architecture patterns.',
  skills: [
    {
      id: '1', name: 'Node.js', proficiency: 78, category: 'Runtime Environments', level: 78, yearsOfExperience: 2, isCore: true, relevanceScore: 10
    },
    {
      id: '2', name: 'Express.js', proficiency: 80, category: 'Web Frameworks', level: 80, yearsOfExperience: 2, isCore: true, relevanceScore: 10
    },
    {
      id: '3', name: 'MongoDB', proficiency: 75, category: 'NoSQL Databases', level: 75, yearsOfExperience: 2, isCore: true, relevanceScore: 9
    },
    {
      id: '4', name: 'REST APIs', proficiency: 82, category: 'API Design', level: 82, yearsOfExperience: 2, isCore: true, relevanceScore: 10
    },
    {
      id: '5', name: 'Git', proficiency: 75, category: 'Version Control', level: 75, yearsOfExperience: 2.5, isCore: true, relevanceScore: 8
    },
    {
      id: '6', name: 'JavaScript', proficiency: 85, category: 'Programming Languages', level: 85, yearsOfExperience: 3, isCore: true, relevanceScore: 9
    },
    {
      id: '7', name: 'JSON', proficiency: 90, category: 'Data Formats', level: 90, yearsOfExperience: 2, isCore: true, relevanceScore: 8
    },
    {
      id: '8', name: 'Postman', proficiency: 80, category: 'API Testing', level: 80, yearsOfExperience: 2, isCore: false, relevanceScore: 7
    },
    {
      id: '9', name: 'MySQL', proficiency: 70, category: 'Relational Databases', level: 70, yearsOfExperience: 1.5, isCore: false, relevanceScore: 8
    },
    {
      id: '10', name: 'JWT', proficiency: 72, category: 'Authentication', level: 72, yearsOfExperience: 1.5, isCore: false, relevanceScore: 7
    },
    {
      id: '11', name: 'NPM', proficiency: 75, category: 'Package Managers', level: 75, yearsOfExperience: 2, isCore: false, relevanceScore: 6
    },
    {
      id: '12', name: 'Mongoose', proficiency: 78, category: 'ODM/ORM', level: 78, yearsOfExperience: 2, isCore: false, relevanceScore: 7
    },
    {
      id: '13', name: 'Heroku', proficiency: 65, category: 'Cloud Platforms', level: 65, yearsOfExperience: 1, isCore: false, relevanceScore: 6
    },
    {
      id: '14', name: 'Jest', proficiency: 60, category: 'Testing Frameworks', level: 60, yearsOfExperience: 1, isCore: false, relevanceScore: 6
    },
    {
      id: '15', name: 'Docker', proficiency: 55, category: 'Containerization', level: 55, yearsOfExperience: 0.5, isCore: false, relevanceScore: 7
    }
  ],
  experiences: [
    {
      id: '1',
      company: 'WebTech Solutions',
      position: 'Backend Developer',
      startDate: '2022-07',
      endDate: null,
      description: 'Developing and maintaining REST APIs and backend services for web applications serving small to medium-sized businesses. Collaborating with frontend developers and product managers to implement new features and optimize existing systems.',
      achievements: [
        'Built 8+ REST APIs with comprehensive documentation and testing',
        'Improved API response times by 35% through database query optimization',
        'Implemented user authentication and authorization system using JWT',
        'Contributed to team project that increased client satisfaction by 20%',
        'Reduced server costs by 25% through code optimization and caching'
      ],
      technologies: ['Node.js', 'Express.js', 'MongoDB', 'JWT', 'Postman', 'Git'],
      location: 'Seattle, WA',
      employmentType: 'Full-time',
      industryContext: 'Web Development',
      roleLevel: 'entry'
    },
    {
      id: '2',
      company: 'StartupHub Inc',
      position: 'Junior Backend Developer',
      startDate: '2021-08',
      endDate: '2022-06',
      description: 'Assisted in developing backend services for startup products. Gained experience in API development, database management, and collaborative development workflows using modern backend technologies.',
      achievements: [
        'Contributed to 5 backend projects from development to deployment',
        'Fixed 40+ bugs and implemented 15+ feature requests',
        'Learned MongoDB and NoSQL database design through mentorship program',
        'Improved code quality through peer reviews and testing practices',
        'Built automated scripts reducing manual deployment time by 50%'
      ],
      technologies: ['Node.js', 'Express.js', 'MongoDB', 'MySQL', 'Git', 'Heroku'],
      location: 'Seattle, WA',
      employmentType: 'Full-time',
      industryContext: 'Technology Startup',
      roleLevel: 'entry'
    },
    {
      id: '3',
      company: 'Freelance',
      position: 'Backend Developer',
      startDate: '2020-10',
      endDate: '2021-07',
      description: 'Provided backend development services to local businesses and individuals. Built custom APIs, database solutions, and simple backend services while learning modern backend development technologies and best practices.',
      achievements: [
        'Completed 10+ freelance backend projects with 100% client satisfaction',
        'Built portfolio of REST APIs showcasing technical skills',
        'Learned Node.js and Express.js through hands-on project experience',
        'Established client relationships leading to repeat business and referrals',
        'Developed problem-solving skills working with diverse project requirements'
      ],
      technologies: ['Node.js', 'Express.js', 'MongoDB', 'MySQL', 'Postman'],
      location: 'Seattle, WA',
      employmentType: 'Freelance',
      industryContext: 'Freelance',
      roleLevel: 'entry'
    }
  ],
  education: [
    {
      id: '1',
      institution: 'University of Washington',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2017-09',
      endDate: '2021-06',
      location: 'Seattle, WA',
      gpa: '3.5',
      honors: ['Dean\'s List (3 semesters)'],
      relevantCoursework: ['Database Systems', 'Software Engineering', 'Web Development', 'Data Structures', 'Algorithms', 'Computer Networks']
    }
  ],
  projects: [
    {
      id: '1',
      title: 'Task Management API',
      description: 'Built comprehensive REST API for task management application using Node.js, Express, and MongoDB. Features include user authentication, CRUD operations, task filtering, and real-time updates. Includes comprehensive API documentation and testing.',
      technologies: ['Node.js', 'Express.js', 'MongoDB', 'JWT', 'Mongoose', 'Jest'],
      startDate: '2023-02-01',
      endDate: '2023-05-01',
      github: 'github.com/sarahkim/task-api',
      impact: '500+ API calls per day, 99.5% uptime, featured in portfolio',
      roleSpecific: true,
      metrics: {
        performance: '99.5% uptime, <150ms response time',
        adoption: '500+ API calls per day',
        efficiency: 'Complete API documentation with Postman collection'
      }
    },
    {
      id: '2',
      title: 'E-commerce Backend Service',
      description: 'Developed backend service for small e-commerce platform using Node.js and MySQL. Includes product management, user authentication, order processing, and payment integration. Features comprehensive error handling and input validation.',
      technologies: ['Node.js', 'Express.js', 'MySQL', 'JWT', 'Stripe API', 'Git'],
      startDate: '2022-11-01',
      endDate: '2023-02-01',
      github: 'github.com/sarahkim/ecommerce-backend',
      impact: '200+ orders processed, 98% uptime, client testimonial received',
      roleSpecific: true,
      metrics: {
        performance: '98% uptime, secure payment processing',
        revenue: '200+ orders successfully processed',
        adoption: 'Client testimonial and referral received'
      }
    },
    {
      id: '3',
      title: 'Blog API with Authentication',
      description: 'Created RESTful API for blog platform with user authentication, post management, and commenting system. Built using Node.js, Express, and MongoDB with JWT authentication and comprehensive input validation.',
      technologies: ['Node.js', 'Express.js', 'MongoDB', 'JWT', 'Bcrypt', 'Postman'],
      startDate: '2022-06-01',
      endDate: '2022-10-01',
      github: 'github.com/sarahkim/blog-api',
      impact: '100+ registered users, featured in university project showcase',
      roleSpecific: true,
      metrics: {
        adoption: '100+ registered users',
        performance: 'Featured in university project showcase',
        efficiency: 'Comprehensive API testing with Postman'
      }
    }
  ],
  achievements: [
    'Completed freeCodeCamp Backend Development and APIs Certification',
    'Active contributor to open source projects with 150+ GitHub contributions',
    'Volunteer backend developer for local non-profit organization',
    'Winner of university hackathon backend development category',
    'Technical blog contributor with articles on Node.js and API development'
  ],
  certifications: [
    {
      id: '1',
      name: 'freeCodeCamp Backend Development and APIs',
      issuer: 'freeCodeCamp',
      issueDate: '2021-12',
      credentialId: 'FCC-BACKEND-2021-001'
    },
    {
      id: '2',
      name: 'MongoDB Basics',
      issuer: 'MongoDB University',
      issueDate: '2022-04',
      credentialId: 'MDB-BASICS-2022-001'
    }
  ],
  metadata: {
    targetRole: 'backend-developer',
    industry: 'technology',
    experienceLevel: 'entry',
    lastUpdated: new Date(),
    contentVersion: '1.0.0',
    tags: ['backend', 'nodejs', 'express', 'mongodb', 'rest-api', 'entry-level', 'javascript']
  }
};