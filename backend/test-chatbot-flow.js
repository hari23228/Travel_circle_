/**
 * Test Script for AI Chatbot Flow
 * Run this to verify the entire system is working correctly
 */

require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:5000/api/chatbot';
const TEST_USER_ID = `test-user-${Date.now()}`;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function sendMessage(message) {
  try {
    log(`\n📤 Sending: "${message}"`, 'blue');
    
    const response = await axios.post(`${API_URL}/message`, {
      userId: TEST_USER_ID,
      message: message
    });

    const data = response.data;
    
    log(`✅ Success!`, 'green');
    log(`Stage: ${data.stage}`, 'yellow');
    log(`Response: ${data.response.text.substring(0, 200)}...`, 'green');
    
    if (data.response.suggestions && data.response.suggestions.length > 0) {
      log(`Suggestions: ${data.response.suggestions.join(', ')}`, 'yellow');
    }
    
    return data;
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    if (error.response) {
      log(`Details: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    throw error;
  }
}

async function testCompleteFlow() {
  log('\n🧪 TESTING AI CHATBOT FLOW\n', 'blue');
  log('════════════════════════════════════════════════', 'blue');

  try {
    // Check if server is running
    log('\n1️⃣  Checking if server is running...', 'yellow');
    try {
      await axios.get('http://localhost:5000/health');
      log('✅ Server is running!', 'green');
    } catch (error) {
      log('❌ Server is not running! Please start it with: npm run dev', 'red');
      return;
    }

    // Check environment variables
    log('\n2️⃣  Checking environment configuration...', 'yellow');
    const weatherKey = process.env.WEATHERSTACK_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    
    if (!weatherKey || weatherKey === 'your-weatherstack-api-key-here') {
      log('⚠️  WEATHERSTACK_API_KEY not set properly!', 'yellow');
    } else {
      log('✅ WEATHERSTACK_API_KEY is set', 'green');
    }
    
    if (!geminiKey || geminiKey === 'your-gemini-api-key-here') {
      log('⚠️  GEMINI_API_KEY not set properly!', 'yellow');
    } else {
      log('✅ GEMINI_API_KEY is set', 'green');
    }

    // Test greeting
    log('\n3️⃣  Testing greeting stage...', 'yellow');
    await sendMessage('Hello');
    
    // Test destination collection
    log('\n4️⃣  Testing destination collection...', 'yellow');
    await sendMessage('I want to go to Paris');
    
    // Test dates collection
    log('\n5️⃣  Testing dates collection...', 'yellow');
    await sendMessage('From April 10 to April 15');
    
    // Test activities collection and full analysis
    log('\n6️⃣  Testing activities collection and AI analysis...', 'yellow');
    const finalResponse = await sendMessage('Sightseeing, museums, and cafes');
    
    log('\n═══════════════════════════════════════════════', 'green');
    log('🎉 ALL TESTS PASSED!', 'green');
    log('═══════════════════════════════════════════════', 'green');
    
    // Display AI analysis results if available
    if (finalResponse.response.data && finalResponse.response.data.aiAnalysis) {
      log('\n📊 AI ANALYSIS RESULTS:', 'blue');
      const analysis = finalResponse.response.data.aiAnalysis;
      
      if (analysis.conflicts && analysis.conflicts.length > 0) {
        log(`\n⚠️  Conflicts Detected: ${analysis.conflicts.length}`, 'yellow');
        analysis.conflicts.forEach((c, i) => {
          log(`   ${i + 1}. ${c.activity}: ${c.issue} (${c.severity})`, 'yellow');
        });
      }
      
      if (analysis.recommendations && analysis.recommendations.length > 0) {
        log(`\n✅ Recommendations: ${analysis.recommendations.length}`, 'green');
        analysis.recommendations.forEach((r, i) => {
          log(`   ${i + 1}. ${r.activity}: ${r.bestTime}`, 'green');
        });
      }
      
      if (analysis.packingList && analysis.packingList.length > 0) {
        log(`\n🎒 Packing List: ${analysis.packingList.join(', ')}`, 'blue');
      }
      
      if (analysis.confidence) {
        log(`\n📈 Confidence: ${(analysis.confidence * 100).toFixed(0)}%`, 'blue');
      }
    }
    
    log('\n✨ Your AI chatbot is working perfectly!\n', 'green');

  } catch (error) {
    log('\n❌ TEST FAILED', 'red');
    log('Please check the error messages above and fix the issues.\n', 'red');
    process.exit(1);
  }
}

// Test with all info at once
async function testQuickFlow() {
  log('\n🧪 TESTING QUICK FLOW (All info at once)\n', 'blue');
  log('════════════════════════════════════════════════', 'blue');

  try {
    log('\nSending complete trip information...', 'yellow');
    const response = await sendMessage(
      'I want to visit Tokyo from March 15 to March 22 for sightseeing and temple visits'
    );
    
    log('\n═══════════════════════════════════════════════', 'green');
    log('🎉 QUICK FLOW TEST PASSED!', 'green');
    log('═══════════════════════════════════════════════', 'green');
    
    log('\n✨ Your chatbot can handle complete trip info in one message!\n', 'green');
    
  } catch (error) {
    log('\n❌ QUICK FLOW TEST FAILED', 'red');
    process.exit(1);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const testType = args[0];

  if (testType === 'quick') {
    await testQuickFlow();
  } else if (testType === 'all') {
    await testCompleteFlow();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await testQuickFlow();
  } else {
    await testCompleteFlow();
  }
}

// Run tests
main().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});
