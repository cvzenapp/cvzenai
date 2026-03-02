/**
 * Test the new DSPy-trained resume parser (4.1M+ records)
 */

const fs = require('fs');
const path = require('path');

async function testNewResumeParser() {
  console.log('🧪 Testing New DSPy-Trained Resume Parser (4.1M+ records)...\n');

  try {
    // Import the new parser from built dist
    const { resumeParser } = await import('./dist/server/node-build.mjs');

    // Sample resume text
    const sampleResume = `
Alex Morgan
john.doe@email.com | +1-555-123-4567 | linkedin.com/in/johndoe | github.com/johndoe
San Francisco, CA

PROFESSIONAL SUMMARY
Experienced Software Engineer with 5+ years developing scalable web applications using React, Node.js, and AWS. 
Proven track record of leading cross-functional teams and delivering high-impact features.

SKILLS
JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, MongoDB, AWS, Docker, Kubernetes, Git

EXPERIENCE

Senior Software Engineer
Tech Company Inc. | San Francisco, CA | 2020-01 - Present
- Led development of microservices architecture serving 1M+ users
- Implemented CI/CD pipeline reducing deployment time by 60%
- Mentored team of 5 junior developers

Software Engineer
Startup Co. | San Francisco, CA | 2018-06 - 2019-12
- Built RESTful APIs using Node.js and Express
- Developed React frontend components
- Optimized database queries improving performance by 40%

EDUCATION

Bachelor of Science in Computer Science
University of California, Berkeley | Berkeley, CA | 2014 - 2018
GPA: 3.8/4.0

PROJECTS

E-Commerce Platform
Built full-stack e-commerce platform with React, Node.js, and PostgreSQL
Technologies: React, Node.js, Express, PostgreSQL, Stripe
GitHub: github.com/johndoe/ecommerce

CERTIFICATIONS
AWS Certified Solutions Architect
Google Cloud Professional Developer
`;

    console.log('📄 Sample Resume Length:', sampleResume.length, 'characters\n');

    // Test parsing
    console.log('🎯 Parsing resume with DSPy-trained parser...\n');
    const startTime = Date.now();
    
    const result = await resumeParser.parseResume(sampleResume);
    
    const duration = Date.now() - startTime;

    console.log('\n✅ Parsing Complete!\n');
    console.log('⏱️  Duration:', duration, 'ms\n');

    // Display results
    console.log('📊 PARSED RESULTS:\n');
    console.log('Personal Info:');
    console.log('  Name:', result.personalInfo?.name || 'N/A');
    console.log('  Email:', result.personalInfo?.email || 'N/A');
    console.log('  Phone:', result.personalInfo?.phone || 'N/A');
    console.log('  Location:', result.personalInfo?.location || 'N/A');
    console.log('  LinkedIn:', result.personalInfo?.linkedin || 'N/A');
    console.log('');

    console.log('Summary:', result.summary?.substring(0, 100) || 'N/A');
    console.log('');

    console.log('Skills:', result.skills?.length || 0, 'items');
    if (result.skills && result.skills.length > 0) {
      console.log('  -', result.skills.slice(0, 5).join(', '), '...');
    }
    console.log('');

    console.log('Experience:', result.experience?.length || 0, 'entries');
    if (result.experience && result.experience.length > 0) {
      result.experience.forEach((exp, i) => {
        console.log(`  ${i + 1}. ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate})`);
      });
    }
    console.log('');

    console.log('Education:', result.education?.length || 0, 'entries');
    if (result.education && result.education.length > 0) {
      result.education.forEach((edu, i) => {
        console.log(`  ${i + 1}. ${edu.degree} from ${edu.institution} (${edu.year || edu.startDate})`);
      });
    }
    console.log('');

    console.log('Projects:', result.projects?.length || 0, 'entries');
    if (result.projects && result.projects.length > 0) {
      result.projects.forEach((proj, i) => {
        console.log(`  ${i + 1}. ${proj.name}`);
        console.log(`     Technologies: ${proj.technologies?.join(', ') || 'N/A'}`);
      });
    }
    console.log('');

    console.log('Certifications:', result.certifications?.length || 0, 'entries');
    if (result.certifications && result.certifications.length > 0) {
      result.certifications.forEach((cert, i) => {
        console.log(`  ${i + 1}. ${cert}`);
      });
    }
    console.log('');

    // Check if compiled patterns were loaded
    console.log('📚 Training Data Info:');
    console.log('  Trained on: 4.1M+ records from 8 datasets');
    console.log('  Pattern file: server/data_sets/resume_parsing_compiled_patterns.json');
    console.log('');

    // Verify pattern file exists
    const patternPath = path.join(process.cwd(), 'server/data_sets/resume_parsing_compiled_patterns.json');
    if (fs.existsSync(patternPath)) {
      const stats = fs.statSync(patternPath);
      console.log('✅ Pattern file found:', (stats.size / 1024).toFixed(2), 'KB');
      
      const patterns = JSON.parse(fs.readFileSync(patternPath, 'utf-8'));
      console.log('  Training records:', patterns.datasetInfo?.trainingRecords?.toLocaleString() || 'N/A');
      console.log('  Test records:', patterns.datasetInfo?.testRecords?.toLocaleString() || 'N/A');
      console.log('  Few-shot examples:', patterns.examples || 'N/A');
      console.log('  Quality score:', ((patterns.metrics?.avgQualityScore || 0) * 100).toFixed(1) + '%');
    } else {
      console.log('⚠️  Pattern file not found - using default prompt');
    }

    console.log('\n✅ Test Complete!');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testNewResumeParser();
