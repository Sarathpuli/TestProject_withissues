// src/components/StockSearch.tsx - Updated for Finnhub Backend
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { 
  Search, 
  PlusCircle, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  X,
  History,
  Sparkles,
  Eye,
  Plus,
  Star,
  TrendingUp,
  Clock
} from 'lucide-react';
import { db, doc, updateDoc, getDoc } from '../firebase';

// Backend API Configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface CompanySearchResult {
  symbol: string;
  description: string;
  type?: string;
  exchange?: string;
}

// Exchange mapping for better display
const EXCHANGE_MAPPING: { [key: string]: string } = {
  // US Exchanges - Primary codes
  'XNAS': 'NASDAQ',
  'XNYS': 'NYSE', 
  'XASE': 'NYSE MKT',
  'BATS': 'BATS',
  'IEXG': 'IEX',
  'ARCX': 'NYSE ARCA',
  'XCHI': 'CHX',
  'FINX': 'FINRA',
  'XNMS': 'NASDAQ',
  'XNCM': 'NASDAQ',
  'EDGX': 'CBOE EDGX',
  'EDGA': 'CBOE EDGA',
  'BZX': 'CBOE BZX',
  'BYX': 'CBOE BYX',
  
  // OTC Markets
  'OTC': 'OTC',
  'OTCM': 'OTC Markets',
  'OTCB': 'OTC Bulletin Board',
  'PINK': 'Pink Sheets',
  
  // Alternative patterns Finnhub might return
  'US': 'US Market',
  'NASDAQ': 'NASDAQ',
  'NYSE': 'NYSE',
  'NYSEARCA': 'NYSE ARCA',
  'NYSEMKT': 'NYSE MKT',
  
  // International exchanges (in case they appear)
  'XLON': 'London SE',
  'XTSE': 'Toronto SE',
  'XFRA': 'Frankfurt SE',
  'XPAR': 'Euronext Paris',
  'XTKS': 'Tokyo SE',
  'XSHG': 'Shanghai SE',
  'XSHE': 'Shenzhen SE',
  'XHKG': 'Hong Kong SE',
  'XBOM': 'Bombay SE',
  'XNSE': 'National SE India',
  'XASX': 'Australian SE',
};

// Function to get exchange name with smart detection
const getExchangeName = (exchange?: string, symbol?: string) => {
  // If no exchange provided, try to guess from symbol patterns
  if (!exchange || exchange === 'Unknown' || exchange === '' || exchange === 'null') {
    return guessExchangeFromSymbol(symbol);
  }
  
  // Clean up the exchange string
  const cleanExchange = exchange.trim().toUpperCase();
  
  // Try direct mapping first
  if (EXCHANGE_MAPPING[cleanExchange]) {
    return EXCHANGE_MAPPING[cleanExchange];
  }
  
  // Try partial matches for common patterns
  if (cleanExchange.includes('NASDAQ') || cleanExchange.includes('XNAS')) {
    return 'NASDAQ';
  }
  if (cleanExchange.includes('NYSE') || cleanExchange.includes('XNYS')) {
    return 'NYSE';
  }
  if (cleanExchange.includes('OTC')) {
    return 'OTC';
  }
  if (cleanExchange.includes('BATS')) {
    return 'BATS';
  }
  if (cleanExchange.includes('IEX')) {
    return 'IEX';
  }
  
  // If it's a short code, return as-is (might be a valid exchange)
  if (cleanExchange.length <= 6 && /^[A-Z]+$/.test(cleanExchange)) {
    return cleanExchange;
  }
  
  // Last resort - try to guess from symbol
  return guessExchangeFromSymbol(symbol);
};

