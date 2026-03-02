import { TemplateSpecificContent, TEMPLATE_IDS } from '../templateSpecificContentService';

// Senior Full Stack Developer Template Content
export const seniorFullstackDeveloperContent: TemplateSpecificContent = {
  templateId: TEMPLATE_IDS.FULLSTACK_SENIOR,
  personalInfo: {
    name: 'Marcus Thompson',
    title: 'Senior Full Stack Developer',
    email: 'marcus.thompson@fullstack.dev',
    phone: '+1 (555) 678-9012',
    location: 'Denver, CO',
    website: 'marcusthompson.dev',
    linkedin: 'linkedin.com/in/marcusthompson',
    github: 'github.com/marcusthompson',
    avatar: '',
  },
  professionalSummary: 'Senior Full Stack Developer with 9+ years of experience building end-to-end web applications using React, Node.js, TypeScript, and PostgreSQL. Expert in full-stack architecture, cloud deployment, and team leadership. Led development teams and architected scalable applications serving 5M+ users with modern DevOps practices and AWS infrastructure.',
  objective: 'Seeking a Lead Full Stack Developer or Engineering Manager role where I can leverage my expertise in modern web technologies, system architecture, and team leadership to build exceptional products while mentoring the next generation of full-stack engineers.',
  skills: [
    {
      id: '1', name: 'React', proficiency: 95, category: 'Frontend Frameworks', level: 95, yearsOfExperience: 8, isCore: true, relevanceScore: 10
    },
    {
      id: '2', name: 'Node.js', proficiency: 93, category: 'Backend Runtime', level: 93, yearsOfExperience: 9, isCore: true, relevanceScore: 10
    },
    {
      id: '3', name: 'TypeScript', proficiency: 92, category: 'Programming Languages', level: 92, yearsOfExperience: 7, isCore: true, relevanceScore: 10
    },
    {
      id: '4', name: 'PostgreSQL', proficiency: 90, category: 'Databases', level: 90, yearsOfExperience: 8, isCore: true, relevanceScore: 9
    },
    {
      id: '5', name: 'AWS', proficiency: 88, category: 'Cloud Platforms', level: 88, yearsOfExperience: 6, isCore: true, relevanceScore: 9
    },
    {
      id: '6', name: 'Docker', proficiency: 85, category: 'Containerization', level: 85, yearsOfExperience: 5, isCore: true, relevanceScore: 9
    },
    {
      id: '7', name: 'JavaScript', proficiency: 95, category: 'Programming Languages', level: 95, yearsOfExperience: 10, isCore: true, relevanceScore: 9
    },
    {
      id: '8', name: 'Express.js', proficiency: 92, category: 'Backend Frameworks', level: 92, yearsOfExperience: 8, isCore: true, relevanceScore: 9
    },
    {
      id: '9', name: 'Next.js', proficiency: 88, category: 'React Frameworks', level: 88, yearsOfExperience: 5, isCore: false, relevanceScore: 8
    },
    {
      id: '10', name: 'GraphQL', proficiency: 85, category: 'API Technologies', level: 85, yearsOfExperience: 4, isCore: false, relevanceScore: 8
    },
    {
      id: '11', name: 'Redis', proficiency: 82, category: 'Caching Systems', level: 82, yearsOfExperience: 5, isCore: false, relevanceScore: 8
    },
    {
      id: '12', name: 'MongoDB', proficiency: 80, category: 'NoSQL Databases', level: 80, yearsOfExperience: 6, isCore: false, relevanceScore: 7
    },
    {
      id: '13', name: 'Kubernetes', proficiency: 78, category: 'Container Orchestration', level: 78, yearsOfExperience: 3, isCore: false, relevanceScore: 7
    },
    {
      id: '14', name: 'Jest', proficiency: 85, category: 'Testing Frameworks', level: 85, yearsOfExperience: 6, isCore: false, relevanceScore: 7
    },
    {
      id: '15', name: 'Terraform', proficiency: 75, category: 'Infrastructure as Code', level: 75, yearsOfExperience: 3, isCore: false, relevanceScore: 7
    }
  ],
  experiences: [
    {
      id: '1',
      company: 'TechScale Solutions',
      position: 'Senior Full Stack Developer',
      startDate: '2021-03',
      endDate: null,
      description: 'Leading full-stack development for enterprise SaaS platform serving 5M+ users. Responsible for end-to-end application architecture, team leadership, and mentoring junior developers. Built scalable web applications with modern React frontend and Node.js backend infrastructure.',
      achievements: [
        'Architected full-stack application reducing page load times by 65% and improving user engagement by 40%',
        'Led team of 8 developers delivering 25+ major features with 99.9% uptime',
        'Implemented microservices architecture reducing deployment time from 2 hours to 15 minutes',
        'Built real-time collaboration features supporting 10K+ concurrent users',
        'Mentored 12 junior developers, with 9 receiving promotions within 18 months',
        'Reduced infrastructure costs by 35% through optimization and containerization'
      ],
      technologies: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes'],
      location: 'Denver, CO',
      employmentType: 'Full-time',
      industryContext: 'SaaS Technology',
      roleLevel: 'senior'
    },
    {
      id: '2',
      company: 'CloudFirst Technologies',
      position: 'Full Stack Developer',
      startDate: '2018-07',
      endDate: '2021-02',
      description: 'Developed end-to-end web applications for diverse clients using React, Node.js, and cloud technologies. Focused on performance optimization, scalable architecture, and modern development practices across the full technology stack.',
      achievements: [
        'Built 15+ full-stack applications with 98% client satisfaction rate',
        'Improved application performance by 50% through frontend and backend optimizations',
        'Implemented automated CI/CD pipelines reducing deployment errors by 80%',
        'Led migration of 5 legacy applications to modern React/Node.js stack',
        'Established development best practices adopted across 3 development teams'
      ],
      technologies: ['React', 'Node.js', 'JavaScript', 'MongoDB', 'AWS', 'Docker'],
      location: 'Denver, CO',
      employmentType: 'Full-time',
      industryContext: 'Technology Consulting',
      roleLevel: 'mid'
    },
    {
      id: '3',
      company: 'InnovateTech Startup',
      position: 'Full Stack Developer',
      startDate: '2015-09',
      endDate: '2018-06',
      description: 'Built complete web applications from concept to deployment for early-stage startup products. Collaborated closely with product managers and designers to create seamless user experiences across frontend and backend systems.',
      achievements: [
        'Developed full-stack MVP for 4 successful product launches',
        'Built authentication and user management system used across all products',
        'Implemented responsive design system reducing development time by 40%',
        'Achieved 99.5% uptime across all applications through robust error handling',
        'Optimized database queries improving application response times by 60%'
      ],
      technologies: ['React', 'Node.js', 'Express.js', 'PostgreSQL', 'MongoDB', 'Heroku'],
      location: 'Denver, CO',
      employmentType: 'Full-time',
      industryContext: 'Startup',
      roleLevel: 'mid'
    }
  ],
  education: [
    {
      id: '1',
      institution: 'University of Colorado Boulder',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2011-09',
      endDate: '2015-05',
      location: 'Boulder, CO',
      gpa: '3.8',
      honors: ['Magna Cum Laude', 'Computer Science Honor Society', 'Dean\'s List (7 semesters)'],
      relevantCoursework: ['Full Stack Web Development', 'Database Systems', 'Software Engineering', 'Human-Computer Interaction', 'Data Structures', 'Algorithms', 'Computer Networks']
    }
  ],
  projects: [
    {
      id: '1',
      title: 'Real-time Project Management Platform',
      description: 'Built comprehensive project management platform using React, Node.js, TypeScript, and PostgreSQL. Features include real-time collaboration, task management, file sharing, and team communication with support for 1000+ concurrent users and advanced analytics.',
      technologies: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'WebSockets', 'AWS', 'Docker'],
      startDate: '2022-08-01',
      endDate: '2023-06-01',
      url: 'https://projecthub-platform.com',
      github: 'github.com/marcusthompson/project-platform',
      images: [
        'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: '1000+ concurrent users, 99.9% uptime, 45% faster than competitors, $500K ARR',
      roleSpecific: true,
      metrics: {
        performance: '99.9% uptime, <150ms response time',
        adoption: '1000+ concurrent users, 500+ teams',
        revenue: '$500K ARR within 12 months',
        efficiency: '45% faster task completion vs competitors'
      }
    },
    {
      id: '2',
      title: 'E-commerce Platform with Analytics',
      description: 'Developed complete e-commerce solution with React frontend, Node.js backend, and PostgreSQL database. Includes product management, order processing, payment integration, inventory tracking, and comprehensive analytics dashboard with real-time reporting.',
      technologies: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Stripe API', 'AWS', 'Docker', 'Redis'],
      startDate: '2021-11-01',
      endDate: '2022-07-01',
      github: 'github.com/marcusthompson/ecommerce-platform',
      images: [
        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: '10K+ orders processed, $2M+ transactions, 99.8% uptime, 35% conversion rate improvement',
      roleSpecific: true,
      metrics: {
        performance: '99.8% uptime, <200ms page load time',
        revenue: '$2M+ in transactions processed',
        adoption: '10K+ orders, 500+ merchants',
        efficiency: '35% conversion rate improvement'
      }
    },
    {
      id: '3',
      title: 'Social Learning Platform',
      description: 'Architected and built social learning platform using React, Node.js, and PostgreSQL. Features include course creation, video streaming, interactive quizzes, discussion forums, and progress tracking with gamification elements and mobile-responsive design.',
      technologies: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS S3', 'WebRTC', 'Socket.io'],
      startDate: '2020-09-01',
      endDate: '2021-10-01',
      url: 'https://learnconnect-platform.com',
      github: 'github.com/marcusthompson/learning-platform',
      images: [
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: '5K+ active learners, 95% course completion rate, featured in EdTech showcase',
      roleSpecific: true,
      metrics: {
        adoption: '5K+ active learners, 200+ courses',
        performance: '95% course completion rate',
        efficiency: 'Featured in top 10 EdTech platforms',
        revenue: '300% increase in user engagement'
      }
    }
  ],
  achievements: [
    'Led full-stack architecture for applications serving 5M+ users',
    'Speaker at 4+ full-stack development conferences and React meetups',
    'Open source contributor with 3K+ GitHub stars across projects',
    'Mentor to 25+ junior full-stack developers',
    'Technical blog with 40K+ monthly readers on full-stack development',
    'Winner of company innovation award for microservices architecture',
    'AWS Certified Solutions Architect with expertise in full-stack deployments'
  ],
  certifications: [
    {
      id: '1',
      name: 'AWS Certified Solutions Architect - Professional',
      issuer: 'Amazon Web Services',
      issueDate: '2022-09',
      credentialId: 'AWS-SAP-2022-002'
    },
    {
      id: '2',
      name: 'React Developer Certification',
      issuer: 'Meta',
      issueDate: '2021-11',
      credentialId: 'META-REACT-2021-001'
    },
    {
      id: '3',
      name: 'Node.js Application Developer',
      issuer: 'OpenJS Foundation',
      issueDate: '2020-08',
      credentialId: 'NODEJS-DEV-2020-001'
    }
  ],
  metadata: {
    targetRole: 'fullstack-developer',
    industry: 'technology',
    experienceLevel: 'senior',
    lastUpdated: new Date(),
    contentVersion: '1.0.0',
    tags: ['fullstack', 'react', 'nodejs', 'typescript', 'postgresql', 'aws', 'docker', 'senior', 'architecture', 'leadership']
  }
};

// Mid-Level Full Stack Developer Template Content
export const midLevelFullstackDeveloperContent: TemplateSpecificContent = {
  templateId: TEMPLATE_IDS.FULLSTACK_MID,
  personalInfo: {
    name: 'Jessica Martinez',
    title: 'Full Stack Developer',
    email: 'jessica.martinez@fullstack.dev',
    phone: '+1 (555) 789-0123',
    location: 'Phoenix, AZ',
    website: 'jessicamartinez.dev',
    linkedin: 'linkedin.com/in/jessicamartinez',
    github: 'github.com/jessicamartinez',
    avatar: '',
  },
  professionalSummary: 'Full Stack Developer with 5+ years of experience building responsive web applications using React, Node.js, JavaScript, and MySQL. Strong foundation in both frontend and backend development with experience in agile methodologies and collaborative development. Passionate about creating user-friendly interfaces and efficient server-side solutions.',
  objective: 'Seeking a Senior Full Stack Developer position where I can leverage my experience in modern web technologies and full-stack development to build scalable applications while continuing to grow my expertise in advanced architecture patterns and team leadership.',
  skills: [
    {
      id: '1', name: 'React', proficiency: 85, category: 'Frontend Frameworks', level: 85, yearsOfExperience: 5, isCore: true, relevanceScore: 10
    },
    {
      id: '2', name: 'Node.js', proficiency: 82, category: 'Backend Runtime', level: 82, yearsOfExperience: 5, isCore: true, relevanceScore: 10
    },
    {
      id: '3', name: 'JavaScript', proficiency: 88, category: 'Programming Languages', level: 88, yearsOfExperience: 6, isCore: true, relevanceScore: 10
    },
    {
      id: '4', name: 'MySQL', proficiency: 80, category: 'Databases', level: 80, yearsOfExperience: 4, isCore: true, relevanceScore: 9
    },
    {
      id: '5', name: 'Express.js', proficiency: 85, category: 'Backend Frameworks', level: 85, yearsOfExperience: 5, isCore: true, relevanceScore: 9
    },
    {
      id: '6', name: 'HTML5', proficiency: 90, category: 'Web Technologies', level: 90, yearsOfExperience: 6, isCore: true, relevanceScore: 8
    },
    {
      id: '7', name: 'CSS3', proficiency: 88, category: 'Web Technologies', level: 88, yearsOfExperience: 6, isCore: true, relevanceScore: 8
    },
    {
      id: '8', name: 'REST APIs', proficiency: 85, category: 'API Technologies', level: 85, yearsOfExperience: 5, isCore: true, relevanceScore: 9
    },
    {
      id: '9', name: 'Git', proficiency: 82, category: 'Version Control', level: 82, yearsOfExperience: 5, isCore: true, relevanceScore: 8
    },
    {
      id: '10', name: 'MongoDB', proficiency: 75, category: 'NoSQL Databases', level: 75, yearsOfExperience: 3, isCore: false, relevanceScore: 7
    },
    {
      id: '11', name: 'Redux', proficiency: 78, category: 'State Management', level: 78, yearsOfExperience: 3, isCore: false, relevanceScore: 7
    },
    {
      id: '12', name: 'Sass/SCSS', proficiency: 80, category: 'CSS Preprocessors', level: 80, yearsOfExperience: 4, isCore: false, relevanceScore: 6
    },
    {
      id: '13', name: 'Webpack', proficiency: 70, category: 'Build Tools', level: 70, yearsOfExperience: 3, isCore: false, relevanceScore: 6
    },
    {
      id: '14', name: 'Jest', proficiency: 72, category: 'Testing Frameworks', level: 72, yearsOfExperience: 3, isCore: false, relevanceScore: 6
    },
    {
      id: '15', name: 'Docker', proficiency: 65, category: 'Containerization', level: 65, yearsOfExperience: 2, isCore: false, relevanceScore: 7
    },
    {
      id: '16', name: 'AWS', proficiency: 60, category: 'Cloud Platforms', level: 60, yearsOfExperience: 2, isCore: false, relevanceScore: 7
    }
  ],
  experiences: [
    {
      id: '1',
      company: 'WebSolutions Inc',
      position: 'Full Stack Developer',
      startDate: '2021-05',
      endDate: null,
      description: 'Developing end-to-end web applications for mid-sized businesses using React, Node.js, and MySQL. Collaborating with cross-functional teams to deliver feature-rich applications with focus on user experience and performance optimization.',
      achievements: [
        'Built 8+ full-stack applications with 96% client satisfaction rate',
        'Improved application performance by 40% through frontend and backend optimizations',
        'Implemented responsive design patterns reducing mobile bounce rate by 30%',
        'Contributed to team project that increased user engagement by 25%',
        'Mentored 3 junior developers in full-stack development best practices',
        'Reduced bug reports by 50% through comprehensive testing and code reviews'
      ],
      technologies: ['React', 'Node.js', 'JavaScript', 'MySQL', 'Express.js', 'HTML5', 'CSS3'],
      location: 'Phoenix, AZ',
      employmentType: 'Full-time',
      industryContext: 'Web Development',
      roleLevel: 'mid'
    },
    {
      id: '2',
      company: 'TechFlow Solutions',
      position: 'Full Stack Developer',
      startDate: '2019-08',
      endDate: '2021-04',
      description: 'Developed and maintained web applications using React frontend and Node.js backend. Focused on creating seamless user experiences while building robust server-side functionality and database integrations.',
      achievements: [
        'Delivered 12+ web development projects from concept to deployment',
        'Implemented user authentication system used across 5 applications',
        'Optimized database queries reducing page load times by 35%',
        'Built reusable component library improving development efficiency by 30%',
        'Collaborated with UX designers to implement pixel-perfect interfaces'
      ],
      technologies: ['React', 'Node.js', 'JavaScript', 'MongoDB', 'Express.js', 'Redux'],
      location: 'Phoenix, AZ',
      employmentType: 'Full-time',
      industryContext: 'Technology Services',
      roleLevel: 'mid'
    },
    {
      id: '3',
      company: 'StartupLab Technologies',
      position: 'Junior Full Stack Developer',
      startDate: '2018-06',
      endDate: '2019-07',
      description: 'Assisted in developing full-stack web applications for startup products. Gained experience in modern web development practices, agile methodologies, and collaborative development workflows across frontend and backend technologies.',
      achievements: [
        'Contributed to 6 full-stack projects from development to production',
        'Fixed 60+ bugs and implemented 25+ feature requests',
        'Learned React and Node.js ecosystem through mentorship program',
        'Improved code quality through peer reviews and testing practices',
        'Built portfolio of full-stack applications showcasing technical growth'
      ],
      technologies: ['React', 'Node.js', 'JavaScript', 'MySQL', 'HTML5', 'CSS3'],
      location: 'Phoenix, AZ',
      employmentType: 'Full-time',
      industryContext: 'Technology Startup',
      roleLevel: 'entry'
    }
  ],
  education: [
    {
      id: '1',
      institution: 'Arizona State University',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2014-09',
      endDate: '2018-05',
      location: 'Tempe, AZ',
      gpa: '3.6',
      honors: ['Dean\'s List (4 semesters)', 'Computer Science Honor Society'],
      relevantCoursework: ['Full Stack Web Development', 'Database Systems', 'Software Engineering', 'User Interface Design', 'Data Structures', 'Algorithms', 'Computer Networks']
    }
  ],
  projects: [
    {
      id: '1',
      title: 'Task Management Web Application',
      description: 'Built comprehensive task management application using React frontend and Node.js backend with MySQL database. Features include user authentication, task creation and assignment, team collaboration, progress tracking, and real-time notifications with responsive design.',
      technologies: ['React', 'Node.js', 'JavaScript', 'MySQL', 'Express.js', 'Socket.io', 'Bootstrap'],
      startDate: '2023-03-01',
      endDate: '2023-08-01',
      url: 'https://taskflow-app.com',
      github: 'github.com/jessicamartinez/task-management',
      impact: '500+ active users, 95% user satisfaction, 40% productivity improvement reported',
      roleSpecific: true,
      metrics: {
        adoption: '500+ active users, 50+ teams',
        performance: '95% user satisfaction score',
        efficiency: '40% productivity improvement reported',
        revenue: 'Featured in productivity app showcase'
      }
    },
    {
      id: '2',
      title: 'Restaurant Ordering System',
      description: 'Developed complete restaurant ordering system with React customer interface and Node.js admin panel. Includes menu management, order processing, payment integration, inventory tracking, and analytics dashboard with real-time order updates.',
      technologies: ['React', 'Node.js', 'JavaScript', 'MySQL', 'Stripe API', 'Express.js', 'Redux'],
      startDate: '2022-09-01',
      endDate: '2023-02-01',
      github: 'github.com/jessicamartinez/restaurant-system',
      impact: '1000+ orders processed, 98% uptime, 25% increase in order efficiency',
      roleSpecific: true,
      metrics: {
        performance: '98% uptime, <2s order processing',
        adoption: '1000+ orders processed monthly',
        efficiency: '25% increase in order processing speed',
        revenue: 'Client reported 15% revenue increase'
      }
    },
    {
      id: '3',
      title: 'Personal Finance Tracker',
      description: 'Created personal finance management application using React and Node.js with MySQL database. Features include expense tracking, budget planning, financial goal setting, transaction categorization, and comprehensive reporting with data visualization.',
      technologies: ['React', 'Node.js', 'JavaScript', 'MySQL', 'Chart.js', 'Express.js', 'CSS3'],
      startDate: '2022-01-01',
      endDate: '2022-08-01',
      url: 'https://financetracker-demo.com',
      github: 'github.com/jessicamartinez/finance-tracker',
      impact: '300+ users, 4.8/5 app store rating, featured in finance app roundup',
      roleSpecific: true,
      metrics: {
        adoption: '300+ active users',
        performance: '4.8/5 app store rating',
        efficiency: 'Featured in top finance apps list',
        revenue: 'Users report 30% better budget adherence'
      }
    }
  ],
  achievements: [
    'Built 20+ full-stack applications with consistent high client satisfaction',
    'Active contributor to open source projects with 800+ GitHub contributions',
    'Volunteer full-stack developer for local non-profit organizations',
    'Winner of regional hackathon full-stack development category',
    'Technical blog contributor with articles on React and Node.js development',
    'Completed advanced full-stack development bootcamp with honors'
  ],
  certifications: [
    {
      id: '1',
      name: 'Full Stack Web Development Certificate',
      issuer: 'freeCodeCamp',
      issueDate: '2022-06',
      credentialId: 'FCC-FULLSTACK-2022-001'
    },
    {
      id: '2',
      name: 'React Developer Certification',
      issuer: 'Meta',
      issueDate: '2021-09',
      credentialId: 'META-REACT-2021-002'
    },
    {
      id: '3',
      name: 'Node.js Application Development',
      issuer: 'IBM',
      issueDate: '2020-12',
      credentialId: 'IBM-NODEJS-2020-001'
    }
  ],
  metadata: {
    targetRole: 'fullstack-developer',
    industry: 'technology',
    experienceLevel: 'mid',
    lastUpdated: new Date(),
    contentVersion: '1.0.0',
    tags: ['fullstack', 'react', 'nodejs', 'javascript', 'mysql', 'express', 'mid-level', 'web-development']
  }
};