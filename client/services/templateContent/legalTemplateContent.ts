import { TemplateSpecificContent, TEMPLATE_IDS } from '../templateSpecificContentService';

// Legal Counsel Template Content
export const legalContent: TemplateSpecificContent = {
  templateId: TEMPLATE_IDS.LEGAL_COUNSEL,
  personalInfo: {
    name: 'Alexandra Chen',
    title: 'Senior Legal Counsel',
    email: 'alexandra.chen@lawfirm.com',
    phone: '+1 (555) 234-5678',
    location: 'New York, NY',
    website: 'alexandrachen-law.com',
    linkedin: 'linkedin.com/in/alexandrachen-esq',
    github: '',
    avatar: '',
  },
  professionalSummary: 'Accomplished Senior Legal Counsel with 12+ years of experience in corporate law, mergers & acquisitions, and regulatory compliance. Expert in contract negotiation, corporate governance, and risk mitigation with proven track record of managing legal matters for Fortune 500 companies. Successfully led legal due diligence for $2B+ in M&A transactions and implemented compliance programs that reduced regulatory risk by 40%.',
  objective: 'Seeking a General Counsel or Chief Legal Officer role where I can leverage my expertise in corporate law, strategic legal planning, and regulatory compliance to drive business growth while ensuring comprehensive legal protection and governance excellence.',
  skills: [
    {
      id: '1',
      name: 'Contract Law',
      proficiency: 95,
      category: 'Legal Expertise',
      level: 95,
      yearsOfExperience: 12,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '2',
      name: 'Corporate Governance',
      proficiency: 92,
      category: 'Corporate Law',
      level: 92,
      yearsOfExperience: 10,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '3',
      name: 'Mergers & Acquisitions',
      proficiency: 90,
      category: 'Transactional Law',
      level: 90,
      yearsOfExperience: 8,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '4',
      name: 'Regulatory Compliance',
      proficiency: 93,
      category: 'Compliance',
      level: 93,
      yearsOfExperience: 11,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '5',
      name: 'Securities Law',
      proficiency: 88,
      category: 'Financial Regulation',
      level: 88,
      yearsOfExperience: 9,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '6',
      name: 'Employment Law',
      proficiency: 85,
      category: 'Labor Relations',
      level: 85,
      yearsOfExperience: 8,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '7',
      name: 'Intellectual Property',
      proficiency: 82,
      category: 'IP Law',
      level: 82,
      yearsOfExperience: 7,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '8',
      name: 'Risk Assessment',
      proficiency: 90,
      category: 'Risk Management',
      level: 90,
      yearsOfExperience: 10,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '9',
      name: 'Legal Research',
      proficiency: 95,
      category: 'Research Skills',
      level: 95,
      yearsOfExperience: 12,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '10',
      name: 'Litigation Management',
      proficiency: 87,
      category: 'Dispute Resolution',
      level: 87,
      yearsOfExperience: 9,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '11',
      name: 'Data Privacy Law',
      proficiency: 85,
      category: 'Privacy Compliance',
      level: 85,
      yearsOfExperience: 6,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '12',
      name: 'International Law',
      proficiency: 80,
      category: 'Global Compliance',
      level: 80,
      yearsOfExperience: 7,
      isCore: false,
      relevanceScore: 7
    }
  ],
  experiences: [
    {
      id: '1',
      company: 'Global Tech Corporation',
      position: 'Senior Legal Counsel',
      startDate: '2019-03',
      endDate: null,
      description: 'Leading legal strategy and operations for multinational technology company with $5B+ annual revenue. Responsible for corporate governance, M&A transactions, regulatory compliance, and risk management across 15+ countries. Managing legal team of 8 attorneys and coordinating with external counsel.',
      achievements: [
        'Led legal due diligence for $2.1B acquisition, completing transaction 30% faster than industry average',
        'Implemented global compliance program reducing regulatory violations by 85%',
        'Negotiated $500M+ in strategic partnerships and licensing agreements',
        'Established data privacy compliance framework achieving GDPR and CCPA certification',
        'Reduced litigation costs by 40% through proactive risk management and alternative dispute resolution'
      ],
      technologies: ['Legal Research Platforms', 'Contract Management Systems', 'Compliance Software', 'Document Review Tools'],
      location: 'New York, NY',
      employmentType: 'Full-time',
      industryContext: 'Technology',
      roleLevel: 'senior'
    },
    {
      id: '2',
      company: 'Metropolitan Investment Bank',
      position: 'Corporate Counsel',
      startDate: '2015-08',
      endDate: '2019-02',
      description: 'Provided comprehensive legal support for investment banking operations including securities offerings, regulatory compliance, and corporate transactions. Advised on complex financial instruments, regulatory matters, and risk management strategies.',
      achievements: [
        'Managed legal aspects of $10B+ in securities offerings with 100% regulatory compliance',
        'Developed compliance training program for 500+ employees reducing violations by 60%',
        'Led legal review of 200+ investment agreements with zero post-closing disputes',
        'Implemented new contract management system reducing review time by 50%',
        'Successfully defended bank in 15+ regulatory examinations with no material findings'
      ],
      technologies: ['Bloomberg Law', 'Securities Compliance Systems', 'Contract Management Platforms'],
      location: 'New York, NY',
      employmentType: 'Full-time',
      industryContext: 'Financial Services',
      roleLevel: 'mid'
    },
    {
      id: '3',
      company: 'Morrison & Associates Law Firm',
      position: 'Associate Attorney',
      startDate: '2012-09',
      endDate: '2015-07',
      description: 'Practiced corporate law with focus on M&A transactions, securities law, and corporate governance. Represented clients in complex business transactions, regulatory matters, and corporate restructuring initiatives.',
      achievements: [
        'Completed legal due diligence for 50+ M&A transactions totaling $3B+ in value',
        'Drafted and negotiated complex commercial agreements with 95% client satisfaction rate',
        'Conducted legal research and analysis for high-stakes litigation matters',
        'Mentored 5+ junior associates and summer interns',
        'Achieved partnership track recognition within 2 years'
      ],
      technologies: ['Westlaw', 'LexisNexis', 'Document Management Systems', 'Legal Research Tools'],
      location: 'New York, NY',
      employmentType: 'Full-time',
      industryContext: 'Legal Services',
      roleLevel: 'entry'
    }
  ],
  education: [
    {
      id: '1',
      institution: 'Columbia Law School',
      degree: 'Juris Doctor (J.D.)',
      field: 'Law',
      startDate: '2009-09',
      endDate: '2012-05',
      location: 'New York, NY',
      gpa: '3.7',
      honors: ['Law Review', 'Order of the Coif', 'Dean\'s List', 'Moot Court Competition Winner'],
      relevantCoursework: ['Corporate Law', 'Securities Regulation', 'Mergers & Acquisitions', 'International Business Law', 'Constitutional Law', 'Contract Law']
    },
    {
      id: '2',
      institution: 'Harvard University',
      degree: 'Bachelor of Arts',
      field: 'Political Science',
      startDate: '2005-09',
      endDate: '2009-05',
      location: 'Cambridge, MA',
      gpa: '3.8',
      honors: ['Magna Cum Laude', 'Phi Beta Kappa', 'Political Science Department Award'],
      relevantCoursework: ['Constitutional Law', 'International Relations', 'Public Policy', 'Economics', 'Philosophy']
    }
  ],
  projects: [
    {
      id: '1',
      title: 'Global Compliance Framework Implementation',
      description: 'Led comprehensive implementation of global compliance framework across 15+ countries to ensure adherence to local and international regulations. Developed standardized policies, procedures, and training programs while maintaining flexibility for regional requirements.',
      technologies: ['Compliance Management Software', 'Policy Management Systems', 'Training Platforms', 'Risk Assessment Tools'],
      startDate: '2020-01-01',
      endDate: '2021-12-01',
      images: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: '85% reduction in regulatory violations, 100% audit compliance across all jurisdictions, $5M cost savings in potential fines',
      roleSpecific: true,
      metrics: {
        performance: '85% reduction in regulatory violations',
        efficiency: '100% audit compliance across 15+ countries',
        revenue: '$5M cost savings in potential regulatory fines'
      }
    },
    {
      id: '2',
      title: 'M&A Legal Due Diligence Automation',
      description: 'Designed and implemented automated legal due diligence process for M&A transactions using AI-powered document review and risk assessment tools. Streamlined workflow reduced transaction timelines while improving accuracy of legal risk identification.',
      technologies: ['AI Document Review', 'Contract Analysis Software', 'Risk Assessment Platforms', 'Project Management Tools'],
      startDate: '2021-06-01',
      endDate: '2022-03-01',
      images: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: '50% reduction in due diligence timeline, 30% improvement in risk identification accuracy, adopted for all major transactions',
      roleSpecific: true,
      metrics: {
        efficiency: '50% reduction in due diligence timeline',
        performance: '30% improvement in risk identification accuracy',
        adoption: '100% adoption for transactions over $100M'
      }
    },
    {
      id: '3',
      title: 'Data Privacy Compliance Program',
      description: 'Developed comprehensive data privacy compliance program addressing GDPR, CCPA, and other global privacy regulations. Created privacy-by-design framework, implemented data mapping processes, and established incident response procedures.',
      technologies: ['Privacy Management Software', 'Data Mapping Tools', 'Compliance Tracking Systems', 'Training Management Platforms'],
      startDate: '2018-03-01',
      endDate: '2019-08-01',
      images: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: 'Achieved full GDPR and CCPA compliance, zero privacy violations, 95% employee training completion rate',
      roleSpecific: true,
      metrics: {
        performance: 'Zero privacy violations since implementation',
        adoption: '95% employee training completion rate',
        efficiency: 'Full regulatory compliance across all jurisdictions'
      }
    }
  ],
  achievements: [
    'Licensed to practice law in New York, California, and Washington D.C.',
    'Led legal strategy for $2B+ in successful M&A transactions',
    'Implemented compliance programs resulting in zero material regulatory violations',
    'Recognized as "Rising Star" by Super Lawyers for 3 consecutive years',
    'Speaker at 20+ legal conferences on corporate governance and compliance',
    'Published 15+ articles in leading legal journals on M&A and securities law',
    'Mentor for 25+ junior attorneys and law students',
    'Board member of Corporate Legal Association of New York'
  ],
  certifications: [
    {
      id: '1',
      name: 'New York State Bar License',
      issuer: 'New York State Bar Association',
      issueDate: '2012-10-15',
      credentialId: 'NY-BAR-2012-001',
      url: 'https://www.nysba.org'
    },
    {
      id: '2',
      name: 'California State Bar License',
      issuer: 'State Bar of California',
      issueDate: '2013-03-20',
      credentialId: 'CA-BAR-2013-001',
      url: 'https://www.calbar.ca.gov'
    },
    {
      id: '3',
      name: 'Certified Information Privacy Professional (CIPP/US)',
      issuer: 'International Association of Privacy Professionals',
      issueDate: '2018-11-10',
      expiryDate: '2024-11-10',
      credentialId: 'CIPP-US-2018-001',
      url: 'https://iapp.org/certify/cipp/united-states/'
    },
    {
      id: '4',
      name: 'Certified Compliance & Ethics Professional (CCEP)',
      issuer: 'Compliance Certification Board',
      issueDate: '2020-06-15',
      expiryDate: '2025-06-15',
      credentialId: 'CCEP-2020-001',
      url: 'https://www.compliancecertification.org'
    }
  ],
  metadata: {
    targetRole: 'legal-counsel',
    industry: 'legal',
    experienceLevel: 'senior',
    lastUpdated: new Date(),
    contentVersion: '1.0.0',
    tags: ['contract-law', 'corporate-governance', 'mergers-acquisitions', 'compliance', 'risk-mitigation', 'senior']
  }
};