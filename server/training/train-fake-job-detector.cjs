const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const Groq = require('groq-sdk').default;
require('dotenv').config();

if (!process.env.GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY is not set in environment variables');
  console.error('Please add GROQ_API_KEY to your .env file');
  process.exit(1);
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * DSPy-style training for fake job detection
 * Uses few-shot learning with metric-based optimization
 */

// Metric function: Calculate accuracy
function calculateMetrics(predictions, actuals) {
  let correct = 0;
  let truePositives = 0;
  let falsePositives = 0;
  let trueNegatives = 0;
  let falseNegatives = 0;

  for (let i = 0; i < predictions.length; i++) {
    const pred = predictions[i];
    const actual = actuals[i];

    if (pred === actual) correct++;

    if (pred && actual) truePositives++;
    else if (pred && !actual) falsePositives++;
    else if (!pred && !actual) trueNegatives++;
    else if (!pred && actual) falseNegatives++;
  }

  const accuracy = correct / predictions.length;
  const precision = truePositives / (truePositives + falsePositives) || 0;
  const recall = truePositives / (truePositives + falseNegatives) || 0;
  const f1 = 2 * (precision * recall) / (precision + recall) || 0;

  return { accuracy, precision, recall, f1, correct, total: predictions.length };
}

// Load and parse dataset
function loadDataset() {
  console.log('📂 Loading dataset...');
  const csvPath = path.join(__dirname, 'server/data_sets/fake_real_job_postings_3000x25.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  console.log(`✅ Loaded ${records.length} job postings`);
  
  // Split into train/test (80/20)
  const shuffled = records.sort(() => Math.random() - 0.5);
  const splitIndex = Math.floor(shuffled.length * 0.8);
  
  return {
    train: shuffled.slice(0, splitIndex),
    test: shuffled.slice(splitIndex),
    all: shuffled
  };
}

// Generate few-shot examples from training data
function generateFewShotExamples(trainData, count = 10) {
  const fakeExamples = trainData.filter(j => j.is_fake === '1').slice(0, count / 2);
  const realExamples = trainData.filter(j => j.is_fake === '0').slice(0, count / 2);
  
  const examples = [...fakeExamples, ...realExamples].sort(() => Math.random() - 0.5);
  
  return examples.map(job => ({
    input: formatJobForPrompt(job),
    output: job.is_fake === '1' ? 'FAKE' : 'REAL',
    reasoning: generateReasoning(job)
  }));
}

function formatJobForPrompt(job) {
  return `Title: ${job.job_title || 'N/A'}
Location: ${job.location || 'N/A'}
Salary: ${job.salary_range || 'N/A'}
Company: ${job.company_profile?.substring(0, 200) || 'N/A'}
Description: ${job.job_description?.substring(0, 300) || 'N/A'}
Requirements: ${job.requirements?.substring(0, 200) || 'N/A'}
Telecommuting: ${job.telecommuting || 'N/A'}
Has Logo: ${job.has_logo || 'N/A'}
Experience: ${job.required_experience_years || 'N/A'}`;
}

function generateReasoning(job) {
  const redFlags = [];
  
  if (job.is_fake === '1') {
    if (!job.company_profile || job.company_profile.length < 50) redFlags.push('Minimal company information');
    if (job.has_logo === '0') redFlags.push('No company logo');
    if (job.telecommuting === '1' && (!job.required_experience_years || job.required_experience_years === '0')) redFlags.push('Remote work with minimal experience required');
    if (!job.salary_range) redFlags.push('No salary information');
    if (job.fraud_reason) redFlags.push(job.fraud_reason);
  }
  
  return redFlags.length > 0 ? `Red flags: ${redFlags.join(', ')}` : 'Appears legitimate';
}

// Build optimized system prompt with examples
function buildOptimizedPrompt(examples) {
  const exampleText = examples.map((ex, idx) => 
    `Example ${idx + 1}:
${ex.input}
Classification: ${ex.output}
Reasoning: ${ex.reasoning}
`
  ).join('\n---\n\n');

  return `You are an expert at detecting fraudulent job postings. You have been trained on thousands of real and fake job postings.

CRITICAL INDICATORS OF FAKE JOBS:
1. Missing or vague company information (< 50 characters)
2. No company logo (has_company_logo = 0)
3. Remote work with "Not Applicable" experience requirements
4. Missing salary information
5. No screening questions (has_questions = 0)
6. Unrealistic promises or "get rich quick" language
7. Poor grammar and unprofessional writing
8. Requests for upfront payment or personal financial info
9. Pressure tactics ("act now", "limited time")
10. Generic job descriptions with no specific responsibilities

TRAINING EXAMPLES:
${exampleText}

INSTRUCTIONS:
Analyze the job posting carefully. Look for the red flags above. Respond in this exact JSON format:
{
  "isFake": true/false,
  "confidence": 0-100,
  "reasoning": "brief explanation of key factors",
  "redFlags": ["specific flag 1", "specific flag 2"]
}

Be precise and base your decision on concrete evidence from the posting.`;
}

// Test prompt on validation set
async function evaluatePrompt(systemPrompt, testData, sampleSize = 50) {
  console.log(`\n🧪 Evaluating prompt on ${sampleSize} test samples...`);
  
  const testSample = testData.slice(0, sampleSize);
  const predictions = [];
  const actuals = [];
  
  for (let i = 0; i < testSample.length; i++) {
    const job = testSample[i];
    const userPrompt = `Analyze this job posting:\n\n${formatJobForPrompt(job)}`;
    
    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 500
      });
      
      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        predictions.push(result.isFake);
      } else {
        predictions.push(content.toLowerCase().includes('fake'));
      }
      
      actuals.push(job.is_fake === '1');
      
      if ((i + 1) % 10 === 0) {
        console.log(`  Processed ${i + 1}/${sampleSize}...`);
      }
    } catch (error) {
      console.error(`Error on sample ${i}:`, error.message);
      predictions.push(false); // Default to not fake on error
      actuals.push(job.is_fake === '1');
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return calculateMetrics(predictions, actuals);
}

