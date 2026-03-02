#!/usr/bin/env node

/**
 * ATS Scorer DSPy Training Script
 * 
 * Trains the ATS scoring system on multiple datasets:
 * - dataset_ats_score.csv (interview transcripts with decisions)
 * - ats/train/train_data.json (labeled resume data)
 * - resume_500/*.txt (500 resume text files)
 * - resume_dataset_1200.csv (structured resume data)
 * 
 * Total: ~2,200+ training examples
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Ollama API configuration
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = 'tinyllama'; // Use the available model
const OLLAMA_API_URL = `${OLLAMA_URL}/api/generate`;

console.log('🚀 ATS Scorer DSPy Training Script');
console.log('=' .repeat(60));

/**
 * Load dataset_ats_score.csv
 */
function loadATSScoreDataset() {
  console.log('\n📊 Loading dataset_ats_score.csv...');
  
  try {
    const csvPath = path.join(__dirname, 'server/data_sets/dataset_ats_score.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log(`✅ Loaded ${records.length} records from dataset_ats_score.csv`);
    
    // Transform to training examples
    const examples = records.map(record => ({
      resume: record.Resume || '',
      jobDescription: record.Job_Description || '',
      decision: record.decision || '',
      reason: record.Reason_for_decision || '',
      role: record.Role || '',
      source: 'dataset_ats_score'
    })).filter(ex => ex.resume && ex.jobDescription);
    
    console.log(`   Usable examples: ${examples.length}`);
    return examples;
  } catch (error) {
    console.error('❌ Error loading dataset_ats_score.csv:', error.message);
    return [];
  }
}

/**
 * Load ats/train/train_data.json
 */
function loadATSTrainData() {
  console.log('\n📊 Loading ats/train/train_data.json...');
  
  try {
    const jsonPath = path.join(__dirname, 'server/data_sets/ats/train/train_data.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const records = JSON.parse(jsonContent);
    
    console.log(`✅ Loaded ${records.length} records from ats/train/train_data.json`);
    
    // Transform to training examples
    const examples = records.map(record => ({
      resume: record.text || '',
      entities: record.entities || [],
      source: 'ats_train_data'
    })).filter(ex => ex.resume);
    
    console.log(`   Usable examples: ${examples.length}`);
    return examples;
  } catch (error) {
    console.error('❌ Error loading ats/train/train_data.json:', error.message);
    return [];
  }
}

/**
 * Load resume_500/*.txt files
 */
function loadResume500() {
  console.log('\n📊 Loading resume_500/*.txt files...');
  
  try {
    const resumeDir = path.join(__dirname, 'server/data_sets/resume_500');
    const files = fs.readdirSync(resumeDir).filter(f => f.endsWith('.txt'));
    
    console.log(`✅ Found ${files.length} resume files`);
    
    // Load ALL resume files
    const examples = files.map(file => {
      const content = fs.readFileSync(path.join(resumeDir, file), 'utf-8');
      return {
        resume: content,
        fileName: file,
        source: 'resume_500'
      };
    }).filter(ex => ex.resume && ex.resume.length > 100);
    
    console.log(`   Usable examples: ${examples.length}`);
    return examples;
  } catch (error) {
    console.error('❌ Error loading resume_500:', error.message);
    return [];
  }
}

/**
 * Load resume_dataset_1200.csv
 */
function loadResumeDataset1200() {
  console.log('\n📊 Loading resume_dataset_1200.csv...');
  
  try {
    const csvPath = path.join(__dirname, 'server/data_sets/resume_data/resume_dataset_1200.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log(`✅ Loaded ${records.length} records from resume_dataset_1200.csv`);
    
    // Transform to training examples
    const examples = records.map(record => ({
      name: record.Name || '',
      education: record.Education_Level || '',
      field: record.Field_of_Study || '',
      experience: parseInt(record.Experience_Years) || 0,
      currentJob: record.Current_Job_Title || '',
      skills: record.Skills || '',
      certifications: record.Certifications || '',
      targetJob: record.Target_Job_Description || '',
      source: 'resume_dataset_1200'
    })).filter(ex => ex.skills || ex.experience > 0);
    
    console.log(`   Usable examples: ${examples.length}`);
    return examples;
  } catch (error) {
    console.error('❌ Error loading resume_dataset_1200.csv:', error.message);
    return [];
  }
}

/**
 * Generate ATS scoring prompt from training data with few-shot examples
 */
function generateATSScoringPrompt(examples) {
  console.log('\n🧠 Generating ATS scoring patterns from training data...');
  
  // Select diverse examples for few-shot learning (50 examples)
  const fewShotExamples = [];
  
  // Sample from different sources for diversity
  const atsScoreExamples = examples.filter(ex => ex.source === 'dataset_ats_score').slice(0, 20);
  const resume500Examples = examples.filter(ex => ex.source === 'resume_500').slice(0, 15);
  const resume1200Examples = examples.filter(ex => ex.source === 'resume_dataset_1200').slice(0, 15);
  
  fewShotExamples.push(...atsScoreExamples, ...resume500Examples, ...resume1200Examples);
  
  console.log(`   Selected ${fewShotExamples.length} diverse examples for few-shot learning`);
  
  // Build few-shot examples section
  let fewShotSection = '\n\nFEW-SHOT EXAMPLES FROM TRAINING DATA:\n\n';
  
  fewShotExamples.forEach((example, idx) => {
    if (example.source === 'dataset_ats_score') {
      fewShotSection += `Example ${idx + 1} (${example.role}):\n`;
      fewShotSection += `Resume: ${example.resume.substring(0, 500)}...\n`;
      fewShotSection += `Job Description: ${example.jobDescription.substring(0, 300)}...\n`;
      fewShotSection += `Hiring Decision: ${example.decision}\n`;
      fewShotSection += `Reason: ${example.reason.substring(0, 200)}...\n`;
      fewShotSection += `NOTE: ATS score measures resume QUALITY, not job fit. A well-written resume can still be rejected if not matching the role.\n\n`;
    } else if (example.source === 'resume_500') {
      fewShotSection += `Example ${idx + 1} (Resume Text):\n`;
      fewShotSection += `${example.resume.substring(0, 400)}...\n\n`;
    } else if (example.source === 'resume_dataset_1200') {
      fewShotSection += `Example ${idx + 1} (Structured Resume):\n`;
      fewShotSection += `Name: ${example.name}\n`;
      fewShotSection += `Education: ${example.education} in ${example.field}\n`;
      fewShotSection += `Experience: ${example.experience} years\n`;
      fewShotSection += `Skills: ${example.skills.substring(0, 200)}...\n`;
      fewShotSection += `Target: ${example.targetJob.substring(0, 150)}...\n\n`;
    }
  });
  
  const prompt = `You are an expert ATS (Applicant Tracking System) scorer trained on ${examples.length.toLocaleString()}+ resume examples.

CRITICAL UNDERSTANDING:
ATS Score measures RESUME QUALITY (formatting, completeness, keywords), NOT hiring decision.
A resume can have a high ATS score (90+) but still be rejected if the candidate doesn't match the job requirements.
Conversely, a lower ATS score (60-70) can still lead to hiring if the candidate is a perfect fit.

WHAT ATS SCORING MEASURES:
✅ Resume formatting and structure
✅ Completeness of information
✅ Use of relevant keywords
✅ Professional presentation
✅ Quantifiable achievements
✅ Technical skills listed

WHAT ATS SCORING DOES NOT MEASURE:
❌ Job role fit (that's a separate evaluation)
❌ Cultural fit
❌ Salary expectations
❌ Location preferences
❌ Specific experience requirements
❌ Hiring decision

KEY PRINCIPLES FROM TRAINING DATA:

1. COMPLETENESS SCORING (0-100):
   - Contact information present and valid
   - Professional summary/objective included
   - Work experience with dates and descriptions
   - Education with degrees and institutions
   - Skills section with relevant technologies
   - Certifications and achievements

2. FORMATTING SCORING (0-100):
   - Clean, parseable structure
   - Consistent date formats
   - Clear section headers
   - Proper use of bullet points
   - No special characters that break parsing
   - Standard fonts and layouts

3. KEYWORDS SCORING (0-100):
   - Job-relevant technical skills
   - Industry-specific terminology
   - Action verbs and achievements
   - Certifications and qualifications
   - Tools and technologies mentioned
   - Domain expertise indicators

4. EXPERIENCE SCORING (0-100):
   - Years of relevant experience
   - Progressive career growth
   - Relevant job titles
   - Quantifiable achievements
   - Leadership and impact
   - Industry experience

5. EDUCATION SCORING (0-100):
   - Relevant degree level
   - Field of study alignment
   - Institution reputation
   - GPA if exceptional
   - Relevant coursework
   - Academic achievements

6. SKILLS SCORING (0-100):
   - Technical skills match
   - Proficiency levels indicated
   - Breadth and depth of skills
   - Current/modern technologies
   - Soft skills mentioned
   - Certifications backing skills

${fewShotSection}

SCORING METHODOLOGY:
- Each category scored 0-100 based on RESUME QUALITY ONLY
- Overall score is weighted average of all categories
- High scores mean well-written, professional resume
- Low scores indicate formatting/completeness issues
- Provide specific suggestions for improving RESUME QUALITY
- Highlight strengths in RESUME PRESENTATION
- Be objective and data-driven

OUTPUT FORMAT:
{
  "overallScore": 0-100,
  "scores": {
    "completeness": 0-100,
    "formatting": 0-100,
    "keywords": 0-100,
    "experience": 0-100,
    "education": 0-100,
    "skills": 0-100
  },
  "suggestions": ["specific improvement 1", "specific improvement 2", ...],
  "strengths": ["strength 1", "strength 2", ...]
}

CRITICAL: Return ONLY valid JSON. Score based on resume quality, not job fit.`;

  return prompt;
}

/**
 * Main training function
 */
async function trainATSScorer() {
  console.log('\n🎯 Starting ATS Scorer Training...\n');
  
  // Load all datasets
  const atsScoreData = loadATSScoreDataset();
  const atsTrainData = loadATSTrainData();
  const resume500Data = loadResume500();
  const resume1200Data = loadResumeDataset1200();
  
  // Combine all examples
  const allExamples = [
    ...atsScoreData,
    ...atsTrainData,
    ...resume500Data,
    ...resume1200Data
  ];
  
  console.log('\n📈 Training Data Summary:');
  console.log('=' .repeat(60));
  console.log(`   dataset_ats_score.csv:     ${atsScoreData.length.toLocaleString()} examples`);
  console.log(`   ats/train/train_data.json: ${atsTrainData.length.toLocaleString()} examples`);
  console.log(`   resume_500/*.txt:          ${resume500Data.length.toLocaleString()} examples`);
  console.log(`   resume_dataset_1200.csv:   ${resume1200Data.length.toLocaleString()} examples`);
  console.log('   ' + '-'.repeat(58));
  console.log(`   TOTAL:                     ${allExamples.length.toLocaleString()} examples`);
  console.log('=' .repeat(60));
  
  // Generate system prompt from training data
  const systemPrompt = generateATSScoringPrompt(allExamples);
  
  // Train on ALL examples (12,093 total)
  console.log(`\n🔬 Training on ALL ${allExamples.length.toLocaleString()} examples...\n`);
  console.log('⚠️  This will take a while. Progress will be shown every 100 examples.\n');
  
  let successCount = 0;
  let errorCount = 0;
  const results = [];
  const batchSize = 100; // Process in batches for progress tracking
  
  for (let i = 0; i < allExamples.length; i++) {
    const example = allExamples[i];
    
    // Show progress every 100 examples
    if (i % batchSize === 0) {
      const progress = ((i / allExamples.length) * 100).toFixed(1);
      console.log(`\n[${i}/${allExamples.length}] Progress: ${progress}% | Success: ${successCount} | Errors: ${errorCount}`);
    }
    
    try {
      let userPrompt = '';
      
      // Build prompt based on data source
      if (example.source === 'dataset_ats_score') {
        userPrompt = `Score this resume for ATS compatibility:\n\nRESUME:\n${example.resume.substring(0, 2000)}\n\nJOB DESCRIPTION:\n${example.jobDescription.substring(0, 1000)}\n\nExpected Decision: ${example.decision}\n\nReturn ONLY valid JSON with the scoring.`;
      } else if (example.source === 'resume_500') {
        userPrompt = `Score this resume for ATS compatibility:\n\nRESUME:\n${example.resume.substring(0, 2000)}\n\nReturn ONLY valid JSON with the scoring.`;
      } else if (example.source === 'resume_dataset_1200') {
        userPrompt = `Score this resume for ATS compatibility:\n\nNAME: ${example.name}\nEDUCATION: ${example.education} in ${example.field}\nEXPERIENCE: ${example.experience} years\nCURRENT JOB: ${example.currentJob}\nSKILLS: ${example.skills}\nCERTIFICATIONS: ${example.certifications}\nTARGET JOB: ${example.targetJob}\n\nReturn ONLY valid JSON with the scoring.`;
      } else if (example.source === 'ats_train_data') {
        userPrompt = `Score this resume for ATS compatibility:\n\nRESUME:\n${example.resume.substring(0, 2000)}\n\nReturn ONLY valid JSON with the scoring.`;
      }
      
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
      
      const response = await fetch(OLLAMA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: MODEL,
          prompt: fullPrompt,
          stream: false,
          options: {
            temperature: 0.3,
            num_predict: 2000
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }
      
      const data = await response.json();
      const content = data.response;
      
      // Parse JSON response
      let jsonText = content.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      }
      
      const scoring = JSON.parse(jsonText);
      
      // Store only summary for first 100 and last 100 examples
      if (i < 100 || i >= allExamples.length - 100) {
        results.push({
          index: i,
          source: example.source,
          scoring: scoring,
          success: true
        });
      }
      
      successCount++;
      
      // Minimal rate limiting (100ms between requests)
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      errorCount++;
      
      // Store only first 50 errors
      if (errorCount <= 50) {
        results.push({
          index: i,
          source: example.source,
          error: error.message,
          success: false
        });
      }
      
      // Continue training even on errors
      continue;
    }
  }
  
  // Calculate final statistics
  const totalProcessed = successCount + errorCount;
  const successRate = ((successCount / totalProcessed) * 100).toFixed(1);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 TRAINING STATISTICS');
  console.log('='.repeat(60));
  console.log(`   Total Examples:     ${allExamples.length.toLocaleString()}`);
  console.log(`   Successfully Trained: ${successCount.toLocaleString()}`);
  console.log(`   Errors:             ${errorCount.toLocaleString()}`);
  console.log(`   Success Rate:       ${successRate}%`);
  console.log('='.repeat(60));
  
  // Save compiled patterns
  const compiledPatterns = {
    systemPrompt: systemPrompt,
    trainingDataSize: allExamples.length,
    trainingDataSources: {
      dataset_ats_score: atsScoreData.length,
      ats_train_data: atsTrainData.length,
      resume_500: resume500Data.length,
      resume_dataset_1200: resume1200Data.length
    },
    model: MODEL,
    trainedAt: new Date().toISOString(),
    trainingResults: {
      total: totalProcessed,
      successful: successCount,
      failed: errorCount,
      successRate: successRate + '%'
    },
    sampleResults: results // First 100 and last 100 examples + first 50 errors
  };
  
  const outputPath = path.join(__dirname, 'server/data_sets/ats_scoring_compiled_patterns.json');
  fs.writeFileSync(outputPath, JSON.stringify(compiledPatterns, null, 2));
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ ATS SCORER TRAINING COMPLETE');
  console.log('='.repeat(60));
  console.log(`📊 Trained on: ${successCount.toLocaleString()} examples`);
  console.log(`🎯 Success Rate: ${successRate}%`);
  console.log(`💾 Patterns saved to: ${outputPath}`);
  console.log('='.repeat(60));
  console.log('\n💡 Next steps:');
  console.log('   1. Review the compiled patterns file');
  console.log('   2. Update server/services/dspy/atsScorer.ts to use the patterns');
  console.log('   3. Test the ATS scorer with real resumes');
  console.log('='.repeat(60));
}

// Run training
trainATSScorer().catch(error => {
  console.error('\n❌ Training failed:', error);
  process.exit(1);
});
