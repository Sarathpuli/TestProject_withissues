// Fixed NewsSection.tsx - Real API Integration with Proper Error Handling
import React, { useState, useEffect } from 'react';
import { 
  Newspaper, 
  ExternalLink, 
  RefreshCw, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  Globe,
  Zap,
  Star,
  Eye,
  Calendar,
  ArrowRight,
  BarChart3,
  Flame,
  TrendingDown,
  Activity,
  DollarSign,
  WifiOff,
  Timer // Fixed: Using Timer instead of non-existent 'Limit'
} from 'lucide-react';

interface NewsItem {
  id: string;
  headline: string;
  url: string;
  datetime: number;
  source: string;
  summary?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  imageUrl?: string;
  category?: string;
  readTime?: number;
}

// Backend API Configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Real API calls for news
const newsAPI = {
  // Get financial news from Finnhub
  getFinancialNews: async (): Promise<NewsItem[]> => {
    try {
      console.log('📰 Fetching financial news from Finnhub...');
      
      const response = await fetch(`${BACKEND_URL}/api/news/financial`, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `News API failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.news)) {
        return data.news.map((item: any, index: number) => ({
          id: `news-${item.id || index}`,
          headline: item.headline || item.title,
          url: item.url,
          datetime: item.datetime * 1000, // Convert to milliseconds
          source: item.source || 'Financial News',
          summary: item.summary || item.headline?.substring(0, 120) + '...',
          category: item.category || 'Markets',
          readTime: Math.floor(Math.random() * 4) + 2
        }));
      }
      
      throw new Error('Invalid news data format received');
      
    } catch (error) {
      console.error('❌ News API error:', error);
      throw error;
    }
  },

  // Check backend health
  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
};

// Market Summary Component
const MarketSummary: React.FC = () => {
  const [marketData, setMarketData] = useState({
    djia: { price: 34156.28, change: 245.67, changePercent: 0.72 },
    sp500: { price: 4398.95, change: 18.43, changePercent: 0.42 },
    nasdaq: { price: 14329.12, change: -24.56, changePercent: -0.17 }
  });

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-lg border border-gray-600/50">
      <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
        <BarChart3 className="w-4 h-4 mr-2" />
        Market Overview
      </h4>
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(marketData).map(([key, data]) => (
          <div key={key} className="text-center">
            <div className="text-xs text-gray-400 uppercase mb-1">
              {key === 'djia' ? 'Dow' : key === 'sp500' ? 'S&P 500' : 'Nasdaq'}
            </div>
            <div className="text-sm font-bold text-white">
              {data.price.toLocaleString()}
            </div>
            <div className={`text-xs flex items-center justify-center ${
              data.change >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {data.change >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {data.changePercent > 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Enhanced News Item Component
const NewsItemCard: React.FC<{ news: NewsItem; index: number; featured?: boolean }> = ({ news, index, featured = false }) => {
  const timeAgo = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getCategoryColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'markets': return 'bg-blue-900/30 text-blue-300';
      case 'earnings': return 'bg-green-900/30 text-green-300';
      case 'crypto': return 'bg-orange-900/30 text-orange-300';
      case 'tech': return 'bg-purple-900/30 text-purple-300';
      default: return 'bg-gray-700/30 text-gray-300';
    }
  };

  const handleClick = () => {
    window.open(news.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className={`group cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
        featured 
          ? 'p-6 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-600/50 shadow-lg'
          : 'p-4 bg-gray-700/30 rounded-lg border border-gray-600/30 hover:border-gray-500/50'
      }`}
      onClick={handleClick}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(news.category)}`}>
              {news.category || 'News'}
            </span>
            <span className="text-xs text-gray-500">{news.source}</span>
            {featured && (
              <span className="text-xs bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-2 py-1 rounded-full flex items-center">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {timeAgo(news.datetime)}
          </span>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h4 className={`font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-2 ${
            featured ? 'text-lg' : 'text-sm'
          }`}>
            {news.headline}
          </h4>
          
          {news.summary && (
            <p className={`text-gray-400 line-clamp-3 ${featured ? 'text-sm' : 'text-xs'}`}>
              {news.summary}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            {news.readTime && (
              <span className="flex items-center">
                <Eye className="w-3 h-3 mr-1" />
                {news.readTime}m read
              </span>
            )}
            <span className="flex items-center">
              <Flame className="w-3 h-3 mr-1" />
              Live
            </span>
          </div>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 transition-colors opacity-0 group-hover:opacity-100 hover:scale-105"
          >
            <span>Read</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Loading Component
const NewsLoading: React.FC = () => (
  <div className="space-y-4">
    {[...Array(4)].map((_, index) => (
      <div key={index} className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30 animate-pulse">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <div className="h-3 bg-gray-600 rounded w-20"></div>
              <div className="h-3 bg-gray-600 rounded w-16"></div>
            </div>
            <div className="h-3 bg-gray-600 rounded w-12"></div>
          </div>
          <div className="h-4 bg-gray-600 rounded w-4/5"></div>
          <div className="h-3 bg-gray-600 rounded w-full"></div>
          <div className="h-3 bg-gray-600 rounded w-3/4"></div>
        </div>
      </div>
    ))}
  </div>
);

// Error Component for API Issues
const NewsError: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => {
  const getErrorConfig = () => {
    if (error.includes('rate limit') || error.includes('quota') || error.includes('429')) {
      return {
        icon: Timer, // Fixed: Using Timer instead of non-existent 'Limit'
        title: 'API Rate Limit Exceeded',
        message: 'We\'ve reached the daily limit for news requests. Please try again later or consider upgrading to a premium plan.',
        color: 'orange',
        showRetry: false
      };
    } else if (error.includes('401') || error.includes('unauthorized') || error.includes('API key')) {
      return {
        icon: AlertCircle,
        title: 'API Configuration Error',
        message: 'There\'s an issue with the news API configuration. Please contact support.',
        color: 'red',
        showRetry: false
      };
    } else if (error.includes('timeout') || error.includes('network')) {
      return {
        icon: WifiOff,
        title: 'Connection Issue',
        message: 'Unable to connect to news services. Please check your internet connection and try again.',
        color: 'yellow',
        showRetry: true
      };
    } else {
      return {
        icon: AlertCircle,
        title: 'News Unavailable',
        message: 'Unable to load financial news at the moment. Our team is working to resolve this issue.',
        color: 'red',
        showRetry: true
      };
    }
  };

  const config = getErrorConfig();
  const Icon = config.icon;

  return (
    <div className={`text-center py-8 px-4 bg-${config.color}-900/20 rounded-lg border border-${config.color}-600/30`}>
      <Icon className={`w-12 h-12 text-${config.color}-400 mx-auto mb-4`} />
      <h4 className="text-lg font-semibold text-white mb-2">{config.title}</h4>
      <p className="text-gray-400 text-sm mb-4 max-w-md mx-auto leading-relaxed">
        {config.message}
      </p>
      {config.showRetry && (
        <button
          onClick={onRetry}
          className={`px-4 py-2 bg-${config.color}-600 hover:bg-${config.color}-700 text-white rounded-lg transition-colors flex items-center space-x-2 mx-auto`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};

// Main NewsSection Component
const NewsSection: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);

  // Check backend status
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const isHealthy = await newsAPI.checkHealth();
        setBackendOnline(isHealthy);
      } catch {
        setBackendOnline(false);
      }
    };
    
    checkBackend();
    const interval = setInterval(checkBackend, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Fetch news function
  const fetchNews = async () => {
    try {
      setError(null);
      
      if (!backendOnline) {
        throw new Error('Backend service is currently offline. Please try again later.');
      }

      const newsData = await newsAPI.getFinancialNews();
      
      if (newsData.length === 0) {
        throw new Error('No financial news available at the moment.');
      }
      
      setNews(newsData);
      setLastUpdated(new Date());
      setError(null);
      
      console.log(`✅ Loaded ${newsData.length} news articles`);
      
    } catch (err) {
      console.error('❌ News fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load financial news';
      setError(errorMessage);
      setNews([]); // Clear any old news
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh news
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNews();
  };

  // Initial load
  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h3 className="text-xl font-bold flex items-center text-white">
            <Newspaper className="w-6 h-6 mr-3 text-blue-400" />
            Financial News
          </h3>
          {lastUpdated && (
            <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-1 rounded-full">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          {!backendOnline && (
            <span className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded-full">
              Service Offline
            </span>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || !backendOnline}
          className="p-2 hover:bg-gray-700/50 rounded-lg transition-all duration-200 disabled:opacity-50 hover:scale-105"
          title="Refresh News"
        >
          <RefreshCw className={`w-4 h-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Market Summary */}
      <MarketSummary />

      {/* News Content */}
      {loading ? (
        <NewsLoading />
      ) : error ? (
        <NewsError error={error} onRetry={handleRefresh} />
      ) : news.length === 0 ? (
        <div className="text-center py-12">
          <Newspaper className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-400 mb-2">No News Available</h4>
          <p className="text-gray-500 text-sm mb-4">There are no financial news articles available at the moment.</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Refresh News
          </button>
        </div>
      ) : (
        <>
          {/* Featured News */}
          <NewsItemCard news={news[0]} index={0} featured={true} />

          {/* Recent News Grid */}
          <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-300 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Latest Headlines
              </h4>
              <span className="text-xs text-gray-500 bg-gray-700/30 px-2 py-1 rounded-full">
                {news.length - 1} stories
              </span>
            </div>
            
            <div className="grid gap-3">
              {news.slice(1, 6).map((item, index) => (
                <NewsItemCard key={item.id} news={item} index={index + 1} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Enhanced Disclaimer */}
      <div className="mt-6 p-4 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-lg border border-gray-600/50">
        <div className="flex items-center space-x-2 mb-2">
          <AlertCircle className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-400">Important Notice</span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Financial news is provided for informational purposes only. Market data may be delayed. 
          Always conduct thorough research and consult financial advisors before making investment decisions.
        </p>
      </div>
    </div>
  );
};

export default NewsSection;