import { TemplateSpecificContent, SkillContent, ExperienceContent, ProjectContent } from '../types/templateContent';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ContentValidationRules {
  validateSkillsForRole(skills: SkillContent[], role: string): ValidationResult;
  validateExperienceContext(experience: ExperienceContent[], role: string): ValidationResult;
  validateProjectRelevance(projects: ProjectContent[], role: string): ValidationResult;
  validateExperienceLevel(content: TemplateSpecificContent): ValidationResult;
  validateContentQuality(content: TemplateSpecificContent): ValidationResult;
}

// Role-specific skill mappings for validation
const ROLE_SKILL_MAPPINGS: Record<string, string[]> = {
  'devops': ['docker', 'kubernetes', 'aws', 'terraform', 'jenkins', 'ci/cd', 'linux', 'monitoring', 'automation'],
  'mobile': ['swift', 'kotlin', 'react native', 'ios', 'android', 'xcode', 'android studio', 'firebase'],
  'data-scientist': ['python', 'r', 'tensorflow', 'pytorch', 'sql', 'machine learning', 'pandas', 'numpy'],
  'frontend': ['react', 'javascript', 'typescript', 'html', 'css', 'vue', 'angular', 'webpack'],
  'backend': ['node.js', 'python', 'java', 'postgresql', 'mongodb', 'redis', 'api', 'microservices'],
  'fullstack': ['react', 'node.js', 'typescript', 'postgresql', 'aws', 'docker', 'api', 'frontend', 'backend'],
  'product-manager': ['product strategy', 'roadmapping', 'analytics', 'stakeholder management', 'agile', 'scrum'],
  'project-manager': ['project management', 'agile', 'scrum', 'risk management', 'budget planning', 'team leadership'],
  'business-analyst': ['requirements analysis', 'process mapping', 'sql', 'tableau', 'stakeholder management'],
  'financial-analyst': ['financial modeling', 'excel', 'sql', 'tableau', 'risk analysis', 'budgeting'],
  'risk-manager': ['risk assessment', 'compliance', 'regulatory knowledge', 'data analysis', 'audit'],
  'healthcare': ['clinical trials', 'medical writing', 'regulatory compliance', 'patient care', 'healthcare'],
  'legal': ['contract law', 'corporate governance', 'compliance', 'legal research', 'litigation'],
  'education': ['curriculum development', 'classroom management', 'student assessment', 'teaching', 'research'],
  'consulting': ['strategic planning', 'market analysis', 'client management', 'business transformation']
};

// Industry context mappings
const INDUSTRY_CONTEXTS: Record<string, string[]> = {
  'technology': ['saas', 'startup', 'tech company', 'software', 'cloud', 'fintech'],
  'healthcare': ['hospital', 'clinic', 'pharmaceutical', 'medical device', 'healthcare system'],
  'finance': ['bank', 'investment firm', 'financial services', 'insurance', 'fintech'],
  'consulting': ['consulting firm', 'advisory', 'strategy consulting', 'management consulting'],
  'education': ['university', 'school', 'research institution', 'educational technology'],
  'nonprofit': ['nonprofit', 'ngo', 'foundation', 'charity', 'social impact']
};

export class TemplateContentValidationService implements ContentValidationRules {
  
  /**
   * Validates that skills are appropriate for the specified role
   */
  validateSkillsForRole(skills: SkillContent[], role: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    const roleKey = this.normalizeRoleKey(role);
    const expectedSkills = ROLE_SKILL_MAPPINGS[roleKey] || [];
    
    if (expectedSkills.length === 0) {
      result.warnings.push(`No skill validation rules defined for role: ${role}`);
      return result;
    }

    // Check if at least 50% of skills are relevant to the role
    const relevantSkills = skills.filter(skill => 
      this.isSkillRelevantToRole(skill.name, expectedSkills)
    );

    const relevanceRatio = relevantSkills.length / skills.length;
    
    if (relevanceRatio < 0.5) {
      result.isValid = false;
      result.errors.push(`Only ${Math.round(relevanceRatio * 100)}% of skills are relevant to ${role}. Expected at least 50%.`);
    } else if (relevanceRatio < 0.7) {
      result.warnings.push(`${Math.round(relevanceRatio * 100)}% of skills are relevant to ${role}. Consider adding more role-specific skills.`);
    }

    // Check for core skills
    const coreSkills = skills.filter(skill => skill.isCore);
    if (coreSkills.length < 3) {
      result.warnings.push(`Only ${coreSkills.length} core skills defined. Consider marking more key skills as core.`);
    }

    // Validate proficiency levels are realistic
    const unrealisticSkills = skills.filter(skill => 
      skill.proficiency > 97 || (skill.yearsOfExperience < 2 && skill.proficiency > 85)
    );

    if (unrealisticSkills.length > 0) {
      result.warnings.push(`Some skills have unrealistic proficiency levels: ${unrealisticSkills.map(s => s.name).join(', ')}`);
    }

    return result;
  }

