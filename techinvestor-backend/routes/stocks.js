// backend/routes/stocks.js - Optimized for Finnhub
const express = require('express');
const rateLimit = require('express-rate-limit');
const finnhubAPI = require('../utils/FinnhubProductionAPI');

const router = express.Router();

// Rate limiting optimized for Finnhub's 60 calls/minute limit
const stockLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 requests per minute per IP (stays under Finnhub's 60/min limit)
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many requests. Please wait a moment before trying again.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(stockLimiter);

// Enhanced error handler for Finnhub
const handleFinnhubError = (error, res, operation) => {
  console.error(`Finnhub ${operation} Error:`, error);

  let statusCode = 500;
  let errorMessage = 'Internal server error';
  let errorCode = 'UNKNOWN_ERROR';

  if (error.message.includes('Invalid API key')) {
    statusCode = 401;
    errorMessage = 'API configuration error. Please check server setup.';
    errorCode = 'API_KEY_ERROR';
  } else if (error.message.includes('Rate limit exceeded')) {
    statusCode = 429;
    errorMessage = 'Too many requests. Please try again in a minute.';
    errorCode = 'RATE_LIMIT_ERROR';
  } else if (error.message.includes('timeout')) {
    statusCode = 504;
    errorMessage = 'Request timeout. Please try again.';
    errorCode = 'TIMEOUT_ERROR';
  } else if (error.message.includes('No quote data available')) {
    statusCode = 404;
    errorMessage = 'Stock symbol not found';
    errorCode = 'SYMBOL_NOT_FOUND';
  } else if (error.message.includes('Invalid stock symbol')) {
    statusCode = 400;
    errorMessage = 'Invalid stock symbol format';
    errorCode = 'INVALID_SYMBOL';
  } else if (error.message.includes('Network error')) {
    statusCode = 503;
    errorMessage = 'Service temporarily unavailable';
    errorCode = 'SERVICE_UNAVAILABLE';
  }

  res.status(statusCode).json({
    error: errorMessage,
    code: errorCode,
    operation,
    timestamp: new Date().toISOString(),
    retryable: statusCode >= 500 || statusCode === 429
  });
};

// Input validation middleware
const validateStockSymbol = (req, res, next) => {
  const symbol = req.params.symbol;
  
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({
      error: 'Stock symbol is required',
      code: 'MISSING_SYMBOL'
    });
  }

  const cleanSymbol = symbol.trim().toUpperCase();
  
  if (!/^[A-Z]{1,10}$/.test(cleanSymbol)) {
    return res.status(400).json({
      error: 'Invalid stock symbol format. Use 1-10 letters only.',
      code: 'INVALID_SYMBOL_FORMAT',
      example: 'AAPL, MSFT, GOOGL'
    });
  }

  req.params.symbol = cleanSymbol;
  next();
};

const validateSearchQuery = (req, res, next) => {
  const query = req.params.query;
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({
      error: 'Search query is required',
      code: 'MISSING_QUERY'
    });
  }

  const cleanQuery = query.trim();
  
  if (cleanQuery.length < 1) {
    return res.status(400).json({
      error: 'Search query must be at least 1 character',
      code: 'QUERY_TOO_SHORT'
    });
  }

  if (cleanQuery.length > 50) {
    return res.status(400).json({
      error: 'Search query too long (max 50 characters)',
      code: 'QUERY_TOO_LONG'
    });
  }

  req.params.query = cleanQuery;
  next();
};

