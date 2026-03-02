import fs from 'fs';
import path from 'path';
import readline from 'readline';

/**
 * Training example for job description generation
 */
export interface JDTrainingExample {
  // Input features
  jobTitle: string;
  role: string;
  experienceLevel: string;
  skills: string[];
  location?: string;
  workType?: string;
  companyInfo?: string;
  qualifications?: string;
  
  // Expected output (ground truth from dataset)
  description: string;
  responsibilities: string[];
  requiredSkills: string[];
  benefits?: string[];
}

/**
 * Parse CSV line handling quoted fields with commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Clean and parse JSON-like strings from CSV
 */
function parseJSONField(field: string): string[] {
  if (!field) return [];
  
  // Remove quotes and braces
  const cleaned = field
    .replace(/^["'{]+|["'}]+$/g, '')
    .replace(/\\"/g, '"');
  
  // Split by common delimiters
  const items = cleaned
    .split(/[,\n•\-]/)
    .map(item => item.trim())
    .filter(item => item.length > 0 && item.length < 200);
  
  return items;
}

/**
 * Load training data from job_descriptions.csv
 */
export async function loadJDTrainingData(
  limit?: number,
  minDescriptionLength: number = 50
): Promise<JDTrainingExample[]> {
  const csvPath = path.join(process.cwd(), 'server/data_sets/job_descriptions.csv');
  
  if (!fs.existsSync(csvPath)) {
    throw new Error(`Dataset not found: ${csvPath}`);
  }

  const examples: JDTrainingExample[] = [];
  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  let header: string[] = [];

  for await (const line of rl) {
    if (lineCount === 0) {
      header = parseCSVLine(line);
      lineCount++;
      continue;
    }

    const fields = parseCSVLine(line);
    
    // Map fields by header index
    const getField = (name: string): string => {
      const index = header.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
      return index >= 0 ? fields[index] || '' : '';
    };

    const jobTitle = getField('Job Title');
    const role = getField('Role');
    const experience = getField('Experience');
    const description = getField('Job Description');
    const skills = getField('skills');
    const responsibilities = getField('Responsibilities');
    const benefits = getField('Benefits');
    const qualifications = getField('Qualifications');
    const location = getField('location');
    const workType = getField('Work Type');
    const company = getField('Company');

    // Filter out low-quality records
    if (
      !jobTitle ||
      !role ||
      !description ||
      description.length < minDescriptionLength ||
      jobTitle.length < 3 ||
      role.length < 3
    ) {
      lineCount++;
      continue;
    }

    const example: JDTrainingExample = {
      jobTitle: jobTitle.trim(),
      role: role.trim(),
      experienceLevel: experience.trim() || 'Not specified',
      skills: parseJSONField(skills),
      location: location.trim() || undefined,
      workType: workType.trim() || undefined,
      companyInfo: company.trim() || undefined,
      qualifications: qualifications.trim() || undefined,
      description: description.trim(),
      responsibilities: parseJSONField(responsibilities),
      requiredSkills: parseJSONField(skills),
      benefits: benefits ? parseJSONField(benefits) : undefined
    };

    examples.push(example);
    lineCount++;

    if (limit && examples.length >= limit) {
      break;
    }
  }

  console.log(`✅ Loaded ${examples.length} training examples from ${lineCount} total records`);
  
  return examples;
}

/**
 * Get statistics about the training data
 */
export async function getTrainingDataStats(examples: JDTrainingExample[]) {
  const stats = {
    totalExamples: examples.length,
    avgDescriptionLength: 0,
    avgResponsibilitiesCount: 0,
    avgSkillsCount: 0,
    uniqueTitles: new Set<string>(),
    uniqueRoles: new Set<string>(),
    experienceLevels: new Set<string>(),
    withBenefits: 0,
    withLocation: 0,
    withWorkType: 0
  };

  let totalDescLength = 0;
  let totalRespCount = 0;
  let totalSkillsCount = 0;

  examples.forEach(ex => {
    totalDescLength += ex.description.length;
    totalRespCount += ex.responsibilities.length;
    totalSkillsCount += ex.requiredSkills.length;
    
    stats.uniqueTitles.add(ex.jobTitle);
    stats.uniqueRoles.add(ex.role);
    stats.experienceLevels.add(ex.experienceLevel);
    
    if (ex.benefits && ex.benefits.length > 0) stats.withBenefits++;
    if (ex.location) stats.withLocation++;
    if (ex.workType) stats.withWorkType++;
  });

  stats.avgDescriptionLength = Math.round(totalDescLength / examples.length);
  stats.avgResponsibilitiesCount = Math.round(totalRespCount / examples.length);
  stats.avgSkillsCount = Math.round(totalSkillsCount / examples.length);

  return {
    ...stats,
    uniqueTitles: stats.uniqueTitles.size,
    uniqueRoles: stats.uniqueRoles.size,
    experienceLevels: stats.experienceLevels.size
  };
}
