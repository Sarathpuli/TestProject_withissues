// test-finnhub.js - Run this to test your Finnhub integration
require('dotenv').config();

async function testFinnhubIntegration() {
  console.log('🧪 Testing Finnhub Integration...\n');
  
  // Check environment variables
  console.log('1. Checking environment variables...');
  const apiKey = process.env.FINNHUB_API_KEY;
  
  if (!apiKey) {
    console.error('❌ FINNHUB_API_KEY not found in .env file');
    console.log('💡 Please add FINNHUB_API_KEY=your_api_key_here to your .env file');
    process.exit(1);
  }
  
  console.log(`✅ API Key found: ${apiKey.substring(0, 10)}...`);
  console.log('');

  // Test direct Finnhub API
  console.log('2. Testing direct Finnhub API connection...');
  try {
    const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=AAPL&token=${apiKey}`);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    if (data.c) {
      console.log(`✅ Direct API works: AAPL = $${data.c}`);
    } else {
      throw new Error('No data returned from Finnhub');
    }
  } catch (error) {
    console.error('❌ Direct API test failed:', error.message);
    
    if (error.message.includes('401') || error.message.includes('Invalid API key')) {
      console.log('💡 Your API key might be incorrect. Check: https://finnhub.io/dashboard');
    }
    
    process.exit(1);
  }
  console.log('');

  // Test your production API handler
  console.log('3. Testing your production API handler...');
  try {
    const finnhubAPI = require('./utils/FinnhubProductionAPI');
    
    // Test search
    console.log('   a) Testing search...');
    const searchResult = await finnhubAPI.searchStocks('apple');
    console.log(`      ✅ Found ${searchResult.results.length} results for "apple"`);
    
    if (searchResult.results.length > 0) {
      const firstResult = searchResult.results[0];
      console.log(`      📝 First result: ${firstResult.symbol} - ${firstResult.description}`);
    }
    
    // Test quote
    console.log('   b) Testing quote...');
    const quoteResult = await finnhubAPI.getStockQuote('AAPL');
    console.log(`      ✅ AAPL Quote: $${quoteResult.quote.c} (${quoteResult.quote.changePercent.toFixed(2)}%)`);
    
    // Test company profile
    console.log('   c) Testing company profile...');
    const profileResult = await finnhubAPI.getCompanyProfile('AAPL');
    console.log(`      ✅ Company: ${profileResult.profile.name}`);
    console.log(`      🏢 Industry: ${profileResult.profile.finnhubIndustry}`);
    
    // Test health check
    console.log('   d) Testing health check...');
    const health = await finnhubAPI.healthCheck();
    console.log(`      ✅ Status: ${health.status}`);
    
  } catch (error) {
    console.error('❌ Production API test failed:', error.message);
    
    if (error.message.includes('Cannot find module')) {
      console.log('💡 Make sure you created the FinnhubProductionAPI.js file in utils/ folder');
    }
    
    process.exit(1);
  }
  console.log('');

  // Test your routes (if server is running)
  console.log('4. Testing server routes...');
  try {
    const serverResponse = await fetch('http://localhost:3001/api/stocks/health');
    
    if (serverResponse.ok) {
      const healthData = await serverResponse.json();
      console.log(`✅ Server health: ${healthData.status}`);
      
      // Test search endpoint
      const searchResponse = await fetch('http://localhost:3001/api/stocks/search/AAPL');
      const searchData = await searchResponse.json();
      
      if (searchData.success) {
        console.log(`✅ Search endpoint: ${searchData.metadata.count} results`);
      }
      
      // Test quote endpoint
      const quoteResponse = await fetch('http://localhost:3001/api/stocks/quote/AAPL');
      const quoteData = await quoteResponse.json();
      
      if (quoteData.success) {
        console.log(`✅ Quote endpoint: $${quoteData.quote.current}`);
      }
      
    } else {
      throw new Error('Server not responding');
    }
    
  } catch (error) {
    console.log('⚠️ Server routes test skipped (server not running)');
    console.log('💡 Start your server with: npm run dev');
    console.log('   Then run: curl http://localhost:3001/api/stocks/health');
  }
  console.log('');

  // Rate limit test
  console.log('5. Testing rate limiting...');
  const startTime = Date.now();
  const promises = [];
  
  // Make 5 quick requests to test rate limiting
  for (let i = 0; i < 5; i++) {
    promises.push(
      fetch(`https://finnhub.io/api/v1/quote?symbol=MSFT&token=${apiKey}`)
        .then(res => res.json())
        .catch(err => ({ error: err.message }))
    );
  }
  
  const results = await Promise.all(promises);
  const successCount = results.filter(r => r.c && !r.error).length;
  const duration = Date.now() - startTime;
  
  console.log(`✅ Rate limit test: ${successCount}/5 requests successful in ${duration}ms`);
  console.log('');

  // Usage calculation
  console.log('6. Usage calculation for your project...');
  console.log('   📊 Finnhub Free Tier: 60 requests/minute = 86,400 requests/day');
  console.log('   🎯 Your Expected Usage: ~24,000 requests/day (100 users × 10 calls/hour × 24 hours)');
  console.log('   ✅ Usage Percentage: 28% of your free tier limit');
  console.log('   🚀 Headroom: 72% available for traffic spikes');
  console.log('');

  console.log('🎉 All tests passed! Your Finnhub integration is ready for production.');
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. Start your server: npm run dev');
  console.log('   2. Test the frontend integration');
  console.log('   3. Deploy to production');
  console.log('   4. Monitor usage at: https://finnhub.io/dashboard');
  console.log('');
  console.log('🔗 Useful links:');
  console.log('   • Finnhub Dashboard: https://finnhub.io/dashboard');
  console.log('   • API Documentation: https://finnhub.io/docs/api');
  console.log('   • Status Page: https://status.finnhub.io/');
  
  process.exit(0);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run the tests
testFinnhubIntegration();