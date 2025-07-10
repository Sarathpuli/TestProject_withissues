// StockSearch.tsx - Superior UI with efficient button-based stock selection
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { 
  Search,
  TrendingUp, 
  TrendingDown,
  Star,
  Zap,
  Crown,
  Building,
  Cpu,
  ShoppingCart,
  Heart,
  Gamepad2,
  Smartphone,
  Car,
  Pill,
  DollarSign,
  BarChart3,
  ArrowRight,
  ChevronRight,
  RefreshCw,
  Plus,
  ExternalLink
} from 'lucide-react';

interface StockButtonProps {
  symbol: string;
  name: string;
  sector: string;
  icon: React.ComponentType<any>;
  color: string;
  trending?: 'up' | 'down' | 'neutral';
  popular?: boolean;
  onClick: (symbol: string, name: string) => void;
}

interface TechStock {
  symbol: string;
  name: string;
  sector: string;
  category: string;
  icon: React.ComponentType<any>;
  color: string;
  trending?: 'up' | 'down' | 'neutral';
  popular?: boolean;
}

// Curated list of important tech stocks and others
const CURATED_STOCKS: TechStock[] = [
  // Mega Cap Tech
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', category: 'mega-cap', icon: Smartphone, color: 'from-gray-500 to-gray-600', trending: 'up', popular: true },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', category: 'mega-cap', icon: Cpu, color: 'from-blue-500 to-blue-600', trending: 'up', popular: true },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', category: 'mega-cap', icon: Search, color: 'from-red-500 to-yellow-500', trending: 'up', popular: true },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'E-commerce', category: 'mega-cap', icon: ShoppingCart, color: 'from-orange-500 to-yellow-500', trending: 'neutral', popular: true },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Social Media', category: 'mega-cap', icon: Building, color: 'from-blue-500 to-purple-500', trending: 'up', popular: true },
  
  // AI & Semiconductors
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Semiconductors', category: 'ai-chips', icon: Zap, color: 'from-green-500 to-green-600', trending: 'up', popular: true },
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Semiconductors', category: 'ai-chips', icon: Cpu, color: 'from-red-500 to-red-600', trending: 'up' },
  { symbol: 'INTC', name: 'Intel Corporation', sector: 'Semiconductors', category: 'ai-chips', icon: Cpu, color: 'from-blue-500 to-blue-600', trending: 'down' },
  { symbol: 'TSM', name: 'Taiwan Semiconductor', sector: 'Semiconductors', category: 'ai-chips', icon: Cpu, color: 'from-purple-500 to-purple-600', trending: 'up' },
  
  // Electric Vehicles & Clean Energy
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Electric Vehicles', category: 'clean-energy', icon: Car, color: 'from-red-500 to-red-600', trending: 'neutral', popular: true },
  { symbol: 'RIVN', name: 'Rivian Automotive', sector: 'Electric Vehicles', category: 'clean-energy', icon: Car, color: 'from-green-500 to-blue-500', trending: 'down' },
  { symbol: 'LCID', name: 'Lucid Group Inc.', sector: 'Electric Vehicles', category: 'clean-energy', icon: Car, color: 'from-purple-500 to-blue-500', trending: 'down' },
  
  // Streaming & Entertainment
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Streaming', category: 'entertainment', icon: Gamepad2, color: 'from-red-500 to-red-600', trending: 'up' },
  { symbol: 'DIS', name: 'The Walt Disney Company', sector: 'Entertainment', category: 'entertainment', icon: Star, color: 'from-blue-500 to-purple-500', trending: 'neutral' },
  
  // Fintech & Finance
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.', sector: 'Fintech', category: 'fintech', icon: DollarSign, color: 'from-blue-500 to-blue-600', trending: 'neutral' },
  { symbol: 'SQ', name: 'Block Inc.', sector: 'Fintech', category: 'fintech', icon: DollarSign, color: 'from-green-500 to-blue-500', trending: 'down' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Banking', category: 'finance', icon: Building, color: 'from-blue-500 to-blue-600', trending: 'up' },
  
  // Healthcare & Biotech
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', category: 'healthcare', icon: Heart, color: 'from-red-500 to-red-600', trending: 'neutral' },
  { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Pharmaceuticals', category: 'healthcare', icon: Pill, color: 'from-blue-500 to-blue-600', trending: 'down' },
  { symbol: 'MRNA', name: 'Moderna Inc.', sector: 'Biotechnology', category: 'healthcare', icon: Pill, color: 'from-purple-500 to-pink-500', trending: 'down' },
  
  // Growth Stocks
  { symbol: 'SHOP', name: 'Shopify Inc.', sector: 'E-commerce', category: 'growth', icon: ShoppingCart, color: 'from-green-500 to-green-600', trending: 'up' },
  { symbol: 'ROKU', name: 'Roku Inc.', sector: 'Streaming', category: 'growth', icon: Gamepad2, color: 'from-purple-500 to-purple-600', trending: 'down' },
  { symbol: 'ZOOM', name: 'Zoom Video Communications', sector: 'Communications', category: 'growth', icon: Building, color: 'from-blue-500 to-blue-600', trending: 'down' }
];

// Stock category configurations
const CATEGORIES = {
  'mega-cap': { label: 'Mega Cap Tech', icon: Crown, color: 'text-yellow-400' },
  'ai-chips': { label: 'AI & Semiconductors', icon: Zap, color: 'text-green-400' },
  'clean-energy': { label: 'Electric Vehicles', icon: Car, color: 'text-blue-400' },
  'entertainment': { label: 'Entertainment', icon: Star, color: 'text-purple-400' },
  'fintech': { label: 'Fintech', icon: DollarSign, color: 'text-green-400' },
  'finance': { label: 'Banking', icon: Building, color: 'text-blue-400' },
  'healthcare': { label: 'Healthcare', icon: Heart, color: 'text-red-400' },
  'growth': { label: 'Growth Stocks', icon: TrendingUp, color: 'text-pink-400' }
};

// Stock Button Component
const StockButton: React.FC<StockButtonProps> = ({ 
  symbol, 
  name, 
  sector, 
  icon: Icon, 
  color, 
  trending = 'neutral',
  popular = false,
  onClick 
}) => {
  const getTrendingIcon = () => {
    switch (trending) {
      case 'up': return <TrendingUp className="w-3 h-3 text-green-400" />;
      case 'down': return <TrendingDown className="w-3 h-3 text-red-400" />;
      default: return null;
    }
  };

  return (
    <button
      onClick={() => onClick(symbol, name)}
      className={`group relative p-4 bg-gradient-to-br ${color} rounded-lg border border-gray-600/50 hover:border-gray-500 transition-all duration-300 hover:scale-105 hover:shadow-lg text-left w-full`}
    >
      {/* Popular badge */}
      {popular && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
          <Star className="w-3 h-3 text-white" />
        </div>
      )}
      
      {/* Content */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-white text-sm">{symbol}</h3>
              {getTrendingIcon()}
            </div>
            <p className="text-white/80 text-xs truncate">{name}</p>
            <p className="text-white/60 text-xs">{sector}</p>
          </div>
        </div>
        
        <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
      </div>
    </button>
  );
};

// Search Input Component
const SearchInput: React.FC<{
  onSearch: (query: string) => void;
  loading?: boolean;
}> = ({ onSearch, loading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex space-x-3">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any stock symbol (e.g., AAPL, MSFT)..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <button
        type="submit"
        disabled={!query.trim() || loading}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
      >
        {loading ? (
          <RefreshCw className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Search className="w-5 h-5" />
            <span>Search</span>
          </>
        )}
      </button>
    </form>
  );
};

// Main StockSearch Component
interface StockSearchProps {
  user: User | null;
  onPortfolioUpdate?: () => void;
}

const StockSearch: React.FC<StockSearchProps> = ({ user, onPortfolioUpdate }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Handle stock selection
  const handleStockClick = useCallback((symbol: string, name: string) => {
    // Save to recent searches
    const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const newSearch = {
      symbol,
      name,
      timestamp: new Date().toISOString()
    };
    
    const updatedSearches = [
      newSearch,
      ...recentSearches.filter((search: any) => search.symbol !== symbol)
    ].slice(0, 10);
    
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    
    // Navigate to stock page
    navigate(`/stock/${symbol}`);
  }, [navigate]);

  // Handle manual search
  const handleSearch = useCallback(async (query: string) => {
    setLoading(true);
    try {
      // Simulate search delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // For manual search, just navigate to the stock page
      // The StockPage will handle API calls and validation
      const symbol = query.toUpperCase();
      navigate(`/stock/${symbol}`);
      
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Filter stocks by category
  const getFilteredStocks = () => {
    if (selectedCategory === 'all') {
      return CURATED_STOCKS;
    }
    return CURATED_STOCKS.filter(stock => stock.category === selectedCategory);
  };

  const filteredStocks = getFilteredStocks();
  const popularStocks = CURATED_STOCKS.filter(stock => stock.popular);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Explore Stocks
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Choose from curated tech stocks or search for any company. Click on any stock to view detailed analysis and add to your portfolio.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <SearchInput onSearch={handleSearch} loading={loading} />
        <p className="text-sm text-gray-500 mt-2 text-center">
          💡 Tip: Search only when you want specific stocks. Use buttons below for popular choices.
        </p>
      </div>

      {/* Popular Stocks - Quick Access */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Star className="w-6 h-6 text-yellow-500" />
            <h3 className="text-xl font-bold text-gray-900">Most Popular</h3>
          </div>
          <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
            {popularStocks.length} stocks
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {popularStocks.map(stock => (
            <StockButton
              key={stock.symbol}
              symbol={stock.symbol}
              name={stock.name}
              sector={stock.sector}
              icon={stock.icon}
              color={stock.color}
              trending={stock.trending}
              popular={stock.popular}
              onClick={handleStockClick}
            />
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Stocks ({CURATED_STOCKS.length})
        </button>
        
        {Object.entries(CATEGORIES).map(([key, category]) => {
          const Icon = category.icon;
          const count = CURATED_STOCKS.filter(stock => stock.category === key).length;
          
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-2 ${
                selectedCategory === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{category.label} ({count})</span>
            </button>
          );
        })}
      </div>

      {/* Stock Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredStocks.map(stock => (
          <StockButton
            key={stock.symbol}
            symbol={stock.symbol}
            name={stock.name}
            sector={stock.sector}
            icon={stock.icon}
            color={stock.color}
            trending={stock.trending}
            popular={stock.popular}
            onClick={handleStockClick}
          />
        ))}
      </div>

      {/* Additional Info */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Real-Time Data</h4>
            <p className="text-sm text-gray-600">Get live stock prices and market data</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Portfolio Tracking</h4>
            <p className="text-sm text-gray-600">Add stocks to your portfolio with one click</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">AI Analysis</h4>
            <p className="text-sm text-gray-600">Get AI-powered insights and recommendations</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockSearch;