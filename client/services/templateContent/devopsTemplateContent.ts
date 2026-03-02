import { TemplateSpecificContent, TEMPLATE_IDS } from '../templateSpecificContentService';

// Senior DevOps Engineer Template Content
export const seniorDevOpsEngineerContent: TemplateSpecificContent = {
  templateId: TEMPLATE_IDS.DEVOPS_SENIOR,
  personalInfo: {
    name: 'Marcus Rodriguez',
    title: 'Senior DevOps Engineer',
    email: 'marcus.rodriguez@devops.com',
    phone: '+1 (555) 234-5678',
    location: 'Seattle, WA',
    website: 'marcusdevops.dev',
    linkedin: 'linkedin.com/in/marcusrodriguez',
    github: 'github.com/marcusdevops',
    avatar: '',
  },
  professionalSummary: 'Senior DevOps Engineer with 8+ years of experience building and maintaining scalable cloud infrastructure. Expert in containerization, CI/CD pipelines, and infrastructure as code. Led DevOps transformation initiatives that reduced deployment time by 75% and improved system reliability to 99.9% uptime. Passionate about automation, monitoring, and creating robust, secure systems that enable rapid software delivery.',
  objective: 'Seeking a Principal DevOps Engineer role where I can leverage my expertise in cloud architecture and automation to lead infrastructure modernization initiatives and mentor engineering teams in DevOps best practices.',
  skills: [
    {
      id: '1',
      name: 'Docker',
      proficiency: 95,
      category: 'Containerization',
      level: 95,
      yearsOfExperience: 6,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '2',
      name: 'Kubernetes',
      proficiency: 90,
      category: 'Container Orchestration',
      level: 90,
      yearsOfExperience: 5,
      isCore: true,
      relevanceScore: 10
    },
    {
      id: '3',
      name: 'AWS',
      proficiency: 92,
      category: 'Cloud Platforms',
      level: 92,
      yearsOfExperience: 7,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '4',
      name: 'Terraform',
      proficiency: 88,
      category: 'Infrastructure as Code',
      level: 88,
      yearsOfExperience: 4,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '5',
      name: 'Jenkins',
      proficiency: 85,
      category: 'CI/CD',
      level: 85,
      yearsOfExperience: 6,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '6',
      name: 'Prometheus',
      proficiency: 82,
      category: 'Monitoring',
      level: 82,
      yearsOfExperience: 4,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '7',
      name: 'Ansible',
      proficiency: 80,
      category: 'Configuration Management',
      level: 80,
      yearsOfExperience: 5,
      isCore: true,
      relevanceScore: 7
    },
    {
      id: '8',
      name: 'Python',
      proficiency: 85,
      category: 'Programming Languages',
      level: 85,
      yearsOfExperience: 8,
      isCore: true,
      relevanceScore: 7
    }
  ],
  experiences: [
    {
      id: '1',
      company: 'CloudTech Solutions',
      position: 'Senior DevOps Engineer',
      startDate: '2021-03',
      endDate: null,
      description: 'Leading DevOps initiatives for a cloud-native SaaS platform serving 500K+ users. Responsible for infrastructure automation, deployment pipelines, system monitoring, and security compliance. Managing multi-cloud architecture across AWS and GCP with focus on cost optimization and performance.',
      achievements: [
        'Reduced deployment time from 2 hours to 15 minutes using automated CI/CD pipelines',
        'Achieved 99.9% uptime through proactive monitoring and automated incident response',
        'Implemented infrastructure as code reducing provisioning time by 80%',
        'Led migration to Kubernetes, improving resource utilization by 60%',
        'Established security scanning in CI/CD pipeline, reducing vulnerabilities by 90%'
      ],
      technologies: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'Jenkins', 'Prometheus', 'Grafana'],
      location: 'Seattle, WA',
      employmentType: 'Full-time',
      industryContext: 'SaaS',
      roleLevel: 'senior'
    },
    {
      id: '2',
      company: 'TechStart Inc',
      position: 'DevOps Engineer',
      startDate: '2019-01',
      endDate: '2021-02',
      description: 'Built DevOps practices from ground up for a fast-growing startup. Designed and implemented CI/CD pipelines, monitoring systems, and cloud infrastructure. Collaborated with development teams to establish deployment best practices and automated testing workflows.',
      achievements: [
        'Designed and implemented complete CI/CD pipeline reducing manual deployments by 100%',
        'Set up comprehensive monitoring stack with Prometheus and Grafana',
        'Automated infrastructure provisioning using Terraform and Ansible',
        'Implemented blue-green deployment strategy reducing deployment risk',
        'Established disaster recovery procedures with 4-hour RTO'
      ],
      technologies: ['Docker', 'AWS', 'Jenkins', 'Terraform', 'Ansible', 'Prometheus', 'Python'],
      location: 'San Francisco, CA',
      employmentType: 'Full-time',
      industryContext: 'Startup',
      roleLevel: 'mid'
    },
    {
      id: '3',
      company: 'Enterprise Systems Corp',
      position: 'Systems Administrator',
      startDate: '2016-06',
      endDate: '2018-12',
      description: 'Managed on-premises and hybrid cloud infrastructure for enterprise applications. Responsible for server maintenance, backup systems, and network security. Initiated automation projects that improved operational efficiency and reduced manual tasks.',
      achievements: [
        'Managed 200+ servers with 99.5% uptime',
        'Implemented automated backup system reducing recovery time by 50%',
        'Led migration of legacy applications to cloud infrastructure',
        'Developed monitoring scripts that reduced incident response time by 40%'
      ],
      technologies: ['Linux', 'VMware', 'AWS', 'Python', 'Bash', 'Nagios'],
      location: 'Austin, TX',
      employmentType: 'Full-time',
      industryContext: 'Enterprise',
      roleLevel: 'entry'
    }
  ],
  education: [
    {
      id: '1',
      institution: 'University of Texas at Austin',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2012-09',
      endDate: '2016-05',
      location: 'Austin, TX',
      gpa: '3.7',
      relevantCoursework: ['Operating Systems', 'Computer Networks', 'Database Systems', 'Software Engineering']
    }
  ],
  projects: [
    {
      id: '1',
      title: 'Multi-Cloud Infrastructure Migration',
      description: 'Led comprehensive migration of legacy monolithic infrastructure to modern multi-cloud architecture using Kubernetes and Terraform. Implemented automated deployment pipelines, monitoring systems, and disaster recovery procedures. Project involved 50+ microservices and zero-downtime migration strategy.',
      technologies: ['Kubernetes', 'Terraform', 'AWS', 'GCP', 'Prometheus', 'Grafana', 'Helm'],
      startDate: '2022-01-01',
      endDate: '2022-08-01',
      url: 'https://cloudtech-migration.example.com',
      github: 'github.com/marcusdevops/multi-cloud-migration',
      images: [
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: 'Reduced infrastructure costs by 40% and improved deployment reliability by 85%',
      roleSpecific: true,
      metrics: {
        performance: '85% improvement in deployment reliability',
        efficiency: '40% reduction in infrastructure costs',
        adoption: 'Zero-downtime migration for 500K+ users'
      }
    },
    {
      id: '2',
      title: 'Automated Security Compliance Pipeline',
      description: 'Developed comprehensive security scanning and compliance automation system integrated into CI/CD pipeline. Implemented container vulnerability scanning, infrastructure security checks, and automated compliance reporting for SOC 2 and ISO 27001 standards.',
      technologies: ['Jenkins', 'Docker', 'Trivy', 'Terraform', 'Python', 'AWS Security Hub'],
      startDate: '2021-09-01',
      endDate: '2022-03-01',
      github: 'github.com/marcusdevops/security-pipeline',
      images: [
        'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: 'Reduced security vulnerabilities by 90% and achieved SOC 2 compliance',
      roleSpecific: true,
      metrics: {
        performance: '90% reduction in security vulnerabilities',
        efficiency: 'Automated 80% of compliance checks'
      }
    },
    {
      id: '3',
      title: 'High-Availability Monitoring Stack',
      description: 'Designed and implemented enterprise-grade monitoring and alerting system using Prometheus, Grafana, and custom Python scripts. Created comprehensive dashboards for infrastructure metrics, application performance, and business KPIs with intelligent alerting rules.',
      technologies: ['Prometheus', 'Grafana', 'Python', 'Kubernetes', 'Helm', 'AlertManager'],
      startDate: '2020-06-01',
      endDate: '2020-12-01',
      github: 'github.com/marcusdevops/monitoring-stack',
      images: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: 'Reduced mean time to detection (MTTD) by 70% and improved system observability',
      roleSpecific: true,
      metrics: {
        performance: '70% reduction in MTTD',
        efficiency: '99.9% monitoring system uptime'
      }
    }
  ],
  achievements: [
    'AWS Certified DevOps Engineer - Professional',
    'Kubernetes Certified Administrator (CKA)',
    'Led DevOps transformation reducing deployment time by 75%',
    'Achieved 99.9% system uptime across multiple production environments',
    'Mentored 5 junior engineers in DevOps practices and cloud technologies',
    'Speaker at DevOps Seattle meetup on "Infrastructure as Code Best Practices"'
  ],
  certifications: [
    {
      id: '1',
      name: 'AWS Certified DevOps Engineer - Professional',
      issuer: 'Amazon Web Services',
      issueDate: '2022-03-15',
      expiryDate: '2025-03-15',
      credentialId: 'AWS-DEVOPS-PRO-2022-001',
      url: 'https://aws.amazon.com/certification/certified-devops-engineer-professional/'
    },
    {
      id: '2',
      name: 'Certified Kubernetes Administrator (CKA)',
      issuer: 'Cloud Native Computing Foundation',
      issueDate: '2021-08-20',
      expiryDate: '2024-08-20',
      credentialId: 'CKA-2021-001',
      url: 'https://www.cncf.io/certification/cka/'
    },
    {
      id: '3',
      name: 'HashiCorp Certified: Terraform Associate',
      issuer: 'HashiCorp',
      issueDate: '2021-05-10',
      expiryDate: '2023-05-10',
      credentialId: 'TERRAFORM-ASSOC-2021-001'
    }
  ],
  metadata: {
    targetRole: 'devops-engineer',
    industry: 'technology',
    experienceLevel: 'senior',
    lastUpdated: new Date(),
    contentVersion: '1.0.0',
    tags: ['devops', 'cloud', 'kubernetes', 'aws', 'automation', 'senior']
  }
};

// Junior DevOps Engineer Template Content
export const juniorDevOpsEngineerContent: TemplateSpecificContent = {
  templateId: TEMPLATE_IDS.DEVOPS_JUNIOR,
  personalInfo: {
    name: 'Alex Chen',
    title: 'DevOps Engineer',
    email: 'alex.chen@devops.com',
    phone: '+1 (555) 345-6789',
    location: 'Austin, TX',
    website: 'alexchen.dev',
    linkedin: 'linkedin.com/in/alexchen',
    github: 'github.com/alexchen',
    avatar: '',
  },
  professionalSummary: 'Motivated DevOps Engineer with 2+ years of experience in cloud infrastructure and automation. Skilled in containerization, CI/CD pipelines, and infrastructure monitoring. Passionate about learning new technologies and contributing to efficient, scalable systems. Strong foundation in Linux systems administration and cloud platforms.',
  objective: 'Seeking a DevOps Engineer role where I can grow my expertise in cloud infrastructure and automation while contributing to building reliable, scalable systems that support rapid software development and deployment.',
  skills: [
    {
      id: '1',
      name: 'Docker',
      proficiency: 75,
      category: 'Containerization',
      level: 75,
      yearsOfExperience: 2,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '2',
      name: 'AWS',
      proficiency: 70,
      category: 'Cloud Platforms',
      level: 70,
      yearsOfExperience: 2,
      isCore: true,
      relevanceScore: 9
    },
    {
      id: '3',
      name: 'Jenkins',
      proficiency: 65,
      category: 'CI/CD',
      level: 65,
      yearsOfExperience: 1.5,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '4',
      name: 'Linux',
      proficiency: 80,
      category: 'Operating Systems',
      level: 80,
      yearsOfExperience: 3,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '5',
      name: 'Python',
      proficiency: 70,
      category: 'Programming Languages',
      level: 70,
      yearsOfExperience: 2,
      isCore: true,
      relevanceScore: 7
    },
    {
      id: '6',
      name: 'Git',
      proficiency: 85,
      category: 'Version Control',
      level: 85,
      yearsOfExperience: 3,
      isCore: true,
      relevanceScore: 7
    },
    {
      id: '7',
      name: 'Terraform',
      proficiency: 60,
      category: 'Infrastructure as Code',
      level: 60,
      yearsOfExperience: 1,
      isCore: true,
      relevanceScore: 8
    },
    {
      id: '8',
      name: 'Kubernetes',
      proficiency: 55,
      category: 'Container Orchestration',
      level: 55,
      yearsOfExperience: 1,
      isCore: true,
      relevanceScore: 8
    }
  ],
  experiences: [
    {
      id: '1',
      company: 'StartupTech Solutions',
      position: 'DevOps Engineer',
      startDate: '2022-06',
      endDate: null,
      description: 'Supporting DevOps operations for a growing SaaS platform. Responsible for maintaining CI/CD pipelines, monitoring system health, and assisting with infrastructure automation. Working closely with development teams to improve deployment processes and system reliability.',
      achievements: [
        'Improved deployment pipeline efficiency by 30% through optimization',
        'Set up monitoring dashboards reducing incident response time by 25%',
        'Automated routine maintenance tasks saving 10 hours per week',
        'Assisted in migration of 5 applications to containerized environment',
        'Implemented backup automation reducing manual backup time by 80%'
      ],
      technologies: ['Docker', 'AWS', 'Jenkins', 'Python', 'Linux', 'Git'],
      location: 'Austin, TX',
      employmentType: 'Full-time',
      industryContext: 'SaaS',
      roleLevel: 'entry'
    },
    {
      id: '2',
      company: 'TechCorp',
      position: 'Junior Systems Administrator',
      startDate: '2021-08',
      endDate: '2022-05',
      description: 'Provided technical support for Linux servers and cloud infrastructure. Assisted with system maintenance, user account management, and basic automation tasks. Gained experience with cloud platforms and infrastructure monitoring tools.',
      achievements: [
        'Maintained 99.2% server uptime across 50+ Linux systems',
        'Created automated scripts for user account provisioning',
        'Assisted with cloud migration project for 10 applications',
        'Implemented log rotation and cleanup procedures'
      ],
      technologies: ['Linux', 'AWS', 'Bash', 'Python', 'Nagios'],
      location: 'Austin, TX',
      employmentType: 'Full-time',
      industryContext: 'Technology Services',
      roleLevel: 'entry'
    }
  ],
  education: [
    {
      id: '1',
      institution: 'University of Texas at Austin',
      degree: 'Bachelor of Science',
      field: 'Information Technology',
      startDate: '2017-09',
      endDate: '2021-05',
      location: 'Austin, TX',
      gpa: '3.5',
      relevantCoursework: ['Network Administration', 'Linux Systems', 'Cloud Computing', 'Database Management']
    }
  ],
  projects: [
    {
      id: '1',
      title: 'Personal CI/CD Pipeline',
      description: 'Built a complete CI/CD pipeline for personal projects using Jenkins, Docker, and AWS. Implemented automated testing, building, and deployment processes for web applications. Includes monitoring and alerting for deployment status.',
      technologies: ['Jenkins', 'Docker', 'AWS', 'Python', 'Git'],
      startDate: '2023-01-01',
      endDate: '2023-04-01',
      github: 'github.com/alexchen/personal-cicd',
      impact: 'Reduced personal project deployment time from 30 minutes to 5 minutes',
      roleSpecific: true,
      metrics: {
        efficiency: '83% reduction in deployment time'
      }
    },
    {
      id: '2',
      title: 'Infrastructure Monitoring Dashboard',
      description: 'Created a comprehensive monitoring dashboard using Grafana and Prometheus for tracking system metrics. Implemented custom alerts for CPU, memory, and disk usage. Includes automated reporting for weekly system health summaries.',
      technologies: ['Grafana', 'Prometheus', 'Python', 'Linux'],
      startDate: '2022-09-01',
      endDate: '2022-12-01',
      github: 'github.com/alexchen/monitoring-dashboard',
      impact: 'Improved system visibility and reduced incident detection time by 40%',
      roleSpecific: true,
      metrics: {
        performance: '40% faster incident detection'
      }
    },
    {
      id: '3',
      title: 'Automated Backup System',
      description: 'Developed automated backup solution for database and application files using Python and AWS S3. Implemented scheduling, compression, and retention policies. Includes monitoring and alerting for backup success/failure.',
      technologies: ['Python', 'AWS S3', 'Linux', 'Cron'],
      startDate: '2022-03-01',
      endDate: '2022-06-01',
      github: 'github.com/alexchen/backup-automation',
      impact: 'Automated 100% of manual backup processes and improved reliability',
      roleSpecific: true,
      metrics: {
        efficiency: '100% automation of backup processes'
      }
    }
  ],
  achievements: [
    'AWS Certified Cloud Practitioner',
    'Completed Docker and Kubernetes online certification',
    'Improved deployment efficiency by 30% in first year',
    'Active contributor to open-source DevOps tools',
    'Volunteer mentor for coding bootcamp students'
  ],
  certifications: [
    {
      id: '1',
      name: 'AWS Certified Cloud Practitioner',
      issuer: 'Amazon Web Services',
      issueDate: '2022-09-15',
      expiryDate: '2025-09-15',
      credentialId: 'AWS-CCP-2022-001'
    },
    {
      id: '2',
      name: 'Docker Certified Associate',
      issuer: 'Docker',
      issueDate: '2023-01-10',
      expiryDate: '2025-01-10',
      credentialId: 'DOCKER-ASSOC-2023-001'
    }
  ],
  metadata: {
    targetRole: 'devops-engineer',
    industry: 'technology',
    experienceLevel: 'entry',
    lastUpdated: new Date(),
    contentVersion: '1.0.0',
    tags: ['devops', 'cloud', 'aws', 'docker', 'automation', 'junior', 'entry-level']
  }
};