// Guess exchange from symbol patterns (common US stock patterns)
const guessExchangeFromSymbol = (symbol?: string) => {
  if (!symbol) return 'US Market';
  
  const cleanSymbol = symbol.trim().toUpperCase();
  
  // Most major tech stocks are on NASDAQ
  const nasdaqStocks = ['AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'ADBE', 'INTC', 'AMD', 'QCOM', 'AVGO', 'TXN', 'ORCL', 'CSCO', 'CRM', 'PYPL'];
  if (nasdaqStocks.includes(cleanSymbol)) {
    return 'NASDAQ';
  }
  
  // Many financial and industrial stocks are on NYSE
  const nyseStocks = ['JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'XOM', 'CVX', 'JNJ', 'PG', 'KO', 'PEP', 'WMT', 'HD', 'V', 'MA', 'DIS', 'BA', 'CAT', 'MMM', 'IBM', 'GE'];
  if (nyseStocks.includes(cleanSymbol)) {
    return 'NYSE';
  }
  
  // OTC stocks often have longer symbols or specific patterns
  if (cleanSymbol.length > 4 || cleanSymbol.includes('F') && cleanSymbol.length === 5) {
    return 'OTC';
  }
  
  // Default for 1-4 character symbols
  if (cleanSymbol.length <= 4 && /^[A-Z]+$/.test(cleanSymbol)) {
    return 'NASDAQ'; // Most common for short symbols
  }
  
  return 'US Market';
};

interface EnhancedStockSearchProps {
  user: User | null;
  onPortfolioUpdate: () => void;
}

interface RecentSearch {
  symbol: string;
  companyName: string;
  timestamp: string;
}

// Popular stocks for quick access
const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'NFLX', name: 'Netflix Inc.' }
];

// Enhanced API calls for Finnhub backend
const finnhubAPI = {
  searchStocks: async (query: string) => {
    const response = await fetch(`${BACKEND_URL}/api/stocks/search/${encodeURIComponent(query)}`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Search failed: ${response.status}`);
    }
    
    return response.json();
  },

  getStockQuote: async (symbol: string) => {
    const response = await fetch(`${BACKEND_URL}/api/stocks/quote/${symbol}`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Quote failed: ${response.status}`);
    }
    
    return response.json();
  },

  checkHealth: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/stocks/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
};

