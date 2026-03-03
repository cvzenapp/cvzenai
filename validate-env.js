// Simple script to validate Railway environment variables
console.log('🔍 Environment Variables Validation');
console.log('=====================================');

const requiredVars = [
  'DATABASE_URL',
  'GROQ_API_KEY',
  'JWT_SECRET',
  'NODE_ENV'
];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${varName}: ${value ? '✅ SET' : '❌ MISSING'}`);
  if (value && varName === 'DATABASE_URL') {
    console.log(`  Format: ${value.startsWith('postgresql://') || value.startsWith('postgres://') ? '✅ VALID' : '❌ INVALID'}`);
    console.log(`  Length: ${value.length} characters`);
  }
});

console.log('\n🔍 All Environment Variables:');
Object.keys(process.env)
  .filter(key => !key.includes('PATH') && !key.includes('HOME'))
  .sort()
  .forEach(key => {
    const value = process.env[key];
    console.log(`${key}=${value?.substring(0, 50)}${value?.length > 50 ? '...' : ''}`);
  });