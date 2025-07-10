// pages/StockPage.tsx - Updated with ReusableHeader Integration
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity, 
  DollarSign, 
  RefreshCw, 
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  Share2,
  Calculator,
  Brain,
  Star,
  Shield,
  Zap,
  Target,
  Eye,
  Clock,
  Calendar,
  Globe
} from 'lucide-react';

// Import the new ReusableHeader
import ReusableHeader from '../components/ReusableHeader';

// Types
interface StockQuote {
  c: number;  // current price
  d: number;  // change
  dp: number; // percent change
  h: number;  // high
  l: number;  // low
  o: number;  // open
  pc: number; // previous close
  t: number;  // timestamp
}

interface StockProfile {
  name: string;
  ticker: string;
  exchange: string;
  currency: string;
  country: string;
  marketCapitalization: number;
  finnhubIndustry: string;
}

interface StockDetails {
  symbol: string;
  quote: StockQuote;
  profile: StockProfile;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  peRatio?: number;
  beta?: number;
  dividendYield?: number;
  volume?: number;
  avgVolume?: number;
  eps?: number;
  revenue?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  industry?: string;
  sector?: string;
  employees?: number;
  description?: string;
  pbRatio?: number;
  debtToEquity?: number;
  currentRatio?: number;
  grossMargin?: number;
  yearLow?: number;
  yearHigh?: number;
  priceHistory?: number[];
  riskMetrics?: {
    volatility: number;
    beta: number;
    riskLevel: string;
    riskScore: number;
  };
  technicalIndicators?: {
    rsi: number;
    macd: number;
    sma20: number;
    sma50: number;
    sma200: number;
    momentum: string;
  };
}

interface StockPageProps {
  user?: User | null;
}

