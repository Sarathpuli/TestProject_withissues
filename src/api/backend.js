// src/api/backend.js - Updated for Finnhub Backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// AI Assistant API (unchanged)
export const askAI = async (message, context = '') => {
  return apiCall('/ai/ask', {
    method: 'POST',
    body: JSON.stringify({ message, context }),
  });
};

// Updated Stock Search API for Finnhub
export const searchStocks = async (query) => {
  try {
    const data = await apiCall(`/stocks/search/${encodeURIComponent(query)}`);
    
    // Handle new Finnhub response structure
    if (data.success) {
      return {
        results: data.results || [],
        metadata: data.metadata
      };
    } else {
      return { results: [] };
    }
  } catch (error) {
    console.error('Stock search failed:', error);
    throw new Error(error.message || 'Stock search failed');
  }
};

// Updated Stock Quote API for Finnhub
export const getStockQuote = async (symbol) => {
  try {
    const data = await apiCall(`/stocks/quote/${symbol}`);
    
    // Handle new Finnhub response structure
    if (data.success) {
      return {
        symbol: data.symbol,
        quote: data.quote,
        metadata: data.metadata
      };
    } else {
      throw new Error(`No quote data for ${symbol}`);
    }
  } catch (error) {
    console.error('Stock quote failed:', error);
    throw new Error(error.message || 'Stock quote failed');
  }
};

// New: Get Company Profile (Finnhub bonus feature)
export const getCompanyProfile = async (symbol) => {
  try {
    const data = await apiCall(`/stocks/profile/${symbol}`);
    
    if (data.success) {
      return {
        symbol: data.symbol,
        profile: data.profile,
        metadata: data.metadata
      };
    } else {
      throw new Error(`No profile data for ${symbol}`);
    }
  } catch (error) {
    console.error('Company profile failed:', error);
    throw new Error(error.message || 'Company profile failed');
  }
};

// New: Batch Quotes (for portfolios)
export const getBatchQuotes = async (symbols) => {
  try {
    const data = await apiCall('/stocks/batch-quotes', {
      method: 'POST',
      body: JSON.stringify({ symbols }),
    });
    
    if (data.success) {
      return {
        results: data.results,
        errors: data.errors,
        metadata: data.metadata
      };
    } else {
      throw new Error('Batch quotes failed');
    }
  } catch (error) {
    console.error('Batch quotes failed:', error);
    throw new Error(error.message || 'Batch quotes failed');
  }
};

// New: Check API Health
export const checkStockAPIHealth = async () => {
  try {
    const data = await apiCall('/stocks/health');
    return {
      status: data.status,
      api: data.api || 'finnhub',
      stats: data.performance
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

// Quiz API (unchanged)
export const generateQuiz = async () => {
  return apiCall('/quiz/generate', {
    method: 'POST',
  });
};

// Helper functions for formatting (useful for components)
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

// Default export for backward compatibility
export default {
  askAI,
  searchStocks,
  getStockQuote,
  getCompanyProfile,
  getBatchQuotes,
  checkStockAPIHealth,
  generateQuiz,
  formatCurrency,
  formatPercent
};