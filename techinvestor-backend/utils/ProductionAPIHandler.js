// backend/utils/ProductionAPIHandler.js
const Redis = require('redis');
const axios = require('axios');

class ProductionAPIHandler {
  constructor() {
    this.cache = new Map(); // In-memory cache (use Redis for production)
    this.requestQueue = new Map();
    this.rateLimitQueue = [];
    this.isProcessingQueue = false;
    
    // Configuration
    this.config = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      timeout: 15000,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      rateLimit: 100, // requests per minute
      batchSize: 10
    };

    // External API configuration
    this.finnhubAPI = {
      baseURL: 'https://finnhub.io/api/v1',
      token: process.env.FINNHUB_API_KEY,
      rateLimitPerMinute: 60 // Free tier limit
    };

    this.alphaVantageAPI = {
      baseURL: 'https://www.alphavantage.co/query',
      apikey: process.env.ALPHA_VANTAGE_API_KEY,
      rateLimitPerMinute: 5 // Free tier limit
    };

    // Initialize Redis if available
    this.initializeRedis();
    
    // Start background processes
    this.startRateLimitProcessor();
    this.startCacheCleanup();
    this.startHealthMonitoring();
  }

  async initializeRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.redis = Redis.createClient({ url: process.env.REDIS_URL });
        await this.redis.connect();
        console.log('✅ Redis connected for caching');
      }
    } catch (error) {
      console.log('⚠️ Redis not available, using in-memory cache');
    }
  }

  // Input validation
  validateSymbol(symbol) {
    if (!symbol || typeof symbol !== 'string') {
      return false;
    }
    
    const cleanSymbol = symbol.trim().toUpperCase();
    return /^[A-Z]{1,10}$/.test(cleanSymbol);
  }

  cleanSymbol(symbol) {
    if (!this.validateSymbol(symbol)) {
      throw new Error(`Invalid symbol: ${symbol}`);
    }
    return symbol.trim().toUpperCase();
  }

  // Cache management with Redis fallback
  async getFromCache(key) {
    try {
      if (this.redis) {
        const cached = await this.redis.get(key);
        if (cached) {
          console.log(`📋 Redis cache hit: ${key}`);
          return JSON.parse(cached);
        }
      }
      
      // Fallback to in-memory cache
      const item = this.cache.get(key);
      if (item && Date.now() < item.expires) {
        console.log(`📋 Memory cache hit: ${key}`);
        return item.data;
      }
      
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async setCache(key, data, ttl = this.config.cacheTimeout) {
    try {
      if (this.redis) {
        await this.redis.setEx(key, Math.floor(ttl / 1000), JSON.stringify(data));
      }
      
      // Also set in memory cache
      this.cache.set(key, {
        data,
        expires: Date.now() + ttl
      });
      
      console.log(`💾 Cached: ${key}`);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // Rate limiting with queue
  async addToRateLimitQueue(operation) {
    return new Promise((resolve, reject) => {
      this.rateLimitQueue.push({
        operation,
        resolve,
        reject,
        timestamp: Date.now()
      });
      
      this.processRateLimitQueue();
    });
  }

  async processRateLimitQueue() {
    if (this.isProcessingQueue || this.rateLimitQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    
    while (this.rateLimitQueue.length > 0) {
      const { operation, resolve, reject } = this.rateLimitQueue.shift();
      
      try {
        const result = await operation();
        resolve(result);
        
        // Rate limit: 1 request per second to be safe
        await new Promise(r => setTimeout(r, 1000));
      } catch (error) {
        reject(error);
      }
    }
    
    this.isProcessingQueue = false;
  }

  startRateLimitProcessor() {
    // Process queue every second
    setInterval(() => {
      this.processRateLimitQueue();
    }, 1000);
  }

  // Retry logic with exponential backoff
  async retryOperation(operation, retryCount = 0) {
    try {
      return await operation();
    } catch (error) {
      if (retryCount >= this.config.maxRetries) {
        throw error;
      }

      const delay = Math.min(
        this.config.baseDelay * Math.pow(2, retryCount),
        this.config.maxDelay
      );

      console.log(`🔄 Retry ${retryCount + 1}/${this.config.maxRetries} after ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryOperation(operation, retryCount + 1);
    }
  }

  // External API call with timeout
  async apiCall(url, headers = {}) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'TechInvestorAI/1.0',
          ...headers
        },
        timeout: this.config.timeout
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout - external API took too long');
      }
      
      if (error.response) {
        throw new Error(`API Error ${error.response.status}: ${error.response.statusText}`);
      }
      
      throw new Error(`Network error: ${error.message}`);
    }
  }

  // Stock search with multiple API fallbacks
  async searchStocks(query) {
    if (!query || query.trim().length < 1) {
      return { results: [] };
    }

    const cleanQuery = query.trim();
    const cacheKey = `search:${cleanQuery.toLowerCase()}`;
    
    // Check cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Add to rate limit queue
    const result = await this.addToRateLimitQueue(async () => {
      return this.retryOperation(async () => {
        console.log(`🔍 Searching for: "${cleanQuery}"`);
        
        // Try Finnhub first
        try {
          const url = `${this.finnhubAPI.baseURL}/search?q=${encodeURIComponent(cleanQuery)}&token=${this.finnhubAPI.token}`;
          const data = await this.apiCall(url);
          
          if (data.result && Array.isArray(data.result)) {
            const results = data.result
              .filter(item => item.symbol && this.validateSymbol(item.symbol))
              .slice(0, 10)
              .map(item => ({
                symbol: this.cleanSymbol(item.symbol),
                description: item.description || item.symbol,
                type: item.type || 'Stock'
              }));

            const response = { results, source: 'finnhub' };
            await this.setCache(cacheKey, response);
            return response;
          }
        } catch (error) {
          console.error('Finnhub search failed:', error.message);
        }

        // Fallback to Alpha Vantage
        try {
          const url = `${this.alphaVantageAPI.baseURL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(cleanQuery)}&apikey=${this.alphaVantageAPI.apikey}`;
          const data = await this.apiCall(url);
          
          if (data.bestMatches && Array.isArray(data.bestMatches)) {
            const results = data.bestMatches
              .filter(item => item['1. symbol'] && this.validateSymbol(item['1. symbol']))
              .slice(0, 10)
              .map(item => ({
                symbol: this.cleanSymbol(item['1. symbol']),
                description: item['2. name'] || item['1. symbol'],
                type: 'Stock'
              }));

            const response = { results, source: 'alphavantage' };
            await this.setCache(cacheKey, response);
            return response;
          }
        } catch (error) {
          console.error('Alpha Vantage search failed:', error.message);
        }

        // No results from any API
        const response = { results: [], source: 'none' };
        await this.setCache(cacheKey, response, 60000); // Cache failures for 1 minute
        return response;
      });
    });

    return result;
  }

  // Stock quote with multiple API fallbacks
  async getStockQuote(symbol) {
    const cleanSymbol = this.cleanSymbol(symbol);
    const cacheKey = `quote:${cleanSymbol}`;
    
    // Check cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Add to rate limit queue
    const result = await this.addToRateLimitQueue(async () => {
      return this.retryOperation(async () => {
        console.log(`📊 Fetching quote for: ${cleanSymbol}`);
        
        // Try Finnhub first
        try {
          const url = `${this.finnhubAPI.baseURL}/quote?symbol=${cleanSymbol}&token=${this.finnhubAPI.token}`;
          const data = await this.apiCall(url);
          
          if (data.c && typeof data.c === 'number') {
            const response = {
              quote: {
                c: data.c,        // Current price
                h: data.h,        // High
                l: data.l,        // Low
                o: data.o,        // Open
                pc: data.pc,      // Previous close
                t: data.t         // Timestamp
              },
              source: 'finnhub'
            };
            
            await this.setCache(cacheKey, response);
            return response;
          }
        } catch (error) {
          console.error('Finnhub quote failed:', error.message);
        }

        // Fallback to Alpha Vantage
        try {
          const url = `${this.alphaVantageAPI.baseURL}?function=GLOBAL_QUOTE&symbol=${cleanSymbol}&apikey=${this.alphaVantageAPI.apikey}`;
          const data = await this.apiCall(url);
          
          if (data['Global Quote'] && data['Global Quote']['05. price']) {
            const quote = data['Global Quote'];
            const response = {
              quote: {
                c: parseFloat(quote['05. price']),
                h: parseFloat(quote['03. high']),
                l: parseFloat(quote['04. low']),
                o: parseFloat(quote['02. open']),
                pc: parseFloat(quote['08. previous close']),
                t: Date.now()
              },
              source: 'alphavantage'
            };
            
            await this.setCache(cacheKey, response);
            return response;
          }
        } catch (error) {
          console.error('Alpha Vantage quote failed:', error.message);
        }

        throw new Error(`Unable to fetch quote for ${cleanSymbol} from any source`);
      });
    });

    return result;
  }

  // Batch quote processing for portfolio
  async getBatchQuotes(symbols) {
    const validSymbols = symbols
      .filter(symbol => this.validateSymbol(symbol))
      .map(symbol => this.cleanSymbol(symbol));

    const results = {};
    const errors = {};

    // Process in smaller batches to respect rate limits
    for (let i = 0; i < validSymbols.length; i += this.config.batchSize) {
      const batch = validSymbols.slice(i, i + this.config.batchSize);
      
      const batchPromises = batch.map(async (symbol) => {
        try {
          const quote = await this.getStockQuote(symbol);
          results[symbol] = quote;
        } catch (error) {
          console.error(`Failed to fetch quote for ${symbol}:`, error.message);
          errors[symbol] = error.message;
        }
      });

      await Promise.all(batchPromises);
      
      // Add delay between batches
      if (i + this.config.batchSize < validSymbols.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return { results, errors };
  }

  // Health monitoring
  startHealthMonitoring() {
    setInterval(async () => {
      try {
        // Test Finnhub
        await this.apiCall(`${this.finnhubAPI.baseURL}/quote?symbol=AAPL&token=${this.finnhubAPI.token}`);
        console.log('✅ Finnhub health check passed');
      } catch (error) {
        console.error('❌ Finnhub health check failed:', error.message);
      }
    }, 60000); // Every minute
  }

  // Cache cleanup
  startCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (now > item.expires) {
          this.cache.delete(key);
        }
      }
      console.log(`🧹 Cache cleanup: ${this.cache.size} items remaining`);
    }, 300000); // Every 5 minutes
  }

  // Get statistics
  getStats() {
    return {
      cacheSize: this.cache.size,
      queueLength: this.rateLimitQueue.length,
      isProcessingQueue: this.isProcessingQueue,
      uptime: process.uptime()
    };
  }

  // Health check endpoint
  async healthCheck() {
    try {
      const stats = this.getStats();
      
      // Test cache
      await this.setCache('health-test', { test: true }, 5000);
      const cacheTest = await this.getFromCache('health-test');
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        stats,
        cache: cacheTest ? 'working' : 'failed',
        redis: this.redis ? 'connected' : 'not-available'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
const apiHandler = new ProductionAPIHandler();

module.exports = apiHandler;