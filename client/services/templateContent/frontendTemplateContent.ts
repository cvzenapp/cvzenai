import { TemplateSpecificContent, TEMPLATE_IDS } from '../templateSpecificContentService';

// Senior Frontend Developer Template Content
export const seniorFrontendDeveloperContent: TemplateSpecificContent = {
  templateId: TEMPLATE_IDS.FRONTEND_SENIOR,
  personalInfo: {
    name: 'Alexandra Chen',
    title: 'Senior Frontend Developer',
    email: 'alexandra.chen@frontend.dev',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA',
    website: 'alexandrachen.dev',
    linkedin: 'linkedin.com/in/alexandrachen',
    github: 'github.com/alexandrachen',
    avatar: '',
  },
  professionalSummary: 'Senior Frontend Developer with 7+ years of experience building scalable, high-performance web applications using React, TypeScript, and modern frontend technologies. Expert in frontend architecture, performance optimization, and user experience design. Led frontend teams and architected systems serving 10M+ users with 99.9% uptime.',
  objective: 'Seeking a Lead Frontend Developer or Frontend Architect role where I can leverage my expertise in modern web technologies and team leadership to build exceptional user experiences while mentoring the next generation of frontend developers.',
  skills: [
    {
      id: '1', name: 'React', proficiency: 95, category: 'Frontend Frameworks', level: 95, yearsOfExperience: 7, isCore: true, relevanceScore: 10
    },
    {
      id: '2', name: 'TypeScript', proficiency: 92, category: 'Programming Languages', level: 92, yearsOfExperience: 6, isCore: true, relevanceScore: 10
    },
    {
      id: '3', name: 'Next.js', proficiency: 90, category: 'React Frameworks', level: 90, yearsOfExperience: 5, isCore: true, relevanceScore: 9
    },
    {
      id: '4', name: 'GraphQL', proficiency: 88, category: 'API Technologies', level: 88, yearsOfExperience: 4, isCore: true, relevanceScore: 9
    },
    {
      id: '5', name: 'Webpack', proficiency: 85, category: 'Build Tools', level: 85, yearsOfExperience: 6, isCore: true, relevanceScore: 8
    },
    {
      id: '6', name: 'JavaScript', proficiency: 95, category: 'Programming Languages', level: 95, yearsOfExperience: 8, isCore: true, relevanceScore: 9
    },
    {
      id: '7', name: 'HTML5', proficiency: 95, category: 'Web Technologies', level: 95, yearsOfExperience: 8, isCore: true, relevanceScore: 8
    },
    {
      id: '8', name: 'CSS3', proficiency: 92, category: 'Web Technologies', level: 92, yearsOfExperience: 8, isCore: true, relevanceScore: 8
    },
    {
      id: '9', name: 'Sass/SCSS', proficiency: 88, category: 'CSS Preprocessors', level: 88, yearsOfExperience: 6, isCore: false, relevanceScore: 7
    },
    {
      id: '10', name: 'Tailwind CSS', proficiency: 85, category: 'CSS Frameworks', level: 85, yearsOfExperience: 3, isCore: false, relevanceScore: 7
    },
    {
      id: '11', name: 'Redux', proficiency: 90, category: 'State Management', level: 90, yearsOfExperience: 5, isCore: false, relevanceScore: 8
    },
    {
      id: '12', name: 'Jest', proficiency: 85, category: 'Testing Frameworks', level: 85, yearsOfExperience: 5, isCore: false, relevanceScore: 7
    },
    {
      id: '13', name: 'Cypress', proficiency: 80, category: 'E2E Testing', level: 80, yearsOfExperience: 3, isCore: false, relevanceScore: 6
    },
    {
      id: '14', name: 'Vite', proficiency: 82, category: 'Build Tools', level: 82, yearsOfExperience: 2, isCore: false, relevanceScore: 6
    },
    {
      id: '15', name: 'Node.js', proficiency: 78, category: 'Runtime Environments', level: 78, yearsOfExperience: 4, isCore: false, relevanceScore: 6
    }
  ],
  experiences: [
    {
      id: '1',
      company: 'TechFlow Solutions',
      position: 'Senior Frontend Developer',
      startDate: '2021-01',
      endDate: null,
      description: 'Leading frontend development for enterprise SaaS platform serving 10M+ users. Responsible for frontend architecture, performance optimization, and mentoring junior developers. Built scalable React applications with modern tooling and best practices.',
      achievements: [
        'Architected micro-frontend system reducing bundle size by 40% and improving load times by 60%',
        'Led team of 5 frontend developers delivering 15+ major features with 99.9% uptime',
        'Implemented performance monitoring reducing page load times from 3.2s to 800ms',
        'Built design system used across 12 products, improving development velocity by 50%',
        'Mentored 8 junior developers, with 6 receiving promotions within 18 months'
      ],
      technologies: ['React', 'TypeScript', 'Next.js', 'GraphQL', 'Webpack', 'Tailwind CSS'],
      location: 'San Francisco, CA',
      employmentType: 'Full-time',
      industryContext: 'SaaS Technology',
      roleLevel: 'senior'
    },
    {
      id: '2',
      company: 'DigitalCraft Agency',
      position: 'Frontend Developer',
      startDate: '2018-03',
      endDate: '2020-12',
      description: 'Developed responsive web applications and e-commerce platforms for diverse clients. Focused on performance optimization, accessibility, and modern frontend development practices using React and Vue.js.',
      achievements: [
        'Built 25+ responsive websites with 98% client satisfaction rate',
        'Improved e-commerce conversion rates by 35% through UX/performance optimizations',
        'Implemented automated testing pipeline reducing bugs in production by 70%',
        'Led frontend modernization project migrating legacy jQuery apps to React'
      ],
      technologies: ['React', 'Vue.js', 'JavaScript', 'Sass', 'Webpack', 'Jest'],
      location: 'San Francisco, CA',
      employmentType: 'Full-time',
      industryContext: 'Digital Agency',
      roleLevel: 'mid'
    },
    {
      id: '3',
      company: 'StartupLab Inc',
      position: 'Frontend Developer',
      startDate: '2016-06',
      endDate: '2018-02',
      description: 'Built user interfaces for early-stage startup products using modern JavaScript frameworks. Collaborated closely with designers and backend developers to create seamless user experiences.',
      achievements: [
        'Developed MVP frontend for 3 successful product launches',
        'Implemented responsive design system used across all company products',
        'Reduced development time by 30% through component reusability',
        'Achieved 95+ Lighthouse performance scores across all applications'
      ],
      technologies: ['React', 'JavaScript', 'CSS3', 'Redux', 'Webpack'],
      location: 'San Francisco, CA',
      employmentType: 'Full-time',
      industryContext: 'Startup',
      roleLevel: 'mid'
    }
  ],
  education: [
    {
      id: '1',
      institution: 'UC Berkeley',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2012-09',
      endDate: '2016-05',
      location: 'Berkeley, CA',
      gpa: '3.7',
      honors: ['Dean\'s List (6 semesters)', 'Computer Science Honor Society'],
      relevantCoursework: ['Web Development', 'Human-Computer Interaction', 'Software Engineering', 'Data Structures', 'Algorithms']
    }
  ],
  projects: [
    {
      id: '1',
      title: 'Real-time Collaboration Platform',
      description: 'Built real-time collaborative web application using React, TypeScript, and WebSockets. Features include live document editing, video chat, and file sharing with support for 1000+ concurrent users.',
      technologies: ['React', 'TypeScript', 'Next.js', 'WebSockets', 'Redis', 'PostgreSQL'],
      startDate: '2022-06-01',
      endDate: '2023-02-01',
      url: 'https://collab-platform.com',
      github: 'github.com/alexandrachen/collab-platform',
      images: [
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: '1000+ concurrent users, 99.9% uptime, 40% faster than competitors',
      roleSpecific: true,
      metrics: {
        performance: '99.9% uptime, <200ms response time',
        adoption: '1000+ concurrent users',
        efficiency: '40% faster than competitor solutions'
      }
    },
    {
      id: '2',
      title: 'E-commerce Performance Optimization',
      description: 'Led comprehensive performance optimization of e-commerce platform serving 500K+ monthly users. Implemented code splitting, lazy loading, and advanced caching strategies resulting in significant performance improvements.',
      technologies: ['React', 'Next.js', 'Webpack', 'Service Workers', 'CDN', 'GraphQL'],
      startDate: '2021-09-01',
      endDate: '2022-05-01',
      images: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: '60% faster load times, 25% increase in conversion rate, $2M additional revenue',
      roleSpecific: true,
      metrics: {
        performance: '60% faster load times',
        revenue: '$2M additional revenue',
        adoption: '25% increase in conversion rate'
      }
    },
    {
      id: '3',
      title: 'Component Library & Design System',
      description: 'Architected and built comprehensive React component library with TypeScript, Storybook, and automated testing. Library is used across 12 products with 50+ reusable components and comprehensive documentation.',
      technologies: ['React', 'TypeScript', 'Storybook', 'Jest', 'Rollup', 'CSS-in-JS'],
      startDate: '2020-11-01',
      endDate: '2021-08-01',
      github: 'github.com/alexandrachen/design-system',
      images: [
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: '50% faster development, 80% code reusability, adopted by 12 products',
      roleSpecific: true,
      metrics: {
        efficiency: '50% faster development time',
        adoption: 'Used across 12 products',
        performance: '80% code reusability'
      }
    }
  ],
  achievements: [
    'Led frontend architecture for applications serving 10M+ users',
    'Speaker at 5+ frontend development conferences and meetups',
    'Open source contributor with 2K+ GitHub stars across projects',
    'Mentor to 15+ junior frontend developers',
    'Technical blog with 50K+ monthly readers',
    'Winner of company innovation award for performance optimization work'
  ],
  certifications: [
    {
      id: '1',
      name: 'AWS Certified Developer - Associate',
      issuer: 'Amazon Web Services',
      issueDate: '2022-08',
      credentialId: 'AWS-DEV-2022-001'
    },
    {
      id: '2',
      name: 'Google Mobile Web Specialist',
      issuer: 'Google',
      issueDate: '2021-05',
      credentialId: 'GMWS-2021-001'
    }
  ],
  metadata: {
    targetRole: 'frontend-developer',
    industry: 'technology',
    experienceLevel: 'senior',
    lastUpdated: new Date(),
    contentVersion: '1.0.0',
    tags: ['frontend', 'react', 'typescript', 'nextjs', 'senior', 'architecture']
  }
};

// Junior Frontend Developer Template Content
export const juniorFrontendDeveloperContent: TemplateSpecificContent = {
  templateId: TEMPLATE_IDS.FRONTEND_JUNIOR,
  personalInfo: {
    name: 'Michael Johnson',
    title: 'Frontend Developer',
    email: 'michael.johnson@frontend.dev',
    phone: '+1 (555) 345-6789',
    location: 'Portland, OR',
    website: 'michaeljohnson.dev',
    linkedin: 'linkedin.com/in/michaeljohnson',
    github: 'github.com/michaeljohnson',
    avatar: '',
  },
  professionalSummary: 'Motivated Frontend Developer with 2+ years of experience building responsive web applications using HTML, CSS, JavaScript, and React. Strong foundation in modern web development practices with passion for creating intuitive user interfaces and continuously learning new technologies.',
  objective: 'Seeking a Frontend Developer position where I can apply my technical skills and creativity to build engaging user experiences while growing my expertise in advanced frontend technologies and best practices.',
  skills: [
    {
      id: '1', name: 'HTML5', proficiency: 85, category: 'Web Technologies', level: 85, yearsOfExperience: 2.5, isCore: true, relevanceScore: 9
    },
    {
      id: '2', name: 'CSS3', proficiency: 82, category: 'Web Technologies', level: 82, yearsOfExperience: 2.5, isCore: true, relevanceScore: 9
    },
    {
      id: '3', name: 'JavaScript', proficiency: 78, category: 'Programming Languages', level: 78, yearsOfExperience: 2, isCore: true, relevanceScore: 10
    },
    {
      id: '4', name: 'React', proficiency: 75, category: 'Frontend Frameworks', level: 75, yearsOfExperience: 1.5, isCore: true, relevanceScore: 10
    },
    {
      id: '5', name: 'Git', proficiency: 70, category: 'Version Control', level: 70, yearsOfExperience: 2, isCore: true, relevanceScore: 8
    },
    {
      id: '6', name: 'Responsive Design', proficiency: 80, category: 'Design Skills', level: 80, yearsOfExperience: 2, isCore: true, relevanceScore: 9
    },
    {
      id: '7', name: 'Sass/SCSS', proficiency: 72, category: 'CSS Preprocessors', level: 72, yearsOfExperience: 1, isCore: false, relevanceScore: 7
    },
    {
      id: '8', name: 'Bootstrap', proficiency: 75, category: 'CSS Frameworks', level: 75, yearsOfExperience: 1.5, isCore: false, relevanceScore: 6
    },
    {
      id: '9', name: 'jQuery', proficiency: 68, category: 'JavaScript Libraries', level: 68, yearsOfExperience: 1, isCore: false, relevanceScore: 5
    },
    {
      id: '10', name: 'Webpack', proficiency: 60, category: 'Build Tools', level: 60, yearsOfExperience: 0.5, isCore: false, relevanceScore: 6
    },
    {
      id: '11', name: 'NPM', proficiency: 65, category: 'Package Managers', level: 65, yearsOfExperience: 1.5, isCore: false, relevanceScore: 6
    },
    {
      id: '12', name: 'REST APIs', proficiency: 70, category: 'API Technologies', level: 70, yearsOfExperience: 1, isCore: false, relevanceScore: 7
    },
    {
      id: '13', name: 'Figma', proficiency: 65, category: 'Design Tools', level: 65, yearsOfExperience: 1, isCore: false, relevanceScore: 6
    },
    {
      id: '14', name: 'TypeScript', proficiency: 55, category: 'Programming Languages', level: 55, yearsOfExperience: 0.5, isCore: false, relevanceScore: 7
    }
  ],
  experiences: [
    {
      id: '1',
      company: 'WebCraft Studios',
      position: 'Frontend Developer',
      startDate: '2022-08',
      endDate: null,
      description: 'Developing responsive websites and web applications for small to medium-sized businesses. Collaborating with designers and backend developers to create user-friendly interfaces and implement modern web development practices.',
      achievements: [
        'Built 12+ responsive websites with 95% client satisfaction rate',
        'Improved website loading speed by 40% through image optimization and code minification',
        'Implemented accessibility features achieving WCAG 2.1 AA compliance',
        'Collaborated on team project that increased client conversion rates by 25%'
      ],
      technologies: ['HTML5', 'CSS3', 'JavaScript', 'React', 'Sass', 'Bootstrap'],
      location: 'Portland, OR',
      employmentType: 'Full-time',
      industryContext: 'Web Development Agency',
      roleLevel: 'entry'
    },
    {
      id: '2',
      company: 'TechStart Solutions',
      position: 'Junior Web Developer',
      startDate: '2021-06',
      endDate: '2022-07',
      description: 'Assisted in developing and maintaining company websites and internal tools. Gained experience in modern web development practices, version control, and collaborative development workflows.',
      achievements: [
        'Contributed to 8 web development projects from concept to deployment',
        'Fixed 50+ bugs and implemented 20+ feature requests',
        'Learned React and modern JavaScript frameworks through mentorship program',
        'Improved code quality through peer reviews and testing practices'
      ],
      technologies: ['HTML5', 'CSS3', 'JavaScript', 'jQuery', 'Git', 'Bootstrap'],
      location: 'Portland, OR',
      employmentType: 'Full-time',
      industryContext: 'Technology Startup',
      roleLevel: 'entry'
    },
    {
      id: '3',
      company: 'Freelance',
      position: 'Web Developer',
      startDate: '2020-09',
      endDate: '2021-05',
      description: 'Provided web development services to local businesses and individuals. Built custom websites, landing pages, and simple web applications while learning modern web development technologies.',
      achievements: [
        'Completed 15+ freelance projects with 100% client satisfaction',
        'Built portfolio website showcasing technical skills and projects',
        'Learned responsive design principles and mobile-first development',
        'Established client relationships leading to repeat business and referrals'
      ],
      technologies: ['HTML5', 'CSS3', 'JavaScript', 'WordPress', 'Photoshop'],
      location: 'Portland, OR',
      employmentType: 'Freelance',
      industryContext: 'Freelance',
      roleLevel: 'entry'
    }
  ],
  education: [
    {
      id: '1',
      institution: 'Portland State University',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2017-09',
      endDate: '2021-05',
      location: 'Portland, OR',
      gpa: '3.4',
      honors: ['Dean\'s List (2 semesters)'],
      relevantCoursework: ['Web Development', 'Software Engineering', 'Database Systems', 'User Interface Design', 'Data Structures', 'Algorithms']
    }
  ],
  projects: [
    {
      id: '1',
      title: 'Personal Portfolio Website',
      description: 'Built responsive portfolio website using React and modern CSS techniques. Features include project showcase, contact form, and blog section with clean, professional design and smooth animations.',
      technologies: ['React', 'CSS3', 'JavaScript', 'Netlify', 'Git'],
      startDate: '2023-01-01',
      endDate: '2023-03-01',
      url: 'https://michaeljohnson.dev',
      github: 'github.com/michaeljohnson/portfolio',
      impact: '500+ monthly visitors, 15+ project inquiries generated',
      roleSpecific: true,
      metrics: {
        adoption: '500+ monthly visitors',
        performance: '95+ Lighthouse score',
        efficiency: '15+ project inquiries generated'
      }
    },
    {
      id: '2',
      title: 'Task Management Web App',
      description: 'Developed full-featured task management application using React with local storage persistence. Includes task creation, editing, filtering, and drag-and-drop functionality with responsive design.',
      technologies: ['React', 'JavaScript', 'CSS3', 'Local Storage', 'React DnD'],
      startDate: '2022-10-01',
      endDate: '2023-01-01',
      github: 'github.com/michaeljohnson/task-manager',
      impact: 'Featured in university project showcase, 100+ GitHub stars',
      roleSpecific: true,
      metrics: {
        adoption: '100+ GitHub stars',
        performance: 'Featured in university showcase',
        efficiency: 'Fully responsive design'
      }
    },
    {
      id: '3',
      title: 'Restaurant Landing Page',
      description: 'Created modern, responsive landing page for local restaurant using HTML5, CSS3, and JavaScript. Features include menu display, reservation system integration, and image gallery with mobile-first design approach.',
      technologies: ['HTML5', 'CSS3', 'JavaScript', 'Sass', 'Git'],
      startDate: '2022-05-01',
      endDate: '2022-08-01',
      url: 'https://restaurant-demo.netlify.app',
      github: 'github.com/michaeljohnson/restaurant-landing',
      impact: '30% increase in online reservations, 95+ Lighthouse score',
      roleSpecific: true,
      metrics: {
        performance: '95+ Lighthouse score',
        revenue: '30% increase in online reservations',
        adoption: 'Client testimonial featured on website'
      }
    }
  ],
  achievements: [
    'Completed freeCodeCamp Responsive Web Design Certification',
    'Active contributor to open source projects with 200+ GitHub contributions',
    'Volunteer web developer for local non-profit organization',
    'Winner of university hackathon frontend development category'
  ],
  certifications: [
    {
      id: '1',
      name: 'freeCodeCamp Responsive Web Design',
      issuer: 'freeCodeCamp',
      issueDate: '2021-08',
      credentialId: 'FCC-RWD-2021-001'
    },
    {
      id: '2',
      name: 'Google UX Design Certificate',
      issuer: 'Google',
      issueDate: '2022-03',
      credentialId: 'GUXD-2022-001'
    }
  ],
  metadata: {
    targetRole: 'frontend-developer',
    industry: 'technology',
    experienceLevel: 'entry',
    lastUpdated: new Date(),
    contentVersion: '1.0.0',
    tags: ['frontend', 'html', 'css', 'javascript', 'react', 'entry-level']
  }
};