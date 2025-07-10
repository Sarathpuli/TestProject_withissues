// Optimized HomePage.tsx - Addresses all issues
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  PieChart, 
  Clock,
  RefreshCw,
  Search,
  Star,
  Newspaper,
  AlertTriangle,
  Activity,
  DollarSign,
  ChevronRight,
  Eye,
  Sparkles,
  UserPlus,
  Lock,
  Home,
  CheckSquare,
  ArrowUp,
  ArrowDown,
  Globe
} from 'lucide-react';

// Core Components
import ReusableHeader from '../components/ReusableHeader';
import NewsSection from '../components/NewsSection';
import StockQuiz from '../components/StockQuiz';
import AskAI from '../components/AskAI';
import { LoadingSpinner } from '../components/LoadingSpinner';

// Types
interface HomePageProps {
  user: any;
  onPortfolioUpdate?: () => void;
}

interface MarketData {
  spy: { price: number; change: number; changePercent: number };
  qqq: { price: number; change: number; changePercent: number };
  dia: { price: number; change: number; changePercent: number };
  vix: { price: number; change: number; changePercent: number };
  lastUpdated: Date;
}

interface PortfolioHolding {
  symbol: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  gainLoss: number;
  gainLossPercent: number;
}

interface Portfolio {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  holdings: PortfolioHolding[];
}

// Backend API Configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const backendAPI = {
  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  },

  getMarketData: async (): Promise<MarketData> => {
    try {
      const symbols = ['SPY', 'QQQ', 'DIA', 'VIX'];
      const promises = symbols.map(symbol => 
        fetch(`${BACKEND_URL}/api/stocks/quote/${symbol}`)
          .then(res => res.json())
          .catch(() => null)
      );

      const results = await Promise.all(promises);
      
      return {
        spy: results[0]?.quote ? {
          price: results[0].quote.c,
          change: results[0].quote.d,
          changePercent: results[0].quote.dp
        } : { price: 0, change: 0, changePercent: 0 },
        qqq: results[1]?.quote ? {
          price: results[1].quote.c,
          change: results[1].quote.d,
          changePercent: results[1].quote.dp
        } : { price: 0, change: 0, changePercent: 0 },
        dia: results[2]?.quote ? {
          price: results[2].quote.c,
          change: results[2].quote.d,
          changePercent: results[2].quote.dp
        } : { price: 0, change: 0, changePercent: 0 },
        vix: results[3]?.quote ? {
          price: results[3].quote.c,
          change: results[3].quote.d,
          changePercent: results[3].quote.dp
        } : { price: 0, change: 0, changePercent: 0 },
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Market data fetch error:', error);
      throw error;
    }
  }
};

// Utility Functions
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatPercent = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

