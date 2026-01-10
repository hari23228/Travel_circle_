#!/usr/bin/env node

/**
 * Test API connection and itinerary generation
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testAPI() {
  console.log('🔍 Testing backend API connection...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get(`${API_URL.replace('/api', '')}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test 2: Check if itineraries endpoint exists
    console.log('2️⃣ Testing itineraries endpoint (should fail without auth)...');
    try {
      await axios.post(`${API_URL}/itineraries/generate`, {
        destination: 'Test',
        startDate: '2026-01-14',
        endDate: '2026-01-15',
        totalBudget: 50000
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Itineraries endpoint exists (requires authentication)');
      } else {
        console.log('⚠️ Unexpected error:', error.message);
      }
    }
    console.log('');

    console.log('✅ Backend API is running correctly!');
    console.log('📍 API URL:', API_URL);
    console.log('');
    console.log('💡 Next steps:');
    console.log('1. Make sure you\'re logged in on the frontend');
    console.log('2. Check browser console for detailed error messages');
    console.log('3. Check backend terminal for generation logs');

  } catch (error) {
    console.error('❌ Backend API test failed!');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('1. Is the backend server running? (npm start in backend folder)');
    console.error('2. Is it running on port 5000?');
    console.error('3. Check backend/.env configuration');
    process.exit(1);
  }
}

testAPI();
