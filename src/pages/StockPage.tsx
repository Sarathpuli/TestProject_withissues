// Enhanced StockPage.tsx - Original UI Design with Backend APIs
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Calendar,
  Users,
  Zap,
  Globe,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  PlusCircle,
  BookOpen,
  Activity,
  Home,
  Calculator,
  GitCompare,
  Eye,
  Shield,
  Gauge,
  Target,
  Building,
  GraduationCap,
  Lightbulb,
  Sparkles,
  Cpu,
  Clock,
  Star,
  TrendingDown as Down,
  ChevronUp,
  ChevronDown,
  Bell,
  Briefcase,
  PieChart,
  LineChart,
  Camera,
  ExternalLink
} from 'lucide-react';

// Backend API Configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Interfaces
interface StockQuote {
  c: number; // Current price
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  d: number; // Change
  dp: number; // Percent change
  t: number; // Timestamp
}

interface StockProfile {
  country?: string;
  currency?: string;
  exchange?: string;
  ipo?: string;
  marketCapitalization?: number;
  name?: string;
  phone?: string;
  shareOutstanding?: number;
  ticker?: string;
  weburl?: string;
  logo?: string;
  finnhubIndustry?: string;
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
  dividendYield?: number;
  beta?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  volume?: number;
  avgVolume?: number;
  eps?: number;
  revenue?: number;
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
  quarterlyData?: {
    revenue: number;
    revenueGrowth: number;
    quarterlyEps: number;
  };
  insiderActivity?: {
    recentBuys: number;
    recentSells: number;
    netActivity: string;
    institutionalOwnership: number;
  };
}

// Backend API helper functions
const backendAPI = {
  // Stock quote
  getStockQuote: async (symbol: string) => {
    const response = await fetch(`${BACKEND_URL}/api/stocks/quote/${symbol}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch quote for ${symbol}`);
    }
    return response.json();
  },

  // AI analysis
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

  // Health check
  checkHealth: async () => {
    const response = await fetch(`${BACKEND_URL}/health`);
    return response.ok;
  }
};

