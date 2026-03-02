/**
 * Download ATS scoring dataset from Hugging Face
 * 
 * Dataset: netsol/resume-score-details
 * - 1,031 samples with resume-JD matching scores
 * - Includes macro/micro scoring criteria
 * - Generated and assessed using GPT-4o
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const DATASET_URL = 'https://huggingface.co/datasets/netsol/resume-score-details/resolve/main/data/train-00000-of-00001.parquet';
const OUTPUT_DIR = path.join(__dirname, 'server/data_sets');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'ats_scoring_dataset.parquet');

console.log('🔍 Downloading ATS scoring dataset from Hugging Face...\n');
console.log('Dataset: netsol/resume-score-details');
console.log('Samples: 1,031 resume-JD pairs with scoring\n');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Download the dataset
const file = fs.createWriteStream(OUTPUT_FILE);

https.get(DATASET_URL, (response) => {
  if (response.statusCode === 302 || response.statusCode === 301) {
    // Follow redirect
    https.get(response.headers.location, (redirectResponse) => {
      const totalSize = parseInt(redirectResponse.headers['content-length'], 10);
      let downloadedSize = 0;

      redirectResponse.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
        process.stdout.write(`\rDownloading: ${progress}% (${(downloadedSize / 1024 / 1024).toFixed(2)} MB / ${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
      });

      redirectResponse.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log('\n\n✅ Dataset downloaded successfully!');
        console.log(`📁 Saved to: ${OUTPUT_FILE}`);
        console.log('\n📊 Dataset Info:');
        console.log('   - 1,031 samples');
        console.log('   - Resume + Job Description pairs');
        console.log('   - Macro/micro scoring criteria');
        console.log('   - Justifications for scores');
        console.log('   - Personal info extraction');
        console.log('\n🎯 Next steps:');
        console.log('   1. Install parquet reader: npm install parquetjs');
        console.log('   2. Run: node parse-ats-dataset.cjs');
        console.log('   3. Compile patterns: node compile-dspy-patterns.cjs');
      });
    }).on('error', (err) => {
      fs.unlink(OUTPUT_FILE, () => {});
      console.error('\n❌ Download failed:', err.message);
    });
  } else {
    const totalSize = parseInt(response.headers['content-length'], 10);
    let downloadedSize = 0;

    response.on('data', (chunk) => {
      downloadedSize += chunk.length;
      const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
      process.stdout.write(`\rDownloading: ${progress}% (${(downloadedSize / 1024 / 1024).toFixed(2)} MB / ${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
    });

    response.pipe(file);

    file.on('finish', () => {
      file.close();
      console.log('\n\n✅ Dataset downloaded successfully!');
      console.log(`📁 Saved to: ${OUTPUT_FILE}`);
      console.log('\n📊 Dataset Info:');
      console.log('   - 1,031 samples');
      console.log('   - Resume + Job Description pairs');
      console.log('   - Macro/micro scoring criteria');
      console.log('   - Justifications for scores');
      console.log('   - Personal info extraction');
      console.log('\n🎯 Next steps:');
      console.log('   1. Install parquet reader: npm install parquetjs');
      console.log('   2. Run: node parse-ats-dataset.cjs');
      console.log('   3. Compile patterns: node compile-dspy-patterns.cjs');
    });
  }
}).on('error', (err) => {
  fs.unlink(OUTPUT_FILE, () => {});
  console.error('\n❌ Download failed:', err.message);
  console.error('\nTry manual download:');
  console.error('1. Visit: https://huggingface.co/datasets/netsol/resume-score-details');
  console.error('2. Download the parquet file');
  console.error(`3. Save to: ${OUTPUT_FILE}`);
});