// Main training function
async function trainFakeJobDetector() {
  console.log('🚀 Starting DSPy-style training for JD Trust Score\n');
  
  // Load dataset
  const dataset = loadDataset();
  console.log(`📊 Train: ${dataset.train.length}, Test: ${dataset.test.length}\n`);
  
  // Generate few-shot examples
  console.log('🎯 Generating few-shot examples...');
  const examples = generateFewShotExamples(dataset.train, 10);
  console.log(`✅ Generated ${examples.length} examples\n`);
  
  // Build optimized prompt
  console.log('🔨 Building optimized prompt...');
  const optimizedPrompt = buildOptimizedPrompt(examples);
  console.log('✅ Prompt built\n');
  
  // Evaluate on test set
  const metrics = await evaluatePrompt(optimizedPrompt, dataset.test, 50);
  
  console.log('\n📊 EVALUATION RESULTS:');
  console.log(`  Accuracy:  ${(metrics.accuracy * 100).toFixed(2)}%`);
  console.log(`  Precision: ${(metrics.precision * 100).toFixed(2)}%`);
  console.log(`  Recall:    ${(metrics.recall * 100).toFixed(2)}%`);
  console.log(`  F1 Score:  ${(metrics.f1 * 100).toFixed(2)}%`);
  console.log(`  Correct:   ${metrics.correct}/${metrics.total}\n`);
  
  // Save compiled prompt
  const outputPath = path.join(__dirname, 'server/data_sets/fake_job_detector_prompt.json');
  const output = {
    systemPrompt: optimizedPrompt,
    metrics,
    examples: examples.length,
    trainedAt: new Date().toISOString(),
    model: 'llama-3.3-70b-versatile'
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`💾 Saved compiled prompt to: ${outputPath}`);
  console.log('\n✅ Training complete!');
}

// Run training
trainFakeJobDetector().catch(console.error);
