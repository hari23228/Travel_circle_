#!/usr/bin/env node

/**
 * Groq API Setup Helper
 * Run this to test your Groq API key and see available models
 */

const Groq = require('groq-sdk');
require('dotenv').config();

async function testGroqAPI() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    console.log('❌ GROQ_API_KEY not set in .env file');
    console.log('');
    console.log('📝 To get your Groq API key:');
    console.log('1. Go to https://console.groq.com/');
    console.log('2. Sign up or log in');
    console.log('3. Create an API key');
    console.log('4. Add it to your .env file: GROQ_API_KEY=your_key_here');
    console.log('');
    console.log('💡 Groq is FREE for development with generous rate limits!');
    return;
  }

  console.log('🔄 Testing Groq API connection...');

  try {
    const groq = new Groq({ apiKey });

    // Test with a simple prompt
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: 'Say "Hello from Groq!" and tell me one fun fact about travel.'
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 100,
    });

    const response = chatCompletion.choices[0]?.message?.content;
    console.log('✅ Groq API working!');
    console.log('🤖 Response:', response);
    console.log('');
    console.log('🚀 Your itinerary generator is ready to use Groq AI!');
    console.log('⚡ Expected generation time: 2-4 seconds (much faster than Gemini)');

  } catch (error) {
    console.log('❌ Groq API test failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Check your API key is correct');
    console.log('2. Make sure you have credits in your Groq account');
    console.log('3. Try again in a few minutes');
  }
}

// Run the test
testGroqAPI().catch(console.error);