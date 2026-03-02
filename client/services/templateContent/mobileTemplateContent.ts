import { TemplateSpecificContent, TEMPLATE_IDS } from '../templateSpecificContentService';

// iOS Developer Template Content
export const iOSDeveloperContent: TemplateSpecificContent = {
  templateId: TEMPLATE_IDS.MOBILE_IOS,
  personalInfo: {
    name: 'Sarah Kim',
    title: 'Senior iOS Developer',
    email: 'sarah.kim@iosdev.com',
    phone: '+1 (555) 456-7890',
    location: 'San Francisco, CA',
    website: 'sarahkim.dev',
    linkedin: 'linkedin.com/in/sarahkim',
    github: 'github.com/sarahkim',
    avatar: '',
  },
  professionalSummary: 'Senior iOS Developer with 3+ years of experience building high-quality native iOS applications. Expert in Swift, UIKit, and SwiftUI with strong focus on user experience and performance optimization. Published 8 apps on the App Store with over 2M combined downloads and 4.7+ average rating.',
  objective: 'Seeking a Lead iOS Developer role where I can leverage my expertise in iOS development and team leadership to build innovative mobile experiences that delight users and drive business growth.',
  skills: [
    {
      id: '1', name: 'Swift', proficiency: 95, category: 'Programming Languages', level: 95, yearsOfExperience: 3, isCore: true, relevanceScore: 10
    },
    {
      id: '2', name: 'SwiftUI', proficiency: 90, category: 'UI Frameworks', level: 90, yearsOfExperience: 3, isCore: true, relevanceScore: 9
    },
    {
      id: '3', name: 'UIKit', proficiency: 92, category: 'UI Frameworks', level: 92, yearsOfExperience: 3, isCore: true, relevanceScore: 9
    },
    {
      id: '4', name: 'Core Data', proficiency: 85, category: 'Data Persistence', level: 85, yearsOfExperience: 3, isCore: true, relevanceScore: 8
    },
    {
      id: '5', name: 'Xcode', proficiency: 93, category: 'Development Tools', level: 93, yearsOfExperience: 3, isCore: true, relevanceScore: 8
    },
    {
      id: '6', name: 'iOS SDK', proficiency: 90, category: 'Frameworks', level: 90, yearsOfExperience: 3, isCore: true, relevanceScore: 9
    }
  ],
  experiences: [
    {
      id: '1',
      company: 'MobileTech Inc',
      position: 'Senior iOS Developer',
      startDate: '2021-01',
      endDate: null,
      description: 'Leading iOS development for consumer mobile applications with 1M+ active users. Responsible for architecture decisions, code reviews, and mentoring junior developers.',
      achievements: [
        'Led development of flagship app achieving 4.8 App Store rating',
        'Improved app performance by 40% through optimization techniques',
        'Mentored 3 junior developers in iOS best practices',
        'Implemented CI/CD pipeline reducing release time by 60%'
      ],
      technologies: ['Swift', 'SwiftUI', 'Core Data', 'Firebase', 'Xcode'],
      location: 'San Francisco, CA',
      employmentType: 'Full-time',
      industryContext: 'Mobile Technology',
      roleLevel: 'senior'
    }
  ],
  education: [
    {
      id: '1',
      institution: 'Stanford University',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2014-09',
      endDate: '2018-06',
      location: 'Stanford, CA',
      gpa: '3.8'
    }
  ],
  projects: [
    {
      id: '1',
      title: 'FitTracker iOS App',
      description: 'Comprehensive fitness tracking app with workout planning, progress tracking, and social features. Built with SwiftUI and Core Data, featuring custom animations and Apple HealthKit integration.',
      technologies: ['Swift', 'SwiftUI', 'Core Data', 'HealthKit', 'CloudKit'],
      startDate: '2023-01-01',
      endDate: '2023-08-01',
      url: 'https://apps.apple.com/app/fittracker',
      github: 'github.com/sarahkim/fittracker-ios',
      images: [
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1434596922112-19c563067271?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: '500K+ downloads, 4.7 App Store rating, featured in App Store',
      roleSpecific: true,
      metrics: {
        users: '500K+ downloads',
        adoption: '4.7 App Store rating'
      }
    }
  ],
  achievements: [
    'Published 8 iOS apps with 2M+ combined downloads',
    'App Store featured developer (2022)',
    'iOS development mentor at coding bootcamp',
    'Speaker at iOS Dev Conference 2023'
  ],
  metadata: {
    targetRole: 'mobile-developer',
    industry: 'technology',
    experienceLevel: 'senior',
    lastUpdated: new Date(),
    contentVersion: '1.0.0',
    tags: ['ios', 'swift', 'mobile', 'app-store', 'senior']
  }
};

// Android Developer Template Content  
export const androidDeveloperContent: TemplateSpecificContent = {
  templateId: TEMPLATE_IDS.MOBILE_ANDROID,
  personalInfo: {
    name: 'David Patel',
    title: 'Android Developer',
    email: 'david.patel@android.com',
    phone: '+1 (555) 567-8901',
    location: 'Mountain View, CA',
    website: 'davidpatel.dev',
    linkedin: 'linkedin.com/in/davidpatel',
    github: 'github.com/davidpatel',
    avatar: '',
  },
  professionalSummary: 'Experienced Android Developer with 4+ years building scalable mobile applications using Kotlin and Java. Expert in modern Android architecture patterns, Jetpack Compose, and performance optimization. Delivered 12 production apps with 5M+ total downloads and maintained 4.5+ Play Store ratings.',
  objective: 'Seeking a Senior Android Developer position where I can contribute to building innovative mobile experiences while mentoring junior developers and driving technical excellence in Android development.',
  skills: [
    {
      id: '1', name: 'Kotlin', proficiency: 92, category: 'Programming Languages', level: 92, yearsOfExperience: 4, isCore: true, relevanceScore: 10
    },
    {
      id: '2', name: 'Java', proficiency: 88, category: 'Programming Languages', level: 88, yearsOfExperience: 4, isCore: true, relevanceScore: 8
    },
    {
      id: '3', name: 'Jetpack Compose', proficiency: 85, category: 'UI Frameworks', level: 85, yearsOfExperience: 2, isCore: true, relevanceScore: 9
    },
    {
      id: '4', name: 'Android SDK', proficiency: 90, category: 'Frameworks', level: 90, yearsOfExperience: 4, isCore: true, relevanceScore: 9
    },
    {
      id: '5', name: 'Room Database', proficiency: 82, category: 'Data Persistence', level: 82, yearsOfExperience: 4, isCore: true, relevanceScore: 8
    },
    {
      id: '6', name: 'Android Studio', proficiency: 90, category: 'Development Tools', level: 90, yearsOfExperience: 4, isCore: true, relevanceScore: 8
    }
  ],
  experiences: [
    {
      id: '1',
      company: 'AndroidTech Solutions',
      position: 'Android Developer',
      startDate: '2020-03',
      endDate: null,
      description: 'Developing and maintaining Android applications for e-commerce and fintech clients. Focus on performance optimization, user experience, and modern Android development practices.',
      achievements: [
        'Built e-commerce app with 1M+ downloads and 4.6 Play Store rating',
        'Reduced app crash rate by 75% through improved error handling',
        'Implemented modern architecture reducing code complexity by 50%',
        'Led migration to Jetpack Compose improving development velocity by 30%'
      ],
      technologies: ['Kotlin', 'Jetpack Compose', 'Room', 'Retrofit', 'Dagger Hilt'],
      location: 'Mountain View, CA',
      employmentType: 'Full-time',
      industryContext: 'Mobile Development',
      roleLevel: 'mid'
    }
  ],
  education: [
    {
      id: '1',
      institution: 'UC Berkeley',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2015-09',
      endDate: '2019-05',
      location: 'Berkeley, CA',
      gpa: '3.6'
    }
  ],
  projects: [
    {
      id: '1',
      title: 'ShopEasy Android App',
      description: 'Feature-rich e-commerce Android application with product browsing, secure payments, order tracking, and personalized recommendations. Built with Jetpack Compose and modern Android architecture.',
      technologies: ['Kotlin', 'Jetpack Compose', 'Room', 'Retrofit', 'Firebase'],
      startDate: '2022-06-01',
      endDate: '2023-02-01',
      url: 'https://play.google.com/store/apps/details?id=com.shopeasy',
      github: 'github.com/davidpatel/shopeasy-android',
      images: [
        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop&crop=entropy&auto=format',
        'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=400&fit=crop&crop=entropy&auto=format'
      ],
      impact: '1M+ downloads, 4.6 Play Store rating, 25% increase in user engagement',
      roleSpecific: true,
      metrics: {
        users: '1M+ downloads',
        adoption: '4.6 Play Store rating',
        performance: '25% increase in user engagement'
      }
    }
  ],
  achievements: [
    'Google Android Developer Certified',
    'Published 12 Android apps with 5M+ total downloads',
    'Android development workshop instructor',
    'Contributor to open-source Android libraries'
  ],
  metadata: {
    targetRole: 'mobile-developer',
    industry: 'technology',
    experienceLevel: 'mid',
    lastUpdated: new Date(),
    contentVersion: '1.0.0',
    tags: ['android', 'kotlin', 'mobile', 'play-store', 'jetpack-compose']
  }
};

// React Native Developer Template Content
export const reactNativeDeveloperContent: TemplateSpecificContent = {
  templateId: TEMPLATE_IDS.MOBILE_REACT_NATIVE,
  personalInfo: {
    name: 'Alex Chen',
    title: 'React Native Developer',
    email: 'alex.chen@reactnative.com',
    phone: '+1 (555) 678-9012',
    location: 'Austin, TX',
    website: 'alexchen.dev',
    linkedin: 'linkedin.com/in/alexchen',
    github: 'github.com/alexchen',
    avatar: '',
  },
  professionalSummary: 'Experienced React Native Developer with 4+ years building cross-platform mobile applications for iOS and Android. Expert in JavaScript, TypeScript, and React ecosystem with strong focus on performance optimization and user experience. Delivered 10+ production apps with 3M+ combined downloads across both platforms.',
  objective: 'Seeking a Senior React Native Developer position where I can leverage my cross-platform expertise to build scalable mobile solutions while contributing to technical architecture and team growth.',
  skills: [
    {
      id: '1', name: 'React Native', proficiency: 92, category: 'Mobile Frameworks', level: 92, yearsOfExperience: 4, isCore: true, relevanceScore: 10
    },
    {
      id: '2', name: 'JavaScript', proficiency: 90, category: 'Programming Languages', level: 90, yearsOfExperience: 4, isCore: true, relevanceScore: 9
    },
    {
      id: '3', name: 'TypeScript', proficiency: 85, category: 'Programming Languages', level: 85, yearsOfExperience: 3, isCore: true, relevanceScore: 8
    },
    {
      id: '4', name: 'Redux', proficiency: 88, category: 'State Management', level: 88, yearsOfExperience: 4, isCore: true, relevanceScore: 8
    },
    {
      id: '5', name: 'Firebase', proficiency: 82, category: 'Backend Services', level: 82, yearsOfExperience: 3, isCore: true, relevanceScore: 7
    },
    {
      id: '6', name: 'React', proficiency: 87, category: 'Frontend Frameworks', level: 87, yearsOfExperience: 4, isCore: true, relevanceScore: 7
    },
    {
      id: '7', name: 'Expo', proficiency: 80, category: 'Development Tools', level: 80, yearsOfExperience: 2, isCore: false, relevanceScore: 6
    },
    {
      id: '8', name: 'GraphQL', proficiency: 75, category: 'APIs', level: 75, yearsOfExperience: 2, isCore: false, relevanceScore: 6
    }
  ],
  experiences: [
    {
      id: '1',
      company: 'CrossPlatform Solutions',
      position: 'React Native Developer',
      startDate: '2021-06',
      endDate: null,
      description: 'Developing cross-platform mobile applications for fintech and e-commerce clients. Focus on performance optimization, native module integration, and maintaining code consistency across iOS and Android platforms.',
      achievements: [
        'Built fintech app with 2M+ downloads and 4.5+ rating on both platforms',
        'Reduced app bundle size by 35% through code splitting and optimization',
        'Implemented offline-first architecture improving user retention by 25%',
        'Led migration from Class components to Hooks reducing codebase by 20%'
      ],
      technologies: ['React Native', 'TypeScript', 'Redux', 'Firebase', 'GraphQL'],
      location: 'Austin, TX',
      employmentType: 'Full-time',
      industryContext: 'Cross-platform Development',
      roleLevel: 'mid'
    },
    {
      id: '2',
      company: 'StartupTech Inc',
      position: 'Junior React Native Developer',
      startDate: '2020-01',
      endDate: '2021-05',
      description: 'Contributed to development of consumer mobile applications using React Native. Worked on UI components, API integrations, and app store deployment processes.',
      achievements: [
        'Developed reusable component library used across 3 mobile apps',
        'Improved app performance by 30% through optimization techniques',
        'Successfully deployed apps to both App Store and Google Play',
        'Collaborated with design team to implement pixel-perfect UI components'
      ],
      technologies: ['React Native', 'JavaScript', 'Redux', 'Firebase', 'REST APIs'],
      location: 'Austin, TX',
      employmentType: 'Full-time',
      industryContext: 'Startup',
      roleLevel: 'entry'
    }
  ],
  education: [
    {
      id: '1',
      institution: 'University of Texas at Austin',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2016-09',
      endDate: '2020-05',
      location: 'Austin, TX',
      gpa: '3.7',
      relevantCoursework: ['Mobile App Development', 'Software Engineering', 'Database Systems', 'Web Development']
    }
  ],
  projects: [
    {
      id: '1',
      title: 'FoodDelivery Cross-Platform App',
      description: 'Full-featured cross-platform food delivery application built with React Native for both iOS and Android. Features real-time order tracking, payment integration, and push notifications with custom animations and offline capabilities.',
      technologies: ['React Native', 'TypeScript', 'Redux Toolkit', 'Firebase', 'Stripe', 'Google Maps API'],
      startDate: '2022-09-01',
      endDate: '2023-03-01',
      url: 'https://apps.apple.com/app/fooddelivery',
      github: 'github.com/alexchen/fooddelivery-rn',
      impact: '1.5M+ downloads across platforms, 4.4 average rating, 40% user retention',
      roleSpecific: true,
      metrics: {
        users: '1.5M+ downloads',
        adoption: '4.4 average rating',
        performance: '40% user retention'
      }
    },
    {
      id: '2',
      title: 'Fitness Tracker React Native App',
      description: 'Cross-platform fitness tracking application with workout logging, progress visualization, and social features. Integrated with device health APIs and wearable devices.',
      technologies: ['React Native', 'JavaScript', 'Redux', 'Firebase', 'HealthKit', 'Google Fit'],
      startDate: '2021-12-01',
      endDate: '2022-06-01',
      url: 'https://play.google.com/store/apps/details?id=com.fitnesstracker',
      github: 'github.com/alexchen/fitness-tracker-rn',
      impact: '800K+ downloads, featured in both app stores, 4.6 rating',
      roleSpecific: true,
      metrics: {
        users: '800K+ downloads',
        adoption: '4.6 rating',
        performance: 'Featured in app stores'
      }
    }
  ],
  achievements: [
    'React Native certified developer',
    'Published 10+ cross-platform apps with 3M+ total downloads',
    'React Native community contributor and open-source maintainer',
    'Speaker at React Native Austin meetup'
  ],
  metadata: {
    targetRole: 'mobile-developer',
    industry: 'technology',
    experienceLevel: 'mid',
    lastUpdated: new Date(),
    contentVersion: '1.0.0',
    tags: ['react-native', 'javascript', 'typescript', 'cross-platform', 'mobile']
  }
};