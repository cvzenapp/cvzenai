import { datasetLoader } from './datasetLoader.js';

/**
 * Education Extractor - Uses education dataset to improve extraction accuracy
 */
export class EducationExtractor {
  private degrees: string[] = [];
  private institutions: string[] = [];
  private fields: string[] = [];
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      // Load education data
      const educationData = await datasetLoader.loadDataset('03_education.csv');
      
      // Dataset columns: person_id, institution, program, start_date, location
      this.degrees = datasetLoader.extractUniqueValues(educationData, 'program');
      this.institutions = datasetLoader.extractUniqueValues(educationData, 'institution');
      // Extract fields from program names (e.g., "Bachelor of Science" -> "Science")
      this.fields = this.extractFieldsFromPrograms(educationData);

      this.initialized = true;
      console.log(`✅ Education Extractor initialized: ${this.degrees.length} degrees, ${this.institutions.length} institutions, ${this.fields.length} fields`);
    } catch (error) {
      console.error('❌ Failed to initialize EducationExtractor:', error);
    }
  }

  /**
   * Extract field names from program descriptions
   */
  private extractFieldsFromPrograms(educationData: any[]): string[] {
    const fields = new Set<string>();
    
    educationData.forEach(row => {
      const program = row.program?.toLowerCase() || '';
      
      // Extract common field patterns
      if (program.includes('computer science')) fields.add('Computer Science');
      if (program.includes('information technology') || program.includes('information systems')) fields.add('Information Technology');
      if (program.includes('business')) fields.add('Business Administration');
      if (program.includes('engineering')) fields.add('Engineering');
      if (program.includes('science')) fields.add('Science');
      if (program.includes('management')) fields.add('Management');
      if (program.includes('accounting')) fields.add('Accounting');
      if (program.includes('biology')) fields.add('Biology');
      if (program.includes('chemistry')) fields.add('Chemistry');
      if (program.includes('political science')) fields.add('Political Science');
      if (program.includes('finance')) fields.add('Finance');
    });
    
    return Array.from(fields);
  }

  /**
   * Generate optimized prompt for education extraction
   */
  generatePrompt(): string {
    // Use actual examples from the dataset
    const datasetExamples = [
      'Lead City University - Bachelor of Science (07/2013)',
      'lagos state university - bsc in computer science (Lagos, GU)',
      'JNTU - Kakinada, Andhra Pradesh - Master of Computer Applications in Science and technology (2013)',
      'University of Informatics - Bachelor in Computer Science (06/07)',
      'Virginia Commonwealth University (08/2013, Richmond, VA)',
      'Bowie State University - Bachelor\'s Degree in Biology/Chem / Computer Science',
      'Bridgewater State University - Management - Information Systems (Present)',
      'George Washington University - BA Political Science (2010, Washington, DC)',
      'The University of Iowa - B.A. in Computer Science (05/16, Iowa City, IA)',
      'Stevens Institute of Technology - Computer Science (2010, Hoboken, NJ)',
      'University of Maryland University College - Bachelor\'s in Computer Science (2015)',
      'Community College of Baltimore County - Associate in Information Technology (2010)'
    ];

    const commonDegrees = [
      'Bachelor of Science', 'Bachelor of Arts', 'Master of Science', 'Master of Arts',
      'PhD', 'MBA', 'B.Tech', 'M.Tech', 'B.Sc', 'M.Sc', 'BE', 'ME',
      'Associate Degree', 'Diploma', 'Certificate', 'Bachelor', 'Master', 'Doctor',
      'Bachelor\'s Degree', 'Master\'s Degree', 'Associate\'s degree',
      'B.A.', 'B.S.', 'M.A.', 'M.S.', 'Ph.D.'
    ];

    const commonFields = [
      'Computer Science', 'Information Technology', 'Information Systems',
      'Engineering', 'Business Administration', 'Management',
      'Data Science', 'Software Engineering', 'Electrical Engineering', 'Mechanical Engineering',
      'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Finance', 'Marketing',
      'Accounting', 'Political Science', 'Biochemistry'
    ];

    return `
🎓 EDUCATION EXTRACTION - CRITICAL SECTION 🎓

⚠️ MANDATORY: Extract ALL education entries - DO NOT SKIP THIS SECTION ⚠️

REAL EXAMPLES FROM DATASET (LEARN THESE PATTERNS):
${datasetExamples.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}

COMMON DEGREE TYPES TO RECOGNIZE:
${commonDegrees.join(', ')}

COMMON FIELDS OF STUDY:
${commonFields.join(', ')}

WHERE TO LOOK FOR EDUCATION:
1. Sections titled: "Education", "Academic Background", "Qualifications", "Academic Qualifications", "Academic History"
2. Look for university/college names followed by degree information
3. Look for graduation years (e.g., "2015-2019", "Class of 2020", "Graduated 2018", "05/16", "2010/06")
4. Look for degree abbreviations (BS, MS, MBA, PhD, B.A., B.S., etc.)
5. Even if no "Education" header exists, extract any degree/university information found
6. Look for patterns like "University Name - Degree (Year)"
7. Look for patterns like "Degree in Field, University (Year)"

EXTRACTION RULES:
1. Extract degree type (Bachelor's, Master's, PhD, etc.) - REQUIRED
2. Extract field of study/major (Computer Science, Engineering, etc.)
3. Extract institution name (university, college, school) - REQUIRED
4. Extract location (city, state, country) if mentioned
5. Extract dates (start year, end year, or graduation year)
6. Extract GPA if mentioned (e.g., "3.8/4.0", "First Class", "Distinction")
7. Extract honors/achievements (Dean's List, Summa Cum Laude, Honors, etc.)

DEGREE ABBREVIATIONS TO RECOGNIZE:
- BS/BSc/B.Sc/B.S. = Bachelor of Science
- BA/B.A = Bachelor of Arts
- MS/MSc/M.Sc/M.S. = Master of Science
- MA/M.A = Master of Arts
- BE/B.E = Bachelor of Engineering
- BTech/B.Tech = Bachelor of Technology
- MTech/M.Tech = Master of Technology
- MBA/M.B.A = Master of Business Administration
- PhD/Ph.D/Ph.D. = Doctor of Philosophy
- MD/M.D = Doctor of Medicine
- JD/J.D = Juris Doctor
- MCA = Master of Computer Applications
- BCA = Bachelor of Computer Applications

DATE FORMAT RECOGNITION:
- "2015-2019" = startDate: "2015", endDate: "2019"
- "05/16" or "2016/05" = "2016-05" or "2016"
- "Class of 2020" = endDate: "2020"
- "Graduated 2018" = endDate: "2018"
- "Present" or "Current" = endDate: "Present"
- "08/2013" = "2013-08" or "2013"

CRITICAL FALLBACK RULES:
- If you see ANY university name, create an education entry
- If you see ANY degree abbreviation, create an education entry
- If you see graduation years like "2015-2019", create an education entry
- NEVER return empty education array if ANY academic information exists
- When in doubt, extract it as education
- If degree is not clear, use "Bachelor's Degree" or "Degree" as default
- If field is not clear, extract it from the program name or leave empty

EXAMPLE PATTERNS TO MATCH:
- "Bachelor of Science in Computer Science, MIT, 2015-2019"
- "Stanford University | MS Computer Science | 2020"
- "B.Tech in Engineering from IIT Delhi (2014-2018)"
- "MBA, Harvard Business School, Class of 2022"
- "University of California - Computer Science (2016-2020)"
- "George Washington University - BA Political Science (2010, Washington, DC)"
- "The University of Iowa - B.A. in Computer Science (05/16, Iowa City, IA)"
- "Community College of Baltimore County - Associate in Information Technology (2010/06, Essex, MD)"
`;
  }

  /**
   * Validate and enhance extracted education
   */
  validateEducation(extractedEducation: any[]): any[] {
    console.log('🎓 [EDUCATION VALIDATOR] Input:', {
      isArray: Array.isArray(extractedEducation),
      length: extractedEducation?.length || 0,
      data: extractedEducation
    });

    if (!extractedEducation || extractedEducation.length === 0) {
      console.warn('⚠️ [EDUCATION VALIDATOR] No education data extracted - returning empty array');
      return [];
    }

    console.log(`🔍 [EDUCATION VALIDATOR] Validating ${extractedEducation.length} education entries...`);

    const validated = extractedEducation.map((edu, index) => {
      console.log(`🔍 [EDUCATION VALIDATOR] Entry ${index + 1} BEFORE validation:`, edu);

      // Normalize degree names
      if (edu.degree) {
        edu.degree = this.normalizeDegree(edu.degree);
      }

      // Ensure required fields with better defaults
      if (!edu.institution || edu.institution.trim() === '') {
        edu.institution = 'University';
        console.warn(`⚠️ [EDUCATION VALIDATOR] Entry ${index + 1} missing institution, using default`);
      }
      
      if (!edu.degree || edu.degree.trim() === '') {
        // Try to infer from field or use default
        if (edu.field && edu.field.toLowerCase().includes('master')) {
          edu.degree = 'Master\'s Degree';
        } else if (edu.field && edu.field.toLowerCase().includes('phd')) {
          edu.degree = 'Doctor of Philosophy';
        } else {
          edu.degree = 'Bachelor\'s Degree';
        }
        console.warn(`⚠️ [EDUCATION VALIDATOR] Entry ${index + 1} missing degree, inferred: ${edu.degree}`);
      }
      
      if (!edu.field) {
        edu.field = '';
      }

      // Normalize dates
      if (edu.startDate) {
        edu.startDate = this.normalizeDate(edu.startDate);
      }
      if (edu.endDate) {
        edu.endDate = this.normalizeDate(edu.endDate);
      }

      console.log(`✅ [EDUCATION VALIDATOR] Entry ${index + 1} AFTER validation:`, edu);
      return edu;
    });

    console.log(`✅ [EDUCATION VALIDATOR] Validation complete. Returning ${validated.length} entries`);
    return validated;
  }

  /**
   * Normalize date formats
   */
  private normalizeDate(date: string): string {
    if (!date) return '';
    
    // Handle "Present" or "Current"
    if (date.toLowerCase().includes('present') || date.toLowerCase().includes('current')) {
      return 'Present';
    }

    // Handle formats like "05/16" or "2016/05"
    const slashMatch = date.match(/(\d{2})\/(\d{2,4})/);
    if (slashMatch) {
      const [_, first, second] = slashMatch;
      // If second part is 2 digits, it's likely MM/YY
      if (second.length === 2) {
        return `20${second}-${first}`;
      }
      // If first part is 2 digits and second is 4, it's MM/YYYY
      if (first.length === 2 && second.length === 4) {
        return `${second}-${first}`;
      }
    }

    // Handle year only (e.g., "2016")
    if (/^\d{4}$/.test(date)) {
      return date;
    }

    // Handle YYYY-MM format
    if (/^\d{4}-\d{2}$/.test(date)) {
      return date;
    }

    // Return as-is if we can't parse
    return date;
  }

  /**
   * Normalize degree names
   */
  private normalizeDegree(degree: string): string {
    const degreeMap: { [key: string]: string } = {
      'bs': 'Bachelor of Science',
      'bsc': 'Bachelor of Science',
      'b.sc': 'Bachelor of Science',
      'b.s': 'Bachelor of Science',
      'b.s.': 'Bachelor of Science',
      'bachelor of science': 'Bachelor of Science',
      'bachelor\'s in science': 'Bachelor of Science',
      'ba': 'Bachelor of Arts',
      'b.a': 'Bachelor of Arts',
      'b.a.': 'Bachelor of Arts',
      'bachelor of arts': 'Bachelor of Arts',
      'bachelor\'s in arts': 'Bachelor of Arts',
      'ms': 'Master of Science',
      'msc': 'Master of Science',
      'm.sc': 'Master of Science',
      'm.s': 'Master of Science',
      'm.s.': 'Master of Science',
      'master of science': 'Master of Science',
      'master\'s in science': 'Master of Science',
      'ma': 'Master of Arts',
      'm.a': 'Master of Arts',
      'm.a.': 'Master of Arts',
      'master of arts': 'Master of Arts',
      'master\'s in arts': 'Master of Arts',
      'be': 'Bachelor of Engineering',
      'b.e': 'Bachelor of Engineering',
      'b.e.': 'Bachelor of Engineering',
      'bachelor of engineering': 'Bachelor of Engineering',
      'btech': 'Bachelor of Technology',
      'b.tech': 'Bachelor of Technology',
      'bachelor of technology': 'Bachelor of Technology',
      'mtech': 'Master of Technology',
      'm.tech': 'Master of Technology',
      'master of technology': 'Master of Technology',
      'mba': 'Master of Business Administration',
      'm.b.a': 'Master of Business Administration',
      'm.b.a.': 'Master of Business Administration',
      'master of business administration': 'Master of Business Administration',
      'phd': 'Doctor of Philosophy',
      'ph.d': 'Doctor of Philosophy',
      'ph.d.': 'Doctor of Philosophy',
      'doctor of philosophy': 'Doctor of Philosophy',
      'mca': 'Master of Computer Applications',
      'm.c.a': 'Master of Computer Applications',
      'master of computer applications': 'Master of Computer Applications',
      'bca': 'Bachelor of Computer Applications',
      'b.c.a': 'Bachelor of Computer Applications',
      'bachelor of computer applications': 'Bachelor of Computer Applications',
      'associate': 'Associate Degree',
      'associate\'s': 'Associate Degree',
      'associate degree': 'Associate Degree',
      'associate\'s degree': 'Associate Degree',
      'bachelor': 'Bachelor\'s Degree',
      'bachelor\'s': 'Bachelor\'s Degree',
      'bachelor\'s degree': 'Bachelor\'s Degree',
      'master': 'Master\'s Degree',
      'master\'s': 'Master\'s Degree',
      'master\'s degree': 'Master\'s Degree'
    };

    const lower = degree.toLowerCase().trim();
    
    // Direct match
    if (degreeMap[lower]) {
      return degreeMap[lower];
    }

    // Check if it contains a known degree type
    for (const [key, value] of Object.entries(degreeMap)) {
      if (lower.includes(key)) {
        return value;
      }
    }

    // Return original if no match found
    return degree;
  }
}

export const educationExtractor = new EducationExtractor();