// Enhanced Mini Chart Component
const MiniChart: React.FC<{ data: number[]; width?: number; height?: number }> = ({ 
  data, 
  width = 300, 
  height = 80
}) => {
  if (!data || data.length < 2) {
    return (
      <div className="flex items-center justify-center h-20 bg-gray-700/30 rounded-lg">
        <div className="text-gray-400 text-xs flex items-center">
          <LineChart className="w-4 h-4 mr-2" />
          No chart data available
        </div>
      </div>
    );
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const isPositive = data[data.length - 1] > data[0];

  return (
    <div className="bg-gray-700/30 rounded-lg p-3">
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`gradient-${isPositive ? 'green' : 'red'}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke={isPositive ? '#10B981' : '#EF4444'}
          strokeWidth="2"
          points={points}
        />
        <polygon
          fill={`url(#gradient-${isPositive ? 'green' : 'red'})`}
          points={`0,${height} ${points} ${width},${height}`}
        />
      </svg>
    </div>
  );
};

// Enhanced Progress Bar Component for 52-week range
const ProgressBar: React.FC<{ current: number; min: number; max: number; className?: string }> = ({ 
  current, 
  min, 
  max, 
  className = "" 
}) => {
  const range = max - min;
  const position = range > 0 ? ((current - min) / range) * 100 : 50;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="w-full bg-gray-700 rounded-full h-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-30"></div>
        <div 
          className="bg-blue-400 h-3 rounded-full transition-all duration-500 relative z-10"
          style={{ width: `${Math.min(100, Math.max(0, position))}%` }}
        />
        <div 
          className="absolute top-0 w-3 h-3 bg-white rounded-full border-2 border-blue-400 transform -translate-x-1.5 z-20 shadow-lg"
          style={{ left: `${Math.min(100, Math.max(0, position))}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span className="flex items-center">
          <Down className="w-3 h-3 mr-1 text-red-400" />
          ${min.toFixed(2)}
        </span>
        <span className="text-white font-medium">${current.toFixed(2)}</span>
        <span className="flex items-center">
          <TrendingUp className="w-3 h-3 mr-1 text-green-400" />
          ${max.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

// Enhanced Metric Card Component
const MetricCard: React.FC<{
  label: string;
  value: string;
  icon: React.ComponentType<any>;
  color?: string;
  tooltip?: string;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  onClick?: () => void;
}> = ({ label, value, icon: Icon, color = "text-blue-400", tooltip, trend, subtitle, onClick }) => (
  <div 
    className={`bg-gradient-to-br from-gray-800 to-gray-750 p-4 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 group ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-105' : 'hover:shadow-md'}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-3">
      <Icon className={`w-5 h-5 ${color} group-hover:scale-110 transition-transform duration-200`} />
      {trend && (
        <div className={`flex items-center text-xs ${
          trend === 'up' ? 'text-green-400' : 
          trend === 'down' ? 'text-red-400' : 
          'text-gray-400'
        }`}>
          {trend === 'up' && <TrendingUp className="w-3 h-3" />}
          {trend === 'down' && <Down className="w-3 h-3" />}
        </div>
      )}
    </div>
    <div className="space-y-1">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
    {tooltip && (
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-2">
        <p className="text-xs text-gray-400 italic">{tooltip}</p>
      </div>
    )}
  </div>
);

// Enhanced Loading Spinner Component
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

// Enhanced Status Card Component
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

// Enhanced AI Analysis Component
const AIAnalysisSection: React.FC<{ symbol: string; stockData: StockDetails }> = ({ symbol, stockData }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAIAnalysis = useCallback(async () => {
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
  }, [symbol, stockData]);

  useEffect(() => {
    fetchAIAnalysis();
  }, [fetchAIAnalysis]);

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold flex items-center text-white">
          <Cpu className="w-6 h-6 mr-3 text-purple-400" />
          AI Analysis
          <span className="ml-3 px-2 py-1 text-xs bg-purple-600 text-purple-100 rounded-full">
            Powered by GPT
          </span>
        </h2>
        <button
          onClick={fetchAIAnalysis}
          disabled={loading}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Analyzing stock with AI..." />
      ) : error ? (
        <div className="p-4 bg-red-900/20 border border-red-600 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      ) : (
        <div className="prose prose-invert max-w-none">
          <div className="bg-gray-700/30 p-6 rounded-lg border border-gray-600">
            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
              {analysis || 'No analysis available. Click refresh to generate analysis.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Mock data generators for missing features (enhanced)
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
const formatNumber = (value?: number, decimals = 2) => {
  return value ? value.toFixed(decimals) : 'N/A';
};

const formatCurrency = (value?: number) => {
  if (!value) return 'N/A';
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
};

const formatPercent = (value?: number) => {
  return value ? `${value.toFixed(2)}%` : 'N/A';
};

// Main StockPage Component
const StockPage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [stockDetails, setStockDetails] = useState<StockDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');

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

  // Fetch comprehensive stock data using backend
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
        description: `${stockSymbol} is a leading company in its sector with strong fundamentals and growth potential. The company operates in the technology sector and has shown consistent performance over the years.`,
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
        },
        quarterlyData: {
          revenue: mockMetrics.revenue / 4,
          revenueGrowth: (Math.random() - 0.5) * 40,
          quarterlyEps: mockMetrics.eps / 4
        },
        insiderActivity: {
          recentBuys: Math.floor(Math.random() * 10),
          recentSells: Math.floor(Math.random() * 10),
          netActivity: Math.random() > 0.5 ? 'BUYING' : 'SELLING',
          institutionalOwnership: 40 + Math.random() * 40
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner message="Loading comprehensive stock data..." size="lg" />
        </div>
      </div>
    );
  }

  if (error || !stockDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="p-8 bg-red-900/20 border border-red-800 rounded-xl">
            <h3 className="text-red-400 font-medium mb-4 text-xl flex items-center">
              <AlertCircle className="w-6 h-6 mr-2" />
              Error Loading Stock Data
            </h3>
            <p className="text-red-300 mb-6">{error || 'Stock data not available'}</p>
            <div className="flex space-x-4">
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
              <Link
                to="/"
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'analysis', label: 'AI Analysis', icon: Cpu },
    { id: 'financials', label: 'Financials', icon: Calculator },
    { id: 'technical', label: 'Technical', icon: Activity },
    { id: 'education', label: 'Learn', icon: GraduationCap }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white">
      {/* Header */}
      <div className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Link 
                  to="/" 
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 hover:scale-105"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Home</span>
                </Link>
                
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors ${refreshing ? 'opacity-50' : ''}`}
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Server Status */}
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs ${
              serverStatus === 'online' ? 'bg-green-900/30 text-green-300' :
              serverStatus === 'offline' ? 'bg-red-900/30 text-red-300' :
              'bg-yellow-900/30 text-yellow-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                serverStatus === 'online' ? 'bg-green-400 animate-pulse' :
                serverStatus === 'offline' ? 'bg-red-400' :
                'bg-yellow-400'
              }`}></div>
              <span>{serverStatus === 'online' ? 'Live Data' : serverStatus === 'offline' ? 'Offline' : 'Checking'}</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Price Display */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-8 rounded-2xl border border-gray-600 mb-8 backdrop-blur-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Price Section */}
            <div className="lg:col-span-1 space-y-6">
              <div className="flex items-baseline space-x-4 mb-4">
                <span className="text-5xl font-bold text-white">${stockDetails.price.toFixed(2)}</span>
                <div className={`flex items-center space-x-2 ${(stockDetails.change ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(stockDetails.change ?? 0) >= 0 ? (
                    <TrendingUp className="w-6 h-6" />
                  ) : (
                    <Down className="w-6 h-6" />
                  )}
                  <div className="text-right">
                    <span className="text-xl font-semibold block">
                      {(stockDetails.change ?? 0) >= 0 ? '+' : ''}${(stockDetails.change || 0).toFixed(2)}
                    </span>
                    <span className="text-lg">
                      ({(stockDetails.changePercent ?? 0) >= 0 ? '+' : ''}{(stockDetails.changePercent ?? 0).toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Company Info */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white">{stockDetails.symbol}</h1>
                <p className="text-gray-400 text-lg">{stockDetails.profile.name}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Globe className="w-4 h-4 mr-1" />
                    {stockDetails.profile.exchange}
                  </span>
                  <span>•</span>
                  <span>{stockDetails.profile.currency}</span>
                </div>
              </div>
              
              {/* Mini Chart */}
              {stockDetails.priceHistory && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400 flex items-center">
                    <LineChart className="w-4 h-4 mr-2" />
                    30-Day Price Trend
                  </p>
                  <MiniChart data={stockDetails.priceHistory} width={300} height={80} />
                </div>
              )}
              
              {/* 52-week range */}
              {stockDetails.yearLow && stockDetails.yearHigh && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    52-Week Range Position
                  </p>
                  <ProgressBar current={stockDetails.price} min={stockDetails.yearLow} max={stockDetails.yearHigh} />
                </div>
              )}
            </div>
            
            {/* Key Metrics Grid */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <MetricCard
                  label="Market Cap"
                  value={formatCurrency(stockDetails.marketCap)}
                  icon={Globe}
                  color="text-blue-400"
                  tooltip="Total market value of all shares"
                />
                <MetricCard
                  label="P/E Ratio"
                  value={formatNumber(stockDetails.peRatio)}
                  icon={Calculator}
                  color="text-green-400"
                  tooltip="Price-to-Earnings ratio"
                />
                <MetricCard
                  label="Volume"
                  value={stockDetails.volume?.toLocaleString() || 'N/A'}
                  icon={Activity}
                  color="text-purple-400"
                  tooltip="Today's trading volume"
                />
                <MetricCard
                  label="Avg Volume"
                  value={stockDetails.avgVolume?.toLocaleString() || 'N/A'}
                  icon={BarChart3}
                  color="text-orange-400"
                  tooltip="Average daily volume"
                />
                <MetricCard
                  label="Day High"
                  value={`$${stockDetails.quote.h?.toFixed(2)}`}
                  icon={TrendingUp}
                  color="text-green-400"
                  trend="up"
                />
                <MetricCard
                  label="Day Low"
                  value={`$${stockDetails.quote.l?.toFixed(2)}`}
                  icon={Down}
                  color="text-red-400"
                  trend="down"
                />
                <MetricCard
                  label="Previous Close"
                  value={`$${stockDetails.quote.pc?.toFixed(2)}`}
                  icon={Calendar}
                  color="text-yellow-400"
                />
                <MetricCard
                  label="Beta"
                  value={formatNumber(stockDetails.beta)}
                  icon={Activity}
                  color="text-cyan-400"
                  tooltip="Stock's volatility vs market"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-700">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Company Overview */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
                <Building className="w-5 h-5 mr-2 text-blue-400" />
                Company Overview
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Industry:</span>
                    <span className="text-white font-medium">{stockDetails.industry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sector:</span>
                    <span className="text-white font-medium">{stockDetails.sector}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Exchange:</span>
                    <span className="text-white font-medium">{stockDetails.profile.exchange}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Employees:</span>
                    <span className="text-white font-medium">{stockDetails.employees?.toLocaleString()}</span>
                  </div>
                </div>

                {stockDetails.description && (
                  <div className="pt-4 border-t border-gray-600">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">About</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{stockDetails.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Health */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
                <Briefcase className="w-5 h-5 mr-2 text-green-400" />
                Financial Health
              </h2>
              
              <div className="space-y-3">
                <MetricCard
                  label="EPS"
                  value={stockDetails.eps ? `$${stockDetails.eps.toFixed(2)}` : 'N/A'}
                  icon={DollarSign}
                  color="text-green-400"
                  tooltip="Earnings per Share"
                />
                <MetricCard
                  label="Revenue"
                  value={formatCurrency(stockDetails.revenue)}
                  icon={BarChart3}
                  color="text-blue-400"
                  tooltip="Annual revenue"
                />
                <MetricCard
                  label="Dividend Yield"
                  value={formatPercent(stockDetails.dividendYield)}
                  icon={DollarSign}
                  color="text-yellow-400"
                  tooltip="Annual dividend yield"
                />
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
                <Shield className="w-5 h-5 mr-2 text-orange-400" />
                Risk Assessment
              </h2>
              
              <div className="space-y-3">
                <StatusCard
                  title="Risk Level"
                  value={stockDetails.riskMetrics?.riskLevel || 'Medium Risk'}
                  icon={Shield}
                  status={
                    stockDetails.riskMetrics?.riskLevel === 'Low Risk' ? 'success' :
                    stockDetails.riskMetrics?.riskLevel === 'High Risk' ? 'error' : 'warning'
                  }
                />
                <MetricCard
                  label="Volatility"
                  value={`${stockDetails.riskMetrics?.volatility.toFixed(1)}%`}
                  icon={Activity}
                  color="text-red-400"
                  tooltip="Price volatility measure"
                />
                <MetricCard
                  label="Beta"
                  value={formatNumber(stockDetails.beta)}
                  icon={TrendingUp}
                  color="text-purple-400"
                  tooltip="Market sensitivity coefficient"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && stockDetails && (
          <AIAnalysisSection symbol={stockDetails.symbol} stockData={stockDetails} />
        )}

        {activeTab === 'financials' && (
          <div className="space-y-6">
            {/* Financial Metrics Grid */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700">
              <h2 className="text-2xl font-semibold mb-6 flex items-center text-white">
                <Calculator className="w-6 h-6 mr-3 text-blue-400" />
                Financial Metrics
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Valuation Metrics */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-blue-400 text-lg flex items-center">
                    <PieChart className="w-5 h-5 mr-2" />
                    Valuation
                  </h3>
                  <div className="space-y-3">
                    <MetricCard
                      label="P/E Ratio"
                      value={formatNumber(stockDetails.peRatio, 1)}
                      icon={Calculator}
                      color="text-blue-400"
                      tooltip="Price-to-Earnings ratio"
                    />
                    <MetricCard
                      label="P/B Ratio"
                      value={formatNumber(stockDetails.pbRatio, 1)}
                      icon={BookOpen}
                      color="text-blue-400"
                      tooltip="Price-to-Book ratio"
                    />
                    <MetricCard
                      label="EPS"
                      value={stockDetails.eps ? `$${stockDetails.eps.toFixed(2)}` : 'N/A'}
                      icon={DollarSign}
                      color="text-blue-400"
                      tooltip="Earnings per Share"
                    />
                  </div>
                </div>

                {/* Growth Metrics */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-green-400 text-lg flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Growth
                  </h3>
                  <div className="space-y-3">
                    <MetricCard
                      label="Revenue"
                      value={formatCurrency(stockDetails.revenue)}
                      icon={BarChart3}
                      color="text-green-400"
                      tooltip="Annual revenue"
                    />
                    <MetricCard
                      label="Quarterly Revenue"
                      value={formatCurrency(stockDetails.quarterlyData?.revenue)}
                      icon={Calendar}
                      color="text-green-400"
                      tooltip="Most recent quarterly revenue"
                    />
                    <MetricCard
                      label="Revenue Growth"
                      value={formatPercent(stockDetails.quarterlyData?.revenueGrowth)}
                      icon={TrendingUp}
                      color="text-green-400"
                      tooltip="Quarter-over-quarter revenue growth"
                    />
                  </div>
                </div>

                {/* Financial Health */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-purple-400 text-lg flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Health
                  </h3>
                  <div className="space-y-3">
                    <MetricCard
                      label="Debt/Equity"
                      value={formatNumber(stockDetails.debtToEquity)}
                      icon={Gauge}
                      color="text-purple-400"
                      tooltip="Debt-to-Equity ratio"
                    />
                    <MetricCard
                      label="Current Ratio"
                      value={formatNumber(stockDetails.currentRatio)}
                      icon={Gauge}
                      color="text-purple-400"
                      tooltip="Current assets / Current liabilities"
                    />
                    <MetricCard
                      label="Gross Margin"
                      value={formatPercent(stockDetails.grossMargin)}
                      icon={BarChart3}
                      color="text-purple-400"
                      tooltip="Gross profit margin"
                    />
                  </div>
                </div>

                {/* Market Metrics */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-yellow-400 text-lg flex items-center">
                    <Globe className="w-5 h-5 mr-2" />
                    Market
                  </h3>
                  <div className="space-y-3">
                    <MetricCard
                      label="Market Cap"
                      value={formatCurrency(stockDetails.marketCap)}
                      icon={Globe}
                      color="text-yellow-400"
                      tooltip="Total market value"
                    />
                    <MetricCard
                      label="Dividend Yield"
                      value={formatPercent(stockDetails.dividendYield)}
                      icon={DollarSign}
                      color="text-yellow-400"
                      tooltip="Annual dividend as percentage of stock price"
                    />
                    <MetricCard
                      label="Employees"
                      value={stockDetails.employees?.toLocaleString() || 'N/A'}
                      icon={Users}
                      color="text-yellow-400"
                      tooltip="Number of employees"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quarterly Performance */}
            {stockDetails.quarterlyData && (
              <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700">
                <h2 className="text-2xl font-semibold mb-6 flex items-center text-white">
                  <Calendar className="w-6 h-6 mr-3 text-cyan-400" />
                  Quarterly Performance
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatusCard
                    title="Quarterly Revenue"
                    value={formatCurrency(stockDetails.quarterlyData.revenue)}
                    icon={DollarSign}
                    status="info"
                    description="Most recent quarterly revenue"
                  />
                  <StatusCard
                    title="Revenue Growth"
                    value={formatPercent(stockDetails.quarterlyData.revenueGrowth)}
                    icon={TrendingUp}
                    status={stockDetails.quarterlyData.revenueGrowth >= 0 ? 'success' : 'error'}
                    description="Quarter-over-quarter growth"
                  />
                  <StatusCard
                    title="Quarterly EPS"
                    value={stockDetails.quarterlyData.quarterlyEps ? `$${stockDetails.quarterlyData.quarterlyEps.toFixed(2)}` : 'N/A'}
                    icon={Calculator}
                    status="info"
                    description="Quarterly earnings per share"
                  />
                </div>
              </div>
            )}

            {/* Insider Activity */}
            {stockDetails.insiderActivity && (
              <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700">
                <h2 className="text-2xl font-semibold mb-6 flex items-center text-white">
                  <Users className="w-6 h-6 mr-3 text-orange-400" />
                  Insider & Institutional Activity
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    label="Recent Buys"
                    value={stockDetails.insiderActivity.recentBuys.toString()}
                    icon={TrendingUp}
                    color="text-green-400"
                    tooltip="Recent insider buying activity"
                  />
                  <MetricCard
                    label="Recent Sells"
                    value={stockDetails.insiderActivity.recentSells.toString()}
                    icon={Down}
                    color="text-red-400"
                    tooltip="Recent insider selling activity"
                  />
                  <StatusCard
                    title="Net Activity"
                    value={stockDetails.insiderActivity.netActivity}
                    icon={Activity}
                    status={
                      stockDetails.insiderActivity.netActivity === 'BUYING' ? 'success' :
                      stockDetails.insiderActivity.netActivity === 'SELLING' ? 'error' : 'warning'
                    }
                    description="Overall insider activity trend"
                  />
                  <MetricCard
                    label="Institutional Ownership"
                    value={`${stockDetails.insiderActivity.institutionalOwnership.toFixed(1)}%`}
                    icon={Building}
                    color="text-orange-400"
                    tooltip="Percentage owned by institutions"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'technical' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Technical Indicators */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700">
              <h2 className="text-2xl font-semibold mb-6 flex items-center text-white">
                <Activity className="w-6 h-6 mr-3 text-purple-400" />
                Technical Indicators
              </h2>
              
              <div className="space-y-4">
                <StatusCard
                  title="RSI"
                  value={stockDetails.technicalIndicators?.rsi.toFixed(1) || 'N/A'}
                  icon={Gauge}
                  status={
                    (stockDetails.technicalIndicators?.rsi || 0) > 70 ? 'error' :
                    (stockDetails.technicalIndicators?.rsi || 0) < 30 ? 'success' : 'warning'
                  }
                  description="Relative Strength Index (0-100)"
                />
                <MetricCard
                  label="SMA 20"
                  value={`$${stockDetails.technicalIndicators?.sma20.toFixed(2)}`}
                  icon={LineChart}
                  color="text-blue-400"
                  tooltip="20-day Simple Moving Average"
                />
                <MetricCard
                  label="SMA 50"
                  value={`$${stockDetails.technicalIndicators?.sma50.toFixed(2)}`}
                  icon={LineChart}
                  color="text-green-400"
                  tooltip="50-day Simple Moving Average"
                />
                <StatusCard
                  title="Momentum"
                  value={stockDetails.technicalIndicators?.momentum || 'Neutral'}
                  icon={Activity}
                  status={stockDetails.technicalIndicators?.momentum === 'Bullish' ? 'success' : 'error'}
                  description="Current price momentum direction"
                />
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700">
              <h2 className="text-2xl font-semibold mb-6 flex items-center text-white">
                <BarChart3 className="w-6 h-6 mr-3 text-blue-400" />
                Price Chart
              </h2>
              
              <div className="h-80 flex items-center justify-center bg-gray-700/30 rounded-xl border border-gray-600">
                <div className="text-center space-y-4">
                  <BarChart3 className="w-20 h-20 text-gray-500 mx-auto" />
                  <div>
                    <p className="text-gray-400 text-lg font-medium">Interactive Chart</p>
                    <p className="text-sm text-gray-500">Advanced charting coming soon</p>
                  </div>
                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Activity className="w-3 h-3 mr-1" />
                      Technical Analysis
                    </span>
                    <span>•</span>
                    <span className="flex items-center">
                      <LineChart className="w-3 h-3 mr-1" />
                      Multiple Timeframes
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'education' && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-8 rounded-xl border border-gray-700">
            <h2 className="text-3xl font-semibold mb-8 flex items-center text-white">
              <GraduationCap className="w-8 h-8 mr-3 text-green-400" />
              Understanding Key Metrics
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 rounded-xl border border-blue-500 bg-blue-900/20 backdrop-blur-sm">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-600">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-300 mb-3 text-lg">P/E Ratio</h3>
                    <p className="text-blue-100 text-sm leading-relaxed">
                      Price-to-Earnings ratio shows how much investors pay for each dollar of earnings. 
                      Lower P/E may indicate undervaluation, while higher P/E suggests growth expectations.
                      Compare with industry averages for context.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-green-500 bg-green-900/20 backdrop-blur-sm">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-600">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-300 mb-3 text-lg">Market Cap</h3>
                    <p className="text-green-100 text-sm leading-relaxed">
                      Market capitalization is the total value of all company shares. 
                      Large-cap stocks are generally more stable, while small-cap may offer higher growth potential
                      but with increased volatility.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-yellow-500 bg-yellow-900/20 backdrop-blur-sm">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-600">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-300 mb-3 text-lg">Beta</h3>
                    <p className="text-yellow-100 text-sm leading-relaxed">
                      Beta measures stock volatility compared to the market. 
                      Beta {'>'} 1 means more volatile, Beta {'<'} 1 means less volatile than the overall market.
                      Higher beta stocks offer more risk and potential reward.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-purple-500 bg-purple-900/20 backdrop-blur-sm">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-600">
                    <Gauge className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-300 mb-3 text-lg">RSI</h3>
                    <p className="text-purple-100 text-sm leading-relaxed">
                      Relative Strength Index (0-100). RSI {'>'} 70 = potentially overbought, 
                      RSI {'<'} 30 = potentially oversold. Helps identify entry/exit points.
                      Use in combination with other indicators for best results.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl border border-green-700/30">
              <div className="flex items-center space-x-3 mb-4">
                <Lightbulb className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">Investment Tip</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Remember: No single metric tells the complete story. Always consider multiple factors including 
                financial health, industry trends, competitive position, and your own investment goals and risk tolerance. 
                Diversification across different stocks and sectors is key to managing risk.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StockPage;