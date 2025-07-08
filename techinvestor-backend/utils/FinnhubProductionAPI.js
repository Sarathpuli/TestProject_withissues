// backend/utils/FinnhubProductionAPI.js
const Redis = require('redis');
const axios = require('axios');

class FinnhubProductionAPI {
  constructor() {
    this.cache = new Map();
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.healthStatus = { consecutiveFailures: 0, lastFailure: 0 };
    
    // Finnhub Configuration
    this.config = {
      baseURL: 'https://finnhub.io/api/v1',
      apiKey: process.env.FINNHUB_API_KEY,
      maxRetries: 3,
      timeout: 8000,
      rateLimit: {
        requestsPerMinute: 55, // Stay under 60/minute limit
        requestsPerSecond: 1   // Conservative rate limiting
      },
      cacheTimeout: {
        search: 10 * 60 * 1000,    // 10 minutes
        quote: 30 * 1000,          // 30 seconds
        profile: 60 * 60 * 1000    // 1 hour
      }
    };

    // Validate API key
    if (!this.config.apiKey) {
      console.error('❌ FINNHUB_API_KEY environment variable is required');
      process.exit(1);
    }

    this.initializeRedis();
    this.startQueueProcessor();
    this.startHealthMonitoring();
    
    console.log('🚀 Finnhub Production API Handler initialized');
    console.log(`📊 Rate limit: ${this.config.rateLimit.requestsPerMinute} requests/minute`);
  }

