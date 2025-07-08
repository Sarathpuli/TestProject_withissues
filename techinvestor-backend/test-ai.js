require('dotenv').config();

async function testAI() {
  console.log('🧪 Testing AI setup...');
  console.log('OpenAI API Key:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 50
      }),
    });
    
    if (response.ok) {
      console.log('✅ OpenAI API working!');
    } else {
      console.log('❌ OpenAI API error:', response.status);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testAI();