  /**
   * Validates that work experience matches the role and industry context
   */
  validateExperienceContext(experience: ExperienceContent[], role: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (experience.length === 0) {
      result.errors.push('No work experience provided');
      result.isValid = false;
      return result;
    }

    // Validate experience progression
    const sortedExperience = [...experience].sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    let totalYears = 0;
    for (const exp of sortedExperience) {
      const startDate = new Date(exp.startDate);
      const endDate = exp.endDate ? new Date(exp.endDate) : new Date();
      const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      totalYears += years;
    }

    // Validate role level consistency
    const seniorRoles = experience.filter(exp => exp.roleLevel === 'senior' || exp.roleLevel === 'executive');
    if (seniorRoles.length > 0 && totalYears < 5) {
      result.warnings.push(`Senior/Executive roles present but total experience is only ${Math.round(totalYears)} years`);
    }

    // Validate industry context relevance
    const roleKey = this.normalizeRoleKey(role);
    const industryContexts = this.getExpectedIndustryContexts(roleKey);
    
    if (industryContexts.length > 0) {
      const relevantExperience = experience.filter(exp =>
        industryContexts.some(context => 
          exp.industryContext.toLowerCase().includes(context) ||
          exp.company.toLowerCase().includes(context)
        )
      );

      if (relevantExperience.length === 0) {
        result.warnings.push(`No experience in expected industry contexts: ${industryContexts.join(', ')}`);
      }
    }

    return result;
  }

  /**
   * Validates that projects are relevant to the specified role
   */
  validateProjectRelevance(projects: ProjectContent[], role: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (projects.length === 0) {
      result.warnings.push('No projects provided - consider adding relevant projects');
      return result;
    }

    const roleSpecificProjects = projects.filter(project => project.roleSpecific);
    if (roleSpecificProjects.length === 0) {
      result.warnings.push('No role-specific projects found - consider marking relevant projects as role-specific');
    }

    // Validate project technologies align with role
    const roleKey = this.normalizeRoleKey(role);
    const expectedSkills = ROLE_SKILL_MAPPINGS[roleKey] || [];
    
    for (const project of projects) {
      const relevantTechnologies = project.technologies.filter(tech =>
        this.isSkillRelevantToRole(tech, expectedSkills)
      );

      if (relevantTechnologies.length === 0) {
        result.warnings.push(`Project "${project.title}" has no technologies relevant to ${role}`);
      }

      // Validate project has measurable impact
      if (!project.impact || project.impact.length < 20) {
        result.warnings.push(`Project "${project.title}" lacks detailed impact description`);
      }
    }

    return result;
  }

  /**
   * Validates experience level consistency across the entire content
   */
  validateExperienceLevel(content: TemplateSpecificContent): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Calculate total years of experience
    let totalYears = 0;
    for (const exp of content.experiences) {
      const startDate = new Date(exp.startDate);
      const endDate = exp.endDate ? new Date(exp.endDate) : new Date();
      const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      totalYears += years;
    }

    // Validate skill experience years don't exceed total experience
    const invalidSkills = content.skills.filter(skill => 
      skill.yearsOfExperience > totalYears + 1 // Allow 1 year buffer
    );

    if (invalidSkills.length > 0) {
      result.errors.push(`Some skills have more years of experience than total career: ${invalidSkills.map(s => s.name).join(', ')}`);
      result.isValid = false;
    }

    // Validate experience level consistency
    const seniorExperience = content.experiences.filter(exp => 
      exp.roleLevel === 'senior' || exp.roleLevel === 'executive'
    );

    if (seniorExperience.length > 0 && totalYears < 5) {
      result.warnings.push('Senior/Executive roles present but total experience suggests mid-level career stage');
    }

    if (totalYears > 10 && !seniorExperience.length) {
      result.suggestions.push('With 10+ years experience, consider including senior-level roles');
    }

