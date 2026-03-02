import { TemplateSpecificContent } from '../templateSpecificContentService';

// Academic Researcher Template Content
export const academicResearcherContent: TemplateSpecificContent = {
  templateId: 'academic-researcher',
  personalInfo: {
    name: 'Dr. Michael Chen',
    title: 'Associate Professor of Computer Science',
    email: 'michael.chen@university.edu',
    phone: '+1 (555) 987-6543',
    location: 'Boston, MA',
    website: 'michaelchen-research.edu',
    linkedin: 'linkedin.com/in/dr-michael-chen',
    github: 'github.com/dr-chen-research',
    avatar: '',
  },
  professionalSummary: 'Distinguished Associate Professor of Computer Science with 12+ years of experience in artificial intelligence and machine learning research. Published 45+ peer-reviewed papers in top-tier conferences and journals with 2,500+ citations. Principal investigator on $3.2M in federal research grants with expertise in deep learning, natural language processing, and computer vision. Committed to advancing scientific knowledge while mentoring the next generation of researchers.',
  objective: 'Seeking a tenured professorship position where I can continue groundbreaking research in artificial intelligence while contributing to academic excellence through teaching, mentoring, and collaborative research initiatives that bridge theory and practical applications.',
  skills: [
    {
      id: '1',
      name: 'Research Methodology',
      proficiency: 98,
      category: 'Academic Research',
      level: 98,
      yearsOfExperience: 12,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '2',
      name: 'Grant Writing',
      proficiency: 95,
      category: 'Funding',
      level: 95,
      yearsOfExperience: 10,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '3',
      name: 'Academic Publishing',
      proficiency: 96,
      category: 'Scholarly Communication',
      level: 96,
      yearsOfExperience: 12,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '4',
      name: 'Teaching',
      proficiency: 90,
      category: 'Education',
      level: 90,
      yearsOfExperience: 12,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '5',
      name: 'Machine Learning',
      proficiency: 95,
      category: 'Technical Expertise',
      level: 95,
      yearsOfExperience: 12,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '6',
      name: 'Deep Learning',
      proficiency: 93,
      category: 'Technical Expertise',
      level: 93,
      yearsOfExperience: 8,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '7',
      name: 'Natural Language Processing',
      proficiency: 92,
      category: 'Technical Expertise',
      level: 92,
      yearsOfExperience: 10,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '8',
      name: 'Python',
      proficiency: 95,
      category: 'Programming',
      level: 95,
      yearsOfExperience: 12,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '9',
      name: 'Statistical Analysis',
      proficiency: 90,
      category: 'Data Analysis',
      level: 90,
      yearsOfExperience: 12,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '10',
      name: 'Peer Review',
      proficiency: 94,
      category: 'Academic Service',
      level: 94,
      yearsOfExperience: 10,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '11',
      name: 'Student Mentoring',
      proficiency: 88,
      category: 'Academic Leadership',
      level: 88,
      yearsOfExperience: 10,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '12',
      name: 'Conference Presentation',
      proficiency: 92,
      category: 'Communication',
      level: 92,
      yearsOfExperience: 12,
      isCore: true,
      relevanceScore: 8
    }
  ],
  experiences: [
    {
      id: '1',
      company: 'Massachusetts Institute of Technology',
      position: 'Associate Professor of Computer Science',
      startDate: '2018-09',
      endDate: null,
      description: 'Leading research in artificial intelligence and machine learning with focus on deep learning applications. Teaching graduate and undergraduate courses while supervising PhD students and postdoctoral researchers. Serving on multiple academic committees and editorial boards.',
      achievements: [
        'Published 25+ papers in top-tier venues (NeurIPS, ICML, AAAI) with 1,800+ citations',
        'Secured $2.1M NSF grant for deep learning research over 3 years',
        'Mentored 8 PhD students and 15+ undergraduate researchers',
        'Achieved 4.8/5.0 teaching evaluation score across all courses',
        'Served as program committee member for 12+ international conferences'
      ],
      technologies: ['Python', 'TensorFlow', 'PyTorch', 'CUDA', 'Research Computing Clusters'],
      location: 'Cambridge, MA',
      employmentType: 'Full-time',
      industryContext: 'Higher Education',
      roleLevel: 'senior'
    },
    {
      id: '2',
      company: 'Stanford University',
      position: 'Assistant Professor of Computer Science',
      startDate: '2012-09',
      endDate: '2018-08',
      description: 'Conducted independent research in machine learning and natural language processing. Established research lab, taught courses, and built collaborative relationships with industry partners. Developed novel algorithms for text understanding and generation.',
      achievements: [
        'Published 20+ peer-reviewed papers with 700+ citations',
        'Received $1.1M DARPA Young Faculty Award for NLP research',
        'Established AI Research Lab with 12+ graduate students',
        'Won Best Paper Award at ACL 2016 for breakthrough in neural machine translation',
        'Collaborated with Google, Microsoft, and Facebook on research projects'
      ],
      technologies: ['Python', 'TensorFlow', 'Natural Language Toolkit', 'Distributed Computing'],
      location: 'Stanford, CA',
      employmentType: 'Full-time',
      industryContext: 'Higher Education',
      roleLevel: 'mid'
    },
    {
      id: '3',
      company: 'Carnegie Mellon University',
      position: 'Postdoctoral Research Fellow',
      startDate: '2010-09',
      endDate: '2012-08',
      description: 'Conducted advanced research in machine learning under supervision of leading AI researchers. Focused on developing novel algorithms for computer vision and pattern recognition with applications in autonomous systems.',
      achievements: [
        'Published 8 high-impact papers in computer vision conferences',
        'Developed novel deep learning architecture adopted by 50+ research groups',
        'Collaborated on $500K industry-sponsored research project',
        'Mentored 5+ graduate students in research methodologies',
        'Presented research at 15+ international conferences'
      ],
      technologies: ['MATLAB', 'Python', 'Computer Vision Libraries', 'Machine Learning Frameworks'],
      location: 'Pittsburgh, PA',
      employmentType: 'Full-time',
      industryContext: 'Academic Research',
      roleLevel: 'entry'
    }
  ],
  education: [
    {
      id: '1',
      institution: 'University of California, Berkeley',
      degree: 'Ph.D.',
      field: 'Computer Science',
      startDate: '2006-09',
      endDate: '2010-08',
      location: 'Berkeley, CA',
      gpa: '3.9',
      honors: ['Outstanding Graduate Student Award', 'NSF Graduate Research Fellowship'],
      relevantCoursework: ['Machine Learning', 'Artificial Intelligence', 'Computer Vision', 'Natural Language Processing', 'Statistical Learning Theory']
    },
    {
      id: '2',
      institution: 'University of California, Berkeley',
      degree: 'Master of Science',
      field: 'Computer Science',
      startDate: '2004-09',
      endDate: '2006-05',
      location: 'Berkeley, CA',
      gpa: '3.8',
      honors: ['Dean\'s List', 'Graduate Research Assistant'],
      relevantCoursework: ['Algorithms', 'Data Structures', 'Software Engineering', 'Database Systems']
    },
    {
      id: '3',
      institution: 'University of Washington',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2000-09',
      endDate: '2004-06',
      location: 'Seattle, WA',
      gpa: '3.9',
      honors: ['Summa Cum Laude', 'Phi Beta Kappa', 'Outstanding Senior Award'],
      relevantCoursework: ['Programming Languages', 'Computer Systems', 'Mathematics', 'Statistics']
    }
  ],
  projects: [
    {
      id: '1',
      title: 'Neural Language Understanding Framework',
      description: 'Developed comprehensive framework for neural language understanding combining transformer architectures with knowledge graphs. Created novel attention mechanisms that improved performance on multiple NLP benchmarks by 15-20%.',
      technologies: ['Python', 'PyTorch', 'Transformers', 'Knowledge Graphs', 'BERT', 'GPT'],
      startDate: '2019-01-01',
      endDate: '2021-12-01',
      images: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: 'Published in Nature Machine Intelligence, cited 300+ times, adopted by 20+ research groups worldwide',
      roleSpecific: true,
      metrics: {
        performance: '15-20% improvement on NLP benchmarks',
        adoption: 'Adopted by 20+ research groups worldwide',
        revenue: '$500K follow-up industry funding secured'
      }
    },
    {
      id: '2',
      title: 'Multimodal AI for Healthcare Diagnostics',
      description: 'Led interdisciplinary research project combining computer vision and natural language processing for automated medical diagnosis. Developed AI system that analyzes medical images and clinical notes to assist radiologists.',
      technologies: ['Python', 'TensorFlow', 'Medical Imaging Libraries', 'Clinical NLP', 'Deep Learning'],
      startDate: '2020-06-01',
      endDate: '2022-08-01',
      images: [
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: '92% diagnostic accuracy, collaboration with 3 major hospitals, potential for FDA approval',
      roleSpecific: true,
      metrics: {
        performance: '92% diagnostic accuracy on validation dataset',
        adoption: 'Pilot deployment in 3 major hospitals',
        efficiency: '40% reduction in diagnostic time'
      }
    },
    {
      id: '3',
      title: 'Open Source ML Education Platform',
      description: 'Created comprehensive open-source platform for machine learning education featuring interactive tutorials, coding exercises, and automated assessment tools. Designed to make ML education accessible to broader audiences.',
      technologies: ['Python', 'JavaScript', 'React', 'Jupyter Notebooks', 'Docker', 'Kubernetes'],
      startDate: '2021-01-01',
      endDate: '2022-12-01',
      images: [
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: '50,000+ users worldwide, adopted by 100+ universities, featured in top education conferences',
      roleSpecific: true,
      metrics: {
        users: '50,000+ registered users worldwide',
        adoption: 'Adopted by 100+ universities globally',
        efficiency: '60% improvement in student learning outcomes'
      }
    }
  ],
  achievements: [
    'Published 45+ peer-reviewed papers with 2,500+ total citations',
    'Principal Investigator on $3.2M in federal research grants',
    'NSF CAREER Award recipient for outstanding early-career research',
    'Best Paper Awards at ACL 2016 and NeurIPS 2019',
    'Editorial Board member for 3 top-tier AI journals',
    'Keynote speaker at 8+ international conferences',
    'Mentored 15+ PhD students with 100% graduation rate',
    'IEEE Fellow for contributions to machine learning and NLP',
    'Google Faculty Research Award recipient (2017, 2020)',
    'Outstanding Teaching Award from MIT (2019, 2021)'
  ],
  certifications: [
    {
      id: '1',
      name: 'IEEE Fellow',
      issuer: 'Institute of Electrical and Electronics Engineers',
      issueDate: '2020-01-01',
      credentialId: 'IEEE-FELLOW-2020-001',
      url: 'https://www.ieee.org/membership/fellows/'
    },
    {
      id: '2',
      name: 'NSF CAREER Award',
      issuer: 'National Science Foundation',
      issueDate: '2015-07-01',
      expiryDate: '2020-06-30',
      credentialId: 'NSF-CAREER-2015-001',
      url: 'https://www.nsf.gov/funding/pgm_summ.jsp?pims_id=503214'
    },
    {
      id: '3',
      name: 'Google Faculty Research Award',
      issuer: 'Google Research',
      issueDate: '2017-03-15',
      credentialId: 'GOOGLE-FRA-2017-001',
      url: 'https://research.google/outreach/faculty-research-awards/'
    }
  ],
  metadata: {
    targetRole: 'academic-researcher',
    industry: 'academia',
    experienceLevel: 'senior',
    lastUpdated: new Date(),
    contentVersion: '1.0.0',
    tags: ['research', 'grant-writing', 'academic-publishing', 'teaching', 'machine-learning', 'senior']
  }
};