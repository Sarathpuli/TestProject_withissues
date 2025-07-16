// pages/HomePage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import ReusableHeader from '../components/ReusableHeader';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  AlertTriangle,
  DollarSign,
  PieChart,
  Target,
  Eye,
  EyeOff,
  Search,
  Brain,
  Lightbulb,
  Plus,
  Activity,
  Clock,
  Star
} from 'lucide-react';

interface MarketData {
  spy: { price: number; change: number; changePercent: number };
  qqq: { price: number; change: number; changePercent: number };
  dia: { price: number; change: number; changePercent: number };
  vix: { price: number; change: number; changePercent: number };
  lastUpdated: Date;
}

interface Portfolio {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  holdings: Array<{
    symbol: string;
    shares: number;
    avgPrice: number;
    currentPrice: number;
    value: number;
    gainLoss: number;
    gainLossPercent: number;
  }>;
}

// Real-time Clock Component
const RealTimeClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center text-xs text-slate-400">
      <Clock className="w-3 h-3 mr-1" />
      <span>{time.toLocaleTimeString()}</span>
    </div>
  );
};

// Market Overview Component
const MarketOverview: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: MarketData = {
        spy: { price: 418.25, change: 3.75, changePercent: 0.90 },
        qqq: { price: 352.80, change: -1.15, changePercent: -0.32 },
        dia: { price: 342.60, change: 2.42, changePercent: 0.71 },
        vix: { price: 16.75, change: -0.85, changePercent: -4.83 },
        lastUpdated: new Date()
      };
      
      setMarketData(mockData);
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

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50 rounded-xl p-6 shadow-xl">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-600/30 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-slate-600/30 rounded"></div>
                <div className="h-6 bg-slate-600/30 rounded"></div>
                <div className="h-4 bg-slate-600/30 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
            Market Overview
          </h3>
        </div>
        <div className="text-center py-8">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-300 mb-3">{error}</p>
          <button
            onClick={fetchMarketData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const marketItems = [
    { label: 'S&P 500', symbol: 'SPY', data: marketData?.spy },
    { label: 'NASDAQ', symbol: 'QQQ', data: marketData?.qqq },
    { label: 'Dow Jones', symbol: 'DIA', data: marketData?.dia },
    { label: 'VIX', symbol: 'VIX', data: marketData?.vix }
  ];

  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50 rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
          Market Overview
        </h3>
        <div className="flex items-center space-x-3">
          <RealTimeClock />
          <button
            onClick={fetchMarketData}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600/50 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {marketItems.map((item, index) => (
          <div key={index} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30 hover:border-slate-500/50 transition-all duration-200">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-1 font-medium">{item.label}</p>
              <p className="text-xs text-slate-500 mb-2">{item.symbol}</p>
              <p className="text-lg font-bold text-white mb-2">
                {item.data?.price ? formatCurrency(item.data.price) : 'N/A'}
              </p>
              {item.data && (
                <div className={`flex items-center justify-center text-sm font-medium ${
                  item.data.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {item.data.changePercent >= 0 ? 
                    <ArrowUp className="w-3 h-3 mr-1" /> : 
                    <ArrowDown className="w-3 h-3 mr-1" />
                  }
                  <span>{formatPercent(item.data.changePercent)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {marketData?.lastUpdated && (
        <div className="mt-4 pt-3 border-t border-slate-600/30">
          <p className="text-xs text-slate-500 text-center">
            Last updated: {marketData.lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
};

// Portfolio Summary Component
const PortfolioSummary: React.FC<{ user?: any }> = ({ user }) => {
  const [showValues, setShowValues] = useState(true);
  const [portfolioData, setPortfolioData] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate portfolio loading
    const timer = setTimeout(() => {
      const mockPortfolio: Portfolio = {
        totalValue: 45750.30,
        dayChange: 1250.75,
        dayChangePercent: 2.81,
        totalGainLoss: 8945.30,
        totalGainLossPercent: 24.32,
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
            avgPrice: 335.80,
            currentPrice: 348.90,
            value: 10467.00,
            gainLoss: 393.00,
            gainLossPercent: 3.90
          },
          {
            symbol: 'GOOGL',
            shares: 15,
            avgPrice: 142.60,
            currentPrice: 145.20,
            value: 2178.00,
            gainLoss: 39.00,
            gainLossPercent: 1.82
          },
          {
            symbol: 'TSLA',
            shares: 25,
            avgPrice: 245.80,
            currentPrice: 238.45,
            value: 5961.25,
            gainLoss: -183.75,
            gainLossPercent: -2.99
          }
        ]
      };
      setPortfolioData(mockPortfolio);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (value: number, hidden: boolean = false): string => {
    if (hidden) return '****';
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

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50 rounded-xl p-6 shadow-xl">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-600/30 rounded w-1/2 mb-4"></div>
          <div className="space-y-4">
            <div className="h-8 bg-slate-600/30 rounded"></div>
            <div className="h-6 bg-slate-600/30 rounded w-3/4"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-slate-600/30 rounded"></div>
              <div className="h-16 bg-slate-600/30 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50 rounded-xl p-6 shadow-xl">
        <div className="text-center py-8">
          <PieChart className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Portfolio Dashboard</h3>
          <p className="text-slate-300 mb-4">
            Sign in to view your portfolio performance and holdings
          </p>
          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const topHoldings = portfolioData?.holdings?.slice(0, 3) || [];

  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50 rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <PieChart className="w-5 h-5 mr-2 text-purple-400" />
          Portfolio Summary
        </h3>
        <button
          onClick={() => setShowValues(!showValues)}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600/50 rounded-lg transition-all duration-200"
        >
          {showValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Portfolio Value */}
      <div className="mb-6">
        <div className="flex items-baseline space-x-2 mb-2">
          <span className="text-2xl font-bold text-white">
            {formatCurrency(portfolioData?.totalValue || 0, !showValues)}
          </span>
          <span className="text-sm text-slate-400">Total Value</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`flex items-center text-sm font-medium ${
            (portfolioData?.dayChangePercent || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {(portfolioData?.dayChangePercent || 0) >= 0 ? 
              <TrendingUp className="w-4 h-4 mr-1" /> : 
              <TrendingDown className="w-4 h-4 mr-1" />
            }
            {showValues ? (
              <>
                <span>{formatCurrency(portfolioData?.dayChange || 0)}</span>
                <span className="ml-1">({formatPercent(portfolioData?.dayChangePercent || 0)})</span>
              </>
            ) : (
              <span>****</span>
            )}
          </div>
          <span className="text-xs text-slate-500">Today</span>
        </div>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Gain/Loss</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className={`text-lg font-bold mt-2 ${
            (portfolioData?.totalGainLossPercent || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {showValues ? formatPercent(portfolioData?.totalGainLossPercent || 0) : '****'}
          </div>
        </div>
        
        <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Holdings</span>
            <Target className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-white mt-2">
            {portfolioData?.holdings?.length || 0}
          </div>
        </div>
      </div>

      {/* Top Holdings */}
      <div>
        <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center">
          <BarChart3 className="w-4 h-4 mr-1" />
          Top Holdings
        </h4>
        <div className="space-y-2">
          {topHoldings.map((holding, index) => (
            <div key={index} className="flex items-center justify-between py-2 px-3 bg-slate-700/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{holding.symbol[0]}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-white">{holding.symbol}</span>
                  <div className="text-xs text-slate-400">
                    {holding.shares} shares
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white">
                  {showValues ? formatCurrency(holding.value) : '****'}
                </div>
                <div className={`text-xs ${
                  holding.gainLossPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {showValues ? formatPercent(holding.gainLossPercent) : '****'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-6 pt-4 border-t border-slate-600/30">
        <button className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 font-medium text-sm">
          View Full Portfolio
        </button>
      </div>
    </div>
  );
};

// Quick Search Component
const QuickSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    // Simulate search
    setTimeout(() => {
      console.log('Searching for:', searchTerm);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50 rounded-xl p-6 shadow-xl">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Search className="w-5 h-5 mr-2 text-green-400" />
        Quick Stock Search
      </h3>
      
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search stocks (e.g., AAPL, TSLA, MSFT)"
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>
        
        <button
          type="submit"
          disabled={!searchTerm.trim() || isLoading}
          className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Searching...
            </span>
          ) : (
            'Search Stock'
          )}
        </button>
      </form>
      
      <div className="mt-4 pt-4 border-t border-slate-600/30">
        <p className="text-xs text-slate-400 text-center">
          Get real-time quotes, analysis, and insights
        </p>
      </div>
    </div>
  );
};

// AI Assistant Component
const AIAssistant: React.FC<{ user?: any }> = ({ user }) => {
  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50 rounded-xl p-6 shadow-xl">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Brain className="w-5 h-5 mr-2 text-purple-400" />
        AI Investment Assistant
      </h3>
      
      {user ? (
        <div className="space-y-4">
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
            <div className="flex items-start space-x-3">
              <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-white mb-1">Today's Insight</h4>
                <p className="text-sm text-slate-300">
                  Based on your portfolio, consider diversifying into technology sector. 
                  Your current allocation shows strong growth potential.
                </p>
              </div>
            </div>
          </div>
          
          <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 font-medium">
            Ask AI Assistant
          </button>
        </div>
      ) : (
        <div className="text-center py-6">
          <Brain className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-300 mb-4">
            Get personalized investment insights and recommendations
          </p>
          <button className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium">
            Try AI Assistant
          </button>
        </div>
      )}
    </div>
  );
};

// Main HomePage Component
const HomePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  useEffect(() => {
    // Simulate user authentication check
    const checkAuth = () => {
      // Replace with your actual auth logic
      const mockUser = {
        displayName: 'John Doe',
        email: 'john.doe@example.com',
        isPro: true
      };
      setUser(mockUser);
    };

    checkAuth();

    // Simulate server health check
    const checkServerHealth = () => {
      setServerStatus('online');
    };

    checkServerHealth();
  }, []);

  const handleNavigation = (path: string) => {
    // Replace with your actual navigation logic
    console.log('Navigate to:', path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white">
      <ReusableHeader 
        user={user}
        variant="home" 
        title="Intelligent Stock Analysis"
        showBackButton={false}
        onNavigate={handleNavigation}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
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

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Market Overview - spans 2 columns on desktop */}
          <div className="lg:col-span-2">
            <MarketOverview />
          </div>
          
          {/* Portfolio Summary */}
          <div>
            <PortfolioSummary user={user} />
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Quick Search */}
          <QuickSearch />
          
          {/* AI Assistant */}
          <AIAssistant user={user} />
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50 rounded-xl p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-400" />
            Quick Actions
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:border-slate-500/50 transition-all duration-200 group">
              <Plus className="w-6 h-6 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-white">Add Stock</span>
            </button>
            
            <button className="flex flex-col items-center p-4 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:border-slate-500/50 transition-all duration-200 group">
              <PieChart className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-white">Portfolio</span>
            </button>
            
            <button className="flex flex-col items-center p-4 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:border-slate-500/50 transition-all duration-200 group">
              <BarChart3 className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-white">Analytics</span>
            </button>
            
            <button className="flex flex-col items-center p-4 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:border-slate-500/50 transition-all duration-200 group">
              <Star className="w-6 h-6 text-yellow-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-white">Watchlist</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;