import { TemplateSpecificContent, TEMPLATE_IDS } from '../templateSpecificContentService';

// Financial Analyst Template Content
export const financialAnalystContent: TemplateSpecificContent = {
  templateId: TEMPLATE_IDS.FINANCIAL_ANALYST,
  personalInfo: {
    name: 'Sarah Martinez',
    title: 'Senior Financial Analyst',
    email: 'sarah.martinez@financecorp.com',
    phone: '+1 (555) 789-0123',
    location: 'New York, NY',
    website: 'sarahmartinez.finance',
    linkedin: 'linkedin.com/in/sarahmartinez-cfa',
    github: '',
    avatar: '',
  },
  professionalSummary: 'Results-driven Senior Financial Analyst with 7+ years of experience in financial modeling, budgeting, and risk analysis. Expert in developing comprehensive financial models that drive strategic decision-making and optimize business performance. Successfully managed financial analysis for $500M+ in assets and led forecasting initiatives that improved accuracy by 25%. Proven track record in variance analysis, investment evaluation, and cross-functional collaboration with executive leadership.',
  objective: 'Seeking a Principal Financial Analyst or Finance Manager role where I can leverage my expertise in advanced financial modeling and strategic analysis to drive data-driven decision making and contribute to organizational growth and profitability.',
  skills: [
    {
      id: '1',
      name: 'Financial Modeling',
      proficiency: 95,
      category: 'Financial Analysis',
      level: 95,
      yearsOfExperience: 7,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '2',
      name: 'Microsoft Excel',
      proficiency: 98,
      category: 'Data Tools',
      level: 98,
      yearsOfExperience: 7,
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
      name: 'Risk Analysis',
      proficiency: 90,
      category: 'Risk Management',
      level: 90,
      yearsOfExperience: 6,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '6',
      name: 'Budgeting & Forecasting',
      proficiency: 92,
      category: 'Financial Planning',
      level: 92,
      yearsOfExperience: 7,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '7',
      name: 'Variance Analysis',
      proficiency: 90,
      category: 'Financial Analysis',
      level: 90,
      yearsOfExperience: 6,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '8',
      name: 'Power BI',
      proficiency: 82,
      category: 'Business Intelligence',
      level: 82,
      yearsOfExperience: 3,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '9',
      name: 'VBA Programming',
      proficiency: 85,
      category: 'Automation',
      level: 85,
      yearsOfExperience: 5,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '10',
      name: 'Financial Reporting',
      proficiency: 93,
      category: 'Reporting',
      level: 93,
      yearsOfExperience: 7,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '11',
      name: 'Investment Analysis',
      proficiency: 87,
      category: 'Investment',
      level: 87,
      yearsOfExperience: 5,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '12',
      name: 'Bloomberg Terminal',
      proficiency: 80,
      category: 'Financial Data',
      level: 80,
      yearsOfExperience: 4,
      isCore: true,
      relevanceScore: 7
    }
  ],
  experiences: [
    {
      id: '1',
      company: 'Global Investment Partners',
      position: 'Senior Financial Analyst',
      startDate: '2021-08',
      endDate: null,
      description: 'Leading financial analysis and modeling for investment portfolio worth $500M+. Responsible for comprehensive financial modeling, risk assessment, and investment recommendations for institutional clients. Collaborating with portfolio managers, research teams, and client relationship managers to deliver data-driven insights.',
      achievements: [
        'Developed advanced DCF models that improved investment decision accuracy by 25%',
        'Led quarterly forecasting process resulting in 15% improvement in budget variance',
        'Created automated risk analysis dashboard reducing reporting time by 40%',
        'Managed financial analysis for 12 major investment opportunities totaling $150M',
        'Implemented new variance analysis framework adopted across entire finance team'
      ],
      technologies: ['Excel', 'VBA', 'SQL', 'Tableau', 'Bloomberg Terminal', 'Power BI', 'Python'],
      location: 'New York, NY',
      employmentType: 'Full-time',
      industryContext: 'Investment Management',
      roleLevel: 'senior'
    },
    {
      id: '2',
      company: 'Metropolitan Bank Corp',
      position: 'Financial Analyst',
      startDate: '2019-03',
      endDate: '2021-07',
      description: 'Conducted comprehensive financial analysis for commercial lending division. Performed credit risk analysis, financial modeling for loan approvals, and portfolio performance monitoring. Supported senior management with budgeting, forecasting, and strategic planning initiatives.',
      achievements: [
        'Built credit risk models that reduced loan default rates by 18%',
        'Streamlined monthly financial reporting process, saving 25 hours per month',
        'Analyzed $200M+ in commercial loan applications with 95% accuracy rate',
        'Developed KPI dashboard that improved portfolio monitoring efficiency by 35%',
        'Led implementation of new budgeting software across 3 business units'
      ],
      technologies: ['Excel', 'SQL', 'SAS', 'Tableau', 'SAP', 'VBA'],
      location: 'New York, NY',
      employmentType: 'Full-time',
      industryContext: 'Commercial Banking',
      roleLevel: 'mid'
    },
    {
      id: '3',
      company: 'Financial Advisory Group',
      position: 'Junior Financial Analyst',
      startDate: '2017-06',
      endDate: '2019-02',
      description: 'Supported senior analysts with financial modeling, data analysis, and client reporting. Assisted with investment research, market analysis, and preparation of client presentations. Gained experience in various financial analysis tools and methodologies.',
      achievements: [
        'Created financial models for 50+ client investment scenarios with 98% accuracy',
        'Automated monthly client reporting process reducing preparation time by 50%',
        'Conducted market research that identified 3 high-potential investment opportunities',
        'Supported due diligence for $75M in client investments with zero compliance issues',
        'Developed Excel templates adopted by entire analyst team for standardized reporting'
      ],
      technologies: ['Excel', 'Bloomberg Terminal', 'FactSet', 'PowerPoint', 'VBA'],
      location: 'New York, NY',
      employmentType: 'Full-time',
      industryContext: 'Financial Advisory',
      roleLevel: 'entry'
    }
  ],
  education: [
    {
      id: '1',
      institution: 'Columbia Business School',
      degree: 'Master of Business Administration',
      field: 'Finance',
      startDate: '2015-09',
      endDate: '2017-05',
      location: 'New York, NY',
      gpa: '3.8',
      honors: ['Dean\'s List', 'Finance Excellence Award', 'Beta Gamma Sigma Honor Society'],
      relevantCoursework: ['Corporate Finance', 'Investment Analysis', 'Financial Modeling', 'Risk Management', 'Derivatives', 'Portfolio Management']
    },
    {
      id: '2',
      institution: 'New York University',
      degree: 'Bachelor of Science',
      field: 'Economics',
      startDate: '2011-09',
      endDate: '2015-05',
      location: 'New York, NY',
      gpa: '3.6',
      honors: ['Magna Cum Laude', 'Economics Department Award'],
      relevantCoursework: ['Econometrics', 'Financial Economics', 'Statistics', 'Macroeconomics', 'International Finance']
    }
  ],
  projects: [
    {
      id: '1',
      title: 'Portfolio Risk Assessment Model',
      description: 'Developed comprehensive risk assessment model for $500M investment portfolio using advanced statistical methods and Monte Carlo simulations. Model incorporates multiple risk factors including market risk, credit risk, and liquidity risk. Implemented automated reporting system that provides daily risk metrics and alerts.',
      technologies: ['Excel', 'VBA', 'Python', 'SQL', 'Monte Carlo Simulation', 'Tableau'],
      startDate: '2022-01-01',
      endDate: '2022-08-01',
      url: 'https://globalinvestment.com/risk-model-case-study',
      images: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: 'Improved risk prediction accuracy by 30% and reduced portfolio volatility by 15%',
      roleSpecific: true,
      metrics: {
        performance: '30% improvement in risk prediction accuracy',
        efficiency: '15% reduction in portfolio volatility',
        adoption: '100% adoption across all portfolio managers',
        revenue: '$2.5M in prevented losses through early risk detection'
      }
    },
    {
      id: '2',
      title: 'Automated Financial Reporting System',
      description: 'Designed and implemented automated financial reporting system that generates monthly, quarterly, and annual reports for executive leadership. System integrates data from multiple sources, performs complex calculations, and produces standardized reports with interactive dashboards.',
      technologies: ['Excel', 'VBA', 'SQL', 'Power BI', 'Python', 'SAP'],
      startDate: '2020-09-01',
      endDate: '2021-03-01',
      images: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: 'Reduced reporting time by 60% and improved data accuracy by 25%',
      roleSpecific: true,
      metrics: {
        efficiency: '60% reduction in reporting preparation time',
        performance: '25% improvement in data accuracy',
        adoption: '100% executive team usage',
        revenue: '$150K annual cost savings in manual labor'
      }
    },
    {
      id: '3',
      title: 'Investment Performance Analytics Dashboard',
      description: 'Created comprehensive analytics dashboard for tracking investment performance across multiple asset classes and time horizons. Dashboard provides real-time performance metrics, benchmark comparisons, and attribution analysis. Includes predictive analytics for performance forecasting.',
      technologies: ['Tableau', 'SQL', 'Excel', 'Bloomberg API', 'Python', 'Power BI'],
      startDate: '2021-04-01',
      endDate: '2021-11-01',
      github: 'github.com/sarahmartinez/investment-analytics',
      images: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: 'Improved investment decision speed by 40% and enhanced client reporting quality',
      roleSpecific: true,
      metrics: {
        performance: '40% faster investment decision-making',
        adoption: '100% portfolio manager usage',
        efficiency: '50% reduction in performance report preparation time'
      }
    }
  ],
  achievements: [
    'Chartered Financial Analyst (CFA) Level II Candidate',
    'Financial Risk Manager (FRM) Certification - GARP',
    'Led financial analysis projects resulting in $5M+ in cost savings and revenue optimization',
    'Managed financial models for investment decisions totaling $300M+ in assets',
    'Speaker at Finance Professionals Conference 2023: "Advanced Risk Modeling in Portfolio Management"',
    'Mentor for 6+ junior analysts and finance professionals',
    'Winner of "Excellence in Financial Analysis" award at Global Investment Partners 2022',
    'Published research paper on "Predictive Analytics in Credit Risk Assessment" in Finance Journal'
  ],
  certifications: [
    {
      id: '1',
      name: 'Financial Risk Manager (FRM)',
      issuer: 'Global Association of Risk Professionals (GARP)',
      issueDate: '2020-08-15',
      expiryDate: '2025-08-15',
      credentialId: 'FRM-2020-001',
      url: 'https://www.garp.org/frm'
    },
    {
      id: '2',
      name: 'Chartered Financial Analyst (CFA) Level II',
      issuer: 'CFA Institute',
      issueDate: '2021-09-20',
      credentialId: 'CFA-L2-2021-001',
      url: 'https://www.cfainstitute.org/en/programs/cfa'
    },
    {
      id: '3',
      name: 'Microsoft Excel Expert',
      issuer: 'Microsoft',
      issueDate: '2019-11-10',
      expiryDate: '2024-11-10',
      credentialId: 'EXCEL-EXP-2019-001'
    },
    {
      id: '4',
      name: 'Tableau Desktop Certified Professional',
      issuer: 'Tableau',
      issueDate: '2022-03-14',
      expiryDate: '2025-03-14',
      credentialId: 'TDC-PRO-2022-001'
    }
  ],
  metadata: {
    targetRole: 'financial-analyst',
    industry: 'finance',
    experienceLevel: 'senior',
    lastUpdated: new Date(),
    contentVersion: '1.0.0',
    tags: ['financial-modeling', 'risk-analysis', 'budgeting', 'forecasting', 'investment-analysis', 'senior']
  }
};