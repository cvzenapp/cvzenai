import { templateContentRegistry } from './templateContentRegistry';
import { seniorDevOpsEngineerContent, juniorDevOpsEngineerContent } from './templateContent/devopsTemplateContent';
import { iOSDeveloperContent, androidDeveloperContent, reactNativeDeveloperContent } from './templateContent/mobileTemplateContent';
import { seniorDataScientistContent, entryLevelDataAnalystContent } from './templateContent/dataScientistTemplateContent';
import { seniorFrontendDeveloperContent, juniorFrontendDeveloperContent } from './templateContent/frontendTemplateContent';
import { seniorBackendDeveloperContent, juniorBackendDeveloperContent } from './templateContent/backendTemplateContent';
import { seniorFullstackDeveloperContent, midLevelFullstackDeveloperContent } from './templateContent/fullstackTemplateContent';
import { productManagerContent } from './templateContent/productManagerTemplateContent';
import { projectManagerContent } from './templateContent/projectManagerTemplateContent';
import { businessAnalystContent } from './templateContent/businessAnalystTemplateContent';
import { financialAnalystContent } from './templateContent/financialAnalystTemplateContent';
import { riskManagerContent } from './templateContent/riskManagerTemplateContent';
import { clinicalResearcherContent } from './templateContent/clinicalResearcherTemplateContent';
import { healthcareAdminContent } from './templateContent/healthcareAdminTemplateContent';
import { legalContent } from './templateContent/legalTemplateContent';
import { k12TeacherContent } from './templateContent/k12TeacherTemplateContent';
import { academicResearcherContent } from './templateContent/academicResearcherTemplateContent';

/**
 * Initialize template content registry with available template content
 * This should be called when the application starts
 */
