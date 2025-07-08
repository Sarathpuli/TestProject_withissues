// components/ReusablePortfolio.tsx - Enhanced with Recent Searches & Better Actions
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { db, doc, getDoc, updateDoc } from '../firebase';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart,
  DollarSign,
  Lock,
  LogIn,
  AlertCircle,
  RefreshCw,
  Eye,
  Trash2,
  Plus,
  ExternalLink,
  Target,
  Activity,
  GraduationCap,
  BookOpen,
  Calculator,
  Zap,
  Heart,
  Bookmark,
  Info,
  Edit3,
  Star,
  History,
  Search,
  TrendingDown as Down,
  Calendar,
  Clock,
  Filter,
  ArrowUpDown,
  Bell,
  Settings,
  Download,
  Upload,
  Share2,
  Building,
  Award,
  Lightbulb,
  FileText,
  ShoppingCart,
  CreditCard,
  Smartphone,
  Gamepad2,
  Film,
  ChevronRight,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

// Backend API Configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Portfolio interfaces
interface PortfolioHolding {
  symbol: string;
  companyName?: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
  industry?: string;
  sector?: string;
  purchaseDate?: Date;
}

interface PortfolioSummary {
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  totalCost: number;
  holdings: PortfolioHolding[];
  watchlist: string[];
}

interface SavedStock {
  symbol: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  addedDate: Date;
  notes?: string;
  tags?: string[];
}

interface RecentSearch {
  symbol: string;
  companyName: string;
  timestamp: Date;
  searchCount: number;
}

interface PortfolioAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  path?: string;
  onClick?: () => void;
  badge?: string;
  available: boolean;
  category: 'basic' | 'analysis' | 'learning' | 'tools';
}

interface ReusablePortfolioProps {
  user: User | null;
  mode?: 'summary' | 'detailed' | 'watchlist' | 'allocation' | 'recent';
  portfolioData?: PortfolioSummary | null;
  watchlistData?: SavedStock[];
  refreshTrigger?: number;
  onPortfolioUpdate?: () => void;
  className?: string;
  showActions?: boolean;
  maxHoldings?: number;
}

// Backend API helper functions
const backendAPI = {
  getStockQuote: async (symbol: string) => {
    const response = await fetch(`${BACKEND_URL}/api/stocks/quote/${symbol}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch quote for ${symbol}: ${response.status} ${response.statusText}`);
    }
    return response.json();
  },

  checkHealth: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
};

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

