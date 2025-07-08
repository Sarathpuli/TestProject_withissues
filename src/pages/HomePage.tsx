// Enhanced HomePage.tsx - Clean version with extracted StockSearch component
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User } from 'firebase/auth';
import { signOut } from 'firebase/auth';
import { auth, db, doc, getDoc, updateDoc } from '../firebase';
import { 
  TrendingUp, 
  TrendingDown,
  User as UserIcon,
  Settings,
  LogOut,
  UserCircle,
  ChevronDown,
  BarChart3,
  DollarSign,
  RefreshCw,
  Bell,
  Crown,
  Lock,
  PieChart,
  GraduationCap,
  LogIn,
  UserPlus,
  GitCompare,
  BookOpen,
  ChevronUp,
  TrendingDown as Down,
  Sparkles,
  Target,
  Clock,
  Cpu,
  Shield,
  ChevronRight,
  Award,
  Brain,
  History,
  Minus,
  CheckSquare,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  Star,
  Search
} from 'lucide-react';

// Import components
import AskAI from '../components/AskAI';
import NewsSection from '../components/NewsSection';
import StockQuiz from '../components/StockQuiz';
import CompareStocks from '../components/CompareStocks';
import EnhancedStockSearch from '../components/StockSearch';

interface HomePageProps {
  user: User | null;
  onPortfolioUpdate: () => void;
}

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
  holdings: PortfolioHolding[];
  watchlist: string[];
}

interface RecentlySearched {
  symbol: string;
  name: string;
  timestamp: Date;
  currentPrice?: number;
}

interface PortfolioAnalysis {
  diversificationScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  suggestions: string[];
  topPerformer: string;
  worstPerformer: string;
  sectorAllocation: { [key: string]: number };
}

// Backend API helper functions
const backendAPI = {
  getStockQuote: async (symbol: string) => {
    const response = await fetch(`${BACKEND_URL}/api/stocks/quote/${symbol}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch quote for ${symbol}`);
    }
    return response.json();
  },

  checkHealth: async () => {
    const response = await fetch(`${BACKEND_URL}/health`);
    return response.ok;
  }
};

