import { TemplateSpecificContent, TEMPLATE_IDS } from '../templateSpecificContentService';

// Risk Manager Template Content
export const riskManagerContent: TemplateSpecificContent = {
  templateId: TEMPLATE_IDS.RISK_MANAGER,
  personalInfo: {
    name: 'Michael Thompson',
    title: 'Senior Risk Manager',
    email: 'michael.thompson@riskmanagement.com',
    phone: '+1 (555) 234-5678',
    location: 'Chicago, IL',
    website: 'michaelthompson.risk',
    linkedin: 'linkedin.com/in/michaelthompson-frm',
    github: '',
    avatar: '',
  },
  professionalSummary: 'Experienced Senior Risk Manager with 9+ years of expertise in enterprise risk assessment, regulatory compliance, and risk mitigation strategies. Proven track record in developing comprehensive risk frameworks that reduced operational losses by 35% and ensured 100% regulatory compliance across multiple jurisdictions. Expert in quantitative risk modeling, stress testing, and crisis management with deep knowledge of Basel III, Dodd-Frank, and COSO frameworks.',
  objective: 'Seeking a Chief Risk Officer or Director of Risk Management position where I can leverage my extensive experience in enterprise risk management and regulatory compliance to protect organizational assets and drive strategic risk-informed decision making.',
  skills: [
    {
      id: '1',
      name: 'Risk Assessment',
      proficiency: 95,
      category: 'Risk Management',
      level: 95,
      yearsOfExperience: 9,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '2',
      name: 'Regulatory Compliance',
      proficiency: 93,
      category: 'Compliance',
      level: 93,
      yearsOfExperience: 9,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '3',
      name: 'Basel III/IV',
      proficiency: 90,
      category: 'Regulatory Knowledge',
      level: 90,
      yearsOfExperience: 7,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '4',
      name: 'Quantitative Risk Modeling',
      proficiency: 88,
      category: 'Risk Analytics',
      level: 88,
      yearsOfExperience: 8,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '5',
      name: 'Operational Risk Management',
      proficiency: 92,
      category: 'Risk Management',
      level: 92,
      yearsOfExperience: 8,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '6',
      name: 'Credit Risk Analysis',
      proficiency: 87,
      category: 'Risk Assessment',
      level: 87,
      yearsOfExperience: 7,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '7',
      name: 'Market Risk Management',
      proficiency: 85,
      category: 'Risk Management',
      level: 85,
      yearsOfExperience: 6,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '8',
      name: 'COSO Framework',
      proficiency: 90,
      category: 'Risk Framework',
      level: 90,
      yearsOfExperience: 7,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '9',
      name: 'Data Analysis',
      proficiency: 86,
      category: 'Analytics',
      level: 86,
      yearsOfExperience: 8,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '10',
      name: 'Stress Testing',
      proficiency: 89,
      category: 'Risk Testing',
      level: 89,
      yearsOfExperience: 6,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '11',
      name: 'GRC (Governance, Risk & Compliance)',
      proficiency: 91,
      category: 'Risk Governance',
      level: 91,
      yearsOfExperience: 8,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '12',
      name: 'SQL',
      proficiency: 82,
      category: 'Data Analysis',
      level: 82,
      yearsOfExperience: 6,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '13',
      name: 'Python',
      proficiency: 78,
      category: 'Programming',
      level: 78,
      yearsOfExperience: 4,
      isCore: true,
      relevanceScore: 7
    },
    {
      id: '14',
      name: 'Monte Carlo Simulation',
      proficiency: 84,
      category: 'Risk Modeling',
      level: 84,
      yearsOfExperience: 5,
      isCore: true,
      relevanceScore: 7
    },
    {
      id: '15',
      name: 'Audit Support',
      proficiency: 88,
      category: 'Compliance',
      level: 88,
      yearsOfExperience: 7,
      isCore: true,
      relevanceScore: 7
    }
  ],
  experiences: [
    {
      id: '1',
      company: 'Global Financial Services Inc.',
      position: 'Senior Risk Manager',
      startDate: '2020-09',
      endDate: null,
      description: 'Leading enterprise risk management for a $50B+ financial services organization. Responsible for developing and implementing comprehensive risk frameworks, conducting risk assessments across all business units, and ensuring regulatory compliance with Basel III, Dodd-Frank, and local regulations. Managing a team of 8 risk analysts and coordinating with senior leadership on strategic risk decisions.',
      achievements: [
        'Developed enterprise risk framework that reduced operational losses by 35% over 3 years',
        'Led successful regulatory examination with zero findings across 4 jurisdictions',
        'Implemented automated risk monitoring system reducing manual effort by 60%',
        'Managed $2B+ credit portfolio risk assessment with 99.2% accuracy in loss predictions',
        'Established crisis management protocols that minimized COVID-19 operational impact by 40%'
      ],
      technologies: ['SAS', 'SQL', 'Python', 'R', 'GRC Platform', 'Monte Carlo', 'VaR Models', 'Tableau'],
      location: 'Chicago, IL',
      employmentType: 'Full-time',
      industryContext: 'Financial Services',
      roleLevel: 'senior'
    },
    {
      id: '2',
      company: 'Metropolitan Trust Bank',
      position: 'Risk Analyst Manager',
      startDate: '2018-01',
      endDate: '2020-08',
      description: 'Managed operational and credit risk analysis for commercial banking division. Led team of 5 risk analysts in conducting comprehensive risk assessments, developing risk mitigation strategies, and supporting regulatory reporting. Collaborated with business units to implement risk controls and monitoring procedures.',
      achievements: [
        'Built credit risk models that improved default prediction accuracy by 28%',
        'Led implementation of Basel III capital adequacy framework ahead of regulatory deadline',
        'Reduced operational risk incidents by 45% through enhanced control procedures',
        'Managed stress testing program covering $15B in assets with regulatory approval',
        'Developed risk appetite framework adopted across entire organization'
      ],
      technologies: ['SAS', 'SQL', 'Excel', 'MATLAB', 'Risk Management Systems', 'Moody\'s Analytics'],
      location: 'Chicago, IL',
      employmentType: 'Full-time',
      industryContext: 'Commercial Banking',
      roleLevel: 'senior'
    },
    {
      id: '3',
      company: 'Regional Insurance Group',
      position: 'Senior Risk Analyst',
      startDate: '2015-06',
      endDate: '2017-12',
      description: 'Conducted comprehensive risk assessments for insurance underwriting and investment portfolios. Developed quantitative risk models, performed regulatory compliance monitoring, and supported senior management with risk reporting and strategic planning. Specialized in catastrophic risk modeling and reinsurance optimization.',
      achievements: [
        'Developed catastrophic risk model that improved pricing accuracy by 22%',
        'Led Solvency II compliance project with successful regulatory approval',
        'Reduced reinsurance costs by $5M annually through optimized risk transfer strategies',
        'Implemented early warning system that prevented 3 major operational risk events',
        'Created risk dashboard providing real-time visibility to C-suite executives'
      ],
      technologies: ['R', 'SQL', 'Excel', 'Catastrophe Modeling Software', 'SAS', 'Crystal Ball'],
      location: 'Milwaukee, WI',
      employmentType: 'Full-time',
      industryContext: 'Insurance',
      roleLevel: 'mid'
    },
    {
      id: '4',
      company: 'Financial Risk Consulting LLC',
      position: 'Risk Analyst',
      startDate: '2013-08',
      endDate: '2015-05',
      description: 'Provided risk management consulting services to mid-market financial institutions. Conducted risk assessments, developed compliance programs, and supported regulatory examination preparation. Gained experience across multiple financial sectors including banking, insurance, and investment management.',
      achievements: [
        'Supported 15+ clients in achieving regulatory compliance with zero violations',
        'Developed risk assessment methodology adopted by 8 client organizations',
        'Led operational risk assessment that identified $2M in potential cost savings',
        'Created compliance training program delivered to 200+ financial professionals',
        'Assisted in successful merger integration with comprehensive risk due diligence'
      ],
      technologies: ['Excel', 'SQL', 'SAS', 'Risk Assessment Tools', 'Regulatory Databases'],
      location: 'Chicago, IL',
      employmentType: 'Full-time',
      industryContext: 'Financial Consulting',
      roleLevel: 'entry'
    }
  ],
  education: [
    {
      id: '1',
      institution: 'Northwestern University Kellogg School of Management',
      degree: 'Master of Business Administration',
      field: 'Finance and Risk Management',
      startDate: '2011-09',
      endDate: '2013-06',
      location: 'Evanston, IL',
      gpa: '3.7',
      honors: ['Dean\'s List', 'Risk Management Excellence Award', 'Finance Club President'],
      relevantCoursework: ['Enterprise Risk Management', 'Derivatives and Risk Management', 'Financial Modeling', 'Regulatory Finance', 'Quantitative Methods', 'Corporate Governance']
    },
    {
      id: '2',
      institution: 'University of Illinois at Urbana-Champaign',
      degree: 'Bachelor of Science',
      field: 'Mathematics with Statistics Concentration',
      startDate: '2007-09',
      endDate: '2011-05',
      location: 'Urbana, IL',
      gpa: '3.5',
      honors: ['Magna Cum Laude', 'Mathematics Department Award', 'Phi Beta Kappa'],
      relevantCoursework: ['Probability Theory', 'Statistical Analysis', 'Mathematical Finance', 'Econometrics', 'Operations Research']
    }
  ],
  projects: [
    {
      id: '1',
      title: 'Enterprise Risk Management Platform',
      description: 'Led development of comprehensive enterprise risk management platform integrating operational, credit, and market risk monitoring. Platform provides real-time risk dashboards, automated reporting, and predictive analytics for risk forecasting. Implemented machine learning algorithms for early risk detection and automated alert systems.',
      technologies: ['Python', 'SQL', 'Tableau', 'Machine Learning', 'REST APIs', 'Docker', 'AWS'],
      startDate: '2021-03-01',
      endDate: '2022-01-01',
      url: 'https://globalfinancial.com/risk-platform-case-study',
      images: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: 'Reduced risk monitoring time by 70% and improved risk prediction accuracy by 40%',
      roleSpecific: true,
      metrics: {
        performance: '40% improvement in risk prediction accuracy',
        efficiency: '70% reduction in risk monitoring time',
        adoption: '100% adoption across all business units',
        revenue: '$3.2M annual cost savings through automated processes'
      }
    },
    {
      id: '2',
      title: 'Regulatory Compliance Automation System',
      description: 'Designed and implemented automated regulatory reporting system for Basel III, CCAR, and local regulatory requirements. System automatically collects data from multiple sources, performs validation checks, and generates regulatory reports. Includes audit trail functionality and exception management workflows.',
      technologies: ['SQL', 'Python', 'SAS', 'Regulatory APIs', 'ETL Tools', 'Power BI'],
      startDate: '2019-09-01',
      endDate: '2020-06-01',
      images: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: 'Achieved 100% regulatory compliance with 80% reduction in manual effort',
      roleSpecific: true,
      metrics: {
        efficiency: '80% reduction in regulatory reporting effort',
        performance: '100% regulatory compliance rate',
        adoption: '100% regulatory team usage',
        revenue: '$1.8M annual cost savings in compliance operations'
      }
    },
    {
      id: '3',
      title: 'Credit Risk Stress Testing Framework',
      description: 'Developed comprehensive stress testing framework for $15B credit portfolio covering multiple economic scenarios. Framework includes Monte Carlo simulations, scenario analysis, and sensitivity testing. Provides detailed loss projections and capital adequacy assessments under stressed conditions.',
      technologies: ['R', 'Python', 'Monte Carlo Simulation', 'SQL', 'MATLAB', 'SAS'],
      startDate: '2018-06-01',
      endDate: '2019-03-01',
      github: 'github.com/mthompson/stress-testing-framework',
      images: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: 'Enhanced capital planning accuracy by 35% and received regulatory approval',
      roleSpecific: true,
      metrics: {
        performance: '35% improvement in capital planning accuracy',
        adoption: '100% regulatory approval and adoption',
        efficiency: '50% faster stress testing execution'
      }
    }
  ],
  achievements: [
    'Financial Risk Manager (FRM) Certification - Global Association of Risk Professionals',
    'Professional Risk Manager (PRM) Certification - Professional Risk Managers\' International Association',
    'Led enterprise risk initiatives resulting in $8M+ in operational loss prevention',
    'Managed regulatory compliance programs with 100% success rate across 12 examinations',
    'Speaker at Risk Management Association Annual Conference 2023: "AI in Enterprise Risk Management"',
    'Mentor for 10+ junior risk professionals and analysts',
    'Winner of "Risk Manager of the Year" award at Global Financial Services 2022',
    'Published research on "Machine Learning Applications in Operational Risk" in Risk Management Journal',
    'Led crisis management response during COVID-19 with minimal operational disruption',
    'Established industry best practices for climate risk assessment adopted by 5+ organizations'
  ],
  certifications: [
    {
      id: '1',
      name: 'Financial Risk Manager (FRM)',
      issuer: 'Global Association of Risk Professionals (GARP)',
      issueDate: '2016-11-15',
      expiryDate: '2026-11-15',
      credentialId: 'FRM-2016-002',
      url: 'https://www.garp.org/frm'
    },
    {
      id: '2',
      name: 'Professional Risk Manager (PRM)',
      issuer: 'Professional Risk Managers\' International Association (PRMIA)',
      issueDate: '2017-08-20',
      credentialId: 'PRM-2017-002',
      url: 'https://www.prmia.org/prm-certification'
    },
    {
      id: '3',
      name: 'Certified Risk Management Professional (CRMP)',
      issuer: 'Risk Management Society (RIMS)',
      issueDate: '2019-05-10',
      expiryDate: '2024-05-10',
      credentialId: 'CRMP-2019-002'
    },
    {
      id: '4',
      name: 'Basel III Implementation Specialist',
      issuer: 'Institute of International Finance (IIF)',
      issueDate: '2020-02-14',
      credentialId: 'BASEL-2020-002'
    },
    {
      id: '5',
      name: 'Certified Information Systems Auditor (CISA)',
      issuer: 'Information Systems Audit and Control Association (ISACA)',
      issueDate: '2021-06-18',
      expiryDate: '2024-06-18',
      credentialId: 'CISA-2021-002'
    }
  ],
  metadata: {
    targetRole: 'risk-manager',
    industry: 'finance',
    experienceLevel: 'senior',
    lastUpdated: new Date(),
    contentVersion: '1.0.0',
    tags: ['risk-assessment', 'compliance', 'regulatory-knowledge', 'data-analysis', 'risk-mitigation', 'senior']
  }
};