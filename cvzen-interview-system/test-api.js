const jwt = require('jsonwebtoken');

// Create test JWT tokens (same secret as CVZen)
const JWT_SECRET = 'cvzen_jwt_secret_key_2024_secure_token_signing';

const recruiterToken = jwt.sign({
  userId: 1,
  id: 1,
  type: 'recruiter',
  email: 'recruiter@test.com'
}, JWT_SECRET, { expiresIn: '24h' });

const candidateToken = jwt.sign({
  userId: 2,
  id: 2,
  type: 'candidate',
  email: 'candidate@test.com'
}, JWT_SECRET, { expiresIn: '24h' });

console.log('🔑 Test Tokens Generated:');
console.log('Recruiter Token:', recruiterToken.substring(0, 50) + '...');
console.log('Candidate Token:', candidateToken.substring(0, 50) + '...');

// Test API endpoints
async function testAPI() {
  const baseUrl = 'http://localhost:4000/api';
  
  try {
    // Test 1: Health check
    console.log('\n📋 Testing Health Check...');
    const healthResponse = await fetch('http://localhost:4000/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health:', healthData.status);

    // Test 2: Create Session (Recruiter)
    console.log('\n📋 Testing Session Creation...');
    const createSessionResponse = await fetch(`${baseUrl}/sessions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${recruiterToken}`
      },
      body: JSON.stringify({
        cvzenInterviewId: 123,
        recruiterId: 1,
        candidateId: 2,
        scheduledStartTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        settings: {
          recordingEnabled: true,
          chatEnabled: true,
          maxDurationMinutes: 60
        }
      })
    });

    if (createSessionResponse.ok) {
      const sessionData = await createSessionResponse.json();
      console.log('✅ Session Created:', {
        sessionId: sessionData.data.sessionId,
        roomId: sessionData.data.roomId,
        url: sessionData.data.interviewRoomUrl
      });

      // Test 3: Get Session Details
      console.log('\n📋 Testing Get Session...');
      const getSessionResponse = await fetch(`${baseUrl}/sessions/${sessionData.data.sessionId}`, {
        headers: {
          'Authorization': `Bearer ${recruiterToken}`
        }
      });

      if (getSessionResponse.ok) {
        const session = await getSessionResponse.json();
        console.log('✅ Session Retrieved:', {
          id: session.data.id,
          status: session.data.status,
          roomId: session.data.roomId
        });
      } else {
        console.log('❌ Get Session Failed:', getSessionResponse.status);
      }

      // Test 4: Join Session (Candidate)
      console.log('\n📋 Testing Join Session...');
      const joinResponse = await fetch(`${baseUrl}/sessions/${sessionData.data.sessionId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${candidateToken}`
        },
        body: JSON.stringify({
          displayName: 'Test Candidate'
        })
      });

      if (joinResponse.ok) {
        const joinData = await joinResponse.json();
        console.log('✅ Session Joined:', {
          participantId: joinData.data.participantId,
          participantCount: joinData.data.participants.length
        });
      } else {
        console.log('❌ Join Session Failed:', joinResponse.status);
      }

    } else {
      const errorData = await createSessionResponse.json();
      console.log('❌ Session Creation Failed:', errorData);
    }

  } catch (error) {
    console.error('❌ API Test Error:', error.message);
  }
}

// Run tests
testAPI();