#!/usr/bin/env node

// Simple script to test serverless function locally
const { handler } = require('../netlify/functions/api.ts');

async function testServerless() {
  console.log('Testing serverless function...');
  
  // Test health endpoint
  const healthEvent = {
    httpMethod: 'GET',
    path: '/api/health',
    headers: {},
    queryStringParameters: null,
    body: null,
    isBase64Encoded: false
  };
  
  try {
    const result = await handler(healthEvent, {});
    console.log('Health check result:', result);
  } catch (error) {
    console.error('Health check failed:', error);
  }
  
  // Test ping endpoint
  const pingEvent = {
    httpMethod: 'GET',
    path: '/api/ping',
    headers: {},
    queryStringParameters: null,
    body: null,
    isBase64Encoded: false
  };
  
  try {
    const result = await handler(pingEvent, {});
    console.log('Ping result:', result);
  } catch (error) {
    console.error('Ping failed:', error);
  }
}

testServerless().catch(console.error);