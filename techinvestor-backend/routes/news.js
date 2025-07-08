// backend/routes/news.js - Finnhub News API Integration
const express = require('express');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for news endpoints
const newsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per 15 minutes
  message: {
    error: 'Too many news requests',
    message: 'Rate limit exceeded for news API. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all news routes
router.use(newsLimiter);

// Input validation and error handler
const handleNewsError = (error, res, operation) => {
  console.error(`News ${operation} Error:`, error);

  let statusCode = 500;
  let errorMessage = 'Internal server error';
  let errorCode = 'UNKNOWN_ERROR';

  if (error.message.includes('429') || error.message.includes('rate limit')) {
    statusCode = 429;
    errorMessage = 'News API rate limit exceeded. Please try again later.';
    errorCode = 'RATE_LIMIT_ERROR';
  } else if (error.message.includes('401') || error.message.includes('Invalid API key')) {
    statusCode = 401;
    errorMessage = 'News API configuration error';
    errorCode = 'API_KEY_ERROR';
  } else if (error.message.includes('timeout') || error.message.includes('504')) {
    statusCode = 504;
    errorMessage = 'News service timeout. Please try again.';
    errorCode = 'TIMEOUT_ERROR';
  } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
    statusCode = 503;
    errorMessage = 'News service temporarily unavailable';
    errorCode = 'SERVICE_UNAVAILABLE';
  }

  res.status(statusCode).json({
    success: false,
    error: errorMessage,
    code: errorCode,
    operation,
    timestamp: new Date().toISOString(),
    retryable: statusCode >= 500 || statusCode === 429
  });
};

// Finnhub API call helper
const finnhubAPICall = async (endpoint) => {
  if (!process.env.FINNHUB_API_KEY) {
    throw new Error('Finnhub API key not configured');
  }

  const url = `https://finnhub.io/api/v1${endpoint}&token=${process.env.FINNHUB_API_KEY}`;
  
  try {
    console.log(`📰 Calling Finnhub news API: ${endpoint}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TechInvestor-News/1.0'
      },
      timeout: 10000 // 10 second timeout
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Finnhub API rate limit exceeded');
      } else if (response.status === 401) {
        throw new Error('Invalid Finnhub API key');
      } else {
        throw new Error(`Finnhub API error: ${response.status}`);
      }
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Finnhub error: ${data.error}`);
    }

    return data;
    
  } catch (error) {
    console.error('❌ Finnhub API call failed:', error.message);
    throw error;
  }
};

// GET /api/news/financial - Get general financial news
router.get('/financial', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log(`📰 Financial news request from IP: ${req.ip}`);
    
    // Get general financial news from Finnhub
    const data = await finnhubAPICall('/news?category=general');
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ News fetched in ${responseTime}ms: ${data.length} articles`);

    // Transform Finnhub news format to our format
    const transformedNews = data.slice(0, 20).map((item, index) => ({
      id: item.id || `news-${Date.now()}-${index}`,
      headline: item.headline || item.title || 'Financial News Update',
      url: item.url || '#',
      datetime: item.datetime || Math.floor(Date.now() / 1000),
      source: item.source || 'Financial Times',
      summary: item.summary || (item.headline ? item.headline.substring(0, 150) + '...' : 'Financial market update'),
      category: item.category || 'Markets',
      image: item.image || null
    }));

    // Add cache headers
    res.set({
      'Cache-Control': 'public, max-age=300', // 5 minutes
      'X-Response-Time': `${responseTime}ms`,
      'X-Data-Source': 'finnhub'
    });

    res.status(200).json({
      success: true,
      news: transformedNews,
      metadata: {
        count: transformedNews.length,
        source: 'finnhub',
        timestamp: new Date().toISOString(),
        responseTime: responseTime
      }
    });

  } catch (error) {
    handleNewsError(error, res, 'financial-news');
  }
});

// GET /api/news/company/:symbol - Get company-specific news
router.get('/company/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const startTime = Date.now();
  
  try {
    // Validate symbol
    if (!symbol || !/^[A-Z]{1,5}$/.test(symbol.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid stock symbol format',
        code: 'INVALID_SYMBOL'
      });
    }

    const cleanSymbol = symbol.toUpperCase();
    console.log(`📰 Company news request for ${cleanSymbol} from IP: ${req.ip}`);
    
    // Get current date and date from 7 days ago for news range
    const toDate = new Date().toISOString().split('T')[0];
    const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const data = await finnhubAPICall(`/company-news?symbol=${cleanSymbol}&from=${fromDate}&to=${toDate}`);
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ Company news fetched in ${responseTime}ms: ${data.length} articles for ${cleanSymbol}`);

    // Transform company news
    const transformedNews = data.slice(0, 15).map((item, index) => ({
      id: item.id || `${cleanSymbol}-news-${Date.now()}-${index}`,
      headline: item.headline || `${cleanSymbol} Market Update`,
      url: item.url || '#',
      datetime: item.datetime || Math.floor(Date.now() / 1000),
      source: item.source || 'Financial News',
      summary: item.summary || (item.headline ? item.headline.substring(0, 150) + '...' : `Latest news about ${cleanSymbol}`),
      category: 'Company News',
      symbol: cleanSymbol,
      image: item.image || null
    }));

    res.set({
      'Cache-Control': 'public, max-age=300', // 5 minutes
      'X-Response-Time': `${responseTime}ms`,
      'X-Data-Source': 'finnhub'
    });

    res.status(200).json({
      success: true,
      news: transformedNews,
      symbol: cleanSymbol,
      metadata: {
        count: transformedNews.length,
        source: 'finnhub',
        dateRange: `${fromDate} to ${toDate}`,
        timestamp: new Date().toISOString(),
        responseTime: responseTime
      }
    });

  } catch (error) {
    handleNewsError(error, res, 'company-news');
  }
});

// GET /api/news/health - News API health check
router.get('/health', async (req, res) => {
  try {
    // Test Finnhub API with a simple call
    await finnhubAPICall('/news?category=general');
    
    res.status(200).json({
      status: 'healthy',
      service: 'finnhub-news',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'finnhub-news',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;