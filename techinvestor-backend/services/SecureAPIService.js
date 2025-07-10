// backend/services/SecureAPIService.js
const axios = require('axios');
const NodeCache = require('node-cache');

class SecureAPIService {
  constructor() {
    // Cache with 5-minute TTL
    this.cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
    
    // API configurations - All keys stay on server
    this.apis = {
      finnhub: {
        baseURL: 'https://finnhub.io/api/v1',
        key: process.env.FINNHUB_API_KEY,
        rateLimit: 60, // calls per minute
        timeout: 10000
      },
      alphaVantage: {
        baseURL: 'https://www.alphavantage.co/query',
        key: process.env.ALPHA_VANTAGE_API_KEY,
        rateLimit: 5,
        timeout: 10000
      }
    };

    // Rate limiting tracking
    this.rateLimiters = new Map();
    this.initializeRateLimiters();
  }

  initializeRateLimiters() {
    Object.keys(this.apis).forEach(apiName => {
      this.rateLimiters.set(apiName, {
        calls: 0,
        resetTime: Date.now() + 60000 // Reset every minute
      });
    });
  }

  // Check if API call is within rate limits
  checkRateLimit(apiName) {
    const limiter = this.rateLimiters.get(apiName);
    const now = Date.now();

    if (now > limiter.resetTime) {
      limiter.calls = 0;
      limiter.resetTime = now + 60000;
    }

    if (limiter.calls >= this.apis[apiName].rateLimit) {
      throw new Error(`Rate limit exceeded for ${apiName}`);
    }

    limiter.calls++;
    return true;
  }

