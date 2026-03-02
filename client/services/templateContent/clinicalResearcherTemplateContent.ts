import { TemplateSpecificContent, TEMPLATE_IDS } from '../templateSpecificContentService';

// Clinical Researcher Template Content
export const clinicalResearcherContent: TemplateSpecificContent = {
  templateId: TEMPLATE_IDS.CLINICAL_RESEARCHER,
  personalInfo: {
    name: 'Dr. Sarah Chen',
    title: 'Clinical Research Scientist',
    email: 'sarah.chen@clinicalresearch.org',
    phone: '+1 (555) 234-5678',
    location: 'Boston, MA',
    website: 'sarahchen-research.com',
    linkedin: 'linkedin.com/in/sarahchen-phd',
    github: '',
    avatar: '',
  },
  professionalSummary: 'Experienced Clinical Research Scientist with 12+ years conducting Phase I-III clinical trials in oncology and cardiovascular medicine. Expert in protocol development, regulatory compliance, and statistical analysis with proven track record of managing $50M+ in research funding. Led 25+ clinical studies resulting in 3 FDA approvals and 40+ peer-reviewed publications with 2,500+ citations.',
  objective: 'Seeking a Senior Clinical Research Director role where I can leverage my expertise in clinical trial design, regulatory affairs, and biostatistics to advance innovative therapies from bench to bedside while ensuring the highest standards of patient safety and scientific rigor.',
  skills: [
    {
      id: '1', name: 'Clinical Trial Design', proficiency: 95, category: 'Clinical Research', level: 95, yearsOfExperience: 12, isCore: true, relevanceScore: 10
    },
    {
      id: '2', name: 'Statistical Analysis', proficiency: 92, category: 'Data Analysis', level: 92, yearsOfExperience: 11, isCore: true, relevanceScore: 10
    },
    {
      id: '3', name: 'Regulatory Compliance', proficiency: 90, category: 'Regulatory Affairs', level: 90, yearsOfExperience: 10, isCore: true, relevanceScore: 10
    },
    {
      id: '4', name: 'Medical Writing', proficiency: 88, category: 'Scientific Communication', level: 88, yearsOfExperience: 12, isCore: true, relevanceScore: 10
    },
    {
      id: '5', name: 'FDA Regulations (21 CFR)', proficiency: 93, category: 'Regulatory Standards', level: 93, yearsOfExperience: 10, isCore: true, relevanceScore: 10
    },
    {
      id: '6', name: 'Good Clinical Practice (GCP)', proficiency: 95, category: 'Clinical Standards', level: 95, yearsOfExperience: 12, isCore: true, relevanceScore: 10
    },
    {
      id: '7', name: 'Protocol Development', proficiency: 90, category: 'Study Design', level: 90, yearsOfExperience: 11, isCore: true, relevanceScore: 9
    },
    {
      id: '8', name: 'Data Management', proficiency: 85, category: 'Data Systems', level: 85, yearsOfExperience: 9, isCore: true, relevanceScore: 9
    },
    {
      id: '9', name: 'Biostatistics', proficiency: 87, category: 'Statistical Methods', level: 87, yearsOfExperience: 10, isCore: true, relevanceScore: 9
    },
    {
      id: '10', name: 'Clinical Data Analysis', proficiency: 88, category: 'Data Analysis', level: 88, yearsOfExperience: 11, isCore: true, relevanceScore: 9
    },
    {
      id: '11', name: 'Pharmacovigilance', proficiency: 82, category: 'Drug Safety', level: 82, yearsOfExperience: 8, isCore: false, relevanceScore: 8
    },
    {
      id: '12', name: 'Clinical Trial Management', proficiency: 90, category: 'Project Management', level: 90, yearsOfExperience: 12, isCore: true, relevanceScore: 9
    },
    {
      id: '13', name: 'Institutional Review Board (IRB)', proficiency: 85, category: 'Ethics & Compliance', level: 85, yearsOfExperience: 10, isCore: false, relevanceScore: 8
    },
    {
      id: '14', name: 'SAS Programming', proficiency: 80, category: 'Statistical Software', level: 80, yearsOfExperience: 8, isCore: false, relevanceScore: 7
    },
    {
      id: '15', name: 'R Statistical Software', proficiency: 83, category: 'Statistical Software', level: 83, yearsOfExperience: 7, isCore: false, relevanceScore: 7
    }
  ],
  experiences: [
    {
      id: '1',
      company: 'Boston Medical Research Institute',
      position: 'Senior Clinical Research Scientist',
      startDate: '2019-03',
      endDate: null,
      description: 'Leading multi-center clinical trials in oncology and cardiovascular medicine. Responsible for protocol development, regulatory submissions, data analysis, and publication of results. Managing research team of 15+ scientists and coordinators with $20M annual budget.',
      achievements: [
        'Led Phase III cardiovascular trial (n=2,400) resulting in FDA approval and $500M market launch',
        'Published 18 peer-reviewed papers with average impact factor of 8.5 and 1,200+ citations',
        'Secured $15M in NIH and industry funding through competitive grant applications',
        'Reduced trial enrollment time by 40% through innovative patient recruitment strategies',
        'Achieved 98% data quality score across all managed studies with zero major protocol deviations'
      ],
      technologies: ['Clinical Trial Management Systems', 'SAS', 'R', 'REDCap', 'Electronic Data Capture (EDC)', 'Statistical Analysis Software'],
      location: 'Boston, MA',
      employmentType: 'Full-time',
      industryContext: 'Healthcare',
      roleLevel: 'senior'
    },
    {
      id: '2',
      company: 'Pharmaceutical Research Corporation',
      position: 'Clinical Research Associate',
      startDate: '2015-08',
      endDate: '2019-02',
      description: 'Conducted Phase I-II clinical trials for novel oncology therapeutics. Responsible for site monitoring, data collection, regulatory compliance, and safety reporting across 12 clinical sites in the Northeast region.',
      achievements: [
        'Successfully managed 8 concurrent Phase I/II oncology trials with 100% regulatory compliance',
        'Developed standardized monitoring procedures reducing site visit time by 30%',
        'Led safety data review resulting in identification of optimal dosing for 2 investigational drugs',
        'Trained 25+ clinical coordinators on GCP guidelines and study-specific procedures'
      ],
      technologies: ['Clinical Data Management Systems', 'Adverse Event Reporting Systems', 'Electronic Case Report Forms'],
      location: 'Cambridge, MA',
      employmentType: 'Full-time',
      industryContext: 'Pharmaceutical',
      roleLevel: 'mid'
    },
    {
      id: '3',
      company: 'Academic Medical Center',
      position: 'Research Coordinator',
      startDate: '2012-06',
      endDate: '2015-07',
      description: 'Coordinated investigator-initiated clinical trials in cardiology department. Responsible for patient recruitment, informed consent, data collection, and regulatory documentation for multiple concurrent studies.',
      achievements: [
        'Managed patient recruitment for 5 concurrent cardiology trials exceeding enrollment targets by 15%',
        'Maintained 100% compliance with IRB requirements and FDA regulations',
        'Developed patient database system improving data accuracy by 25%',
        'Co-authored 6 publications in high-impact cardiovascular journals'
      ],
      technologies: ['Research Database Systems', 'Statistical Software', 'Clinical Documentation Systems'],
      location: 'Boston, MA',
      employmentType: 'Full-time',
      industryContext: 'Academic Medicine',
      roleLevel: 'entry'
    }
  ],
  education: [
    {
      id: '1',
      institution: 'Harvard University',
      degree: 'Ph.D.',
      field: 'Biostatistics',
      startDate: '2008-09',
      endDate: '2012-05',
      location: 'Boston, MA',
      gpa: '3.9',
      honors: ['Summa Cum Laude', 'Outstanding Dissertation Award', 'Graduate Research Fellowship'],
      relevantCoursework: ['Clinical Trial Design', 'Biostatistical Methods', 'Epidemiology', 'Survival Analysis', 'Bayesian Statistics', 'Regulatory Science']
    },
    {
      id: '2',
      institution: 'MIT',
      degree: 'Master of Science',
      field: 'Computational Biology',
      startDate: '2006-09',
      endDate: '2008-05',
      location: 'Cambridge, MA',
      gpa: '3.8',
      relevantCoursework: ['Bioinformatics', 'Statistical Genetics', 'Machine Learning', 'Data Mining', 'Molecular Biology']
    },
    {
      id: '3',
      institution: 'University of California, Berkeley',
      degree: 'Bachelor of Science',
      field: 'Molecular and Cell Biology',
      startDate: '2002-09',
      endDate: '2006-05',
      location: 'Berkeley, CA',
      gpa: '3.7',
      honors: ['Phi Beta Kappa', 'Dean\'s Honor List'],
      relevantCoursework: ['Biochemistry', 'Genetics', 'Cell Biology', 'Statistics', 'Research Methods']
    }
  ],
  projects: [
    {
      id: '1',
      title: 'Multi-Center Cardiovascular Outcomes Trial (CARDIO-PROTECT)',
      description: 'Led design and execution of Phase III randomized controlled trial evaluating novel cardioprotective therapy in 2,400 patients across 45 sites. Managed all aspects from protocol development through regulatory submission and publication of results.',
      technologies: ['Clinical Trial Management Systems', 'SAS', 'R', 'Electronic Data Capture', 'Statistical Analysis Software', 'Regulatory Submission Systems'],
      startDate: '2020-01-01',
      endDate: '2023-12-01',
      images: [
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: 'FDA approval achieved, 23% reduction in cardiovascular events, $500M market launch, published in New England Journal of Medicine (IF: 91.2)',
      roleSpecific: true,
      metrics: {
        performance: '23% reduction in primary cardiovascular endpoints (p<0.001)',
        adoption: 'FDA approval with priority review designation',
        revenue: '$500M estimated annual market potential'
      }
    },
    {
      id: '2',
      title: 'Oncology Biomarker Discovery Study (ONCO-MARK)',
      description: 'Designed and conducted Phase II biomarker-driven trial in advanced lung cancer patients. Developed companion diagnostic strategy and led correlative studies identifying predictive biomarkers for treatment response.',
      technologies: ['Genomic Analysis Platforms', 'Biomarker Analysis Software', 'Clinical Data Systems', 'Statistical Modeling Tools'],
      startDate: '2018-06-01',
      endDate: '2021-03-01',
      images: [
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: '2 novel biomarkers identified, 40% improvement in response prediction, 3 patents filed, breakthrough therapy designation',
      roleSpecific: true,
      metrics: {
        performance: '40% improvement in treatment response prediction accuracy',
        adoption: 'Breakthrough therapy designation from FDA',
        efficiency: '3 patents filed for companion diagnostic'
      }
    },
    {
      id: '3',
      title: 'Pediatric Drug Safety Meta-Analysis',
      description: 'Conducted comprehensive meta-analysis of pediatric clinical trial safety data across 15 studies and 3,000+ patients. Developed novel statistical methods for pediatric safety assessment and published methodology in leading journal.',
      technologies: ['Meta-Analysis Software', 'R', 'SAS', 'Safety Database Systems', 'Statistical Modeling'],
      startDate: '2017-01-01',
      endDate: '2018-12-01',
      images: [
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: 'New FDA guidance adopted, methodology cited in 50+ subsequent studies, improved pediatric drug safety assessment',
      roleSpecific: true,
      metrics: {
        adoption: 'Methodology adopted in FDA pediatric guidance',
        performance: 'Analysis of 3,000+ pediatric patients across 15 studies',
        efficiency: 'Cited in 50+ subsequent pediatric safety studies'
      }
    }
  ],
  achievements: [
    'Led clinical trials resulting in 3 FDA drug approvals with combined market value >$1B',
    'Published 40+ peer-reviewed papers with 2,500+ citations and h-index of 28',
    'Secured $50M+ in competitive research funding from NIH, FDA, and industry sponsors',
    'Recipient of American Society of Clinical Oncology Young Investigator Award',
    'Expert panel member for FDA Oncologic Drugs Advisory Committee',
    'Keynote speaker at 20+ international clinical research conferences'
  ],
  certifications: [
    {
      id: '1',
      name: 'Certified Clinical Research Professional (CCRP)',
      issuer: 'Society of Clinical Research Associates',
      issueDate: '2015-06',
      credentialId: 'CCRP-2015-001'
    },
    {
      id: '2',
      name: 'Good Clinical Practice (GCP) Certification',
      issuer: 'International Conference on Harmonisation',
      issueDate: '2023-01',
      expiryDate: '2026-01',
      credentialId: 'GCP-2023-001'
    },
    {
      id: '3',
      name: 'Clinical Data Management Certification',
      issuer: 'Society for Clinical Data Management',
      issueDate: '2018-09',
      credentialId: 'CDM-2018-001'
    },
    {
      id: '4',
      name: 'Regulatory Affairs Certification (RAC)',
      issuer: 'Regulatory Affairs Professionals Society',
      issueDate: '2020-03',
      credentialId: 'RAC-2020-001'
    }
  ],
  metadata: {
    targetRole: 'clinical-researcher',
    industry: 'healthcare',
    experienceLevel: 'senior',
    lastUpdated: new Date(),
    contentVersion: '1.0.0',
    tags: ['clinical-research', 'clinical-trials', 'statistical-analysis', 'regulatory-compliance', 'medical-writing', 'biostatistics', 'healthcare']
  }
};