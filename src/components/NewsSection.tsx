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
  Limit
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

// Enhanced News Item Component (keeping your UI design)
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
    const colors: { [key: string]: string } = {
      'Markets': 'bg-blue-500/20 text-blue-300',
      'Technology': 'bg-purple-500/20 text-purple-300',
      'Energy': 'bg-green-500/20 text-green-300',
      'Healthcare': 'bg-red-500/20 text-red-300',
      'Banking': 'bg-yellow-500/20 text-yellow-300',
      'Crypto': 'bg-orange-500/20 text-orange-300',
      'Global': 'bg-indigo-500/20 text-indigo-300',
      'Consumer': 'bg-pink-500/20 text-pink-300'
    };
    return colors[category || 'Markets'] || 'bg-gray-500/20 text-gray-300';
  };

  const handleClick = () => {
    if (news.url && news.url.startsWith('http')) {
      window.open(news.url, '_blank');
    }
  };

  if (featured) {
    return (
      <div 
        onClick={handleClick}
        className="group relative p-6 bg-gradient-to-br from-blue-900/10 via-gray-800 to-purple-900/10 hover:from-blue-900/20 hover:to-purple-900/20 rounded-xl border border-blue-600/20 hover:border-blue-500/40 transition-all duration-500 cursor-pointer overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent transform -skew-y-1"></div>
        </div>
        
        <div className="relative space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-300">Breaking News</span>
              </div>
              {news.category && (
                <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(news.category)}`}>
                  {news.category}
                </span>
              )}
            </div>
          </div>

          {/* Headline */}
          <h3 className="text-xl font-bold text-white line-clamp-2 group-hover:text-blue-300 transition-colors leading-tight">
            {news.headline}
          </h3>

          {/* Summary */}
          {news.summary && (
            <p className="text-gray-300 line-clamp-3 leading-relaxed">
              {news.summary}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span className="flex items-center">
                <Globe className="w-4 h-4 mr-1" />
                {news.source}
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {timeAgo(news.datetime)}
              </span>
              {news.readTime && (
                <span className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {news.readTime} min read
                </span>
              )}
            </div>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg transition-all duration-200 hover:scale-105 text-sm font-medium"
            >
              <span>Read Full Story</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleClick}
      className="group p-4 bg-gradient-to-br from-gray-700/50 to-gray-750/50 hover:from-gray-600/60 hover:to-gray-700/60 rounded-lg border border-gray-600/50 hover:border-gray-500/60 transition-all duration-300 hover:shadow-lg cursor-pointer hover:scale-[1.02] hover:-translate-y-1"
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400 flex items-center">
              <Globe className="w-3 h-3 mr-1" />
              {news.source}
            </span>
            {news.category && (
              <>
                <span className="text-xs text-gray-500">•</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(news.category)}`}>
                  {news.category}
                </span>
              </>
            )}
          </div>
          <span className="text-xs text-gray-500 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {timeAgo(news.datetime)}
          </span>
        </div>

        {/* Headline */}
        <h4 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-blue-300 transition-colors leading-snug">
          {news.headline}
        </h4>

        {/* Summary */}
        {news.summary && (
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
            {news.summary}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            {news.readTime && (
              <span className="flex items-center">
                <Eye className="w-3 h-3 mr-1" />
                {news.readTime}m
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

// Loading Component (keeping your design)
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
        icon: Limit,
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
  
  const colorClasses = {
    orange: 'from-orange-900/20 to-yellow-900/20 border-orange-600/30 text-orange-300',
    red: 'from-red-900/20 to-red-800/20 border-red-600/30 text-red-300',
    yellow: 'from-yellow-900/20 to-yellow-800/20 border-yellow-600/30 text-yellow-300'
  };

  return (
    <div className={`p-6 bg-gradient-to-r ${colorClasses[config.color]} border rounded-xl`}>
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className={`w-16 h-16 rounded-full bg-${config.color}-500/20 flex items-center justify-center`}>
            <Icon className={`w-8 h-8 text-${config.color}-400`} />
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">{config.title}</h3>
          <p className="text-sm leading-relaxed opacity-90">
            {config.message}
          </p>
        </div>

        {config.showRetry && (
          <button
            onClick={onRetry}
            className={`px-6 py-2 bg-${config.color}-600/30 hover:bg-${config.color}-600/50 text-${config.color}-300 rounded-lg transition-all duration-200 hover:scale-105 font-medium`}
          >
            Try Again
          </button>
        )}

        <div className="pt-4 border-t border-current/20">
          <p className="text-xs opacity-60">
            Error Details: {error}
          </p>
        </div>
      </div>
    </div>
  );
};

// Market Summary Component (keeping your design but with real data structure)
const MarketSummary: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate market data loading
    setTimeout(() => setLoading(false), 800);
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-800/30 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-blue-600/20 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="h-3 bg-blue-600/20 rounded w-16 mx-auto"></div>
                <div className="h-4 bg-blue-600/20 rounded w-20 mx-auto"></div>
                <div className="h-3 bg-blue-600/20 rounded w-12 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-r from-blue-900/20 via-indigo-900/20 to-purple-900/20 rounded-xl border border-blue-800/30 mb-6 hover:border-blue-700/50 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-blue-300 flex items-center">
          <BarChart3 className="w-4 h-4 mr-2" />
          Market Overview
        </h4>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">Real-time data requires API upgrade</span>
        </div>
      </div>
      
      <div className="text-center py-8">
        <WifiOff className="w-8 h-8 text-gray-500 mx-auto mb-3" />
        <p className="text-sm text-gray-400">Market data temporarily unavailable</p>
        <p className="text-xs text-gray-500 mt-1">Enable market data API for live updates</p>
      </div>
    </div>
  );
};

// Main Enhanced NewsSection Component
const NewsSection: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [backendOnline, setBackendOnline] = useState(true);

  // Fetch real news from API
  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if backend is online first
      const isOnline = await newsAPI.checkHealth();
      setBackendOnline(isOnline);
      
      if (!isOnline) {
        throw new Error('News service is currently offline. Please try again later.');
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