// Real-time Clock Component
const RealTimeClock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isMarketOpen = () => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hour * 60 + minutes;
    
    // Monday to Friday
    if (day >= 1 && day <= 5) {
      // 9:30 AM to 4:00 PM EST
      const marketOpen = 9 * 60 + 30; // 9:30 AM
      const marketClose = 16 * 60; // 4:00 PM
      return currentTime >= marketOpen && currentTime < marketClose;
    }
    
    return false;
  };

  const marketOpen = isMarketOpen();

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${marketOpen ? 'bg-green-400' : 'bg-red-400'}`}></div>
        <span className="text-sm text-gray-300">
          {marketOpen ? 'Market Open' : 'Market Closed'}
        </span>
      </div>
      <div className="text-sm text-blue-300 font-mono">
        {formatTime(currentTime)}
      </div>
    </div>
  );
};

// Compact Market Overview Component
const CompactMarketOverview: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await backendAPI.getMarketData();
      setMarketData(data);
    } catch (err) {
      console.error('Market data error:', err);
      setError('Unable to load market data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-4 rounded-lg border border-blue-800/30">
        <div className="animate-pulse">
          <div className="h-4 bg-blue-600/20 rounded w-1/3 mb-3"></div>
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-blue-600/20 rounded"></div>
                <div className="h-4 bg-blue-600/20 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-4 rounded-lg border border-blue-800/30">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-blue-300 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Market Overview
          </h4>
          <RealTimeClock />
        </div>
        <div className="text-center py-4">
          <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-300">{error}</p>
          <button
            onClick={fetchMarketData}
            className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center mx-auto"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const marketItems = [
    { label: 'S&P 500', data: marketData?.spy, symbol: 'SPY' },
    { label: 'NASDAQ', data: marketData?.qqq, symbol: 'QQQ' },
    { label: 'Dow Jones', data: marketData?.dia, symbol: 'DIA' },
    { label: 'VIX', data: marketData?.vix, symbol: 'VIX' }
  ];

  return (
    <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-4 rounded-lg border border-blue-800/30">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-blue-300 flex items-center">
          <BarChart3 className="w-4 h-4 mr-2" />
          Market Overview
        </h4>
        <RealTimeClock />
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {marketItems.map((item, index) => (
          <div key={index} className="text-center">
            <p className="text-xs text-gray-400 mb-1">{item.label}</p>
            <p className="text-sm font-medium text-white">
              {item.data?.price ? formatCurrency(item.data.price) : 'N/A'}
            </p>
            <p className={`text-xs flex items-center justify-center ${
              (item.data?.changePercent || 0) >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {(item.data?.changePercent || 0) >= 0 ? 
                <ArrowUp className="w-3 h-3 mr-1" /> : 
                <ArrowDown className="w-3 h-3 mr-1" />
              }
              {formatPercent(item.data?.changePercent || 0)}
            </p>
          </div>
        ))}
      </div>
      
      {marketData?.lastUpdated && (
        <div className="mt-3 pt-2 border-t border-blue-800/30">
          <p className="text-xs text-gray-500 text-center">
            Last updated: {marketData.lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
};

// Compact Portfolio Summary Component
const CompactPortfolioSummary: React.FC<{ user: any }> = ({ user }) => {
  const [portfolio, setPortfolio] = useState<Portfolio>({
    totalValue: 0,
    dayChange: 0,
    dayChangePercent: 0,
    holdings: []
  });

  const mockPortfolio: Portfolio = useMemo(() => ({
    totalValue: 45750.30,
    dayChange: 1250.75,
    dayChangePercent: 2.81,
    holdings: [
      {
        symbol: 'AAPL',
        shares: 50,
        avgPrice: 180.25,
        currentPrice: 185.50,
        value: 9275.00,
        gainLoss: 262.50,
        gainLossPercent: 2.91
      },
      {
        symbol: 'MSFT',
        shares: 30,
        avgPrice: 340.80,
        currentPrice: 355.20,
        value: 10656.00,
        gainLoss: 432.00,
        gainLossPercent: 4.22
      },
      {
        symbol: 'GOOGL',
        shares: 25,
        avgPrice: 125.60,
        currentPrice: 131.25,
        value: 3281.25,
        gainLoss: 141.25,
        gainLossPercent: 4.50
      }
    ]
  }), []);

  useEffect(() => {
    if (user) {
      setPortfolio(mockPortfolio);
    }
  }, [user, mockPortfolio]);

  if (!user) {
    return (
      <div className="bg-gradient-to-br from-gray-800/80 to-gray-750/80 p-4 rounded-lg border border-gray-700">
        <div className="text-center">
          <Lock className="w-8 h-8 mx-auto mb-3 text-gray-500" />
          <p className="text-sm font-medium text-gray-300 mb-2">Portfolio Tracking</p>
          <p className="text-xs text-gray-500 mb-3">Sign in to track your investments</p>
          <Link
            to="/signup"
            className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
          >
            <UserPlus className="w-3 h-3 mr-1" />
            Get Started
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-750/80 p-4 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-white flex items-center">
          <PieChart className="w-4 h-4 mr-2 text-green-400" />
          Portfolio
        </h4>
        <Link
          to="/portfolio"
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
        >
          View All
          <ChevronRight className="w-3 h-3 ml-1" />
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Total Value</span>
          <span className="text-sm font-medium text-white">
            {formatCurrency(portfolio.totalValue)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Today's Change</span>
          <span className={`text-sm font-medium flex items-center ${
            portfolio.dayChange >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {portfolio.dayChange >= 0 ? 
              <TrendingUp className="w-3 h-3 mr-1" /> : 
              <TrendingDown className="w-3 h-3 mr-1" />
            }
            {formatCurrency(Math.abs(portfolio.dayChange))} ({formatPercent(portfolio.dayChangePercent)})
          </span>
        </div>

        <div className="pt-2 border-t border-gray-700">
          <p className="text-xs text-gray-500 mb-2">Top Holdings</p>
          <div className="space-y-1">
            {portfolio.holdings.slice(0, 3).map((holding, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-xs text-gray-300">{holding.symbol}</span>
                <span className={`text-xs ${
                  holding.gainLossPercent >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatPercent(holding.gainLossPercent)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick Search Component
const QuickSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/stock/${query.toUpperCase()}`);
      setQuery('');
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-750/80 p-4 rounded-lg border border-gray-700">
      <h4 className="text-sm font-medium text-white mb-3 flex items-center">
        <Search className="w-4 h-4 mr-2 text-blue-400" />
        Quick Stock Analysis
      </h4>
      
      <form onSubmit={handleSearch} className="space-y-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter stock symbol (e.g., AAPL)"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={!query.trim()}
          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors flex items-center justify-center"
        >
          <Search className="w-3 h-3 mr-2" />
          Analyze Stock
        </button>
      </form>

      <div className="mt-3 pt-3 border-t border-gray-700">
        <p className="text-xs text-gray-500 mb-2">Popular Stocks</p>
        <div className="flex flex-wrap gap-1">
          {['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'NVDA'].map((symbol) => (
            <button
              key={symbol}
              onClick={() => navigate(`/stock/${symbol}`)}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-xs text-gray-300 rounded transition-colors"
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main HomePage Component
const HomePage: React.FC<HomePageProps> = ({ user }) => {
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const navigate = useNavigate();

  // Check server health
  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        const isHealthy = await backendAPI.checkHealth();
        setServerStatus(isHealthy ? 'online' : 'offline');
      } catch {
        setServerStatus('offline');
      }
    };

    checkServerHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white">
      <ReusableHeader 
        user={user}
        variant="home" 
        title="Intelligent Stock Analysis"
        showBackButton={false}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section with proper spacing */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 bg-clip-text text-transparent">
              Intelligent Stock Analysis
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Make smarter investment decisions with AI-powered analysis and real-time market data
            </p>
          </div>

          {/* Server Status Indicator */}
          {serverStatus !== 'checking' && (
            <div className="flex justify-center mb-6">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
                serverStatus === 'online' 
                  ? 'bg-green-900/30 text-green-400 border border-green-800' 
                  : 'bg-red-900/30 text-red-400 border border-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  serverStatus === 'online' ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                <span>{serverStatus === 'online' ? 'Real-time data enabled' : 'Using cached data'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Compact Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Market Overview - Full width on mobile, 2 cols on desktop */}
          <div className="lg:col-span-2">
            <CompactMarketOverview />
          </div>
          
          {/* Portfolio Summary */}
          <div>
            <CompactPortfolioSummary user={user} />
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Quick Search */}
          <QuickSearch />
          
          {/* AI Assistant */}
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-750/80 p-4 rounded-lg border border-gray-700">
            {user ? (
              <AskAI user={user} />
            ) : (
              <div className="text-center">
                <Brain className="w-8 h-8 mx-auto mb-3 text-purple-400" />
                <p className="text-sm font-medium text-white mb-2">AI Investment Assistant</p>
                <p className="text-xs text-gray-500 mb-3">Get personalized investment insights</p>
                <Link
                  to="/signup"
                  className="inline-flex items-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Try AI Assistant
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section - News and Quiz */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* News Section */}
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-750/80 p-4 rounded-lg border border-gray-700">
            <NewsSection />
          </div>
          
          {/* Stock Quiz */}
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-750/80 p-4 rounded-lg border border-gray-700">
            <StockQuiz />
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;