  // Secure Finnhub API calls
  async getFinnhubData(endpoint, params = {}) {
    const cacheKey = `finnhub:${endpoint}:${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log(`Cache hit for ${cacheKey}`);
      return cached;
    }

    this.checkRateLimit('finnhub');

    try {
      const response = await axios.get(`${this.apis.finnhub.baseURL}${endpoint}`, {
        params: {
          ...params,
          token: this.apis.finnhub.key
        },
        timeout: this.apis.finnhub.timeout,
        headers: {
          'User-Agent': 'TechInvestorAI/1.0'
        }
      });

      const data = {
        ...response.data,
        _metadata: {
          timestamp: new Date().toISOString(),
          source: 'finnhub',
          cached: false
        }
      };

      this.cache.set(cacheKey, data);
      return data;

    } catch (error) {
      console.error('Finnhub API Error:', error.message);
      
      if (error.response?.status === 429) {
        throw new Error('API rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 401) {
        throw new Error('Invalid API credentials.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please try again.');
      }
      
      throw new Error(`Failed to fetch data: ${error.message}`);
    }
  }

  // Batch stock quotes (reduces API calls)
  async getBatchStockQuotes(symbols) {
    const results = {};
    const uncachedSymbols = [];

    // Check cache first
    symbols.forEach(symbol => {
      const cached = this.cache.get(`quote:${symbol}`);
      if (cached) {
        results[symbol] = cached;
      } else {
        uncachedSymbols.push(symbol);
      }
    });

    // Fetch uncached symbols
    if (uncachedSymbols.length > 0) {
      const promises = uncachedSymbols.map(async (symbol) => {
        try {
          const quote = await this.getFinnhubData('/quote', { symbol });
          this.cache.set(`quote:${symbol}`, quote, 300); // 5-minute cache
          return { symbol, quote, success: true };
        } catch (error) {
          console.error(`Failed to fetch quote for ${symbol}:`, error.message);
          return { symbol, error: error.message, success: false };
        }
      });

      const fetchResults = await Promise.allSettled(promises);
      
      fetchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          results[result.value.symbol] = result.value.quote;
        }
      });
    }

    return {
      success: true,
      data: results,
      metadata: {
        requested: symbols.length,
        returned: Object.keys(results).length,
        cached: symbols.length - uncachedSymbols.length,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Company search with fuzzy matching
  async searchCompanies(query, limit = 10) {
    const cacheKey = `search:${query.toLowerCase()}:${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) return cached;

    this.checkRateLimit('finnhub');

    try {
      const data = await this.getFinnhubData('/search', { q: query });
      
      const filteredResults = data.result
        .filter(item => item.symbol && item.description)
        .slice(0, limit)
        .map(item => ({
          symbol: item.symbol,
          name: item.description,
          type: item.type || 'Common Stock',
          exchange: item.mic || 'Unknown'
        }));

      const result = {
        success: true,
        results: filteredResults,
        query: query,
        metadata: {
          total: filteredResults.length,
          timestamp: new Date().toISOString()
        }
      };

      this.cache.set(cacheKey, result, 1800); // 30-minute cache
      return result;

    } catch (error) {
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  // Financial news with content filtering
  async getFinancialNews(category = 'general', limit = 20) {
    const cacheKey = `news:${category}:${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) return cached;

    this.checkRateLimit('finnhub');

    try {
      const data = await this.getFinnhubData('/news', { 
        category,
        minId: Math.floor(Date.now() / 1000) - 86400 // Last 24 hours
      });

      const filteredNews = data
        .filter(item => item.headline && item.url && item.source)
        .slice(0, limit)
        .map(item => ({
          id: item.id || `news-${Date.now()}-${Math.random()}`,
          headline: item.headline.substring(0, 200), // Limit headline length
          summary: item.summary?.substring(0, 300) || item.headline.substring(0, 150) + '...',
          url: item.url,
          source: item.source,
          datetime: item.datetime,
          category: item.category || category,
          sentiment: this.analyzeSentiment(item.headline) // Basic sentiment
        }));

      const result = {
        success: true,
        news: filteredNews,
        metadata: {
          category,
          count: filteredNews.length,
          timestamp: new Date().toISOString()
        }
      };

      this.cache.set(cacheKey, result, 600); // 10-minute cache for news
      return result;

    } catch (error) {
      return {
        success: false,
        error: error.message,
        news: []
      };
    }
  }

  // Basic sentiment analysis
  analyzeSentiment(text) {
    const positive = ['gain', 'up', 'rise', 'bull', 'positive', 'growth', 'strong', 'beats', 'exceeds'];
    const negative = ['fall', 'down', 'bear', 'negative', 'weak', 'misses', 'disappoints', 'decline'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positive.filter(word => lowerText.includes(word)).length;
    const negativeCount = negative.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Health check for all APIs
  async healthCheck() {
    const results = {};
    
    for (const [apiName, config] of Object.entries(this.apis)) {
      try {
        const startTime = Date.now();
        
        if (apiName === 'finnhub') {
          await axios.get(`${config.baseURL}/quote?symbol=AAPL&token=${config.key}`, {
            timeout: 5000
          });
        }
        
        results[apiName] = {
          status: 'healthy',
          responseTime: Date.now() - startTime,
          rateLimitUsed: this.rateLimiters.get(apiName).calls,
          rateLimitMax: config.rateLimit
        };
        
      } catch (error) {
        results[apiName] = {
          status: 'unhealthy',
          error: error.message,
          rateLimitUsed: this.rateLimiters.get(apiName).calls,
          rateLimitMax: config.rateLimit
        };
      }
    }
    
    return {
      timestamp: new Date().toISOString(),
      overall: Object.values(results).every(r => r.status === 'healthy') ? 'healthy' : 'degraded',
      apis: results,
      cache: {
        keys: this.cache.keys().length,
        stats: this.cache.getStats()
      }
    };
  }

  // Clear cache manually
  clearCache(pattern = null) {
    if (pattern) {
      const keys = this.cache.keys().filter(key => key.includes(pattern));
      keys.forEach(key => this.cache.del(key));
      return { cleared: keys.length, pattern };
    } else {
      this.cache.flushAll();
      return { cleared: 'all' };
    }
  }
}

module.exports = SecureAPIService;

// backend/routes/secure-stocks.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const SecureAPIService = require('../services/SecureAPIService');

const router = express.Router();
const apiService = new SecureAPIService();

// Enhanced rate limiting based on user type
const createRateLimit = (maxRequests, windowMs = 60000) => 
  rateLimit({
    windowMs,
    max: (req) => {
      if (req.user?.plan === 'pro') return maxRequests * 10;
      if (req.user?.plan === 'premium') return maxRequests * 5;
      return maxRequests;
    },
    keyGenerator: (req) => req.user?.id || req.ip,
    message: {
      error: 'Rate limit exceeded',
      limit: maxRequests,
      upgrade: 'Consider upgrading to Pro for higher limits'
    }
  });

// Middleware
router.use(createRateLimit(100)); // 100 requests per minute for free users

// Batch quotes endpoint (reduces API calls)
router.post('/batch-quotes', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        error: 'Invalid symbols array',
        example: { symbols: ['AAPL', 'MSFT', 'GOOGL'] }
      });
    }

    if (symbols.length > 50) {
      return res.status(400).json({
        error: 'Too many symbols. Maximum 50 allowed per batch.'
      });
    }

    const validSymbols = symbols
      .filter(s => typeof s === 'string' && /^[A-Z]{1,10}$/.test(s.toUpperCase()))
      .map(s => s.toUpperCase());

    if (validSymbols.length === 0) {
      return res.status(400).json({
        error: 'No valid symbols provided'
      });
    }

    const result = await apiService.getBatchStockQuotes(validSymbols);
    res.json(result);

  } catch (error) {
    console.error('Batch quotes error:', error);
    res.status(500).json({
      error: 'Failed to fetch batch quotes',
      message: error.message
    });
  }
});

// Single quote endpoint (cached)
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!/^[A-Z]{1,10}$/i.test(symbol)) {
      return res.status(400).json({
        error: 'Invalid symbol format',
        format: 'Use 1-10 letters only (e.g., AAPL)'
      });
    }

    const result = await apiService.getBatchStockQuotes([symbol.toUpperCase()]);
    const quote = result.data[symbol.toUpperCase()];
    
    if (!quote) {
      return res.status(404).json({
        error: 'Symbol not found',
        symbol: symbol.toUpperCase()
      });
    }

    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      quote,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('Quote error:', error);
    res.status(500).json({
      error: 'Failed to fetch quote',
      message: error.message
    });
  }
});

// Search endpoint with caching
router.get('/search/:query', createRateLimit(50), async (req, res) => {
  try {
    const { query } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    
    if (!query || query.length < 1) {
      return res.status(400).json({
        error: 'Search query required',
        minLength: 1
      });
    }

    const result = await apiService.searchCompanies(query, limit);
    res.json(result);

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
});

// News endpoint with filtering
router.get('/news', createRateLimit(20), async (req, res) => {
  try {
    const category = req.query.category || 'general';
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    
    const result = await apiService.getFinancialNews(category, limit);
    res.json(result);

  } catch (error) {
    console.error('News error:', error);
    res.status(500).json({
      error: 'Failed to fetch news',
      message: error.message
    });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = await apiService.healthCheck();
    const statusCode = health.overall === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({
      error: 'Health check failed',
      message: error.message
    });
  }
});

// Cache management (admin only)
router.delete('/cache', async (req, res) => {
  try {
    // Add admin authentication here
    const pattern = req.query.pattern;
    const result = apiService.clearCache(pattern);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Cache clear failed',
      message: error.message
    });
  }
});

module.exports = router;

// backend/middleware/authentication.js
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null; // Allow anonymous access with limited features
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Invalid token',
        message: 'Please log in again'
      });
    }
    req.user = user;
    next();
  });
};

// User plan detection
const detectUserPlan = (req, res, next) => {
  if (req.user) {
    // Set plan based on user data or subscription
    req.user.plan = req.user.subscription?.plan || 'free';
  }
  next();
};

module.exports = {
  authenticateToken,
  detectUserPlan
};