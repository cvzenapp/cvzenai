// Test script to verify the skills sorting fix
console.log('Testing skills sorting fix...');

// Simulate the old problematic scenario
const resumeWithStringSkills = {
  skills: ['JavaScript', 'React', 'Node.js', 'TypeScript']
};

const resumeWithObjectSkills = {
  skills: [
    { name: 'JavaScript', proficiency: 90, isCore: true },
    { name: 'React', proficiency: 85, isCore: true },
    { name: 'Node.js', proficiency: 80, isCore: false },
    { name: 'TypeScript', proficiency: 75, isCore: false }
  ]
};

// Test the fix logic
function getTopSkills(resume) {
  if (!resume.skills || resume.skills.length === 0) return [];
  
  // Handle both string array (legacy) and skill object array formats
  const skillObjects = resume.skills.map(skill => {
    if (typeof skill === 'string') {
      return { name: skill, proficiency: 0, category: 'Other', isCore: false };
    }
    return skill;
  });
  
  return skillObjects
    .sort((a, b) => (b.proficiency || 0) - (a.proficiency || 0))
    .slice(0, 8);
}

// Test with string skills (should not throw error)
try {
  const result1 = getTopSkills(resumeWithStringSkills);
  console.log('✅ String skills test passed:', result1.map(s => s.name));
} catch (error) {
  console.log('❌ String skills test failed:', error.message);
}

// Test with object skills (should work as before)
try {
  const result2 = getTopSkills(resumeWithObjectSkills);
  console.log('✅ Object skills test passed:', result2.map(s => s.name));
} catch (error) {
  console.log('❌ Object skills test failed:', error.message);
}

console.log('Test completed!');