import { TemplateSpecificContent } from '../templateSpecificContentService';

// K-12 Teacher Template Content
export const k12TeacherContent: TemplateSpecificContent = {
  templateId: 'k12-teacher',
  personalInfo: {
    name: 'Sarah Martinez',
    title: 'Elementary School Teacher',
    email: 'sarah.martinez@schooldistrict.edu',
    phone: '+1 (555) 123-4567',
    location: 'Austin, TX',
    website: 'sarahmartinez-educator.com',
    linkedin: 'linkedin.com/in/sarahmartinez-teacher',
    github: '',
    avatar: '',
  },
  professionalSummary: 'Dedicated Elementary School Teacher with 8+ years of experience creating engaging, inclusive learning environments for diverse student populations. Expert in curriculum development, differentiated instruction, and student assessment with proven track record of improving student achievement by 25% above district averages. Passionate about integrating technology and innovative teaching methods to enhance student learning outcomes.',
  objective: 'Seeking a teaching position where I can leverage my expertise in curriculum development, classroom management, and student-centered learning to inspire and educate the next generation while contributing to a collaborative school community focused on academic excellence.',
  skills: [
    {
      id: '1',
      name: 'Curriculum Development',
      proficiency: 95,
      category: 'Instructional Design',
      level: 95,
      yearsOfExperience: 8,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '2',
      name: 'Classroom Management',
      proficiency: 92,
      category: 'Teaching Skills',
      level: 92,
      yearsOfExperience: 8,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '3',
      name: 'Student Assessment',
      proficiency: 90,
      category: 'Evaluation',
      level: 90,
      yearsOfExperience: 8,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '4',
      name: 'Differentiated Instruction',
      proficiency: 88,
      category: 'Teaching Methods',
      level: 88,
      yearsOfExperience: 7,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '5',
      name: 'Educational Technology',
      proficiency: 85,
      category: 'Technology Integration',
      level: 85,
      yearsOfExperience: 6,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '6',
      name: 'Special Needs Education',
      proficiency: 82,
      category: 'Inclusive Education',
      level: 82,
      yearsOfExperience: 5,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '7',
      name: 'Parent Communication',
      proficiency: 90,
      category: 'Communication',
      level: 90,
      yearsOfExperience: 8,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '8',
      name: 'Lesson Planning',
      proficiency: 93,
      category: 'Instructional Planning',
      level: 93,
      yearsOfExperience: 8,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '9',
      name: 'Student Mentoring',
      proficiency: 87,
      category: 'Student Support',
      level: 87,
      yearsOfExperience: 7,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '10',
      name: 'Data-Driven Instruction',
      proficiency: 85,
      category: 'Assessment Analysis',
      level: 85,
      yearsOfExperience: 6,
      isCore: true,
      relevanceScore: 9
    }
  ],
  experiences: [
    {
      id: '1',
      company: 'Riverside Elementary School',
      position: 'Elementary School Teacher (Grade 3)',
      startDate: '2019-08',
      endDate: null,
      description: 'Teaching 3rd grade students in diverse classroom environment with 25+ students per class. Developing and implementing comprehensive curriculum aligned with state standards while incorporating innovative teaching methods and technology integration.',
      achievements: [
        'Improved student reading proficiency by 30% above district average through differentiated instruction',
        'Implemented project-based learning curriculum increasing student engagement by 40%',
        'Mentored 3 new teachers and served as grade-level team leader',
        'Achieved 95% parent satisfaction rate in annual evaluations',
        'Led school-wide technology integration initiative reaching 500+ students'
      ],
      technologies: ['Google Classroom', 'Smartboard Technology', 'Educational Apps', 'Assessment Software'],
      location: 'Austin, TX',
      employmentType: 'Full-time',
      industryContext: 'K-12 Education',
      roleLevel: 'mid'
    },
    {
      id: '2',
      company: 'Oakwood Elementary School',
      position: 'Elementary School Teacher (Grade 2)',
      startDate: '2016-08',
      endDate: '2019-06',
      description: 'Taught 2nd grade students with focus on foundational literacy and numeracy skills. Collaborated with special education team to support inclusive classroom environment and individualized learning plans.',
      achievements: [
        'Increased student math achievement scores by 25% through hands-on learning activities',
        'Developed reading intervention program serving 15+ struggling readers',
        'Coordinated parent-teacher conferences with 100% participation rate',
        'Received "Teacher of the Year" nomination for innovative teaching methods',
        'Led professional development workshop on classroom management for 20+ teachers'
      ],
      technologies: ['Interactive Whiteboards', 'Reading Assessment Tools', 'Learning Management Systems'],
      location: 'Austin, TX',
      employmentType: 'Full-time',
      industryContext: 'K-12 Education',
      roleLevel: 'entry'
    }
  ],
  education: [
    {
      id: '1',
      institution: 'University of Texas at Austin',
      degree: 'Master of Education',
      field: 'Elementary Education',
      startDate: '2014-09',
      endDate: '2016-05',
      location: 'Austin, TX',
      gpa: '3.8',
      honors: ['Dean\'s List', 'Outstanding Graduate Student Award'],
      relevantCoursework: ['Curriculum and Instruction', 'Educational Psychology', 'Assessment and Evaluation', 'Classroom Management', 'Special Education Law']
    },
    {
      id: '2',
      institution: 'Texas State University',
      degree: 'Bachelor of Science',
      field: 'Elementary Education',
      startDate: '2010-09',
      endDate: '2014-05',
      location: 'San Marcos, TX',
      gpa: '3.7',
      honors: ['Magna Cum Laude', 'Education Honor Society'],
      relevantCoursework: ['Child Development', 'Teaching Methods', 'Educational Technology', 'Literacy Instruction', 'Mathematics Education']
    }
  ],
  projects: [
    {
      id: '1',
      title: 'STEM Integration Program',
      description: 'Developed and implemented comprehensive STEM integration program for elementary students combining science, technology, engineering, and mathematics through hands-on projects and real-world problem solving.',
      technologies: ['Coding Platforms', 'Robotics Kits', 'Science Lab Equipment', 'Engineering Design Software'],
      startDate: '2020-09-01',
      endDate: '2021-06-01',
      images: [
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: '45% increase in student interest in STEM subjects, 35% improvement in problem-solving skills assessment scores',
      roleSpecific: true,
      metrics: {
        performance: '45% increase in student STEM interest',
        adoption: '100% teacher participation in program',
        efficiency: '35% improvement in problem-solving scores'
      }
    },
    {
      id: '2',
      title: 'Digital Literacy Curriculum',
      description: 'Created age-appropriate digital literacy curriculum teaching students essential computer skills, internet safety, and responsible technology use while integrating with core academic subjects.',
      technologies: ['Educational Software', 'Online Safety Tools', 'Digital Citizenship Platforms', 'Assessment Applications'],
      startDate: '2021-01-01',
      endDate: '2022-05-01',
      images: [
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: '90% of students achieved digital literacy benchmarks, adopted district-wide for 2,000+ students',
      roleSpecific: true,
      metrics: {
        performance: '90% student achievement of digital literacy benchmarks',
        adoption: 'District-wide implementation for 2,000+ students',
        efficiency: '50% reduction in technology-related classroom disruptions'
      }
    }
  ],
  achievements: [
    'Texas Elementary Teacher Certification (EC-6)',
    'Improved student achievement scores by 25% above district averages',
    'Teacher of the Year nominee for innovative teaching methods',
    'Led professional development workshops for 50+ educators',
    'Mentored 8+ new teachers and student teachers',
    'Served as grade-level team leader for 3 consecutive years',
    'Implemented technology integration program adopted district-wide',
    'Achieved 95% parent satisfaction rate in annual evaluations'
  ],
  certifications: [
    {
      id: '1',
      name: 'Texas Elementary Teacher Certification (EC-6)',
      issuer: 'Texas Education Agency',
      issueDate: '2014-06-15',
      expiryDate: '2025-06-15',
      credentialId: 'TX-CERT-EC6-2014-001',
      url: 'https://tea.texas.gov'
    },
    {
      id: '2',
      name: 'ESL Supplemental Certification',
      issuer: 'Texas Education Agency',
      issueDate: '2017-08-20',
      expiryDate: '2025-08-20',
      credentialId: 'TX-ESL-2017-001',
      url: 'https://tea.texas.gov'
    },
    {
      id: '3',
      name: 'Google for Education Certified Trainer',
      issuer: 'Google for Education',
      issueDate: '2020-03-10',
      expiryDate: '2024-03-10',
      credentialId: 'GOOGLE-EDU-2020-001',
      url: 'https://edu.google.com/teacher-center/'
    }
  ],
  metadata: {
    targetRole: 'k12-teacher',
    industry: 'education',
    experienceLevel: 'mid',
    lastUpdated: new Date(),
    contentVersion: '1.0.0',
    tags: ['curriculum-development', 'classroom-management', 'student-assessment', 'elementary-education', 'mid-level']
  }
};