// Utility functions for localStorage
const getRecentlySearched = (): RecentlySearched[] => {
  try {
    const stored = localStorage.getItem('recentlySearched');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const addToRecentlySearched = (stock: RecentlySearched) => {
  try {
    const recent = getRecentlySearched();
    const filtered = recent.filter(item => item.symbol !== stock.symbol);
    const updated = [stock, ...filtered].slice(0, 10); // Keep only last 10
    localStorage.setItem('recentlySearched', JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving to recently searched:', error);
  }
};

// Enhanced Loading Component
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

// Enhanced Metric Card Component
const MetricCard: React.FC<{
  label: string;
  value: string;
  icon: React.ComponentType<any>;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  onClick?: () => void;
  tooltip?: string;
}> = ({ label, value, icon: Icon, color = "text-blue-400", trend, subtitle, onClick, tooltip }) => (
  <div 
    className={`bg-gradient-to-br from-gray-800 to-gray-750 p-4 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 group ${onClick ? 'cursor-pointer hover:shadow-lg' : ''} relative`}
    onClick={onClick}
  >
    {tooltip && (
      <div className="absolute -top-2 -right-2 group-hover:visible invisible">
        <div className="bg-gray-900 text-xs text-gray-300 p-2 rounded-lg shadow-lg max-w-xs">
          {tooltip}
        </div>
      </div>
    )}
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
          {trend === 'neutral' && <Minus className="w-3 h-3" />}
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

// Portfolio Analysis Component
const PortfolioAnalysis: React.FC<{ analysis: PortfolioAnalysis }> = ({ analysis }) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-400 bg-green-900/20 border-green-600/30';
      case 'Medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-600/30';
      case 'High': return 'text-red-400 bg-red-900/20 border-red-600/30';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-600/30';
    }
  };

  const getDiversificationColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className={`p-4 rounded-lg border ${getRiskColor(analysis.riskLevel)}`}>
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-4 h-4" />
            <span className="font-medium">Risk Level</span>
          </div>
          <p className="text-lg font-bold">{analysis.riskLevel}</p>
        </div>
        
        <div className="p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className={`w-4 h-4 ${getDiversificationColor(analysis.diversificationScore)}`} />
            <span className="font-medium text-blue-300">Diversification</span>
          </div>
          <p className={`text-lg font-bold ${getDiversificationColor(analysis.diversificationScore)}`}>
            {analysis.diversificationScore}%
          </p>
        </div>
      </div>

      <div className="bg-purple-900/20 border border-purple-600/30 p-4 rounded-lg">
        <h4 className="font-medium text-purple-300 mb-3 flex items-center">
          <Brain className="w-4 h-4 mr-2" />
          AI Recommendations
        </h4>
        <div className="space-y-2">
          {analysis.suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-start space-x-2 text-sm text-gray-300">
              <CheckSquare className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <span>{suggestion}</span>
            </div>
          ))}
        </div>
      </div>

      {analysis.topPerformer && analysis.worstPerformer && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-900/20 border border-green-600/30 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Star className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-300">Top Performer</span>
            </div>
            <p className="text-white font-semibold">{analysis.topPerformer}</p>
          </div>
          
          <div className="bg-red-900/20 border border-red-600/30 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-red-300">Needs Attention</span>
            </div>
            <p className="text-white font-semibold">{analysis.worstPerformer}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Recently Searched Stocks Component
const RecentlySearchedStocks: React.FC = () => {
  const [recentStocks, setRecentStocks] = useState<RecentlySearched[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setRecentStocks(getRecentlySearched());
  }, []);

  if (recentStocks.length === 0) {
    return (
      <div className="text-center text-gray-400 py-6">
        <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No recent searches</p>
        <p className="text-xs text-gray-500">Search for stocks to see them here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recentStocks.slice(0, 5).map((stock, index) => (
        <div
          key={index}
          onClick={() => navigate(`/stock/${stock.symbol}`)}
          className="flex items-center justify-between p-3 bg-gray-700/30 hover:bg-gray-700/50 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">{stock.symbol.charAt(0)}</span>
            </div>
            <div>
              <p className="font-medium text-white text-sm">{stock.symbol}</p>
              <p className="text-xs text-gray-400 truncate max-w-32">{stock.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {stock.currentPrice && (
              <span className="text-xs text-gray-400">${stock.currentPrice.toFixed(2)}</span>
            )}
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Enhanced Portfolio Summary Component
const PortfolioSummary: React.FC<{ user: User | null; refreshTrigger: number }> = ({ user, refreshTrigger }) => {
  const [portfolio, setPortfolio] = useState<PortfolioSummary>({
    totalValue: 0,
    totalGainLoss: 0,
    totalGainLossPercent: 0,
    holdings: [],
    watchlist: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllHoldings, setShowAllHoldings] = useState(false);
  const [portfolioAnalysis, setPortfolioAnalysis] = useState<PortfolioAnalysis | null>(null);

  // Analyze portfolio function
  const analyzePortfolio = useCallback((holdings: PortfolioHolding[]): PortfolioAnalysis => {
    if (holdings.length === 0) {
      return {
        diversificationScore: 0,
        riskLevel: 'Low',
        suggestions: ['Start building your portfolio by adding some stocks'],
        topPerformer: '',
        worstPerformer: '',
        sectorAllocation: {}
      };
    }

    // Calculate diversification score based on number of stocks and sector spread
    const diversificationScore = Math.min(100, (holdings.length / 10) * 100);
    
    // Determine risk level based on volatility and concentration
    let riskLevel: 'Low' | 'Medium' | 'High' = 'Medium';
    if (holdings.length >= 10 && diversificationScore >= 80) riskLevel = 'Low';
    if (holdings.length < 5 || diversificationScore < 50) riskLevel = 'High';

    // Find best and worst performers
    const sortedByPerformance = [...holdings].sort((a, b) => b.gainLossPercent - a.gainLossPercent);
    const topPerformer = sortedByPerformance[0]?.symbol || '';
    const worstPerformer = sortedByPerformance[sortedByPerformance.length - 1]?.symbol || '';

    // Generate suggestions
    const suggestions: string[] = [];
    if (holdings.length < 5) {
      suggestions.push('Consider adding more stocks for better diversification');
    }
    if (diversificationScore < 70) {
      suggestions.push('Diversify across different sectors and industries');
    }
    const negativePerformers = holdings.filter(h => h.gainLossPercent < -10);
    if (negativePerformers.length > 0) {
      suggestions.push(`Review underperforming stocks: ${negativePerformers.map(h => h.symbol).join(', ')}`);
    }
    if (holdings.some(h => (h.totalValue / portfolio.totalValue) > 0.3)) {
      suggestions.push('Consider reducing concentration in large positions');
    }

    return {
      diversificationScore: Math.round(diversificationScore),
      riskLevel,
      suggestions: suggestions.length > 0 ? suggestions : ['Your portfolio looks well balanced!'],
      topPerformer,
      worstPerformer,
      sectorAllocation: {}
    };
  }, [portfolio.totalValue]);

  const fetchPortfolioData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
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
          holdings: [],
          watchlist: []
        });
        setPortfolioAnalysis(null);
        setLoading(false);
        return;
      }

      const holdings: PortfolioHolding[] = [];
      const watchlistStocks: string[] = [];
      let totalValue = 0;
      let totalCost = 0;

      for (const item of portfolioData) {
        const { symbol, shares, avgPrice } = item;
        
        if (shares === 0) {
          watchlistStocks.push(symbol);
          continue;
        }
        
        try {
          // Get current stock data from backend
          const stockData = await backendAPI.getStockQuote(symbol);
          
          if (stockData && stockData.quote && stockData.quote.c) {
            const currentPrice = stockData.quote.c;
            const totalStockValue = currentPrice * shares;
            const totalStockCost = avgPrice * shares;
            const gainLoss = totalStockValue - totalStockCost;
            const gainLossPercent = totalStockCost > 0 ? (gainLoss / totalStockCost) * 100 : 0;

            holdings.push({
              symbol,
              companyName: item.companyName || symbol,
              shares,
              avgPrice,
              currentPrice,
              totalValue: totalStockValue,
              gainLoss,
              gainLossPercent,
              industry: item.industry,
              sector: item.sector,
              purchaseDate: item.purchaseDate
            });

            totalValue += totalStockValue;
            totalCost += totalStockCost;
          }
        } catch (stockError) {
          console.error(`Error fetching data for ${symbol}:`, stockError);
        }
      }

      const totalGainLoss = totalValue - totalCost;
      const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

      const portfolioSummary = {
        totalValue,
        totalGainLoss,
        totalGainLossPercent,
        holdings,
        watchlist: watchlistStocks
      };

      setPortfolio(portfolioSummary);
      
      // Analyze portfolio
      const analysis = analyzePortfolio(holdings);
      setPortfolioAnalysis(analysis);

    } catch (error) {
      console.error('Error fetching portfolio:', error);
      setError('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  }, [user, analyzePortfolio]);

  useEffect(() => {
    fetchPortfolioData();
  }, [fetchPortfolioData, refreshTrigger]);

  if (!user) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-8 rounded-xl border border-gray-700">
          <h3 className="text-xl font-semibold mb-6 text-white flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-green-400" />
            Portfolio Overview
          </h3>
          <div className="text-center text-gray-400 py-12">
            <Lock className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Authentication Required</p>
            <p className="text-sm mb-6">Please log in to view your portfolio summary</p>
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Link>
          </div>
        </div>
        
        {/* Recently Searched for non-users */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700">
          <h3 className="text-xl font-semibold mb-6 flex items-center text-white">
            <History className="w-5 h-5 mr-2 text-purple-400" />
            Recently Searched
          </h3>
          <RecentlySearchedStocks />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-800 p-6 rounded-xl border border-gray-700 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-4 bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="text-center text-red-400 py-8">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
            <p className="text-lg font-medium mb-2">Error Loading Portfolio</p>
            <p className="text-sm">{error}</p>
            <button 
              onClick={fetchPortfolioData}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

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

  const totalInvested = portfolio.holdings.reduce((sum, holding) => sum + (holding.avgPrice * holding.shares), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Portfolio Performance Overview with Recently Searched */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700">
        <h3 className="text-xl font-semibold mb-6 flex items-center text-white">
          <BarChart3 className="w-5 h-5 mr-2 text-green-400" />
          Portfolio Overview
        </h3>
        
        {!portfolio || portfolio.holdings.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <PieChart className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium mb-2">No Holdings</p>
            <p className="text-sm">Start building your portfolio by searching for stocks above</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-900/20 border border-blue-600/30 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">Total Value</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(portfolio.totalValue)}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700/30 p-3 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Invested</p>
                <p className="text-lg font-semibold text-white">{formatCurrency(totalInvested)}</p>
              </div>
              <div className={`p-3 rounded-lg ${portfolio.totalGainLoss >= 0 ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                <p className="text-xs text-gray-400 mb-1">P&L</p>
                <p className={`text-lg font-semibold ${portfolio.totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(portfolio.totalGainLoss)}
                </p>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg border ${portfolio.totalGainLoss >= 0 ? 'bg-green-900/20 border-green-600/30' : 'bg-red-900/20 border-red-600/30'}`}>
              <div className="flex items-center space-x-2 mb-2">
                {portfolio.totalGainLoss >= 0 ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                <span className={`text-sm font-medium ${portfolio.totalGainLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  Total Return
                </span>
              </div>
              <p className={`text-xl font-bold ${portfolio.totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercent(portfolio.totalGainLossPercent)}
              </p>
            </div>
            
            <MetricCard
              label="Total Holdings"
              value={`${portfolio.holdings.length} stocks`}
              icon={BarChart3}
              color="text-purple-400"
            />
          </div>
        )}

        {/* Recently Searched Section */}
        <div className="mt-8 pt-6 border-t border-gray-600">
          <h4 className="text-lg font-semibold mb-4 flex items-center text-white">
            <History className="w-4 h-4 mr-2 text-purple-400" />
            Recently Searched
          </h4>
          <RecentlySearchedStocks />
        </div>
      </div>

      {/* Enhanced Holdings */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold flex items-center text-white">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
            Holdings
          </h3>
          {portfolio.holdings.length > 3 && (
            <button
              onClick={() => setShowAllHoldings(!showAllHoldings)}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center"
            >
              {showAllHoldings ? 'Show Less' : 'Show All'}
              {showAllHoldings ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </button>
          )}
        </div>
        
        {portfolio.holdings.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No Holdings Yet</p>
            <p className="text-sm">Add stocks to your portfolio to see them here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {portfolio.holdings
              .sort((a, b) => b.totalValue - a.totalValue)
              .slice(0, showAllHoldings ? undefined : 5)
              .map((holding, index) => (
              <div key={index} className="p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-all duration-200 cursor-pointer" onClick={() => window.open(`/stock/${holding.symbol}`, '_blank')}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{holding.symbol.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">{holding.symbol}</p>
                      <p className="text-sm text-gray-400">{holding.shares} shares @ ${holding.avgPrice.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">{formatCurrency(holding.totalValue)}</p>
                    <p className="text-xs text-gray-400">${holding.currentPrice.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <p className="text-gray-400">Invested</p>
                    <p className="text-white font-medium">{formatCurrency(holding.avgPrice * holding.shares)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400">P&L Amount</p>
                    <p className={`font-medium ${holding.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(holding.gainLoss)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400">P&L %</p>
                    <p className={`font-medium flex items-center justify-center ${holding.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {holding.gainLoss >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <Down className="w-3 h-3 mr-1" />}
                      {formatPercent(holding.gainLossPercent)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Portfolio Guidance */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700">
        <h3 className="text-xl font-semibold mb-6 flex items-center text-white">
          <Brain className="w-5 h-5 mr-2 text-purple-400" />
          AI Portfolio Guidance
        </h3>
        
        {portfolio.holdings.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No Portfolio Data</p>
            <p className="text-sm mb-6">Add some stocks to get AI-powered portfolio insights</p>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-blue-300 bg-blue-900/20 p-3 rounded-lg">
                <CheckSquare className="w-4 h-4" />
                <span>Portfolio diversification analysis</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-green-300 bg-green-900/20 p-3 rounded-lg">
                <CheckSquare className="w-4 h-4" />
                <span>Risk assessment & recommendations</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-purple-300 bg-purple-900/20 p-3 rounded-lg">
                <CheckSquare className="w-4 h-4" />
                <span>Performance optimization tips</span>
              </div>
            </div>
          </div>
        ) : portfolioAnalysis ? (
          <PortfolioAnalysis analysis={portfolioAnalysis} />
        ) : (
          <LoadingSpinner message="Analyzing your portfolio..." size="sm" />
        )}
      </div>
    </div>
  );
};

// Main HomePage Component
const HomePage: React.FC<HomePageProps> = ({ user, onPortfolioUpdate }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [marketHours, setMarketHours] = useState('');
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
    const interval = setInterval(checkServerHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Market hours logic
  useEffect(() => {
    const updateMarketStatus = () => {
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();
      const minute = now.getMinutes();
      
      const isWeekday = day >= 1 && day <= 5;
      const currentTime = hour * 60 + minute;
      const marketOpen = 9 * 60 + 30; // 9:30 AM
      const marketClose = 16 * 60; // 4:00 PM
      
      const isOpen = isWeekday && currentTime >= marketOpen && currentTime < marketClose;
      setIsMarketOpen(isOpen);
      
      if (isOpen) {
        setMarketHours(`Open until 4:00 PM ET`);
      } else if (isWeekday && currentTime < marketOpen) {
        setMarketHours(`Opens at 9:30 AM ET`);
      } else {
        setMarketHours('Closed - Opens Monday 9:30 AM ET');
      }
    };

    updateMarketStatus();
    const interval = setInterval(updateMarketStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // Handle portfolio updates
  const handlePortfolioUpdate = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    onPortfolioUpdate();
  }, [onPortfolioUpdate]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white">
      {/* Header */}
      <header className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">TechInvestorAI</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {/* Server Status */}
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs ${
                serverStatus === 'online' ? 'bg-green-900/30 text-green-300' :
                serverStatus === 'offline' ? 'bg-red-900/30 text-red-300' :
                'bg-yellow-900/30 text-yellow-300'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  serverStatus === 'online' ? 'bg-green-400' :
                  serverStatus === 'offline' ? 'bg-red-400' :
                  'bg-yellow-400'
                }`}></div>
                <span>{serverStatus === 'online' ? 'Online' : serverStatus === 'offline' ? 'Offline' : 'Checking'}</span>
              </div>

              {user ? (
                <div className="flex items-center space-x-4">
                  <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                  </button>

                  <Link
                    to="/upgrade-pro"
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center hover:scale-105"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade Pro
                  </Link>

                  <div className="relative group">
                    <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-700 transition-colors">
                      <UserCircle className="w-6 h-6 text-gray-400" />
                      <span className="text-white hidden md:block">{user.displayName || user.email}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-lg border border-gray-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <Link
                        to="/account"
                        className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-600 rounded-t-lg transition-colors"
                      >
                        <UserIcon className="w-4 h-4 mr-2" />
                        Account
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-600 transition-colors"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-gray-600 rounded-b-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="flex items-center px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Welcome{user ? `, ${user.displayName || user.email?.split('@')[0]}` : ''}! 👋
            </h1>
            <p className="text-gray-400 mt-2 text-lg">
              {user 
                ? 'Search stocks, get insights, and track your portfolio.'
                : 'Search stocks, get insights, and track your portfolio.'
              }
            </p>
            {!user && (
              <p className="text-sm text-blue-400 mt-3 flex items-center">
                <Sparkles className="w-4 h-4 mr-1" />
                Login or Sign up to unlock all features including portfolio tracking, AI assistant, and more!
              </p>
            )}
          </div>
          
          {/* Market Status Widget */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-4 rounded-xl border border-gray-700">
            <div className="flex items-center space-x-3 mb-2">
              <div className={`w-3 h-3 rounded-full ${isMarketOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-sm font-semibold">{isMarketOpen ? 'Market Open' : 'Market Closed'}</span>
            </div>
            <p className="text-xs text-gray-400 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {marketHours}
            </p>
          </div>
        </div>

        {/* Search and Ask AI Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-400" />
              Stock Search
              {!user && <span className="ml-2 text-xs text-gray-400 bg-green-900/20 px-2 py-1 rounded-full">(Always Available)</span>}
            </h3>
            <EnhancedStockSearch user={user} onPortfolioUpdate={handlePortfolioUpdate} />
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700">
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <Cpu className="w-5 h-5 mr-2 text-blue-400" />
              AI Assistant
              <span className="ml-2 px-2 py-1 text-xs bg-yellow-600 text-yellow-100 rounded-full flex items-center">
                <Crown className="w-3 h-3 mr-1" />
                Pro
              </span>
            </h3>
            {user ? (
              <AskAI user={user} />
            ) : (
              <div className="text-center text-gray-400 py-12">
                <Lock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Authentication Required</p>
                <p className="text-sm mb-6">Sign up to access our AI investment assistant</p>
                <Link
                  to="/signup"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 hover:scale-105"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Portfolio Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold flex items-center">
              <PieChart className="w-7 h-7 mr-3 text-green-400" />
              Portfolio Overview
            </h2>
            {user && (
              <button
                onClick={() => setRefreshTrigger(prev => prev + 1)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 hover:scale-105"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            )}
          </div>
          
          <PortfolioSummary user={user} refreshTrigger={refreshTrigger} />
        </section>

        {/* Compare Stocks Section */}
        <section className="mb-8">
          <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700">
            <h2 className="text-3xl font-bold mb-6 flex items-center">
              <GitCompare className="w-7 h-7 mr-3 text-purple-400" />
              Compare Stocks
            </h2>
            
            <CompareStocks />
            
            {!user && (
              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                <p className="text-blue-300 text-sm flex items-center">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Login to save comparisons and access advanced analytics.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Learning Resources for Beginners */}
        <section className="mb-8">
          <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 p-8 rounded-xl border border-green-700/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-600/20 rounded-xl backdrop-blur-sm">
                  <GraduationCap className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Learn Investing</h3>
                  <p className="text-gray-300">Master the fundamentals of stock market investing</p>
                </div>
              </div>
              <BookOpen className="w-12 h-12 text-green-400 opacity-30" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-green-900/20 p-6 rounded-xl border border-green-700/30 backdrop-blur-sm">
                <h4 className="font-semibold text-green-300 mb-3 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Stock Basics
                </h4>
                <p className="text-sm text-gray-300 mb-4">Understand P/E ratios, market cap, dividends, and key metrics</p>
                <div className="flex items-center text-xs text-green-400">
                  <Award className="w-3 h-3 mr-1" />
                  <span>Beginner Friendly</span>
                </div>
              </div>
              <div className="bg-green-900/20 p-6 rounded-xl border border-green-700/30 backdrop-blur-sm">
                <h4 className="font-semibold text-green-300 mb-3 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Portfolio Building
                </h4>
                <p className="text-sm text-gray-300 mb-4">Learn diversification, risk management, and asset allocation</p>
                <div className="flex items-center text-xs text-yellow-400">
                  <Star className="w-3 h-3 mr-1" />
                  <span>Intermediate</span>
                </div>
              </div>
              <div className="bg-green-900/20 p-6 rounded-xl border border-green-700/30 backdrop-blur-sm">
                <h4 className="font-semibold text-green-300 mb-3 flex items-center">
                  <Search className="w-5 h-5 mr-2" />
                  Research Methods
                </h4>
                <p className="text-sm text-gray-300 mb-4">Fundamental and technical analysis techniques</p>
                <div className="flex items-center text-xs text-orange-400">
                  <Brain className="w-3 h-3 mr-1" />
                  <span>Advanced</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/learning')}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-4 rounded-xl flex items-center justify-center space-x-3 transition-all duration-200 font-medium hover:scale-105"
            >
              <GraduationCap className="w-6 h-6" />
              <span className="text-lg">Start Learning</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Beginner Progress Tracker */}
        {user && (
          <section className="mb-8">
            <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 p-6 rounded-xl border border-purple-700/30">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center">
                  <Target className="w-6 h-6 mr-3 text-purple-400" />
                  Your Investment Journey
                </h3>
                <div className="text-sm text-purple-300 bg-purple-900/30 px-3 py-1 rounded-full">
                  Beginner
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-600/30">
                  <div className="flex items-center space-x-3 mb-3">
                    <CheckSquare className="w-5 h-5 text-green-400" />
                    <span className="font-medium text-white">Account Setup</span>
                  </div>
                  <p className="text-sm text-gray-300">Portfolio tracking enabled</p>
                </div>

                <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-600/30">
                  <div className="flex items-center space-x-3 mb-3">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <span className="font-medium text-white">First Investment</span>
                  </div>
                  <p className="text-sm text-gray-300">Add your first stock</p>
                </div>

                <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-600/30">
                  <div className="flex items-center space-x-3 mb-3">
                    <HelpCircle className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-white">Diversification</span>
                  </div>
                  <p className="text-sm text-gray-300">Build a balanced portfolio</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Bottom Grid - News and Quiz */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700">
            <NewsSection />
          </div>
          
          <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700">
            <StockQuiz />
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;