    return result;
  }

  /**
   * Validates overall content quality and completeness
   */
  validateContentQuality(content: TemplateSpecificContent): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Validate required fields
    if (!content.professionalSummary || content.professionalSummary.length < 50) {
      result.errors.push('Professional summary is missing or too short (minimum 50 characters)');
      result.isValid = false;
    }

    if (content.skills.length < 5) {
      result.warnings.push(`Only ${content.skills.length} skills listed - consider adding more relevant skills`);
    }

    if (content.experiences.length === 0) {
      result.errors.push('No work experience provided');
      result.isValid = false;
    }

    // Validate content professionalism
    const unprofessionalWords = ['awesome', 'amazing', 'incredible', 'fantastic'];
    const summaryWords = content.professionalSummary.toLowerCase().split(' ');
    const foundUnprofessional = unprofessionalWords.filter(word => 
      summaryWords.includes(word)
    );

    if (foundUnprofessional.length > 0) {
      result.warnings.push(`Professional summary contains informal language: ${foundUnprofessional.join(', ')}`);
    }

    // Validate achievements have metrics
    for (const exp of content.experiences) {
      const achievementsWithMetrics = exp.achievements.filter(achievement =>
        /\d+%|\d+\+|\$\d+|[0-9,]+/.test(achievement)
      );

      if (achievementsWithMetrics.length === 0) {
        result.suggestions.push(`Experience at ${exp.company} could benefit from quantified achievements`);
      }
    }

    return result;
  }

  /**
   * Comprehensive validation of template content
   */
  validateTemplateContent(content: TemplateSpecificContent): ValidationResult {
    const results = [
      this.validateSkillsForRole(content.skills, content.templateId),
      this.validateExperienceContext(content.experiences, content.templateId),
      this.validateProjectRelevance(content.projects, content.templateId),
      this.validateExperienceLevel(content),
      this.validateContentQuality(content)
    ];

    return this.combineValidationResults(results);
  }

  // Helper methods
  private normalizeRoleKey(role: string): string {
    const normalized = role.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Map common role variations to base keys
    if (normalized.includes('devops')) return 'devops';
    if (normalized.includes('mobile')) return 'mobile';
    if (normalized.includes('data-scientist') || normalized.includes('data')) return 'data-scientist';
    if (normalized.includes('frontend') || normalized.includes('front-end')) return 'frontend';
    if (normalized.includes('backend') || normalized.includes('back-end')) return 'backend';
    if (normalized.includes('fullstack') || normalized.includes('full-stack')) return 'fullstack';
    if (normalized.includes('product-manager')) return 'product-manager';
    if (normalized.includes('project-manager')) return 'project-manager';
    if (normalized.includes('business-analyst')) return 'business-analyst';
    if (normalized.includes('financial-analyst')) return 'financial-analyst';
    if (normalized.includes('risk-manager')) return 'risk-manager';
    if (normalized.includes('healthcare')) return 'healthcare';
    if (normalized.includes('legal')) return 'legal';
    if (normalized.includes('education')) return 'education';
    if (normalized.includes('consulting')) return 'consulting';
    
    return normalized;
  }

  private isSkillRelevantToRole(skillName: string, expectedSkills: string[]): boolean {
    const normalizedSkill = skillName.toLowerCase();
    return expectedSkills.some(expectedSkill =>
      normalizedSkill.includes(expectedSkill) || expectedSkill.includes(normalizedSkill)
    );
  }

  private getExpectedIndustryContexts(roleKey: string): string[] {
    // Map roles to expected industry contexts
    const roleIndustryMap: Record<string, string[]> = {
      'devops': INDUSTRY_CONTEXTS.technology,
      'mobile': INDUSTRY_CONTEXTS.technology,
      'data-scientist': [...INDUSTRY_CONTEXTS.technology, ...INDUSTRY_CONTEXTS.finance],
      'frontend': INDUSTRY_CONTEXTS.technology,
      'backend': INDUSTRY_CONTEXTS.technology,
      'fullstack': INDUSTRY_CONTEXTS.technology,
      'financial-analyst': INDUSTRY_CONTEXTS.finance,
      'risk-manager': INDUSTRY_CONTEXTS.finance,
      'healthcare': INDUSTRY_CONTEXTS.healthcare,
      'consulting': INDUSTRY_CONTEXTS.consulting
    };

    return roleIndustryMap[roleKey] || [];
  }

  private combineValidationResults(results: ValidationResult[]): ValidationResult {
    const combined: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    for (const result of results) {
      if (!result.isValid) {
        combined.isValid = false;
      }
      combined.errors.push(...result.errors);
      combined.warnings.push(...result.warnings);
      combined.suggestions.push(...result.suggestions);
    }

    return combined;
  }
}

// Export singleton instance
export const templateContentValidationService = new TemplateContentValidationService();