  async initializeRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.redis = Redis.createClient({ url: process.env.REDIS_URL });
        await this.redis.connect();
        console.log('✅ Redis connected for production caching');
      } else {
        console.log('⚠️ Using in-memory cache (Redis recommended for production)');
      }
    } catch (error) {
      console.error('Redis connection failed:', error.message);
    }
  }

  // Enhanced caching with Redis
  async getFromCache(key) {
    try {
      if (this.redis) {
        const cached = await this.redis.get(key);
        return cached ? JSON.parse(cached) : null;
      } else {
        const cached = this.cache.get(key);
        return (cached && cached.expires > Date.now()) ? cached.data : null;
      }
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  async setCache(key, data, ttl) {
    try {
      if (this.redis) {
        await this.redis.setEx(key, Math.floor(ttl / 1000), JSON.stringify(data));
      } else {
        this.cache.set(key, {
          data,
          expires: Date.now() + ttl
        });
      }
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  // Finnhub API call with proper error handling
  async makeAPICall(endpoint, params = {}) {
    const url = new URL(`${this.config.baseURL}${endpoint}`);
    
    // Add API key and parameters
    url.searchParams.append('token', this.config.apiKey);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    try {
      const response = await axios.get(url.toString(), {
        timeout: this.config.timeout,
        headers: {
          'User-Agent': 'TechInvestor-Production/1.0'
        }
      });

      if (response.status !== 200) {
        throw new Error(`Finnhub API error: ${response.status} ${response.statusText}`);
      }

      // Check for Finnhub error response
      if (response.data.error) {
        throw new Error(`Finnhub error: ${response.data.error}`);
      }

      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout - Finnhub API took too long');
      }
      
      if (error.response) {
        if (error.response.status === 429) {
          throw new Error('Rate limit exceeded - too many requests');
        }
        if (error.response.status === 401) {
          throw new Error('Invalid API key - check your Finnhub credentials');
        }
        throw new Error(`Finnhub API error: ${error.response.status} ${error.response.statusText}`);
      }
      
      throw new Error(`Network error: ${error.message}`);
    }
  }

  // Production-ready stock search using Finnhub
  async searchStocks(query) {
    if (!query || query.trim().length < 1) {
      return { results: [], source: 'finnhub' };
    }

    const cleanQuery = query.trim().toLowerCase();
    const cacheKey = `search:${cleanQuery}`;

    // Check cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      console.log(`📋 Cache hit for search: ${cleanQuery}`);
      return cached;
    }

    return new Promise((resolve, reject) => {
      this.addToQueue(async () => {
        try {
          const result = await this.executeStockSearch(cleanQuery);
          await this.setCache(cacheKey, result, this.config.cacheTimeout.search);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async executeStockSearch(query) {
    try {
      console.log(`🔍 Searching Finnhub for: "${query}"`);
      
      const data = await this.makeAPICall('/search', { q: query });
      
      if (data.result && Array.isArray(data.result)) {
        const results = data.result
          .filter(item => item.symbol && this.validateSymbol(item.symbol))
          .slice(0, 15)
          .map(item => ({
            symbol: this.cleanSymbol(item.symbol),
            description: item.description || item.displaySymbol || item.symbol,
            type: item.type || 'Stock',
            exchange: item.mic || 'Unknown'
          }));

        this.recordAPIHealth(true);
        
        return {
          results,
          source: 'finnhub',
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          results: [],
          source: 'finnhub',
          timestamp: new Date().toISOString()
        };
      }

    } catch (error) {
      console.error('Finnhub search failed:', error.message);
      this.recordAPIHealth(false);
      throw error;
    }
  }

  // Production-ready stock quote from Finnhub
  async getStockQuote(symbol) {
    const cleanSymbol = this.cleanSymbol(symbol);
    const cacheKey = `quote:${cleanSymbol}`;

    // Check cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      console.log(`📋 Cache hit for quote: ${cleanSymbol}`);
      return cached;
    }

    return new Promise((resolve, reject) => {
      this.addToQueue(async () => {
        try {
          const result = await this.executeStockQuote(cleanSymbol);
          await this.setCache(cacheKey, result, this.config.cacheTimeout.quote);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async executeStockQuote(symbol) {
    try {
      console.log(`📊 Getting Finnhub quote for: ${symbol}`);
      
      const data = await this.makeAPICall('/quote', { symbol });
      
      if (data.c && typeof data.c === 'number') {
        this.recordAPIHealth(true);
        
        return {
          symbol,
          quote: {
            c: data.c,        // Current price
            h: data.h,        // High price of the day
            l: data.l,        // Low price of the day
            o: data.o,        // Open price of the day
            pc: data.pc,      // Previous close price
            t: data.t * 1000, // Timestamp (convert from seconds to milliseconds)
            change: data.c - data.pc,
            changePercent: data.pc ? ((data.c - data.pc) / data.pc * 100) : 0
          },
          source: 'finnhub',
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(`No quote data available for ${symbol}`);
      }

    } catch (error) {
      console.error(`Finnhub quote failed for ${symbol}:`, error.message);
      this.recordAPIHealth(false);
      throw error;
    }
  }

  // Get company profile (additional Finnhub feature)
  async getCompanyProfile(symbol) {
    const cleanSymbol = this.cleanSymbol(symbol);
    const cacheKey = `profile:${cleanSymbol}`;

    // Check cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    return new Promise((resolve, reject) => {
      this.addToQueue(async () => {
        try {
          console.log(`🏢 Getting company profile for: ${cleanSymbol}`);
          
          const data = await this.makeAPICall('/stock/profile2', { symbol: cleanSymbol });
          
          const result = {
            symbol: cleanSymbol,
            profile: {
              name: data.name || '',
              country: data.country || '',
              currency: data.currency || '',
              exchange: data.exchange || '',
              ipo: data.ipo || '',
              marketCapitalization: data.marketCapitalization || 0,
              shareOutstanding: data.shareOutstanding || 0,
              logo: data.logo || '',
              weburl: data.weburl || '',
              phone: data.phone || '',
              finnhubIndustry: data.finnhubIndustry || ''
            },
            source: 'finnhub',
            timestamp: new Date().toISOString()
          };
          
          await this.setCache(cacheKey, result, this.config.cacheTimeout.profile);
          resolve(result);
          
        } catch (error) {
          console.error(`Company profile failed for ${cleanSymbol}:`, error.message);
          reject(error);
        }
      });
    });
  }

  // Batch quote processing
  async getBatchQuotes(symbols) {
    const validSymbols = symbols
      .filter(symbol => this.validateSymbol(symbol))
      .map(symbol => this.cleanSymbol(symbol));

    const results = {};
    const errors = {};

    // Process quotes with rate limiting
    for (const symbol of validSymbols) {
      try {
        const quote = await this.getStockQuote(symbol);
        results[symbol] = quote.quote;
      } catch (error) {
        console.error(`Batch quote failed for ${symbol}:`, error.message);
        errors[symbol] = error.message;
      }
      
      // Add small delay between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return { results, errors };
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
      throw new Error(`Invalid stock symbol: ${symbol}`);
    }
    return symbol.trim().toUpperCase();
  }

  // Health monitoring
  recordAPIHealth(success) {
    if (success) {
      this.healthStatus.consecutiveFailures = 0;
    } else {
      this.healthStatus.consecutiveFailures++;
      this.healthStatus.lastFailure = Date.now();
    }
  }

  isAPIHealthy() {
    return this.healthStatus.consecutiveFailures < 3 && 
           (Date.now() - this.healthStatus.lastFailure) > 60000;
  }

  // Queue management for rate limiting
  addToQueue(operation) {
    if (this.requestQueue.length >= 1000) {
      throw new Error('Request queue is full. Please try again later.');
    }
    
    this.requestQueue.push(operation);
  }

  startQueueProcessor() {
    setInterval(async () => {
      if (this.isProcessingQueue || this.requestQueue.length === 0) {
        return;
      }

      this.isProcessingQueue = true;
      
      // Process one request per second to stay within rate limits
      if (this.requestQueue.length > 0) {
        const operation = this.requestQueue.shift();
        try {
          await operation();
        } catch (error) {
          console.error('Queue operation failed:', error);
        }
      }
      
      this.isProcessingQueue = false;
    }, 1100); // Slightly over 1 second to be safe
  }

  // Health monitoring
  startHealthMonitoring() {
    setInterval(async () => {
      try {
        // Test with a simple quote request
        await this.makeAPICall('/quote', { symbol: 'AAPL' });
        console.log('✅ Finnhub health check passed');
      } catch (error) {
        console.error('❌ Finnhub health check failed:', error.message);
        this.recordAPIHealth(false);
      }
    }, 300000); // Every 5 minutes
  }

  // Get system statistics
  getStats() {
    return {
      queueLength: this.requestQueue.length,
      cacheSize: this.cache.size,
      isHealthy: this.isAPIHealthy(),
      consecutiveFailures: this.healthStatus.consecutiveFailures,
      lastFailure: this.healthStatus.lastFailure,
      uptime: process.uptime()
    };
  }

  async healthCheck() {
    const stats = this.getStats();
    
    return {
      status: this.isAPIHealthy() ? 'healthy' : 'degraded',
      api: 'finnhub',
      stats,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new FinnhubProductionAPI();