// Backend API Configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Backend API helper functions
const backendAPI = {
  getStockQuote: async (symbol: string) => {
    const response = await fetch(`${BACKEND_URL}/api/stocks/quote/${symbol}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch quote for ${symbol}`);
    }
    return response.json();
  },

  getAIAnalysis: async (symbol: string, context: string) => {
    const response = await fetch(`${BACKEND_URL}/api/ai/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: `Analyze ${symbol} stock from an investment perspective. Include key metrics, strengths, risks, and recommendation.`,
        context: `Stock analysis for ${symbol}. ${context}`
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to get AI analysis');
    }
    return response.json();
  },

  checkHealth: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
};

// Mock data generator for missing features
const generateMockMetrics = (symbol: string, price: number) => {
  const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (min: number, max: number) => min + ((seed * 9301 + 49297) % 233280) / 233280 * (max - min);
  
  return {
    peRatio: random(10, 35),
    beta: random(0.5, 2.0),
    dividendYield: random(0, 5),
    marketCap: random(1000, 500000),
    volume: Math.floor(random(1000000, 100000000)),
    avgVolume: Math.floor(random(1000000, 50000000)),
    eps: random(0.5, 15),
    revenue: random(1000, 100000),
    fiftyTwoWeekHigh: price * random(1.1, 1.8),
    fiftyTwoWeekLow: price * random(0.6, 0.9),
    rsi: random(20, 80),
    sma20: price * random(0.95, 1.05),
    sma50: price * random(0.90, 1.10),
    pbRatio: random(0.5, 5),
    debtToEquity: random(0.1, 2),
    currentRatio: random(0.5, 3),
    grossMargin: random(15, 60),
    priceHistory: Array.from({length: 30}, (_, i) => {
      const trend = Math.sin(i * 0.2) * 0.1;
      const noise = (Math.random() - 0.5) * 0.05;
      return price * (1 + trend + noise);
    })
  };
};

// Format helper functions
const formatCurrency = (value?: number) => {
  if (!value) return 'N/A';
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
};

const formatPercent = (value?: number) => {
  return value ? `${value >= 0 ? '+' : ''}${value.toFixed(2)}%` : 'N/A';
};

const formatNumber = (value?: number, decimals = 2) => {
  return value ? value.toFixed(decimals) : 'N/A';
};

// Loading Spinner Component
const LoadingSpinner: React.FC<{ message?: string; size?: 'sm' | 'md' | 'lg' }> = ({ 
  message = "Loading...", 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className={`animate-spin rounded-full border-b-2 border-blue-400 mx-auto mb-3 ${sizeClasses[size]}`}></div>
        <p className="text-gray-400 text-sm">{message}</p>
      </div>
    </div>
  );
};

// Status Card Component
const StatusCard: React.FC<{
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  status: 'success' | 'warning' | 'error' | 'info';
  description?: string;
  className?: string;
}> = ({ title, value, icon: Icon, status, description, className = "" }) => {
  const statusConfig = {
    success: {
      gradient: 'from-green-600 to-green-700',
      border: 'border-green-500',
      iconColor: 'text-green-300',
      bgColor: 'bg-green-900/20'
    },
    warning: {
      gradient: 'from-yellow-600 to-yellow-700',
      border: 'border-yellow-500',
      iconColor: 'text-yellow-300',
      bgColor: 'bg-yellow-900/20'
    },
    error: {
      gradient: 'from-red-600 to-red-700',
      border: 'border-red-500',
      iconColor: 'text-red-300',
      bgColor: 'bg-red-900/20'
    },
    info: {
      gradient: 'from-blue-600 to-blue-700',
      border: 'border-blue-500',
      iconColor: 'text-blue-300',
      bgColor: 'bg-blue-900/20'
    }
  };

  const config = statusConfig[status];

  return (
    <div className={`bg-gradient-to-r ${config.gradient} p-4 rounded-xl border-l-4 ${config.border} backdrop-blur-sm ${className}`}>
      <div className="flex items-center space-x-3">
        <Icon className={`w-6 h-6 ${config.iconColor}`} />
        <div className="flex-1">
          <p className="text-white font-medium">{title}</p>
          <p className="text-white/90 text-lg font-bold">{value}</p>
          {description && <p className="text-white/70 text-sm mt-1">{description}</p>}
        </div>
      </div>
    </div>
  );
};

// AI Analysis Component
const AIAnalysisSection: React.FC<{ symbol: string; stockData: StockDetails; user: User | null }> = ({ symbol, stockData, user }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAIAnalysis = useCallback(async () => {
    if (!user) {
      setError('Please sign in to access AI analysis');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const context = `Current price: $${stockData.price}, Market cap: ${stockData.marketCap ? `$${(stockData.marketCap / 1000).toFixed(1)}B` : 'N/A'}, P/E: ${stockData.peRatio?.toFixed(1) || 'N/A'}`;
      const response = await backendAPI.getAIAnalysis(symbol, context);
      setAnalysis(response.response);
    } catch (err) {
      console.error('AI Analysis error:', err);
      setError('Failed to load AI analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [symbol, stockData, user]);

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold flex items-center text-white">
          <Brain className="w-5 h-5 mr-2 text-purple-400" />
          AI Stock Analysis
        </h3>
        <button
          onClick={fetchAIAnalysis}
          disabled={loading || !user}
          className="flex items-center px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analyzing...' : 'Get Analysis'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg mb-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {analysis ? (
        <div className="prose prose-invert max-w-none">
          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {analysis}
          </div>
        </div>
      ) : !user ? (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 mx-auto mb-3 text-gray-500" />
          <p className="text-gray-400 mb-2">AI Analysis Available</p>
          <p className="text-gray-500 text-sm">Sign in to get AI-powered stock analysis</p>
        </div>
      ) : (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 mx-auto mb-3 text-purple-400" />
          <p className="text-gray-400 mb-2">Ready for AI Analysis</p>
          <p className="text-gray-500 text-sm">Click "Get Analysis" to generate insights</p>
        </div>
      )}
    </div>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  label: string;
  value: string;
  icon: React.ComponentType<any>;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
}> = ({ label, value, icon: Icon, color = "text-blue-400", trend, subtitle }) => (
  <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-4 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300">
    <div className="flex items-center justify-between mb-3">
      <Icon className={`w-5 h-5 ${color}`} />
      {trend && (
        <div className={`flex items-center text-xs ${
          trend === 'up' ? 'text-green-400' : 
          trend === 'down' ? 'text-red-400' : 
          'text-gray-400'
        }`}>
          {trend === 'up' && <TrendingUp className="w-3 h-3" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3" />}
        </div>
      )}
    </div>
    <div className="space-y-1">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  </div>
);

// Main StockPage Component
const StockPage: React.FC<StockPageProps> = ({ user = null }) => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [stockDetails, setStockDetails] = useState<StockDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Fetch stock data
  const fetchStockData = useCallback(async (stockSymbol: string): Promise<StockDetails> => {
    try {
      // Get stock quote from backend
      const quoteResponse = await backendAPI.getStockQuote(stockSymbol);
      
      if (!quoteResponse || !quoteResponse.quote || quoteResponse.quote.c === 0) {
        throw new Error(`Invalid stock symbol: ${stockSymbol}`);
      }

      const quote = quoteResponse.quote;
      
      // Generate mock metrics and additional data
      const mockMetrics = generateMockMetrics(stockSymbol, quote.c);
      
      const profile: StockProfile = {
        name: `${stockSymbol} Company`,
        ticker: stockSymbol,
        exchange: 'NASDAQ',
        currency: 'USD',
        country: 'US',
        marketCapitalization: mockMetrics.marketCap,
        finnhubIndustry: 'Technology'
      };

      return {
        symbol: stockSymbol,
        quote,
        profile,
        price: quote.c,
        change: quote.d,
        changePercent: quote.dp,
        marketCap: mockMetrics.marketCap,
        peRatio: mockMetrics.peRatio,
        beta: mockMetrics.beta,
        dividendYield: mockMetrics.dividendYield,
        volume: mockMetrics.volume,
        avgVolume: mockMetrics.avgVolume,
        eps: mockMetrics.eps,
        revenue: mockMetrics.revenue,
        fiftyTwoWeekHigh: mockMetrics.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: mockMetrics.fiftyTwoWeekLow,
        yearHigh: mockMetrics.fiftyTwoWeekHigh,
        yearLow: mockMetrics.fiftyTwoWeekLow,
        pbRatio: mockMetrics.pbRatio,
        debtToEquity: mockMetrics.debtToEquity,
        currentRatio: mockMetrics.currentRatio,
        grossMargin: mockMetrics.grossMargin,
        priceHistory: mockMetrics.priceHistory,
        industry: profile.finnhubIndustry || 'Technology',
        sector: 'Technology',
        employees: Math.floor(Math.random() * 50000) + 1000,
        description: `${stockSymbol} is a leading company in its sector with strong fundamentals and growth potential.`,
        riskMetrics: {
          volatility: mockMetrics.beta * 15,
          beta: mockMetrics.beta,
          riskLevel: mockMetrics.beta > 1.5 ? 'High Risk' : mockMetrics.beta > 1 ? 'Medium Risk' : 'Low Risk',
          riskScore: Math.min(10, mockMetrics.beta * 5)
        },
        technicalIndicators: {
          rsi: mockMetrics.rsi,
          macd: Math.random() > 0.5 ? 1 : -1,
          sma20: mockMetrics.sma20,
          sma50: mockMetrics.sma50,
          sma200: quote.c * 0.85,
          momentum: quote.d > 0 ? 'Bullish' : 'Bearish'
        }
      };
    } catch (error) {
      console.error('Error fetching stock data:', error);
      throw error;
    }
  }, []);

  // Load stock data
  useEffect(() => {
    const loadStockData = async () => {
      if (!symbol) {
        setError('No stock symbol provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await fetchStockData(symbol.toUpperCase());
        setStockDetails(data);
      } catch (err) {
        console.error('Failed to load stock data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load stock data');
      } finally {
        setLoading(false);
      }
    };

    loadStockData();
  }, [symbol, fetchStockData]);

  // Refresh data
  const handleRefresh = async () => {
    if (!symbol) return;
    
    setRefreshing(true);
    try {
      const data = await fetchStockData(symbol.toUpperCase());
      setStockDetails(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  // Stock action buttons
  const stockActions = (
    <div className="flex items-center space-x-3">
      <button
        onClick={() => setIsBookmarked(!isBookmarked)}
        className={`p-2 rounded-lg transition-colors ${
          isBookmarked 
            ? 'bg-yellow-600 text-yellow-100 hover:bg-yellow-700' 
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
        title={isBookmarked ? 'Remove from watchlist' : 'Add to watchlist'}
      >
        {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
      </button>
      
      <button
        onClick={() => navigator.share?.({ 
          title: `${symbol} Stock Analysis`,
          url: window.location.href 
        })}
        className="p-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-lg transition-colors"
        title="Share"
      >
        <Share2 className="w-4 h-4" />
      </button>
      
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
        {refreshing ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white">
        <ReusableHeader 
          user={user}
          variant="stock" 
          title={symbol ? `${symbol.toUpperCase()} Analysis` : 'Stock Analysis'}
          showBackButton={true}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner message="Loading comprehensive stock data..." size="lg" />
        </div>
      </div>
    );
  }

  if (error || !stockDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white">
        <ReusableHeader 
          user={user}
          variant="stock" 
          title="Stock Analysis"
          showBackButton={true}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="p-8 bg-red-900/20 border border-red-800 rounded-xl">
            <h3 className="text-red-400 font-medium mb-4 text-xl flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2" />
              Error Loading Stock Data
            </h3>
            <p className="text-red-300 mb-6">{error || 'Stock data not available'}</p>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white">
      <ReusableHeader 
        user={user}
        variant="stock" 
        title={`${stockDetails.symbol} Analysis`}
        showBackButton={true}
        customActions={stockActions}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stock Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold">{stockDetails.symbol}</h1>
              <p className="text-xl text-gray-300">{stockDetails.profile.name}</p>
              <p className="text-sm text-gray-400">{stockDetails.profile.exchange} • {stockDetails.industry}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{formatCurrency(stockDetails.price)}</p>
              <p className={`text-lg flex items-center justify-end ${
                stockDetails.change >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {stockDetails.change >= 0 ? 
                  <TrendingUp className="w-5 h-5 mr-1" /> : 
                  <TrendingDown className="w-5 h-5 mr-1" />
                }
                {formatCurrency(Math.abs(stockDetails.change))} ({formatPercent(stockDetails.changePercent)})
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Market Cap"
            value={formatCurrency(stockDetails.marketCap)}
            icon={Globe}
            color="text-purple-400"
          />
          <MetricCard
            label="P/E Ratio"
            value={formatNumber(stockDetails.peRatio, 1)}
            icon={Calculator}
            color="text-blue-400"
          />
          <MetricCard
            label="52W High"
            value={formatCurrency(stockDetails.fiftyTwoWeekHigh)}
            icon={TrendingUp}
            color="text-green-400"
          />
          <MetricCard
            label="52W Low"
            value={formatCurrency(stockDetails.fiftyTwoWeekLow)}
            icon={TrendingDown}
            color="text-red-400"
          />
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatusCard
            title="Risk Level"
            value={stockDetails.riskMetrics?.riskLevel || 'Medium Risk'}
            icon={Shield}
            status={
              stockDetails.riskMetrics?.riskLevel === 'Low Risk' ? 'success' :
              stockDetails.riskMetrics?.riskLevel === 'High Risk' ? 'error' : 'warning'
            }
            description={`Beta: ${formatNumber(stockDetails.beta, 2)}`}
          />
          <StatusCard
            title="Technical Momentum"
            value={stockDetails.technicalIndicators?.momentum || 'Neutral'}
            icon={Activity}
            status={
              stockDetails.technicalIndicators?.momentum === 'Bullish' ? 'success' :
              stockDetails.technicalIndicators?.momentum === 'Bearish' ? 'error' : 'info'
            }
            description={`RSI: ${formatNumber(stockDetails.technicalIndicators?.rsi, 0)}`}
          />
          <StatusCard
            title="Dividend Yield"
            value={formatPercent(stockDetails.dividendYield)}
            icon={DollarSign}
            status="info"
            description="Annual dividend yield"
          />
        </div>

        {/* AI Analysis Section */}
        <div className="mb-8">
          <AIAnalysisSection symbol={stockDetails.symbol} stockData={stockDetails} user={user} />
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Volume"
            value={formatNumber(stockDetails.volume)}
            icon={Activity}
            color="text-orange-400"
          />
          <MetricCard
            label="EPS"
            value={formatCurrency(stockDetails.eps)}
            icon={Target}
            color="text-yellow-400"
          />
          <MetricCard
            label="P/B Ratio"
            value={formatNumber(stockDetails.pbRatio, 1)}
            icon={BarChart3}
            color="text-indigo-400"
          />
          <MetricCard
            label="Employees"
            value={stockDetails.employees?.toLocaleString() || 'N/A'}
            icon={Eye}
            color="text-pink-400"
          />
        </div>
      </main>
    </div>
  );
};

export default StockPage;