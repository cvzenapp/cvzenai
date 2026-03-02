import { TemplateSpecificContent, TEMPLATE_IDS } from '../templateSpecificContentService';

// Healthcare Administrator Template Content
export const healthcareAdminContent: TemplateSpecificContent = {
  templateId: TEMPLATE_IDS.HEALTHCARE_ADMIN,
  personalInfo: {
    name: 'Michael Thompson',
    title: 'Healthcare Administrator',
    email: 'michael.thompson@healthsystem.org',
    phone: '+1 (555) 345-6789',
    location: 'Chicago, IL',
    website: 'michaelthompson-healthcare.com',
    linkedin: 'linkedin.com/in/michaelthompson-mha',
    github: '',
    avatar: '',
  },
  professionalSummary: 'Experienced Healthcare Administrator with 10+ years managing hospital operations, budget oversight, and quality improvement initiatives. Expert in healthcare compliance, staff management, and process optimization with proven track record of reducing operational costs by 25% while improving patient satisfaction scores by 40%. Led cross-functional teams of 200+ healthcare professionals across multiple departments.',
  objective: 'Seeking a Senior Healthcare Administration role where I can leverage my expertise in operational excellence, regulatory compliance, and strategic planning to drive organizational growth while ensuring the highest standards of patient care and staff satisfaction.',
  skills: [
    {
      id: '1', name: 'Budget Management', proficiency: 95, category: 'Financial Management', level: 95, yearsOfExperience: 10, isCore: true, relevanceScore: 10
    },
    {
      id: '2', name: 'Healthcare Compliance', proficiency: 92, category: 'Regulatory Affairs', level: 92, yearsOfExperience: 9, isCore: true, relevanceScore: 10
    },
    {
      id: '3', name: 'Quality Improvement', proficiency: 90, category: 'Process Improvement', level: 90, yearsOfExperience: 8, isCore: true, relevanceScore: 10
    },
    {
      id: '4', name: 'Staff Management', proficiency: 88, category: 'Leadership', level: 88, yearsOfExperience: 10, isCore: true, relevanceScore: 9
    },
    {
      id: '5', name: 'HIPAA Compliance', proficiency: 95, category: 'Regulatory Standards', level: 95, yearsOfExperience: 10, isCore: true, relevanceScore: 10
    },
    {
      id: '6', name: 'Joint Commission Standards', proficiency: 90, category: 'Healthcare Accreditation', level: 90, yearsOfExperience: 8, isCore: true, relevanceScore: 9
    },
    {
      id: '7', name: 'Healthcare Analytics', proficiency: 85, category: 'Data Analysis', level: 85, yearsOfExperience: 6, isCore: true, relevanceScore: 8
    },
    {
      id: '8', name: 'Strategic Planning', proficiency: 87, category: 'Strategic Management', level: 87, yearsOfExperience: 8, isCore: true, relevanceScore: 8
    },
    {
      id: '9', name: 'Risk Management', proficiency: 83, category: 'Risk Assessment', level: 83, yearsOfExperience: 7, isCore: false, relevanceScore: 8
    },
    {
      id: '10', name: 'Electronic Health Records (EHR)', proficiency: 82, category: 'Healthcare Technology', level: 82, yearsOfExperience: 6, isCore: false, relevanceScore: 7
    },
    {
      id: '11', name: 'Process Improvement', proficiency: 88, category: 'Operational Excellence', level: 88, yearsOfExperience: 9, isCore: true, relevanceScore: 9
    },
    {
      id: '12', name: 'Healthcare Policy', proficiency: 85, category: 'Policy Management', level: 85, yearsOfExperience: 8, isCore: false, relevanceScore: 7
    },
    {
      id: '13', name: 'Patient Safety', proficiency: 90, category: 'Quality Assurance', level: 90, yearsOfExperience: 10, isCore: true, relevanceScore: 9
    }
  ],
  experiences: [
    {
      id: '1',
      company: 'Metropolitan Medical Center',
      position: 'Director of Operations',
      startDate: '2020-01',
      endDate: null,
      description: 'Leading operational excellence initiatives across 500-bed hospital system. Responsible for budget management, quality improvement programs, regulatory compliance, and staff development for 1,200+ employees across multiple departments.',
      achievements: [
        'Reduced operational costs by $15M annually through process optimization and vendor negotiations',
        'Improved patient satisfaction scores from 72% to 91% through service excellence initiatives',
        'Led successful Joint Commission accreditation with zero findings',
        'Implemented EHR system upgrade affecting 1,200+ staff members with 99% adoption rate',
        'Reduced average length of stay by 1.2 days while maintaining quality metrics'
      ],
      technologies: ['Epic EHR', 'Healthcare Analytics Software', 'Budget Management Systems', 'Quality Management Tools'],
      location: 'Chicago, IL',
      employmentType: 'Full-time',
      industryContext: 'Healthcare',
      roleLevel: 'senior'
    },
    {
      id: '2',
      company: 'Regional Health Network',
      position: 'Healthcare Operations Manager',
      startDate: '2016-08',
      endDate: '2019-12',
      description: 'Managed day-to-day operations for multi-specialty clinic network serving 50,000+ patients annually. Oversaw budget planning, staff scheduling, compliance monitoring, and quality improvement initiatives across 8 clinic locations.',
      achievements: [
        'Increased clinic efficiency by 30% through workflow optimization and staff cross-training',
        'Achieved 100% HIPAA compliance across all clinic locations',
        'Reduced patient wait times by 45% through scheduling system improvements',
        'Led implementation of patient portal increasing engagement by 60%'
      ],
      technologies: ['Practice Management Software', 'Scheduling Systems', 'Compliance Tracking Tools'],
      location: 'Chicago, IL',
      employmentType: 'Full-time',
      industryContext: 'Healthcare',
      roleLevel: 'mid'
    },
    {
      id: '3',
      company: 'Community Hospital',
      position: 'Administrative Coordinator',
      startDate: '2014-06',
      endDate: '2016-07',
      description: 'Coordinated administrative functions for emergency department and surgical services. Responsible for staff scheduling, budget tracking, compliance documentation, and patient flow optimization.',
      achievements: [
        'Streamlined patient admission process reducing processing time by 25%',
        'Maintained 100% compliance with state and federal healthcare regulations',
        'Coordinated staff schedules for 80+ healthcare professionals',
        'Implemented quality improvement initiative reducing medical errors by 20%'
      ],
      technologies: ['Hospital Information Systems', 'Scheduling Software', 'Compliance Management Tools'],
      location: 'Springfield, IL',
      employmentType: 'Full-time',
      industryContext: 'Healthcare',
      roleLevel: 'entry'
    }
  ],
  education: [
    {
      id: '1',
      institution: 'Northwestern University',
      degree: 'Master of Health Administration (MHA)',
      field: 'Healthcare Administration',
      startDate: '2012-09',
      endDate: '2014-05',
      location: 'Chicago, IL',
      gpa: '3.8',
      honors: ['Dean\'s List', 'Healthcare Leadership Award'],
      relevantCoursework: ['Healthcare Finance', 'Quality Management', 'Healthcare Policy', 'Strategic Planning', 'Healthcare Law', 'Operations Management']
    },
    {
      id: '2',
      institution: 'University of Illinois',
      degree: 'Bachelor of Science',
      field: 'Business Administration',
      startDate: '2008-09',
      endDate: '2012-05',
      location: 'Urbana-Champaign, IL',
      gpa: '3.6',
      relevantCoursework: ['Business Management', 'Finance', 'Statistics', 'Organizational Behavior']
    }
  ],
  projects: [
    {
      id: '1',
      title: 'Hospital-Wide Quality Improvement Initiative',
      description: 'Led comprehensive quality improvement program across 500-bed hospital system focusing on patient safety, infection control, and care coordination. Implemented evidence-based protocols and staff training programs resulting in significant improvements in patient outcomes.',
      technologies: ['Quality Management Software', 'Data Analytics Tools', 'Training Management Systems', 'Compliance Tracking'],
      startDate: '2021-01-01',
      endDate: '2022-12-01',
      images: [
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: '35% reduction in hospital-acquired infections, 20% improvement in patient safety scores, $8M cost savings',
      roleSpecific: true,
      metrics: {
        performance: '35% reduction in hospital-acquired infections',
        efficiency: '20% improvement in patient safety scores',
        revenue: '$8M annual cost savings'
      }
    },
    {
      id: '2',
      title: 'EHR Implementation and Optimization Project',
      description: 'Managed hospital-wide implementation of new Electronic Health Records system affecting 1,200+ staff members. Led change management, training coordination, and workflow optimization to ensure seamless transition with minimal disruption to patient care.',
      technologies: ['Epic EHR', 'Training Management Systems', 'Workflow Analysis Tools', 'Change Management Software'],
      startDate: '2019-03-01',
      endDate: '2020-08-01',
      images: [
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: '99% staff adoption rate, 30% improvement in documentation efficiency, zero patient care disruptions',
      roleSpecific: true,
      metrics: {
        adoption: '99% staff adoption rate (1,200+ employees)',
        efficiency: '30% improvement in documentation efficiency',
        performance: 'Zero patient care disruptions during transition'
      }
    },
    {
      id: '3',
      title: 'Multi-Site Compliance Standardization Program',
      description: 'Developed and implemented standardized compliance protocols across 8 clinic locations to ensure consistent adherence to HIPAA, Joint Commission, and state regulations. Created comprehensive audit system and staff training programs.',
      technologies: ['Compliance Management Systems', 'Audit Software', 'Training Platforms', 'Documentation Systems'],
      startDate: '2017-06-01',
      endDate: '2018-12-01',
      images: [
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: '100% compliance across all locations, 50% reduction in audit findings, standardized processes adopted network-wide',
      roleSpecific: true,
      metrics: {
        performance: '100% compliance across 8 locations',
        efficiency: '50% reduction in audit findings',
        adoption: 'Standardized processes adopted network-wide'
      }
    }
  ],
  achievements: [
    'Led operational improvements resulting in $25M+ cost savings over 5 years',
    'Achieved 100% Joint Commission accreditation compliance with zero findings',
    'Improved patient satisfaction scores by 40% through service excellence initiatives',
    'Successfully managed budgets exceeding $100M annually',
    'Certified Healthcare Administrative Professional (cHAP)',
    'Speaker at 15+ healthcare administration conferences and workshops'
  ],
  certifications: [
    {
      id: '1',
      name: 'Certified Healthcare Administrative Professional (cHAP)',
      issuer: 'American Organization for Nursing Leadership',
      issueDate: '2018-03',
      credentialId: 'cHAP-2018-001'
    },
    {
      id: '2',
      name: 'Certified Professional in Healthcare Quality (CPHQ)',
      issuer: 'National Association for Healthcare Quality',
      issueDate: '2019-07',
      credentialId: 'CPHQ-2019-001'
    },
    {
      id: '3',
      name: 'Healthcare Compliance Officer Certification',
      issuer: 'Compliance Certification Board',
      issueDate: '2020-11',
      credentialId: 'HCCO-2020-001'
    }
  ],
  metadata: {
    targetRole: 'healthcare-admin',
    industry: 'healthcare',
    experienceLevel: 'senior',
    lastUpdated: new Date(),
    contentVersion: '1.0.0',
    tags: ['healthcare-administration', 'budget-management', 'compliance', 'quality-improvement', 'staff-management', 'healthcare']
  }
};