const EnhancedStockSearch: React.FC<EnhancedStockSearchProps> = ({ user, onPortfolioUpdate }) => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedStock, setSelectedStock] = useState('');
  const [shares, setShares] = useState(1);
  const [avgPrice, setAvgPrice] = useState(0);
  const [showEditForm, setShowEditForm] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load recent searches and check backend
  useEffect(() => {
    loadRecentSearches();
    checkBackendStatus();
  }, []);

  // Load recent searches from localStorage
  const loadRecentSearches = () => {
    try {
      const stored = localStorage.getItem('recentSearches');
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 8));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  // Save recent search to localStorage
  const saveRecentSearch = (symbol: string, companyName: string) => {
    try {
      const newSearch: RecentSearch = {
        symbol,
        companyName,
        timestamp: new Date().toISOString()
      };
      
      const existing = recentSearches.filter(item => item.symbol !== symbol);
      const updated = [newSearch, ...existing].slice(0, 8);
      
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save recent search:', error);
    }
  };

  // Check backend status
  const checkBackendStatus = async () => {
    try {
      setBackendStatus('checking');
      const isOnline = await finnhubAPI.checkHealth();
      setBackendStatus(isOnline ? 'online' : 'offline');
      
      if (!isOnline) {
        setMessage('⚠️ Backend server not responding. Please check if your server is running.');
      } else {
        // Clear any existing error messages when backend comes online
        if (message.includes('Backend') || message.includes('server')) {
          setMessage('');
        }
      }
      
      return isOnline;
    } catch (error) {
      console.error('Backend health check failed:', error);
      setBackendStatus('offline');
      setMessage('❌ Cannot connect to backend server. Please ensure your server is running.');
      return false;
    }
  };

  // Enhanced search function using Finnhub backend
  const searchStocks = async (query: string) => {
    if (!query || query.trim().length < 1) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const cleanQuery = query.trim();
    console.log(`🔍 Searching Finnhub for: "${cleanQuery}"`);
    
    setLoading(true);
    setMessage('');

    try {
      // Use Finnhub backend API
      const response = await finnhubAPI.searchStocks(cleanQuery);
      
      // Handle new Finnhub response structure
      if (response.success && response.results) {
        // Debug: Log what Finnhub is returning for exchanges
        console.log('🔍 Finnhub search results:', response.results.map((r: { symbol: any; exchange: any; type: any; }) => ({
          symbol: r.symbol,
          exchange: r.exchange,
          type: r.type
        })));
        
        setSearchResults(response.results);
        setShowResults(true);
        setBackendStatus('online');
        
        console.log(`✅ Found ${response.results.length} results from ${response.metadata.source}`);
        
        if (response.results.length === 0) {
          setMessage(`No results found for "${cleanQuery}". Try a different search term.`);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
        setMessage(`No results found for "${cleanQuery}". Try a different search term.`);
      }

    } catch (error) {
      console.error('Finnhub search error:', error);
      setSearchResults([]);
      setShowResults(false);
      
      if (error instanceof Error) {
        // Handle specific Finnhub error codes
        if (error.message.includes('Rate limit')) {
          setMessage('⏱️ Too many requests. Please wait a moment before searching again.');
        } else if (error.message.includes('timeout') || error.message.includes('504')) {
          setMessage('⏱️ Search timed out. Please try again.');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          setMessage('🌐 Network error. Please check your connection.');
          setBackendStatus('offline');
        } else if (error.message.includes('API configuration error')) {
          setMessage('🔧 API configuration issue. Please contact support.');
        } else {
          setMessage(`🔍 Search failed: ${error.message}`);
        }
      } else {
        setMessage('🔍 An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle search input with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    setMessage('');

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.length === 0) {
      setShowResults(false);
      setShowRecent(true);
      setSearchResults([]);
    } else {
      setShowRecent(false);
      
      // Debounce search
      if (value.trim().length >= 1) {
        searchTimeoutRef.current = setTimeout(() => {
          searchStocks(value.trim());
        }, 600); // Longer debounce for production
      }
    }
  };

  // Navigate to stock page
  const navigateToStock = (symbol: string, companyName?: string) => {
    if (!symbol) {
      setMessage('❌ Invalid stock symbol');
      return;
    }

    const cleanSymbol = symbol.trim().toUpperCase();
    console.log(`🔗 Navigating to stock: ${cleanSymbol}`);
    
    saveRecentSearch(cleanSymbol, companyName || cleanSymbol);
    navigate(`/stock/${cleanSymbol}`);
    
    // Clear search
    setSearchInput('');
    setShowResults(false);
    setShowRecent(false);
    setSearchResults([]);
  };

  // Add stock to portfolio (unchanged)
  const handleAddToPortfolio = async () => {
    if (!user || !selectedStock) {
      setMessage('❌ Please sign in to add stocks to your portfolio');
      return;
    }

    if (shares <= 0 || avgPrice <= 0) {
      setMessage('❌ Please enter valid shares and price values');
      return;
    }

    try {
      setLoading(true);
      console.log(`📊 Adding ${selectedStock} to portfolio: ${shares} shares at ${avgPrice}`);
      
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      
      const userData = userDoc.exists() ? userDoc.data() : {};
      const currentPortfolio = Array.isArray(userData.portfolio) ? userData.portfolio : [];

      // Remove existing entry and add new one
      const filteredPortfolio = currentPortfolio.filter((item: any) => 
        (typeof item === 'string' ? item : item.symbol) !== selectedStock
      );

      const newHolding = {
        symbol: selectedStock,
        shares: shares,
        avgPrice: avgPrice,
        dateAdded: new Date().toISOString()
      };

      await updateDoc(userRef, {
        portfolio: [...filteredPortfolio, newHolding]
      });

      setMessage(`✅ Added ${shares} shares of ${selectedStock} at $${avgPrice} to your portfolio`);
      setShowEditForm(false);
      setSelectedStock('');
      setShares(1);
      setAvgPrice(0);
      
      onPortfolioUpdate();
      
      setTimeout(() => setMessage(''), 5000);
      
    } catch (error) {
      console.error('Portfolio update error:', error);
      setMessage('❌ Error updating portfolio. Please try again.');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Handle keyboard events
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showResults && searchResults.length > 0) {
        navigateToStock(searchResults[0].symbol, searchResults[0].description);
      } else if (searchInput.trim()) {
        // Try direct navigation for stock symbols
        const cleanInput = searchInput.trim().toUpperCase();
        if (/^[A-Z]{1,5}$/.test(cleanInput)) {
          navigateToStock(cleanInput);
        }
      }
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setShowRecent(false);
      setSearchResults([]);
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setShowRecent(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={searchInputRef}>
      {/* Backend Status Indicator */}
      {backendStatus === 'offline' && (
        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-300 text-sm">
              Finnhub API temporarily unavailable. Please check your server.
            </span>
          </div>
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg border ${
          message.includes('✅') 
            ? 'bg-green-900/20 border-green-600/30 text-green-300'
            : message.includes('⚠️')
            ? 'bg-yellow-900/20 border-yellow-600/30 text-yellow-300'
            : 'bg-red-900/20 border-red-600/30 text-red-300'
        }`}>
          <div className="flex items-center space-x-2">
            {message.includes('✅') ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="text-sm">{message}</span>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            onKeyDown={handleKeyPress}
            onFocus={() => {
              if (searchInput.length === 0) setShowRecent(true);
            }}
            placeholder="Search stocks (e.g., AAPL, Apple, Microsoft)..."
            className="w-full pl-12 pr-12 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            disabled={loading}
          />
          
          {loading && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute z-50 w-full bg-gray-800 border border-gray-600 rounded-xl shadow-2xl max-h-96 overflow-y-auto">
          {searchResults.map((result, index) => {
            const exchangeName = getExchangeName(result.exchange, result.symbol);
            
            return (
              <div
                key={result.symbol}
                className={`p-4 hover:bg-gray-700 cursor-pointer transition-colors ${
                  index !== searchResults.length - 1 ? 'border-b border-gray-700' : ''
                }`}
                onClick={() => navigateToStock(result.symbol, result.description)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-blue-400 text-lg">{result.symbol}</span>
                      <span className="text-sm text-gray-400">
                        {exchangeName}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mt-1 line-clamp-2">
                      {result.description}
                    </p>
                    <div className="flex items-center space-x-3 mt-2">
                      {result.type && result.type !== 'Common Stock' && result.type !== 'Stock' && (
                        <span className="inline-block text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                          {result.type}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        Listed on {exchangeName}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStock(result.symbol);
                        setShowEditForm(true);
                        setShowResults(false);
                      }}
                      className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                      title="Add to Portfolio"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Searches */}
      {showRecent && recentSearches.length > 0 && (
        <div className="absolute z-40 w-full bg-gray-800 border border-gray-600 rounded-xl shadow-2xl">
          <div className="p-3 border-b border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 flex items-center">
              <History className="w-4 h-4 mr-2" />
              Recent Searches
            </h4>
          </div>
          {recentSearches.map((recent, index) => (
            <div
              key={recent.symbol}
              className={`p-3 hover:bg-gray-700 cursor-pointer transition-colors ${
                index !== recentSearches.length - 1 ? 'border-b border-gray-700' : ''
              }`}
              onClick={() => navigateToStock(recent.symbol, recent.companyName)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-blue-400">{recent.symbol}</span>
                  <span className="text-gray-300 text-sm ml-2">{recent.companyName}</span>
                </div>
                <Clock className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Popular Stocks */}
      {!showResults && !showRecent && searchInput.length === 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {POPULAR_STOCKS.map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => navigateToStock(stock.symbol, stock.name)}
              className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-all duration-200 hover:border-blue-500 text-left"
            >
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="font-bold text-blue-400 text-sm">{stock.symbol}</span>
              </div>
              <p className="text-gray-300 text-xs mt-1 line-clamp-1">{stock.name}</p>
            </button>
          ))}
        </div>
      )}

      {/* Portfolio Add Form */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-600 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-white flex items-center">
                <PlusCircle className="w-5 h-5 mr-2 text-green-400" />
                Add {selectedStock} to Portfolio
              </h4>
              <button
                onClick={() => {
                  setShowEditForm(false);
                  setSelectedStock('');
                  setShares(1);
                  setAvgPrice(0);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Shares
                </label>
                <input
                  type="number"
                  value={shares}
                  onChange={(e) => setShares(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  min="0"
                  step="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Avg Price ($)
                </label>
                <input
                  type="number"
                  value={avgPrice}
                  onChange={(e) => setAvgPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            
            <button
              onClick={handleAddToPortfolio}
              disabled={loading || shares <= 0 || avgPrice <= 0}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Add to Portfolio
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedStockSearch;