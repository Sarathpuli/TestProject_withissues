// src/api/stockAPI.js - Updated for Finnhub Backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class StockAPIError extends Error {
  constructor(message, code, retryable = false) {
    super(message);
    this.name = 'StockAPIError';
    this.code = code;
    this.retryable = retryable;
  }
}

class FinnhubStockAPI {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = {
      search: 10 * 60 * 1000,  // 10 minutes
      quote: 30 * 1000,        // 30 seconds
      profile: 60 * 60 * 1000  // 1 hour
    };
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 5000
    };
    
    console.log('🚀 Finnhub Stock API initialized');
  }

  // Enhanced caching
  getCacheKey(type, params) {
    return `${type}:${JSON.stringify(params)}`;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expires) {
      console.log(`📋 Cache hit: ${key}`);
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data, ttl) {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    });
  }

  // Enhanced API call with retries and Finnhub-specific error handling
  async apiCall(endpoint, options = {}) {
    const { retries = this.retryConfig.maxRetries, ...fetchOptions } = options;
    
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...fetchOptions.headers,
          },
          ...fetchOptions,
        });

        clearTimeout(timeoutId);

        // Handle non-2xx responses
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Create structured error
          const error = new StockAPIError(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`,
            errorData.code || `HTTP_${response.status}`,
            errorData.retryable || response.status >= 500
          );

          // Handle specific Finnhub/backend errors
          if (errorData.code === 'API_KEY_ERROR') {
            error.retryable = false;
            throw error;
          }

          // Rate limit handling for Finnhub
          if (response.status === 429 || errorData.code === 'RATE_LIMIT_ERROR') {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
            error.retryAfter = retryAfter;
            
            if (attempt <= retries) {
              console.log(`⏱️ Rate limited by Finnhub, retrying in ${retryAfter}s...`);
              await this.delay(retryAfter * 1000);
              continue;
            }
          }

          // Don't retry client errors (4xx) except rate limits
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw error;
          }

          throw error;
        }

        const data = await response.json();
        
        // Log performance metrics
        const responseTime = response.headers.get('X-Response-Time');
        const dataSource = response.headers.get('X-Data-Source');
        
        if (responseTime && dataSource) {
          console.log(`✅ API call successful: ${responseTime} from ${dataSource}`);
        }

        return data;

      } catch (error) {
        // Handle abort/timeout errors
        if (error.name === 'AbortError') {
          error.message = 'Request timeout';
          error.retryable = true;
        }

        // Handle network errors
        if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
          error.message = 'Network error - please check your connection';
          error.retryable = true;
        }

        // If this is the last attempt or error is not retryable, throw
        if (attempt > retries || !error.retryable) {
          throw error;
        }

        // Calculate retry delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(2, attempt - 1),
          this.retryConfig.maxDelay
        );

        console.log(`🔄 Retry ${attempt}/${retries} after ${delay}ms: ${error.message}`);
        await this.delay(delay);
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Finnhub stock search
  async searchStocks(query) {
    if (!query || query.trim().length < 1) {
      return { results: [], metadata: { count: 0 } };
    }

    const cleanQuery = query.trim();
    const cacheKey = this.getCacheKey('search', { query: cleanQuery.toLowerCase() });

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      console.log(`🔍 Searching Finnhub for: "${cleanQuery}"`);
      
      const data = await this.apiCall(`/stocks/search/${encodeURIComponent(cleanQuery)}`);
      
      if (data.success) {
        // Cache successful responses
        this.setCache(cacheKey, data, this.cacheTTL.search);
        
        console.log(`✅ Search successful: ${data.metadata.count} results from Finnhub`);
        return data;
      } else {
        throw new StockAPIError('Search failed', 'SEARCH_FAILED');
      }

    } catch (error) {
      console.error('Finnhub search error:', error);
      
      if (error instanceof StockAPIError) {
        throw error;
      }
      
      throw new StockAPIError(
        error.message || 'Stock search failed',
        'SEARCH_ERROR',
        true
      );
    }
  }

  // Finnhub stock quote
  async getStockQuote(symbol) {
    if (!symbol || typeof symbol !== 'string') {
      throw new StockAPIError('Valid stock symbol is required', 'INVALID_SYMBOL');
    }

    const cleanSymbol = symbol.trim().toUpperCase();
    const cacheKey = this.getCacheKey('quote', { symbol: cleanSymbol });

    // Check cache first (shorter TTL for quotes)
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      console.log(`📊 Getting Finnhub quote for: ${cleanSymbol}`);
      
      const data = await this.apiCall(`/stocks/quote/${cleanSymbol}`);
      
      if (data.success) {
        // Cache successful quotes
        this.setCache(cacheKey, data, this.cacheTTL.quote);
        
        console.log(`✅ Quote successful: $${data.quote.current} from Finnhub`);
        return data;
      } else {
        throw new StockAPIError('Quote fetch failed', 'QUOTE_FAILED');
      }

    } catch (error) {
      console.error('Finnhub quote error:', error);
      
      if (error instanceof StockAPIError) {
        throw error;
      }
      
      throw new StockAPIError(
        error.message || 'Stock quote failed',
        'QUOTE_ERROR',
        true
      );
    }
  }

  // Get company profile (Finnhub bonus feature)
  async getCompanyProfile(symbol) {
    if (!symbol || typeof symbol !== 'string') {
      throw new StockAPIError('Valid stock symbol is required', 'INVALID_SYMBOL');
    }

    const cleanSymbol = symbol.trim().toUpperCase();
    const cacheKey = this.getCacheKey('profile', { symbol: cleanSymbol });

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      console.log(`🏢 Getting company profile for: ${cleanSymbol}`);
      
      const data = await this.apiCall(`/stocks/profile/${cleanSymbol}`);
      
      if (data.success) {
        // Cache successful profiles
        this.setCache(cacheKey, data, this.cacheTTL.profile);
        
        console.log(`✅ Profile successful: ${data.profile.name}`);
        return data;
      } else {
        throw new StockAPIError('Profile fetch failed', 'PROFILE_FAILED');
      }

    } catch (error) {
      console.error('Company profile error:', error);
      
      if (error instanceof StockAPIError) {
        throw error;
      }
      
      throw new StockAPIError(
        error.message || 'Company profile failed',
        'PROFILE_ERROR',
        true
      );
    }
  }

  // Batch quotes for portfolios (optimized for Finnhub rate limits)
  async getBatchQuotes(symbols) {
    if (!Array.isArray(symbols) || symbols.length === 0) {
      throw new StockAPIError('Symbols array is required', 'INVALID_SYMBOLS');
    }

    if (symbols.length > 10) {
      throw new StockAPIError('Maximum 10 symbols allowed per batch (Finnhub rate limit)', 'TOO_MANY_SYMBOLS');
    }

    const cleanSymbols = symbols.map(s => s.trim().toUpperCase()).filter(Boolean);
    
    try {
      console.log(`📊 Getting batch quotes from Finnhub: [${cleanSymbols.join(', ')}]`);
      
      const data = await this.apiCall('/stocks/batch-quotes', {
        method: 'POST',
        body: JSON.stringify({ symbols: cleanSymbols }),
      });
      
      if (data.success) {
        console.log(`✅ Batch quotes: ${data.metadata.successful}/${data.metadata.requested} successful`);
        return data;
      } else {
        throw new StockAPIError('Batch quotes failed', 'BATCH_FAILED');
      }

    } catch (error) {
      console.error('Batch quotes error:', error);
      
      if (error instanceof StockAPIError) {
        throw error;
      }
      
      throw new StockAPIError(
        error.message || 'Batch quotes failed',
        'BATCH_ERROR',
        true
      );
    }
  }

  // Enhanced health check for Finnhub
  async checkHealth() {
    try {
      const data = await this.apiCall('/stocks/health');
      return {
        status: data.status,
        api: data.api || 'finnhub',
        limits: data.limits,
        stats: data.performance
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        api: 'finnhub',
        error: error.message
      };
    }
  }

  // Get system stats
  async getStats() {
    try {
      const data = await this.apiCall('/stocks/stats');
      return data.stats;
    } catch (error) {
      console.error('Stats error:', error);
      return null;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('🧹 Cache cleared');
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      items: Array.from(this.cache.keys())
    };
  }

  // User-friendly error messages
  getErrorMessage(error) {
    if (error.code === 'API_KEY_ERROR') {
      return 'API configuration error. Please contact support.';
    } else if (error.code === 'RATE_LIMIT_ERROR') {
      return 'Too many requests. Please wait a minute and try again.';
    } else if (error.code === 'SYMBOL_NOT_FOUND') {
      return 'Stock symbol not found. Please check the symbol and try again.';
    } else if (error.code === 'INVALID_SYMBOL') {
      return 'Invalid stock symbol format. Use 1-10 letters (e.g., AAPL, MSFT).';
    } else if (error.code === 'TIMEOUT_ERROR') {
      return 'Request timeout. Please try again.';
    } else if (error.code === 'SERVICE_UNAVAILABLE') {
      return 'Service temporarily unavailable. Please try again later.';
    } else {
      return error.message || 'An unexpected error occurred.';
    }
  }
}

// Export singleton instance
const stockAPI = new FinnhubStockAPI();

// Legacy API compatibility (for existing components)
export const searchStocks = async (query) => {
  try {
    const result = await stockAPI.searchStocks(query);
    return result;
  } catch (error) {
    throw new Error(stockAPI.getErrorMessage(error));
  }
};

export const getStockQuote = async (symbol) => {
  try {
    const result = await stockAPI.getStockQuote(symbol);
    return result;
  } catch (error) {
    throw new Error(stockAPI.getErrorMessage(error));
  }
};

// New enhanced API
export default stockAPI;

// Error types for better error handling in components
export { StockAPIError };

// Utility functions for components
export const formatCurrency = (value) => {
  if (typeof value !== 'number') return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};

export const formatPercent = (value) => {
  if (typeof value !== 'number') return 'N/A';
  const formatted = value.toFixed(2);
  return `${value >= 0 ? '+' : ''}${formatted}%`;
};

export const formatMarketCap = (value) => {
  if (typeof value !== 'number' || value === 0) return 'N/A';
  
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else {
    return `$${value.toLocaleString()}`;
  }
};