// Enhanced Metric Card
const MetricCard: React.FC<{
  label: string;
  value: string;
  icon: React.ComponentType<any>;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  onClick?: () => void;
}> = ({ label, value, icon: Icon, color = "text-blue-400", trend, subtitle, onClick }) => (
  <div 
    className={`bg-gradient-to-br from-gray-800 to-gray-750 p-4 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 group ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-3">
      <Icon className={`w-5 h-5 ${color} group-hover:scale-110 transition-transform`} />
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
  </div>
);

const ReusablePortfolio: React.FC<ReusablePortfolioProps> = ({
  user,
  mode = 'summary',
  portfolioData: externalPortfolioData,
  watchlistData: externalWatchlistData,
  refreshTrigger = 0,
  onPortfolioUpdate,
  className = '',
  showActions = true,
  maxHoldings = 5
}) => {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [watchlist, setWatchlist] = useState<SavedStock[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watchlistFilter, setWatchlistFilter] = useState<'all' | 'gainers' | 'losers'>('all');
  const [sortBy, setSortBy] = useState<'value' | 'percent' | 'alpha'>('value');
  const [showAllActions, setShowAllActions] = useState(false);
  const navigate = useNavigate();

  // Portfolio Actions Configuration
  const portfolioActions: PortfolioAction[] = useMemo(() => [
    // Basic Actions
    {
      id: 'view-full',
      title: 'Full Portfolio',
      description: 'View detailed portfolio with all holdings',
      icon: BarChart3,
      color: 'from-blue-600 to-blue-700',
      path: '/portfolio',
      available: portfolio ? portfolio.holdings.length > 0 : false,
      category: 'basic'
    },
    {
      id: 'rebalance',
      title: 'Rebalance',
      description: 'Optimize your portfolio allocation',
      icon: Target,
      color: 'from-purple-600 to-purple-700',
      path: '/portfolio/rebalance',
      available: portfolio ? portfolio.holdings.length >= 2 : false,
      category: 'analysis'
    },
    {
      id: 'add-stock',
      title: 'Add Stock',
      description: 'Search and add new stocks',
      icon: Plus,
      color: 'from-green-600 to-green-700',
      onClick: () => {
        const searchElement = document.querySelector('input[placeholder*="Search stocks"]') as HTMLInputElement;
        if (searchElement) {
          searchElement.focus();
          searchElement.scrollIntoView({ behavior: 'smooth' });
        }
      },
      available: true,
      category: 'basic'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View performance metrics and insights',
      icon: Activity,
      color: 'from-indigo-600 to-indigo-700',
      path: '/analytics',
      available: portfolio ? portfolio.holdings.length > 0 : false,
      category: 'analysis'
    },
    
    // Analysis Tools
    {
      id: 'performance',
      title: 'Performance',
      description: 'Track returns and compare to benchmarks',
      icon: TrendingUp,
      color: 'from-emerald-600 to-emerald-700',
      path: '/performance',
      available: portfolio ? portfolio.holdings.length > 0 : false,
      category: 'analysis'
    },
    {
      id: 'risk-analysis',
      title: 'Risk Analysis',
      description: 'Analyze portfolio risk and diversification',
      icon: Shield,
      color: 'from-orange-600 to-orange-700',
      path: '/risk',
      available: portfolio ? portfolio.holdings.length >= 3 : false,
      category: 'analysis'
    },
    {
      id: 'alerts',
      title: 'Price Alerts',
      description: 'Set up notifications for price changes',
      icon: Bell,
      color: 'from-yellow-600 to-yellow-700',
      path: '/alerts',
      badge: 'Pro',
      available: true,
      category: 'tools'
    },
    {
      id: 'export',
      title: 'Export Data',
      description: 'Download portfolio data for analysis',
      icon: Download,
      color: 'from-gray-600 to-gray-700',
      onClick: () => {
        // Export functionality
        if (portfolio) {
          const data = JSON.stringify(portfolio, null, 2);
          const blob = new Blob([data], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'portfolio.json';
          a.click();
          URL.revokeObjectURL(url);
        }
      },
      available: portfolio ? portfolio.holdings.length > 0 : false,
      category: 'tools'
    },

    // Learning Resources
    {
      id: 'learn-basics',
      title: 'Stock Basics',
      description: 'Learn fundamental concepts',
      icon: GraduationCap,
      color: 'from-blue-600 to-cyan-600',
      path: '/learning/basics',
      available: true,
      category: 'learning'
    },
    {
      id: 'portfolio-guide',
      title: 'Portfolio Building',
      description: 'Master diversification strategies',
      icon: BookOpen,
      color: 'from-green-600 to-teal-600',
      path: '/learning/portfolio',
      available: true,
      category: 'learning'
    },
    {
      id: 'demo',
      title: 'Try Demo',
      description: 'Practice with virtual portfolio',
      icon: Calculator,
      color: 'from-purple-600 to-pink-600',
      path: '/demo',
      available: !user || (portfolio && portfolio.holdings.length === 0),
      category: 'learning'
    },

    // Advanced Tools
    {
      id: 'sectors',
      title: 'Sector Analysis',
      description: 'Analyze sector allocation and performance',
      icon: Building,
      color: 'from-slate-600 to-slate-700',
      path: '/sectors',
      available: portfolio ? portfolio.holdings.length >= 3 : false,
      category: 'analysis'
    },
    {
      id: 'dividends',
      title: 'Dividend Tracker',
      description: 'Track dividend income and schedule',
      icon: CreditCard,
      color: 'from-green-600 to-emerald-700',
      path: '/dividends',
      badge: 'Pro',
      available: portfolio ? portfolio.holdings.length > 0 : false,
      category: 'analysis'
    },
    {
      id: 'tax-loss',
      title: 'Tax Loss Harvesting',
      description: 'Optimize tax efficiency',
      icon: FileText,
      color: 'from-red-600 to-red-700',
      path: '/tax-loss',
      badge: 'Pro',
      available: portfolio ? portfolio.holdings.some(h => h.gainLoss < 0) : false,
      category: 'tools'
    }
  ], [portfolio, user]);

  // Fetch portfolio data
  const fetchPortfolioData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (externalPortfolioData !== undefined) {
      setPortfolio(externalPortfolioData);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        setLoading(false);
        return;
      }

      const userData = userDoc.data();
      const portfolioData = userData.portfolio || [];
      
      if (portfolioData.length === 0) {
        setPortfolio({
          totalValue: 0,
          totalGainLoss: 0,
          totalGainLossPercent: 0,
          totalCost: 0,
          holdings: [],
          watchlist: []
        });
        setLoading(false);
        return;
      }

      const holdings: PortfolioHolding[] = [];
      const watchlistStocks: string[] = [];
      let totalValue = 0;
      let totalCost = 0;

      for (const item of portfolioData) {
        if (!item || typeof item !== 'object') {
          continue;
        }

        let symbol: string;
        let shares: number;
        let avgPrice: number;
        let companyName: string;

        if (typeof item === 'string') {
          symbol = item;
          shares = 0;
          avgPrice = 0;
          companyName = symbol;
        } else {
          symbol = item.symbol;
          shares = item.shares || 0;
          avgPrice = item.avgPrice || 0;
          companyName = item.companyName || symbol;
        }

        if (!symbol || typeof symbol !== 'string' || symbol.trim() === '') {
          continue;
        }

        symbol = symbol.trim().toUpperCase();
        
        if (shares === 0) {
          watchlistStocks.push(symbol);
          continue;
        }

        if (shares <= 0 || avgPrice <= 0) {
          continue;
        }
        
        try {
          const stockData = await backendAPI.getStockQuote(symbol);
          
          if (!stockData || !stockData.quote || typeof stockData.quote.c !== 'number') {
            continue;
          }
          
          const currentPrice = stockData.quote.c;
          const totalStockValue = currentPrice * shares;
          const totalStockCost = avgPrice * shares;
          const gainLoss = totalStockValue - totalStockCost;
          const gainLossPercent = totalStockCost > 0 ? (gainLoss / totalStockCost) * 100 : 0;

          holdings.push({
            symbol,
            companyName,
            shares,
            avgPrice,
            currentPrice,
            totalValue: totalStockValue,
            gainLoss,
            gainLossPercent,
            industry: item.industry || 'Unknown',
            sector: item.sector || 'Unknown',
            purchaseDate: item.purchaseDate
          });

          totalValue += totalStockValue;
          totalCost += totalStockCost;
        } catch (stockError) {
          console.error(`Error fetching data for ${symbol}:`, stockError);
          continue;
        }
      }

      const totalGainLoss = totalValue - totalCost;
      const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

      setPortfolio({
        totalValue,
        totalGainLoss,
        totalGainLossPercent,
        totalCost,
        holdings,
        watchlist: watchlistStocks
      });

    } catch (error) {
      console.error('Error fetching portfolio:', error);
      setError(`Failed to load portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [user, externalPortfolioData]);

  // Fetch watchlist data
  const fetchWatchlistData = useCallback(async () => {
    if (!user || mode !== 'watchlist') return;

    if (externalWatchlistData !== undefined) {
      setWatchlist(externalWatchlistData);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const watchlistData = userData.watchlist || [];
      
      if (watchlistData.length === 0) {
        setWatchlist([]);
        return;
      }

      const stocks: SavedStock[] = [];
      
      for (const item of watchlistData) {
        if (!item || typeof item !== 'object') {
          continue;
        }

        const symbol = item.symbol;
        if (!symbol || typeof symbol !== 'string' || symbol.trim() === '') {
          continue;
        }

        const cleanSymbol = symbol.trim().toUpperCase();
        
        try {
          const stockData = await backendAPI.getStockQuote(cleanSymbol);
          
          if (stockData && stockData.quote && typeof stockData.quote.c === 'number') {
            stocks.push({
              symbol: cleanSymbol,
              companyName: item.companyName || cleanSymbol,
              price: stockData.quote.c,
              change: stockData.quote.d || 0,
              changePercent: stockData.quote.dp || 0,
              addedDate: item.addedDate?.toDate() || new Date(),
              notes: item.notes,
              tags: item.tags || []
            });
          } else {
            stocks.push({
              symbol: cleanSymbol,
              companyName: item.companyName || cleanSymbol,
              price: 0,
              change: 0,
              changePercent: 0,
              addedDate: item.addedDate?.toDate() || new Date(),
              notes: item.notes,
              tags: item.tags || []
            });
          }
        } catch (error) {
          console.error(`Error fetching watchlist data for ${cleanSymbol}:`, error);
          stocks.push({
            symbol: cleanSymbol,
            companyName: item.companyName || cleanSymbol,
            price: 0,
            change: 0,
            changePercent: 0,
            addedDate: item.addedDate?.toDate() || new Date(),
            notes: item.notes,
            tags: item.tags || []
          });
        }
      }

      setWatchlist(stocks);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      setError(`Failed to load watchlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [user, mode, externalWatchlistData]);

  // Fetch recent searches
  const fetchRecentSearches = useCallback(async () => {
    if (mode !== 'recent') return;

    try {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const recent = userData.recentSearches || [];
          setRecentSearches(recent.slice(0, 10));
        }
      } else {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
          const parsed = JSON.parse(saved);
          setRecentSearches(parsed.slice(0, 10));
        }
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }, [user, mode]);

  // Remove from watchlist
  const removeFromWatchlist = async (symbol: string) => {
    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentWatchlist = userData.watchlist || [];
        
        const updatedWatchlist = currentWatchlist.filter((item: any) => item.symbol !== symbol);
        
        await updateDoc(userDocRef, { watchlist: updatedWatchlist });
        setWatchlist(prev => prev.filter(stock => stock.symbol !== symbol));
        if (onPortfolioUpdate) onPortfolioUpdate();
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      setError(`Failed to remove ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
    fetchWatchlistData();
    fetchRecentSearches();
  }, [fetchPortfolioData, fetchWatchlistData, fetchRecentSearches, refreshTrigger]);

  // Utility functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  // Filter and sort functions
  const getFilteredWatchlist = () => {
    let filtered = [...watchlist];
    
    if (watchlistFilter === 'gainers') {
      filtered = filtered.filter(stock => stock.changePercent > 0);
    } else if (watchlistFilter === 'losers') {
      filtered = filtered.filter(stock => stock.changePercent < 0);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'percent':
          return b.changePercent - a.changePercent;
        case 'alpha':
          return a.symbol.localeCompare(b.symbol);
        default:
          return b.price - a.price;
      }
    });
  };

  // Components
  const AuthRequired: React.FC<{ title: string; description: string; icon: any }> = ({ title, description, icon: Icon }) => (
    <div className="text-center text-gray-400 py-12">
      <Lock className="w-16 h-16 mx-auto mb-4 opacity-50" />
      <p className="text-lg font-medium mb-2">Authentication Required</p>
      <p className="text-sm mb-6">{description}</p>
      <Link
        to="/login"
        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        <LogIn className="w-4 h-4 mr-2" />
        Sign In
      </Link>
    </div>
  );

  const ErrorDisplay: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
    <div className="text-center text-red-400 py-8">
      <AlertCircle className="w-12 h-12 mx-auto mb-3" />
      <p className="text-lg font-medium mb-2">Error</p>
      <p className="text-sm text-gray-300 mb-4">{error}</p>
      <div className="flex justify-center space-x-3">
        <button 
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Retry
        </button>
        <Link 
          to="/help"
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white text-sm transition-colors"
        >
          <Info className="w-4 h-4 inline mr-2" />
          Get Help
        </Link>
      </div>
    </div>
  );

  const NoDataDisplay: React.FC<{ mode: string }> = ({ mode: displayMode }) => {
    const configs = {
      summary: {
        icon: PieChart,
        title: 'No Holdings',
        description: 'Start building your portfolio by searching for stocks',
        action: { to: '/', label: 'Search Stocks' }
      },
      detailed: {
        icon: BarChart3,
        title: 'No Portfolio Data',
        description: 'Add stocks to your portfolio to see detailed analytics',
        action: { to: '/', label: 'Add Stocks' }
      },
      watchlist: {
        icon: Heart,
        title: 'No Saved Stocks',
        description: 'Add stocks to your watchlist to track them here',
        action: { to: '/', label: 'Search Stocks' }
      },
      recent: {
        icon: History,
        title: 'No Recent Searches',
        description: 'Your recent stock searches will appear here',
        action: { to: '/', label: 'Search Stocks' }
      },
      allocation: {
        icon: Target,
        title: 'No Allocation Data',
        description: 'Add stocks to your portfolio to see allocation breakdown',
        action: { to: '/', label: 'Build Portfolio' }
      }
    };

    const config = configs[displayMode as keyof typeof configs] || configs.summary;
    const Icon = config.icon;

    return (
      <div className="text-center text-gray-400 py-12">
        <Icon className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">{config.title}</p>
        <p className="text-sm mb-6">{config.description}</p>
        <Link
          to={config.action.to}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          {config.action.label}
        </Link>
      </div>
    );
  };

  // Render logic
  if (!user) {
    return (
      <div className={`bg-gradient-to-br from-gray-800 to-gray-750 p-8 rounded-xl border border-gray-700 ${className}`}>
        <AuthRequired 
          title="Portfolio Access" 
          description="Please log in to view your portfolio data" 
          icon={PieChart}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700 ${className}`}>
        <LoadingSpinner message={`Loading ${mode}...`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700 ${className}`}>
        <ErrorDisplay error={error} onRetry={fetchPortfolioData} />
      </div>
    );
  }

  // Render based on mode
  switch (mode) {
    case 'summary':
      const availableActions = portfolioActions.filter(action => action.available);
      const basicActions = availableActions.filter(action => action.category === 'basic');
      const analysisActions = availableActions.filter(action => action.category === 'analysis');
      const learningActions = availableActions.filter(action => action.category === 'learning');
      const toolActions = availableActions.filter(action => action.category === 'tools');

      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Performance Overview */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700 flex flex-col min-h-[400px]">
            <h3 className="text-xl font-semibold mb-6 flex items-center text-white">
              <BarChart3 className="w-5 h-5 mr-2 text-green-400" />
              Portfolio Performance
            </h3>
            
            {!portfolio || portfolio.holdings.length === 0 ? (
              <NoDataDisplay mode="summary" />
            ) : (
              <div className="space-y-4 flex-1">
                <div className="bg-gradient-to-r from-green-900/20 to-green-800/20 p-4 rounded-lg border border-green-700/30">
                  <p className="text-sm text-gray-400">Total Value</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(portfolio.totalValue)}</p>
                </div>
                
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Total Gain/Loss</p>
                  <p className={`text-xl font-bold ${portfolio.totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(portfolio.totalGainLoss)}
                  </p>
                  <p className={`text-sm ${portfolio.totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercent(portfolio.totalGainLossPercent)}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-700/50 p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-400">Total Invested</p>
                    <p className="text-sm font-bold text-white">{formatCurrency(portfolio.totalCost)}</p>
                  </div>
                  <div className="bg-gray-700/50 p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-400">Holdings</p>
                    <p className="text-sm font-bold text-white">{portfolio.holdings.length} stocks</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Top Holdings */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700 flex flex-col min-h-[400px]">
            <h3 className="text-xl font-semibold mb-6 flex items-center text-white">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
              Top Holdings
            </h3>
            
            {!portfolio || portfolio.holdings.length === 0 ? (
              <NoDataDisplay mode="detailed" />
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto">
                {portfolio.holdings
                  .sort((a, b) => b.totalValue - a.totalValue)
                  .slice(0, maxHoldings)
                  .map((holding, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{holding.symbol.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-white">{holding.symbol}</p>
                        <p className="text-sm text-gray-400">{holding.shares} shares</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{formatCurrency(holding.totalValue)}</p>
                      <p className={`text-sm flex items-center ${holding.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {holding.gainLoss >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {formatPercent(holding.gainLossPercent)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Portfolio Actions */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                Quick Actions
              </h3>
              <button
                onClick={() => setShowAllActions(!showAllActions)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {showAllActions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto">
              {/* Always show basic actions */}
              {basicActions.map((action) => (
                <ActionButton key={action.id} action={action} navigate={navigate} />
              ))}

              {/* Show additional actions if expanded or if no basic actions available */}
              {(showAllActions || basicActions.length === 0) && (
                <>
                  {analysisActions.length > 0 && (
                    <>
                      <div className="py-2">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Analysis</p>
                      </div>
                      {analysisActions.slice(0, showAllActions ? undefined : 2).map((action) => (
                        <ActionButton key={action.id} action={action} navigate={navigate} />
                      ))}
                    </>
                  )}

                  {learningActions.length > 0 && (portfolio?.holdings.length === 0 || showAllActions) && (
                    <>
                      <div className="py-2">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Learning</p>
                      </div>
                      {learningActions.slice(0, showAllActions ? undefined : 2).map((action) => (
                        <ActionButton key={action.id} action={action} navigate={navigate} />
                      ))}
                    </>
                  )}

                  {showAllActions && toolActions.length > 0 && (
                    <>
                      <div className="py-2">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Tools</p>
                      </div>
                      {toolActions.map((action) => (
                        <ActionButton key={action.id} action={action} navigate={navigate} />
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      );

    case 'watchlist':
      const filteredWatchlist = getFilteredWatchlist();

      return (
        <div className={`bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700 ${className}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <Bookmark className="w-5 h-5 mr-2 text-yellow-400" />
              Saved Stocks ({watchlist.length})
            </h3>

            {watchlist.length > 0 && (
              <div className="flex items-center space-x-3">
                {/* Filter buttons */}
                <div className="flex bg-gray-700 rounded-lg p-1">
                  {(['all', 'gainers', 'losers'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setWatchlistFilter(filter)}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        watchlistFilter === filter
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Sort dropdown */}
                <button
                  onClick={() => {
                    const sortOptions = ['value', 'percent', 'alpha'];
                    const currentIndex = sortOptions.indexOf(sortBy);
                    const nextIndex = (currentIndex + 1) % sortOptions.length;
                    setSortBy(sortOptions[nextIndex] as any);
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                  title="Sort by"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>

                {showActions && (
                  <button
                    onClick={fetchWatchlistData}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {filteredWatchlist.length === 0 ? (
            watchlist.length === 0 ? (
              <NoDataDisplay mode="watchlist" />
            ) : (
              <div className="text-center text-gray-400 py-8">
                <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium mb-2">No stocks match filter</p>
                <p className="text-sm">Try adjusting your filter settings</p>
              </div>
            )
          ) : (
            <div className="space-y-3">
              {filteredWatchlist.map((stock, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{stock.symbol.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">{stock.symbol}</p>
                      <p className="text-sm text-gray-400">{stock.companyName}</p>
                      {stock.tags && stock.tags.length > 0 && (
                        <div className="flex space-x-1 mt-1">
                          {stock.tags.slice(0, 2).map((tag, tagIndex) => (
                            <span key={tagIndex} className="text-xs bg-blue-600/20 text-blue-300 px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold text-white">
                        {stock.price > 0 ? `$${stock.price.toFixed(2)}` : 'N/A'}
                      </p>
                      {stock.price > 0 && (
                        <p className={`text-sm flex items-center ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {stock.changePercent >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                          {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </p>
                      )}
                      {stock.notes && (
                        <p className="text-xs text-gray-500 truncate max-w-24" title={stock.notes}>
                          {stock.notes}
                        </p>
                      )}
                    </div>
                    
                    {showActions && (
                      <div className="flex space-x-2">
                        <Link
                          to={`/stock/${stock.symbol}`}
                          className="p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => removeFromWatchlist(stock.symbol)}
                          className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-300 rounded-lg transition-colors"
                          title="Remove from Watchlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );

    case 'recent':
      return (
        <div className={`bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700 ${className}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <History className="w-5 h-5 mr-2 text-purple-400" />
              Recent Searches ({recentSearches.length})
            </h3>
            {recentSearches.length > 0 && (
              <button
                onClick={() => {
                  setRecentSearches([]);
                  if (user) {
                    updateDoc(doc(db, 'users', user.uid), { recentSearches: [] });
                  } else {
                    localStorage.removeItem('recentSearches');
                  }
                }}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {recentSearches.length === 0 ? (
            <NoDataDisplay mode="recent" />
          ) : (
            <div className="space-y-3">
              {recentSearches.map((search, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{search.symbol.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">{search.symbol}</p>
                      <p className="text-sm text-gray-400">{search.companyName}</p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(search.timestamp).toLocaleDateString()}
                        {search.searchCount > 1 && (
                          <span className="ml-2 bg-purple-600/20 text-purple-300 px-2 py-0.5 rounded-full text-xs">
                            {search.searchCount}x
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link
                      to={`/stock/${search.symbol}`}
                      className="p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg transition-colors"
                      title="View Again"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );

    default:
      return (
        <div className={`bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700 ${className}`}>
          <div className="text-center text-gray-400 py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-3" />
            <p className="text-lg font-medium mb-2">Invalid Mode</p>
            <p className="text-sm">Unsupported portfolio display mode: {mode}</p>
          </div>
        </div>
      );
  }
};

// Action Button Component
const ActionButton: React.FC<{ action: PortfolioAction; navigate: any }> = ({ action, navigate }) => {
  const handleClick = () => {
    if (action.onClick) {
      action.onClick();
    } else if (action.path) {
      navigate(action.path);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full p-4 bg-gradient-to-r ${action.color} hover:shadow-lg text-white rounded-lg transition-all duration-200 hover:scale-105 group`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <action.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <div className="text-left">
            <div className="font-medium flex items-center">
              {action.title}
              {action.badge && (
                <span className="ml-2 px-2 py-0.5 bg-white/20 text-white text-xs rounded-full">
                  {action.badge}
                </span>
              )}
            </div>
            <div className="text-sm text-white/80">{action.description}</div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
};

export default ReusablePortfolio;