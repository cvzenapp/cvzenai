import { TemplateSpecificContent, TEMPLATE_IDS } from '../templateSpecificContentService';

// Business Analyst Template Content
export const businessAnalystContent: TemplateSpecificContent = {
  templateId: TEMPLATE_IDS.BUSINESS_ANALYST,
  personalInfo: {
    name: 'Michael Chen',
    title: 'Senior Business Analyst',
    email: 'michael.chen@businesssolutions.com',
    phone: '+1 (555) 456-7890',
    location: 'Chicago, IL',
    website: 'michaelchen.business',
    linkedin: 'linkedin.com/in/michaelchen-ba',
    github: '',
    avatar: '',
  },
  professionalSummary: 'Results-oriented Senior Business Analyst with 6+ years of experience in requirements analysis, process mapping, and stakeholder management. Expert in translating business needs into technical specifications and driving process improvements that deliver measurable value. Successfully led 20+ projects resulting in $3M+ cost savings and 40% average efficiency improvements. Proven track record in data analysis, system optimization, and cross-functional collaboration.',
  objective: 'Seeking a Principal Business Analyst role where I can leverage my expertise in business process optimization and data-driven analysis to lead strategic initiatives that transform operations and drive significant organizational growth.',
  skills: [
    {
      id: '1',
      name: 'Requirements Analysis',
      proficiency: 95,
      category: 'Business Analysis',
      level: 95,
      yearsOfExperience: 6,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '2',
      name: 'Process Mapping',
      proficiency: 92,
      category: 'Process Improvement',
      level: 92,
      yearsOfExperience: 6,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '3',
      name: 'SQL',
      proficiency: 88,
      category: 'Data Analysis',
      level: 88,
      yearsOfExperience: 5,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '4',
      name: 'Tableau',
      proficiency: 85,
      category: 'Data Visualization',
      level: 85,
      yearsOfExperience: 4,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '5',
      name: 'Stakeholder Management',
      proficiency: 90,
      category: 'Communication',
      level: 90,
      yearsOfExperience: 6,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '6',
      name: 'Business Process Modeling',
      proficiency: 87,
      category: 'Process Design',
      level: 87,
      yearsOfExperience: 5,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '7',
      name: 'Data Analysis',
      proficiency: 90,
      category: 'Analytics',
      level: 90,
      yearsOfExperience: 6,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '8',
      name: 'Microsoft Excel',
      proficiency: 95,
      category: 'Data Tools',
      level: 95,
      yearsOfExperience: 6,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '9',
      name: 'JIRA',
      proficiency: 82,
      category: 'Project Management',
      level: 82,
      yearsOfExperience: 4,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '10',
      name: 'Agile/Scrum',
      proficiency: 85,
      category: 'Methodology',
      level: 85,
      yearsOfExperience: 5,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '11',
      name: 'Power BI',
      proficiency: 80,
      category: 'Business Intelligence',
      level: 80,
      yearsOfExperience: 3,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '12',
      name: 'Visio',
      proficiency: 88,
      category: 'Process Documentation',
      level: 88,
      yearsOfExperience: 5,
      isCore: true,
      relevanceScore: 7
    }
  ],
  experiences: [
    {
      id: '1',
      company: 'Enterprise Solutions Corp',
      position: 'Senior Business Analyst',
      startDate: '2021-09',
      endDate: null,
      description: 'Leading business analysis initiatives for enterprise software implementations serving 200+ corporate clients. Managing requirements gathering, process optimization, and stakeholder communication for complex business transformation projects. Collaborating with cross-functional teams including IT, operations, and executive leadership.',
      achievements: [
        'Led requirements analysis for ERP implementation that reduced operational costs by $1.2M annually',
        'Designed process optimization framework that improved workflow efficiency by 45% across 5 departments',
        'Managed stakeholder requirements for 8 concurrent projects with 99% on-time delivery rate',
        'Created comprehensive business process documentation reducing onboarding time by 60%',
        'Implemented data governance framework that improved data quality by 35%'
      ],
      technologies: ['SQL', 'Tableau', 'JIRA', 'Confluence', 'Visio', 'Power BI', 'Excel', 'SAP'],
      location: 'Chicago, IL',
      employmentType: 'Full-time',
      industryContext: 'Enterprise Software',
      roleLevel: 'senior'
    },
    {
      id: '2',
      company: 'Financial Services Group',
      position: 'Business Analyst',
      startDate: '2019-06',
      endDate: '2021-08',
      description: 'Conducted business analysis for financial services operations including loan processing, risk assessment, and customer onboarding. Collaborated with compliance, IT, and business units to ensure regulatory requirements and process efficiency. Specialized in data analysis and reporting for executive decision-making.',
      achievements: [
        'Analyzed loan processing workflow and identified bottlenecks, reducing processing time by 30%',
        'Created automated reporting dashboard that saved 20 hours/week of manual reporting',
        'Led requirements gathering for compliance system upgrade affecting 500+ users',
        'Developed KPI framework that improved business performance tracking by 50%',
        'Facilitated 25+ stakeholder workshops to define business requirements'
      ],
      technologies: ['SQL', 'Excel', 'Tableau', 'SAS', 'JIRA', 'SharePoint', 'Visio'],
      location: 'Chicago, IL',
      employmentType: 'Full-time',
      industryContext: 'Financial Services',
      roleLevel: 'mid'
    },
    {
      id: '3',
      company: 'TechStart Solutions',
      position: 'Junior Business Analyst',
      startDate: '2018-01',
      endDate: '2019-05',
      description: 'Supported business analysis activities for growing technology startup. Assisted with requirements documentation, user acceptance testing, and process improvement initiatives. Worked closely with product and engineering teams to translate business needs into technical specifications.',
      achievements: [
        'Documented business requirements for 3 major product features with 100% stakeholder approval',
        'Conducted user acceptance testing that identified and resolved 50+ critical issues',
        'Created process documentation that reduced new employee training time by 40%',
        'Supported data migration project affecting 10,000+ customer records with zero data loss',
        'Developed standard operating procedures adopted across 4 business units'
      ],
      technologies: ['Excel', 'Google Analytics', 'JIRA', 'Confluence', 'Lucidchart', 'SQL'],
      location: 'Chicago, IL',
      employmentType: 'Full-time',
      industryContext: 'Technology Startup',
      roleLevel: 'entry'
    }
  ],
  education: [
    {
      id: '1',
      institution: 'Northwestern University',
      degree: 'Master of Business Administration',
      field: 'Business Analytics',
      startDate: '2016-09',
      endDate: '2018-06',
      location: 'Evanston, IL',
      gpa: '3.7',
      honors: ['Dean\'s List', 'Analytics Excellence Award'],
      relevantCoursework: ['Business Process Analysis', 'Data Mining', 'Operations Research', 'Strategic Management']
    },
    {
      id: '2',
      institution: 'University of Illinois at Chicago',
      degree: 'Bachelor of Science',
      field: 'Information Systems',
      startDate: '2012-09',
      endDate: '2016-05',
      location: 'Chicago, IL',
      gpa: '3.5',
      relevantCoursework: ['Database Systems', 'Systems Analysis', 'Business Statistics', 'Project Management']
    }
  ],
  projects: [
    {
      id: '1',
      title: 'Enterprise Resource Planning (ERP) Implementation',
      description: 'Led comprehensive business analysis for enterprise-wide ERP system implementation. Conducted stakeholder interviews, documented current state processes, designed future state workflows, and managed requirements throughout the project lifecycle. Coordinated with technical teams to ensure business requirements were properly translated into system configurations.',
      technologies: ['Requirements Analysis', 'Process Mapping', 'SAP', 'SQL', 'Visio', 'JIRA'],
      startDate: '2022-03-01',
      endDate: '2023-08-01',
      url: 'https://enterprisesolutions.com/erp-case-study',
      images: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: 'Reduced operational costs by $1.2M annually and improved process efficiency by 45%',
      roleSpecific: true,
      metrics: {
        revenue: '$1.2M annual cost savings',
        users: '500+ system users across 5 departments',
        performance: '45% improvement in process efficiency',
        adoption: '99% user adoption rate within 3 months'
      }
    },
    {
      id: '2',
      title: 'Customer Onboarding Process Optimization',
      description: 'Analyzed and redesigned customer onboarding process for financial services company. Conducted process mapping, identified pain points, and designed streamlined workflow. Implemented automated data validation and approval workflows that significantly reduced processing time and improved customer satisfaction.',
      technologies: ['Process Mapping', 'Tableau', 'SQL', 'Excel', 'Visio', 'Power BI'],
      startDate: '2020-01-01',
      endDate: '2020-09-01',
      images: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: 'Reduced customer onboarding time by 50% and improved satisfaction scores by 25%',
      roleSpecific: true,
      metrics: {
        efficiency: '50% reduction in onboarding time',
        performance: '25% improvement in customer satisfaction',
        adoption: '100% process compliance across all teams'
      }
    },
    {
      id: '3',
      title: 'Business Intelligence Dashboard Development',
      description: 'Designed and implemented comprehensive business intelligence dashboard for executive reporting. Gathered requirements from C-level stakeholders, analyzed data sources, and created automated reporting solution. Dashboard provides real-time insights into key business metrics and performance indicators.',
      technologies: ['Tableau', 'SQL', 'Power BI', 'Excel', 'Data Analysis'],
      startDate: '2021-06-01',
      endDate: '2022-01-01',
      github: 'github.com/michaelchen/bi-dashboard',
      images: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: 'Saved 20 hours/week of manual reporting and improved decision-making speed by 40%',
      roleSpecific: true,
      metrics: {
        efficiency: '20 hours/week time savings',
        performance: '40% faster executive decision-making',
        adoption: '100% executive team usage within 2 weeks'
      }
    }
  ],
  achievements: [
    'Certified Business Analysis Professional (CBAP) - IIBA',
    'Tableau Desktop Specialist Certification',
    'Led business analysis projects resulting in $3M+ cumulative cost savings',
    'Managed requirements for systems serving 1,000+ users across multiple organizations',
    'Speaker at Business Analysis Conference 2023: "Process Optimization in Digital Transformation"',
    'Mentor for 8+ junior business analysts and career changers',
    'Winner of "Process Excellence Award" at Enterprise Solutions Corp 2022'
  ],
  certifications: [
    {
      id: '1',
      name: 'Certified Business Analysis Professional (CBAP)',
      issuer: 'International Institute of Business Analysis (IIBA)',
      issueDate: '2020-11-15',
      expiryDate: '2023-11-15',
      credentialId: 'CBAP-2020-001',
      url: 'https://www.iiba.org/business-analysis-certifications/cbap/'
    },
    {
      id: '2',
      name: 'Tableau Desktop Specialist',
      issuer: 'Tableau',
      issueDate: '2021-05-20',
      expiryDate: '2024-05-20',
      credentialId: 'TDS-2021-001'
    },
    {
      id: '3',
      name: 'Certified Scrum Product Owner (CSPO)',
      issuer: 'Scrum Alliance',
      issueDate: '2019-09-10',
      expiryDate: '2025-09-10',
      credentialId: 'CSPO-2019-001'
    },
    {
      id: '4',
      name: 'Microsoft Power BI Data Analyst Associate',
      issuer: 'Microsoft',
      issueDate: '2022-02-14',
      expiryDate: '2025-02-14',
      credentialId: 'PBI-DA-2022-001'
    }
  ],
  metadata: {
    targetRole: 'business-analyst',
    industry: 'business',
    experienceLevel: 'senior',
    lastUpdated: new Date(),
    contentVersion: '1.0.0',
    tags: ['business-analysis', 'requirements-analysis', 'process-improvement', 'data-analysis', 'stakeholder-management', 'senior']
  }
};