// GET /api/stocks/search/:query - Finnhub stock search
router.get('/search/:query', validateSearchQuery, async (req, res) => {
  const { query } = req.params;
  const startTime = Date.now();
  
  try {
    console.log(`🔍 Finnhub search request: "${query}" from IP: ${req.ip}`);
    
    const result = await finnhubAPI.searchStocks(query);
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ Search completed in ${responseTime}ms: ${result.results.length} results from Finnhub`);

    // Add cache headers
    res.set({
      'Cache-Control': 'public, max-age=600', // 10 minutes
      'X-Response-Time': `${responseTime}ms`,
      'X-Data-Source': 'finnhub'
    });

    res.status(200).json({
      success: true,
      results: result.results,
      metadata: {
        query,
        count: result.results.length,
        source: result.source,
        timestamp: result.timestamp,
        responseTime: responseTime
      }
    });

  } catch (error) {
    handleFinnhubError(error, res, 'search');
  }
});

// GET /api/stocks/quote/:symbol - Finnhub stock quote
router.get('/quote/:symbol', validateStockSymbol, async (req, res) => {
  const { symbol } = req.params;
  const startTime = Date.now();
  
  try {
    console.log(`📊 Finnhub quote request: ${symbol} from IP: ${req.ip}`);
    
    const result = await finnhubAPI.getStockQuote(symbol);
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ Quote completed in ${responseTime}ms for ${symbol} from Finnhub`);

    // Add cache headers (shorter for quotes)
    res.set({
      'Cache-Control': 'public, max-age=30', // 30 seconds
      'X-Response-Time': `${responseTime}ms`,
      'X-Data-Source': 'finnhub'
    });

    res.status(200).json({
      success: true,
      symbol: result.symbol,
      quote: {
        current: result.quote.c,
        open: result.quote.o,
        high: result.quote.h,
        low: result.quote.l,
        previousClose: result.quote.pc,
        change: result.quote.change,
        changePercent: result.quote.changePercent,
        timestamp: result.quote.t
      },
      metadata: {
        source: result.source,
        timestamp: result.timestamp,
        responseTime: responseTime
      }
    });

  } catch (error) {
    handleFinnhubError(error, res, 'quote');
  }
});

// GET /api/stocks/profile/:symbol - Company profile (bonus Finnhub feature)
router.get('/profile/:symbol', validateStockSymbol, async (req, res) => {
  const { symbol } = req.params;
  const startTime = Date.now();
  
  try {
    console.log(`🏢 Company profile request: ${symbol} from IP: ${req.ip}`);
    
    const result = await finnhubAPI.getCompanyProfile(symbol);
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ Profile completed in ${responseTime}ms for ${symbol}`);

    res.set({
      'Cache-Control': 'public, max-age=3600', // 1 hour
      'X-Response-Time': `${responseTime}ms`,
      'X-Data-Source': 'finnhub'
    });

    res.status(200).json({
      success: true,
      symbol: result.symbol,
      profile: result.profile,
      metadata: {
        source: result.source,
        timestamp: result.timestamp,
        responseTime: responseTime
      }
    });

  } catch (error) {
    handleFinnhubError(error, res, 'profile');
  }
});

// POST /api/stocks/batch-quotes - Batch quotes for portfolios
router.post('/batch-quotes', async (req, res) => {
  const { symbols } = req.body;
  
  if (!Array.isArray(symbols) || symbols.length === 0) {
    return res.status(400).json({
      error: 'Symbols array is required',
      code: 'MISSING_SYMBOLS',
      example: '["AAPL", "MSFT", "GOOGL"]'
    });
  }

  if (symbols.length > 10) {
    return res.status(400).json({
      error: 'Maximum 10 symbols allowed per batch (Finnhub rate limit)',
      code: 'TOO_MANY_SYMBOLS'
    });
  }

  const startTime = Date.now();
  
  try {
    console.log(`📊 Batch quote request: [${symbols.join(', ')}] from IP: ${req.ip}`);
    
    const { results, errors } = await finnhubAPI.getBatchQuotes(symbols);
    
    const responseTime = Date.now() - startTime;
    const successCount = Object.keys(results).length;
    const errorCount = Object.keys(errors).length;
    
    console.log(`✅ Batch quotes completed in ${responseTime}ms: ${successCount} success, ${errorCount} errors`);

    res.status(200).json({
      success: true,
      results,
      errors,
      metadata: {
        requested: symbols.length,
        successful: successCount,
        failed: errorCount,
        responseTime: responseTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    handleFinnhubError(error, res, 'batch-quotes');
  }
});

// GET /api/stocks/health - Finnhub API health check
router.get('/health', async (req, res) => {
  try {
    const health = await finnhubAPI.healthCheck();
    const stats = finnhubAPI.getStats();

    res.status(health.status === 'healthy' ? 200 : 503).json({
      ...health,
      performance: {
        queueLength: stats.queueLength,
        cacheSize: stats.cacheSize,
        uptime: stats.uptime,
        consecutiveFailures: stats.consecutiveFailures
      },
      limits: {
        finnhubLimit: '60 requests/minute',
        currentQueue: stats.queueLength
      }
    });

  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      api: 'finnhub',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/stocks/stats - System statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = finnhubAPI.getStats();
    
    res.status(200).json({
      success: true,
      stats: {
        ...stats,
        api: 'finnhub',
        rateLimit: '60 requests/minute',
        timestamp: new Date().toISOString(),
        version: '2.0.0-finnhub'
      }
    });

  } catch (error) {
    handleFinnhubError(error, res, 'stats');
  }
});

module.exports = router;