export function initializeTemplateContent() {
  console.log('🚀 Initializing template content registry...');

  try {
    // Register main template categories with their corresponding content
    // Create modified content objects with the main template IDs
    
    // Technology template (maps to fullstack developer)
    const techTemplateContent = { ...seniorFullstackDeveloperContent, templateId: 'tech-modern-1' };
    templateContentRegistry.registerTemplateContent('tech-modern-1', techTemplateContent);
    
    // Design template (maps to frontend developer)  
    const designTemplateContent = { ...seniorFrontendDeveloperContent, templateId: 'design-creative-1' };
    templateContentRegistry.registerTemplateContent('design-creative-1', designTemplateContent);
    
    // Management template (maps to project manager)
    const managementTemplateContent = { ...projectManagerContent, templateId: 'management-corporate-1' };
    templateContentRegistry.registerTemplateContent('management-corporate-1', managementTemplateContent);
    
    // Academic template (maps to academic researcher)
    const academicTemplateContent = { ...academicResearcherContent, templateId: '4' };
    templateContentRegistry.registerTemplateContent('4', academicTemplateContent);
    
    // Marketing template (maps to business analyst)
    const marketingTemplateContent = { ...businessAnalystContent, templateId: '5' };
    templateContentRegistry.registerTemplateContent('5', marketingTemplateContent);
    
    // Sales template (maps to business analyst)
    const salesTemplateContent = { ...businessAnalystContent, templateId: '6' };
    templateContentRegistry.registerTemplateContent('6', salesTemplateContent);
    
    // Tech Modern template (maps to frontend developer)
    const techModernContent = { ...seniorFrontendDeveloperContent, templateId: '7' };
    templateContentRegistry.registerTemplateContent('7', techModernContent);
    
    // Tech Minimal template (maps to backend developer)
    const techMinimalContent = { ...juniorBackendDeveloperContent, templateId: '8' };
    templateContentRegistry.registerTemplateContent('8', techMinimalContent);
    
    // Tech Senior template (maps to devops engineer)
    const techSeniorContent = { ...seniorDevOpsEngineerContent, templateId: '9' };
    templateContentRegistry.registerTemplateContent('9', techSeniorContent);
    
    // Tech Fullstack template (maps to fullstack developer)
    const techFullstackContent = { ...seniorFullstackDeveloperContent, templateId: '10' };
    templateContentRegistry.registerTemplateContent('10', techFullstackContent);
    
    // Tech DevOps template (maps to devops engineer)
    const techDevOpsContent = { ...seniorDevOpsEngineerContent, templateId: '11' };
    templateContentRegistry.registerTemplateContent('11', techDevOpsContent);
    
    // Tech Mobile template (maps to mobile developer)
    const techMobileContent = { ...iOSDeveloperContent, templateId: '12' };
    templateContentRegistry.registerTemplateContent('12', techMobileContent);
    
    // Register DevOps templates
    console.log('📝 Registering DevOps templates...');
    console.log('Senior DevOps template ID:', seniorDevOpsEngineerContent.templateId);
    console.log('Senior DevOps name:', seniorDevOpsEngineerContent.personalInfo.name);
    
    templateContentRegistry.registerTemplateContent(
      seniorDevOpsEngineerContent.templateId,
      seniorDevOpsEngineerContent
    );
    
    templateContentRegistry.registerTemplateContent(
      juniorDevOpsEngineerContent.templateId,
      juniorDevOpsEngineerContent
    );

    // Register Mobile Developer templates
    templateContentRegistry.registerTemplateContent(
      iOSDeveloperContent.templateId,
      iOSDeveloperContent
    );
    
    templateContentRegistry.registerTemplateContent(
      androidDeveloperContent.templateId,
      androidDeveloperContent
    );
    
    templateContentRegistry.registerTemplateContent(
      reactNativeDeveloperContent.templateId,
      reactNativeDeveloperContent
    );

    // Register Data Scientist templates
    templateContentRegistry.registerTemplateContent(
      seniorDataScientistContent.templateId,
      seniorDataScientistContent
    );
    
    templateContentRegistry.registerTemplateContent(
      entryLevelDataAnalystContent.templateId,
      entryLevelDataAnalystContent
    );

    // Register Frontend Developer templates
    templateContentRegistry.registerTemplateContent(
      seniorFrontendDeveloperContent.templateId,
      seniorFrontendDeveloperContent
    );
    
    templateContentRegistry.registerTemplateContent(
      juniorFrontendDeveloperContent.templateId,
      juniorFrontendDeveloperContent
    );

    // Register Backend Developer templates
    templateContentRegistry.registerTemplateContent(
      seniorBackendDeveloperContent.templateId,
      seniorBackendDeveloperContent
    );
    
    templateContentRegistry.registerTemplateContent(
      juniorBackendDeveloperContent.templateId,
      juniorBackendDeveloperContent
    );

    // Register Full Stack Developer templates
    templateContentRegistry.registerTemplateContent(
      seniorFullstackDeveloperContent.templateId,
      seniorFullstackDeveloperContent
    );
    
    templateContentRegistry.registerTemplateContent(
      midLevelFullstackDeveloperContent.templateId,
      midLevelFullstackDeveloperContent
    );

    // Register Business Role templates
    templateContentRegistry.registerTemplateContent(
      productManagerContent.templateId,
      productManagerContent
    );
    
    templateContentRegistry.registerTemplateContent(
      projectManagerContent.templateId,
      projectManagerContent
    );
    
    templateContentRegistry.registerTemplateContent(
      businessAnalystContent.templateId,
      businessAnalystContent
    );

    // Register Finance Role templates
    templateContentRegistry.registerTemplateContent(
      financialAnalystContent.templateId,
      financialAnalystContent
    );
    
    templateContentRegistry.registerTemplateContent(
      riskManagerContent.templateId,
      riskManagerContent
    );

    // Register Healthcare Role templates
    templateContentRegistry.registerTemplateContent(
      clinicalResearcherContent.templateId,
      clinicalResearcherContent
    );
    
    templateContentRegistry.registerTemplateContent(
      healthcareAdminContent.templateId,
      healthcareAdminContent
    );

    // Register Legal Role templates
    templateContentRegistry.registerTemplateContent(
      legalContent.templateId,
      legalContent
    );

    // Register Education Role templates
    templateContentRegistry.registerTemplateContent(
      k12TeacherContent.templateId,
      k12TeacherContent
    );
    
    templateContentRegistry.registerTemplateContent(
      academicResearcherContent.templateId,
      academicResearcherContent
    );

    console.log('✅ Template content registry initialized successfully');
    console.log('📊 Registry statistics:', templateContentRegistry.getContentStatistics());
    console.log('🔑 Available template IDs:', templateContentRegistry.getAvailableTemplateIds());
    
    // Test specific lookups
    console.log('🧪 Testing template lookups:');
    console.log('- devops-engineer-senior exists:', templateContentRegistry.hasTemplateContent('devops-engineer-senior'));
    console.log('- devops-engineer-junior exists:', templateContentRegistry.hasTemplateContent('devops-engineer-junior'));
    
    const devopsContent = templateContentRegistry.getTemplateContentAsResume('devops-engineer-senior');
    if (devopsContent) {
      console.log('✅ DevOps content loaded:', devopsContent.personalInfo.name);
    } else {
      console.log('❌ DevOps content not found');
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize template content registry:', error);
  }
}

/**
 * Get template ID mapping for common template categories
 * This helps map from template categories to specific template IDs
 */
export function getTemplateIdForCategory(category: string, experienceLevel: string = 'mid'): string | null {
  const mappings: Record<string, Record<string, string>> = {
    'tech-devops': {
      'entry': 'devops-engineer-junior',
      'junior': 'devops-engineer-junior', 
      'mid': 'devops-engineer-senior',
      'senior': 'devops-engineer-senior',
      'executive': 'devops-engineer-senior'
    },
    'tech-mobile': {
      'entry': 'mobile-developer-ios',
      'junior': 'mobile-developer-ios',
      'mid': 'mobile-developer-ios', 
      'senior': 'mobile-developer-ios',
      'executive': 'mobile-developer-ios'
    },
    'mobile': {
      'entry': 'mobile-developer-ios',
      'junior': 'mobile-developer-ios',
      'mid': 'mobile-developer-ios',
      'senior': 'mobile-developer-ios', 
      'executive': 'mobile-developer-ios'
    },
    'data-science': {
      'entry': 'data-analyst-entry',
      'junior': 'data-analyst-entry',
      'mid': 'data-scientist-senior',
      'senior': 'data-scientist-senior',
      'executive': 'data-scientist-senior'
    },
    'frontend': {
      'entry': 'frontend-developer-junior',
      'junior': 'frontend-developer-junior',
      'mid': 'frontend-developer-senior',
      'senior': 'frontend-developer-senior',
      'executive': 'frontend-developer-senior'
    },
    'tech-frontend': {
      'entry': 'frontend-developer-junior',
      'junior': 'frontend-developer-junior',
      'mid': 'frontend-developer-senior',
      'senior': 'frontend-developer-senior',
      'executive': 'frontend-developer-senior'
    },
    'backend': {
      'entry': 'backend-developer-junior',
      'junior': 'backend-developer-junior',
      'mid': 'backend-developer-senior',
      'senior': 'backend-developer-senior',
      'executive': 'backend-developer-senior'
    },
    'tech-backend': {
      'entry': 'backend-developer-junior',
      'junior': 'backend-developer-junior',
      'mid': 'backend-developer-senior',
      'senior': 'backend-developer-senior',
      'executive': 'backend-developer-senior'
    },
    'fullstack': {
      'entry': 'fullstack-developer-mid',
      'junior': 'fullstack-developer-mid',
      'mid': 'fullstack-developer-mid',
      'senior': 'fullstack-developer-senior',
      'executive': 'fullstack-developer-senior'
    },
    'tech-fullstack': {
      'entry': 'fullstack-developer-mid',
      'junior': 'fullstack-developer-mid',
      'mid': 'fullstack-developer-mid',
      'senior': 'fullstack-developer-senior',
      'executive': 'fullstack-developer-senior'
    },
    'technology': {
      'entry': 'devops-engineer-junior',
      'junior': 'devops-engineer-junior',
      'mid': 'devops-engineer-senior',
      'senior': 'devops-engineer-senior',
      'executive': 'devops-engineer-senior'
    }
  };

  return mappings[category]?.[experienceLevel] || null;
}

/**
 * Get template ID mapping for template config IDs to specific content IDs
 * This maps the template service IDs to our content registry IDs
 */
export function getContentIdForTemplateId(templateId: string): string | null {
  const templateIdMappings: Record<string, string> = {
    // Main template configurations - these now map directly to the registered content
    'tech-modern-1': 'tech-modern-1',
    'design-creative-1': 'design-creative-1', 
    'management-corporate-1': 'management-corporate-1',
    '4': '4',
    '5': '5',
    '6': '6',
    '7': '7',
    '8': '8',
    '9': '9',
    '10': '10',
    '11': '11',
    '12': '12',
    
    // DevOps templates
    'tech-devops': 'devops-engineer-senior',
    'devops-engineer': 'devops-engineer-senior',
    
    // Mobile templates  
    'tech-mobile': 'mobile-developer-ios',
    'mobile-developer': 'mobile-developer-ios',
    
    // Data Science templates
    'data-science': 'data-scientist-senior',
    'data-scientist': 'data-scientist-senior',
    'data-analyst': 'data-analyst-entry',
    
    // Frontend templates
    'frontend': 'frontend-developer-senior',
    'tech-frontend': 'frontend-developer-senior',
    'frontend-developer': 'frontend-developer-senior',
    
    // Backend templates
    'backend': 'backend-developer-senior',
    'tech-backend': 'backend-developer-senior',
    'backend-developer': 'backend-developer-senior',
    
    // Full Stack templates
    'fullstack': 'fullstack-developer-senior',
    'tech-fullstack': 'fullstack-developer-senior',
    'fullstack-developer': 'fullstack-developer-senior',
    
    // Business templates
    'product-manager': 'product-manager',
    'project-manager': 'project-manager',
    'business-analyst': 'business-analyst',
    
    // Finance templates
    'financial-analyst': 'financial-analyst',
    'risk-manager': 'risk-manager',
    
    // Healthcare templates
    'clinical-researcher': 'clinical-researcher',
    'healthcare-admin': 'healthcare-admin',
    
    // Legal templates
    'legal-counsel': 'legal-counsel',
    
    // Education templates
    'k12-teacher': 'k12-teacher',
    'academic-researcher': 'academic-researcher',
    'academic': 'academic-researcher', // Map generic academic to researcher
    
    // Direct mappings for our content IDs
    'devops-engineer-senior': 'devops-engineer-senior',
    'devops-engineer-junior': 'devops-engineer-junior',
    'mobile-developer-ios': 'mobile-developer-ios',
    'mobile-developer-android': 'mobile-developer-android',
    'mobile-developer-react-native': 'mobile-developer-react-native',
    'data-scientist-senior': 'data-scientist-senior',
    'data-analyst-entry': 'data-analyst-entry',
    'frontend-developer-senior': 'frontend-developer-senior',
    'frontend-developer-junior': 'frontend-developer-junior',
    'backend-developer-senior': 'backend-developer-senior',
    'backend-developer-junior': 'backend-developer-junior',
    'fullstack-developer-senior': 'fullstack-developer-senior',
    'fullstack-developer-mid': 'fullstack-developer-mid',
  };

  return templateIdMappings[templateId] || null;
}

/**
 * Get template category from template ID
 * This helps convert template IDs back to categories for proper template config lookup
 */
export function getTemplateCategoryFromId(templateId: string): string | null {
  const idToCategoryMappings: Record<string, string> = {
    // Template ID to category mappings
    '11': 'tech-devops',
    '12': 'tech-mobile',
    '1': 'technology',
    '2': 'design', 
    '3': 'management',
    '4': 'academic',
    '5': 'marketing',
    '6': 'sales',
    '7': 'tech-modern',
    '8': 'tech-minimal',
    '9': 'tech-senior',
    '10': 'tech-fullstack',
    
    // Full template ID mappings
    'tech-modern-1': 'enhanced-technology',  // This is the Enhanced Technology Template
    'design-creative-1': 'design',
    'management-corporate-1': 'management',
    
    // Specific template mappings for enhanced templates
    'enhanced-technology-1': 'enhanced-technology',
    'modern-professional-1': 'modern-professional',
    
    // DevOps specific mappings
    'devops-engineer-senior': 'tech-devops',
    'devops-engineer-junior': 'tech-devops',
    
    // Mobile specific mappings
    'mobile-developer-ios': 'tech-mobile',
    'mobile-developer-android': 'tech-mobile',
    'mobile-developer-react-native': 'tech-mobile',
    
    // Data Science specific mappings
    'data-scientist-senior': 'technology',
    'data-analyst-entry': 'technology',
    
    // Frontend specific mappings
    'frontend-developer-senior': 'technology',
    'frontend-developer-junior': 'technology',
    
    // Backend specific mappings
    'backend-developer-senior': 'technology',
    'backend-developer-junior': 'technology',
    
    // Full Stack specific mappings
    'fullstack-developer-senior': 'technology',
    'fullstack-developer-mid': 'technology',
  };

  return idToCategoryMappings[templateId] || null;
}

/**
 * Check if template content is available for a given template ID
 */
export function hasTemplateContent(templateId: string): boolean {
  return templateContentRegistry.hasTemplateContent(templateId);
}

/**
 * Get all available template content for debugging
 */
export function getAllTemplateContent() {
  return templateContentRegistry.getAllTemplateContents();
}