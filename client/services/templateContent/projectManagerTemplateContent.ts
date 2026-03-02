import { TemplateSpecificContent, TEMPLATE_IDS } from '../templateSpecificContentService';

// Project Manager Template Content
export const projectManagerContent: TemplateSpecificContent = {
  templateId: TEMPLATE_IDS.PROJECT_MANAGER,
  personalInfo: {
    name: 'Michael Chen',
    title: 'Senior Project Manager',
    email: 'michael.chen@projectpro.com',
    phone: '+1 (555) 234-5678',
    location: 'Austin, TX',
    website: 'michaelchen.pm',
    linkedin: 'linkedin.com/in/michaelchen',
    github: '',
    avatar: '',
  },
  professionalSummary: 'Experienced Senior Project Manager with 8+ years of expertise in leading complex, cross-functional projects from initiation to delivery. Proven track record of managing $10M+ project portfolios, coordinating teams of 20+ members, and delivering projects on time and under budget. Expert in Agile/Scrum methodologies, risk management, and stakeholder communication. Successfully delivered 50+ projects with 95% on-time completion rate and average 15% cost savings.',
  objective: 'Seeking a Program Manager role where I can leverage my expertise in project delivery, team leadership, and process optimization to drive organizational success through strategic project management and cross-functional collaboration.',
  skills: [
    {
      id: '1',
      name: 'Agile',
      proficiency: 95,
      category: 'Methodology',
      level: 95,
      yearsOfExperience: 8,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '2',
      name: 'Scrum',
      proficiency: 92,
      category: 'Methodology',
      level: 92,
      yearsOfExperience: 7,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '3',
      name: 'Risk Management',
      proficiency: 90,
      category: 'Project Management',
      level: 90,
      yearsOfExperience: 8,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '4',
      name: 'Budget Planning',
      proficiency: 88,
      category: 'Financial Management',
      level: 88,
      yearsOfExperience: 6,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '5',
      name: 'Team Leadership',
      proficiency: 93,
      category: 'Leadership',
      level: 93,
      yearsOfExperience: 8,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '6',
      name: 'Stakeholder Management',
      proficiency: 91,
      category: 'Communication',
      level: 91,
      yearsOfExperience: 7,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '7',
      name: 'Project Planning',
      proficiency: 94,
      category: 'Project Management',
      level: 94,
      yearsOfExperience: 8,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '8',
      name: 'Resource Management',
      proficiency: 87,
      category: 'Project Management',
      level: 87,
      yearsOfExperience: 6,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '9',
      name: 'Microsoft Project',
      proficiency: 85,
      category: 'Tools',
      level: 85,
      yearsOfExperience: 5,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '10',
      name: 'Jira',
      proficiency: 90,
      category: 'Tools',
      level: 90,
      yearsOfExperience: 6,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '11',
      name: 'Confluence',
      proficiency: 82,
      category: 'Documentation',
      level: 82,
      yearsOfExperience: 5,
      isCore: false,
      relevanceScore: 7
    },
    {
      id: '12',
      name: 'Change Management',
      proficiency: 86,
      category: 'Process Management',
      level: 86,
      yearsOfExperience: 6,
      isCore: true,
      relevanceScore: 8
    }
  ],
  experiences: [
    {
      id: '1',
      company: 'TechCorp Solutions',
      position: 'Senior Project Manager',
      startDate: '2020-09',
      endDate: null,
      description: 'Leading enterprise software implementation projects for Fortune 500 clients. Managing cross-functional teams of 15-25 members including developers, QA engineers, business analysts, and UX designers. Responsible for project planning, risk management, budget oversight, and stakeholder communication across multiple concurrent projects.',
      achievements: [
        'Successfully delivered 12 major projects worth $8M total value with 100% on-time completion',
        'Reduced project delivery time by 25% through process optimization and Agile implementation',
        'Managed project budgets totaling $3M annually with average 12% cost savings',
        'Led digital transformation initiative that improved client operational efficiency by 40%',
        'Implemented risk management framework that reduced project risks by 60%'
      ],
      technologies: ['Jira', 'Confluence', 'Microsoft Project', 'Slack', 'Tableau', 'Azure DevOps'],
      location: 'Austin, TX',
      employmentType: 'Full-time',
      industryContext: 'Enterprise Software',
      roleLevel: 'senior'
    },
    {
      id: '2',
      company: 'InnovateNow Inc.',
      position: 'Project Manager',
      startDate: '2018-01',
      endDate: '2020-08',
      description: 'Managed product development projects for B2B SaaS platform. Coordinated between engineering, product, marketing, and sales teams to deliver new features and product enhancements. Implemented Agile/Scrum methodologies and established project governance frameworks.',
      achievements: [
        'Delivered 8 major product releases on schedule, increasing customer satisfaction by 35%',
        'Implemented Scrum framework that improved team velocity by 45%',
        'Managed cross-functional team of 12 members across 3 time zones',
        'Reduced project scope creep by 50% through improved requirements management',
        'Led migration project that upgraded 200+ client instances with zero downtime'
      ],
      technologies: ['Scrum', 'Jira', 'Trello', 'Google Workspace', 'Zoom', 'Miro'],
      location: 'Austin, TX',
      employmentType: 'Full-time',
      industryContext: 'SaaS',
      roleLevel: 'mid'
    },
    {
      id: '3',
      company: 'BuildRight Construction',
      position: 'Assistant Project Manager',
      startDate: '2016-06',
      endDate: '2017-12',
      description: 'Supported project management activities for commercial construction projects. Assisted with project planning, resource coordination, vendor management, and progress tracking. Gained experience in traditional project management methodologies and construction industry practices.',
      achievements: [
        'Supported delivery of 6 construction projects valued at $15M total',
        'Coordinated with 20+ subcontractors and vendors for timely project completion',
        'Implemented project tracking system that improved reporting accuracy by 30%',
        'Assisted in budget management for projects ranging from $1M to $5M',
        'Contributed to safety program that achieved zero workplace incidents'
      ],
      technologies: ['Microsoft Project', 'Excel', 'AutoCAD', 'Procore', 'SharePoint'],
      location: 'Dallas, TX',
      employmentType: 'Full-time',
      industryContext: 'Construction',
      roleLevel: 'entry'
    }
  ],
  education: [
    {
      id: '1',
      institution: 'University of Texas at Austin',
      degree: 'Master of Business Administration',
      field: 'Operations Management',
      startDate: '2014-08',
      endDate: '2016-05',
      location: 'Austin, TX',
      gpa: '3.7',
      honors: ['Beta Gamma Sigma Honor Society', 'Operations Excellence Award'],
      relevantCoursework: ['Project Management', 'Operations Strategy', 'Supply Chain Management', 'Leadership Development']
    },
    {
      id: '2',
      institution: 'Texas A&M University',
      degree: 'Bachelor of Science',
      field: 'Industrial Engineering',
      startDate: '2010-08',
      endDate: '2014-05',
      location: 'College Station, TX',
      gpa: '3.5',
      relevantCoursework: ['Systems Engineering', 'Quality Control', 'Process Optimization', 'Statistics']
    }
  ],
  projects: [
    {
      id: '1',
      title: 'Enterprise ERP Implementation',
      description: 'Led comprehensive ERP system implementation for Fortune 500 manufacturing client. Managed 18-month project involving system integration, data migration, user training, and change management. Coordinated with multiple vendors and internal teams to ensure seamless transition.',
      technologies: ['SAP', 'Microsoft Project', 'Change Management', 'Data Migration', 'Training Development'],
      startDate: '2021-03-01',
      endDate: '2022-09-01',
      images: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: 'Delivered $2.5M project on time and 8% under budget, improving client operational efficiency by 35%',
      roleSpecific: true,
      metrics: {
        revenue: '$2.5M project value',
        performance: '35% improvement in operational efficiency',
        efficiency: '8% under budget delivery',
        adoption: '500+ users successfully trained and onboarded'
      }
    },
    {
      id: '2',
      title: 'Digital Transformation Initiative',
      description: 'Managed organization-wide digital transformation project involving cloud migration, process automation, and team restructuring. Led change management efforts and coordinated with IT, HR, and business units to ensure successful adoption.',
      technologies: ['Cloud Migration', 'Process Automation', 'Change Management', 'Stakeholder Management'],
      startDate: '2019-06-01',
      endDate: '2020-12-01',
      images: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: 'Reduced operational costs by 30% and improved process efficiency by 50%',
      roleSpecific: true,
      metrics: {
        efficiency: '30% reduction in operational costs',
        performance: '50% improvement in process efficiency',
        adoption: '200+ employees successfully transitioned'
      }
    },
    {
      id: '3',
      title: 'Multi-Site Software Rollout',
      description: 'Coordinated simultaneous software deployment across 15 client locations. Managed timeline coordination, resource allocation, training delivery, and risk mitigation. Established communication protocols and escalation procedures for smooth execution.',
      technologies: ['Project Coordination', 'Risk Management', 'Training Delivery', 'Communication Planning'],
      startDate: '2020-01-01',
      endDate: '2020-08-01',
      images: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: 'Achieved 100% on-time deployment with 95% user adoption rate within first month',
      roleSpecific: true,
      metrics: {
        performance: '100% on-time deployment',
        adoption: '95% user adoption rate',
        efficiency: '15 locations coordinated simultaneously'
      }
    }
  ],
  achievements: [
    'Project Management Professional (PMP) Certification - Project Management Institute',
    'Certified ScrumMaster (CSM) - Scrum Alliance',
    'Successfully delivered 50+ projects with 95% on-time completion rate',
    'Managed project portfolios worth $10M+ with average 15% cost savings',
    'Led teams of up to 25 cross-functional members across multiple time zones',
    'Speaker at PMI Austin Chapter: "Agile Project Management in Enterprise Environments"',
    'Mentor for 8+ junior project managers and career transition professionals',
    'Winner of "Project Excellence Award" at TechCorp Solutions 2022'
  ],
  certifications: [
    {
      id: '1',
      name: 'Project Management Professional (PMP)',
      issuer: 'Project Management Institute',
      issueDate: '2018-09-15',
      expiryDate: '2024-09-15',
      credentialId: 'PMP-2018-001',
      url: 'https://www.pmi.org/certifications/project-management-pmp'
    },
    {
      id: '2',
      name: 'Certified ScrumMaster (CSM)',
      issuer: 'Scrum Alliance',
      issueDate: '2019-03-20',
      expiryDate: '2025-03-20',
      credentialId: 'CSM-2019-001'
    },
    {
      id: '3',
      name: 'Agile Certified Practitioner (PMI-ACP)',
      issuer: 'Project Management Institute',
      issueDate: '2020-11-10',
      expiryDate: '2026-11-10',
      credentialId: 'ACP-2020-001'
    },
    {
      id: '4',
      name: 'PRINCE2 Foundation',
      issuer: 'AXELOS',
      issueDate: '2017-05-15',
      expiryDate: null,
      credentialId: 'PRINCE2-2017-001'
    }
  ],
  metadata: {
    targetRole: 'project-manager',
    industry: 'business',
    experienceLevel: 'senior',
    lastUpdated: new Date(),
    contentVersion: '1.0.0',
    tags: ['project-management', 'agile', 'scrum', 'risk-management', 'team-leadership', 'senior']
  }
};