const bcrypt = require('bcryptjs');

async function generatePasswordHash() {
  const password = 'TempPassword123!';
  
  try {
    // Generate hash with salt rounds 10 (same as used in the app)
    const hash = await bcrypt.hash(password, 10);
    console.log('Password:', password);
    console.log('Generated Hash:', hash);
    
    // Verify the hash works
    const isValid = await bcrypt.compare(password, hash);
    console.log('Hash verification:', isValid ? '✅ Valid' : '❌ Invalid');
    
    console.log('\n--- SQL Command to run in PostgreSQL ---');
    console.log(`UPDATE users SET password_hash = '${hash}', updated_at = NOW() WHERE email = 'imyogesh82@gmail.com';`);
    console.log('\n--- Verification Query ---');
    console.log(`SELECT id, email, first_name, last_name, user_type, updated_at FROM users WHERE email = 'imyogesh82@gmail.com';`);
    
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

generatePasswordHash();