import { TemplateSpecificContent, TEMPLATE_IDS } from '../templateSpecificContentService';

// Product Manager Template Content
export const productManagerContent: TemplateSpecificContent = {
  templateId: TEMPLATE_IDS.PRODUCT_MANAGER,
  personalInfo: {
    name: 'Sarah Mitchell',
    title: 'Senior Product Manager',
    email: 'sarah.mitchell@producttech.com',
    phone: '+1 (555) 789-0123',
    location: 'San Francisco, CA',
    website: 'sarahmitchell.pm',
    linkedin: 'linkedin.com/in/sarahmitchell',
    github: 'github.com/sarahmitchell',
    avatar: '',
  },
  professionalSummary: 'Results-driven Senior Product Manager with 7+ years of experience leading cross-functional teams to deliver innovative digital products. Expert in product strategy, roadmapping, user research, and data-driven decision making. Successfully launched 15+ products that generated $50M+ in revenue and served 2M+ users. Proven track record of transforming user insights into compelling product experiences that drive business growth.',
  objective: 'Seeking a Principal Product Manager role where I can leverage my expertise in product strategy and user-centered design to lead the development of transformative products that create meaningful impact for users and drive significant business value.',
  skills: [
    {
      id: '1',
      name: 'Product Strategy',
      proficiency: 95,
      category: 'Product Management',
      level: 95,
      yearsOfExperience: 7,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '2',
      name: 'Roadmapping',
      proficiency: 92,
      category: 'Product Planning',
      level: 92,
      yearsOfExperience: 6,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '3',
      name: 'Analytics',
      proficiency: 88,
      category: 'Data Analysis',
      level: 88,
      yearsOfExperience: 5,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '4',
      name: 'Stakeholder Management',
      proficiency: 90,
      category: 'Leadership',
      level: 90,
      yearsOfExperience: 7,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '5',
      name: 'User Research',
      proficiency: 85,
      category: 'Research',
      level: 85,
      yearsOfExperience: 6,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '6',
      name: 'A/B Testing',
      proficiency: 82,
      category: 'Experimentation',
      level: 82,
      yearsOfExperience: 4,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '7',
      name: 'Agile/Scrum',
      proficiency: 88,
      category: 'Methodology',
      level: 88,
      yearsOfExperience: 6,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '8',
      name: 'SQL',
      proficiency: 75,
      category: 'Technical Skills',
      level: 75,
      yearsOfExperience: 4,
      isCore: false,
      relevanceScore: 7
    },
    {
      id: '9',
      name: 'Figma',
      proficiency: 70,
      category: 'Design Tools',
      level: 70,
      yearsOfExperience: 3,
      isCore: false,
      relevanceScore: 6
    },
    {
      id: '10',
      name: 'Google Analytics',
      proficiency: 85,
      category: 'Analytics Tools',
      level: 85,
      yearsOfExperience: 5,
      isCore: true,
      relevanceScore: 8
    }
  ],
  experiences: [
    {
      id: '1',
      company: 'TechFlow Solutions',
      position: 'Senior Product Manager',
      startDate: '2021-08',
      endDate: null,
      description: 'Leading product strategy and development for a B2B SaaS platform serving 500+ enterprise clients. Managing cross-functional teams of 12+ engineers, designers, and data analysts. Responsible for product roadmap, feature prioritization, user research, and go-to-market strategy.',
      achievements: [
        'Launched 3 major product features that increased user engagement by 45% and reduced churn by 30%',
        'Led product discovery process that identified $15M market opportunity in enterprise automation',
        'Implemented data-driven product development process, improving feature success rate by 60%',
        'Managed product roadmap for 18-month horizon with quarterly OKR alignment',
        'Increased monthly active users from 50K to 150K through strategic feature development'
      ],
      technologies: ['Jira', 'Confluence', 'Figma', 'Google Analytics', 'Mixpanel', 'SQL', 'Tableau'],
      location: 'San Francisco, CA',
      employmentType: 'Full-time',
      industryContext: 'SaaS',
      roleLevel: 'senior'
    },
    {
      id: '2',
      company: 'InnovateCorp',
      position: 'Product Manager',
      startDate: '2019-03',
      endDate: '2021-07',
      description: 'Managed product development for consumer mobile application with 1M+ downloads. Collaborated with engineering, design, and marketing teams to deliver user-centered product experiences. Conducted user research, competitive analysis, and market validation.',
      achievements: [
        'Launched mobile app redesign that improved user retention by 40% and app store rating to 4.8/5',
        'Conducted 50+ user interviews and usability tests to inform product decisions',
        'Implemented A/B testing framework that increased conversion rates by 25%',
        'Coordinated go-to-market strategy for 5 major feature releases',
        'Grew daily active users by 120% through strategic product improvements'
      ],
      technologies: ['Firebase', 'Google Analytics', 'Hotjar', 'Sketch', 'Zeplin', 'Amplitude'],
      location: 'San Francisco, CA',
      employmentType: 'Full-time',
      industryContext: 'Consumer Tech',
      roleLevel: 'mid'
    },
    {
      id: '3',
      company: 'StartupLab',
      position: 'Associate Product Manager',
      startDate: '2017-06',
      endDate: '2019-02',
      description: 'Supported product development for early-stage fintech startup. Assisted with user research, feature specification, and product analytics. Worked closely with founders to define product vision and execute MVP development.',
      achievements: [
        'Contributed to MVP development that secured $2M Series A funding',
        'Conducted market research that identified key user personas and use cases',
        'Implemented user feedback collection system that improved product-market fit',
        'Supported launch of beta program with 500+ early adopters',
        'Created product documentation and user guides for initial product release'
      ],
      technologies: ['Google Analytics', 'Intercom', 'Trello', 'Slack', 'Typeform'],
      location: 'Palo Alto, CA',
      employmentType: 'Full-time',
      industryContext: 'Fintech Startup',
      roleLevel: 'entry'
    }
  ],
  education: [
    {
      id: '1',
      institution: 'Stanford University',
      degree: 'Master of Business Administration',
      field: 'Technology Management',
      startDate: '2015-09',
      endDate: '2017-06',
      location: 'Stanford, CA',
      gpa: '3.8',
      honors: ['Dean\'s List', 'Product Management Fellowship'],
      relevantCoursework: ['Product Strategy', 'Technology Entrepreneurship', 'Data Analytics', 'Design Thinking']
    },
    {
      id: '2',
      institution: 'University of California, Berkeley',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2011-09',
      endDate: '2015-05',
      location: 'Berkeley, CA',
      gpa: '3.6',
      relevantCoursework: ['Software Engineering', 'Human-Computer Interaction', 'Database Systems', 'Statistics']
    }
  ],
  projects: [
    {
      id: '1',
      title: 'Enterprise Workflow Automation Platform',
      description: 'Led end-to-end product development of workflow automation platform for enterprise clients. Conducted extensive user research, defined product requirements, and managed development through multiple iterations. Platform now serves 200+ enterprise customers with 95% satisfaction rate.',
      technologies: ['Product Strategy', 'User Research', 'Figma', 'SQL', 'Google Analytics', 'A/B Testing'],
      startDate: '2022-01-01',
      endDate: '2023-06-01',
      url: 'https://techflow.com/automation',
      images: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: 'Generated $8M ARR and reduced customer workflow processing time by 70%',
      roleSpecific: true,
      metrics: {
        revenue: '$8M ARR generated',
        users: '200+ enterprise customers',
        performance: '70% reduction in workflow processing time',
        adoption: '95% customer satisfaction rate'
      }
    },
    {
      id: '2',
      title: 'Mobile App Personalization Engine',
      description: 'Designed and launched AI-powered personalization system for mobile application. Led cross-functional team through user research, technical specification, and iterative development. Implemented comprehensive A/B testing framework to optimize personalization algorithms.',
      technologies: ['Machine Learning', 'A/B Testing', 'Firebase', 'Google Analytics', 'User Research'],
      startDate: '2020-03-01',
      endDate: '2021-01-01',
      images: [
        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: 'Increased user engagement by 45% and reduced churn by 30%',
      roleSpecific: true,
      metrics: {
        performance: '45% increase in user engagement',
        efficiency: '30% reduction in user churn',
        adoption: '1M+ users experiencing personalized content'
      }
    },
    {
      id: '3',
      title: 'Customer Feedback Analytics Dashboard',
      description: 'Built comprehensive analytics dashboard to track and analyze customer feedback across multiple channels. Integrated data from support tickets, app reviews, surveys, and user interviews. Created automated reporting system for stakeholder communication.',
      technologies: ['Tableau', 'SQL', 'Python', 'Google Analytics', 'Intercom API'],
      startDate: '2019-09-01',
      endDate: '2020-02-01',
      github: 'github.com/sarahmitchell/feedback-analytics',
      images: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: 'Reduced time to identify product issues by 60% and improved customer satisfaction by 25%',
      roleSpecific: true,
      metrics: {
        efficiency: '60% faster issue identification',
        performance: '25% improvement in customer satisfaction'
      }
    }
  ],
  achievements: [
    'Certified Product Manager (CPM) - Product School',
    'Google Analytics Individual Qualification (IQ)',
    'Led product launches generating $50M+ in cumulative revenue',
    'Managed products serving 2M+ active users across multiple platforms',
    'Speaker at ProductCon 2023: "Data-Driven Product Discovery"',
    'Mentor for 10+ junior product managers and career changers',
    'Winner of "Product Innovation Award" at TechFlow Solutions 2022'
  ],
  certifications: [
    {
      id: '1',
      name: 'Certified Product Manager (CPM)',
      issuer: 'Product School',
      issueDate: '2020-08-15',
      expiryDate: '2023-08-15',
      credentialId: 'CPM-2020-001',
      url: 'https://productschool.com/product-manager-certification/'
    },
    {
      id: '2',
      name: 'Google Analytics Individual Qualification',
      issuer: 'Google',
      issueDate: '2021-03-10',
      expiryDate: '2024-03-10',
      credentialId: 'GA-IQ-2021-001'
    },
    {
      id: '3',
      name: 'Agile Product Management',
      issuer: 'Scrum Alliance',
      issueDate: '2019-11-20',
      expiryDate: '2025-11-20',
      credentialId: 'APM-2019-001'
    }
  ],
  metadata: {
    targetRole: 'product-manager',
    industry: 'business',
    experienceLevel: 'senior',
    lastUpdated: new Date(),
    contentVersion: '1.0.0',
    tags: ['product-management', 'strategy', 'analytics', 'user-research', 'saas', 'senior']
  }
};