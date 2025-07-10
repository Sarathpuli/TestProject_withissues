// StockComparisonPage.tsx - Detailed stock comparison with AI analysis
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  TrendingUp, 
  TrendingDown,
  BarChart3,
  RefreshCw,
  Brain,
  Star,
  AlertTriangle,
  CheckCircle,
  Target,
  Shield,
  DollarSign,
  Activity,
  Home,
  ExternalLink,
  Download
} from 'lucide-react';

// Backend API Configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface ComparisonStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  peRatio?: number;
  beta?: number;
  dividendYield?: number;
  volume?: number;
  sector?: string;
  pbRatio?: number;
  eps?: number;
  revenue?: number;
}

interface AIAnalysis {
  summary: string;
  winner: string;
  winnerReason: string;
  risks: string[];
  opportunities: string[];
  recommendations: {
    symbol: string;
    recommendation: 'Buy' | 'Hold' | 'Sell';
    reason: string;
    targetPrice?: number;
  }[];
  comparison: {
    valuation: string;
    growth: string;
    risk: string;
    dividends: string;
  };
}

// Mock AI analysis generator
const generateAIAnalysis = (stocks: ComparisonStock[]): AIAnalysis => {
  const winner = stocks.reduce((prev, curr) => 
    curr.changePercent > prev.changePercent ? curr : prev
  );

  return {
    summary: `Based on our analysis of ${stocks.length} stocks, we've evaluated their financial metrics, market performance, and growth potential. The comparison reveals significant differences in valuation, risk profiles, and dividend yields across the selected companies.`,
    winner: winner.symbol,
    winnerReason: `${winner.symbol} shows the strongest momentum with ${winner.changePercent > 0 ? 'positive' : 'negative'} ${Math.abs(winner.changePercent).toFixed(2)}% change, combined with solid fundamentals and market position.`,
    risks: [
      'Market volatility could impact all positions',
      'Sector-specific regulatory changes',
      'Economic downturn affecting growth stocks',
      'Competition intensifying in key markets'
    ],
    opportunities: [
      'Growing market demand in technology sector',
      'Potential for dividend increases',
      'Expansion into emerging markets',
      'Cost optimization initiatives showing results'
    ],
    recommendations: stocks.map(stock => ({
      symbol: stock.symbol,
      recommendation: stock.changePercent > 2 ? 'Buy' : stock.changePercent < -2 ? 'Hold' : 'Hold' as 'Buy' | 'Hold' | 'Sell',
      reason: stock.changePercent > 2 
        ? 'Strong momentum and solid fundamentals suggest continued growth'
        : stock.changePercent < -2 
        ? 'Temporary weakness provides buying opportunity at attractive valuation'
        : 'Stable performance with balanced risk-reward profile',
      targetPrice: stock.price * (1 + (Math.random() * 0.2 - 0.1))
    })),
    comparison: {
      valuation: stocks.length > 1 
        ? `${stocks[0].symbol} trades at ${stocks[0].peRatio?.toFixed(1) || 'N/A'} P/E vs ${stocks[1].symbol} at ${stocks[1].peRatio?.toFixed(1) || 'N/A'} P/E`
        : 'Valuation metrics show attractive entry points',
      growth: 'Revenue growth expectations remain positive across all positions',
      risk: 'Beta values indicate moderate to high risk profiles with potential for higher returns',
      dividends: 'Dividend yields provide income stability while growth positions offer capital appreciation'
    }
  };
};

// Format utilities
const formatCurrency = (value?: number): string => {
  if (!value) return 'N/A';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
};

const formatPercent = (value?: number): string => {
  return value ? `${value.toFixed(2)}%` : 'N/A';
};

const formatNumber = (value?: number, decimals = 2): string => {
  return value ? value.toFixed(decimals) : 'N/A';
};

// Stock comparison card component
const StockComparisonCard: React.FC<{ 
  stock: ComparisonStock; 
  recommendation?: { recommendation: string; reason: string; targetPrice?: number };
  isWinner?: boolean;
}> = ({ stock, recommendation, isWinner }) => (
  <div className={`bg-gray-800 rounded-lg border p-6 ${isWinner ? 'border-yellow-500 bg-yellow-900/10' : 'border-gray-700'}`}>
    {isWinner && (
      <div className="flex items-center space-x-2 mb-4">
        <Star className="w-5 h-5 text-yellow-400" />
        <span className="text-yellow-400 font-medium">Top Pick</span>
      </div>
    )}
    
    <div className="mb-4">
      <h3 className="text-xl font-bold text-white">{stock.symbol}</h3>
      <p className="text-gray-400">{stock.name}</p>
      <p className="text-sm text-gray-500">{stock.sector}</p>
    </div>

    <div className="space-y-4">
      {/* Price */}
      <div className="flex justify-between items-center">
        <span className="text-gray-400">Current Price</span>
        <span className="text-2xl font-bold text-white">${stock.price.toFixed(2)}</span>
      </div>

      {/* Change */}
      <div className="flex justify-between items-center">
        <span className="text-gray-400">Change</span>
        <div className={`flex items-center space-x-1 ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {stock.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span className="font-medium">
            {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
        <div>
          <p className="text-gray-400 text-sm">P/E Ratio</p>
          <p className="text-white font-medium">{formatNumber(stock.peRatio, 1)}</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Beta</p>
          <p className="text-white font-medium">{formatNumber(stock.beta)}</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Market Cap</p>
          <p className="text-white font-medium">
            {stock.marketCap ? `$${(stock.marketCap / 1000).toFixed(0)}B` : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Dividend</p>
          <p className="text-white font-medium">{formatPercent(stock.dividendYield)}</p>
        </div>
      </div>

      {/* AI Recommendation */}
      {recommendation && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">AI Recommendation</span>
            <span className={`px-2 py-1 rounded text-sm font-medium ${
              recommendation.recommendation === 'Buy' ? 'bg-green-900/30 text-green-400' :
              recommendation.recommendation === 'Sell' ? 'bg-red-900/30 text-red-400' :
              'bg-yellow-900/30 text-yellow-400'
            }`}>
              {recommendation.recommendation}
            </span>
          </div>
          {recommendation.targetPrice && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Target Price</span>
              <span className="text-white font-medium">${recommendation.targetPrice.toFixed(2)}</span>
            </div>
          )}
          <p className="text-sm text-gray-300">{recommendation.reason}</p>
        </div>
      )}
    </div>

    {/* Actions */}
    <div className="mt-6 flex space-x-2">
      <Link
        to={`/stock/${stock.symbol}`}
        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm text-center"
      >
        View Details
      </Link>
      <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm">
        Add to Portfolio
      </button>
    </div>
  </div>
);

// Main component
const StockComparisonPage: React.FC = () => {
  const [stocks, setStocks] = useState<ComparisonStock[]>([]);
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load stocks from localStorage (passed from CompareStocks component)
    const savedStocks = localStorage.getItem('comparisonStocks');
    if (savedStocks) {
      try {
        const parsedStocks = JSON.parse(savedStocks);
        setStocks(parsedStocks);
        
        // Generate AI analysis
        setTimeout(() => {
          const analysis = generateAIAnalysis(parsedStocks);
          setAIAnalysis(analysis);
          setLoading(false);
        }, 2000); // Simulate AI processing time
        
      } catch (err) {
        setError('Failed to load comparison data');
        setLoading(false);
      }
    } else {
      setError('No stocks to compare. Please go back and select stocks.');
      setLoading(false);
    }
  }, []);

  const handleRefreshAnalysis = async () => {
    if (stocks.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    // Simulate AI reanalysis
    setTimeout(() => {
      const analysis = generateAIAnalysis(stocks);
      setAIAnalysis(analysis);
      setLoading(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <Brain className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold text-white mb-2">AI Analysis in Progress</h2>
            <p className="text-gray-400">Analyzing stocks and generating insights...</p>
            <div className="mt-8 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-6 animate-pulse">
                  <div className="w-full h-32 bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Analysis Error</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <Link
              to="/"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Go Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Stock Comparison Analysis</h1>
                <p className="text-gray-400">Comparing {stocks.length} stocks with AI insights</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefreshAnalysis}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Analysis</span>
              </button>
              <Link
                to="/"
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* AI Summary */}
        {aiAnalysis && (
          <div className="mb-8 bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Brain className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">AI Analysis Summary</h2>
            </div>
            <p className="text-gray-300 mb-4">{aiAnalysis.summary}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Winner */}
              <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="w-5 h-5 text-green-400" />
                  <h3 className="font-semibold text-green-400">Top Pick: {aiAnalysis.winner}</h3>
                </div>
                <p className="text-sm text-gray-300">{aiAnalysis.winnerReason}</p>
              </div>

              {/* Key Insights */}
              <div className="space-y-3">
                <h3 className="font-semibold text-white">Key Comparisons</h3>
                <div className="text-sm text-gray-300 space-y-1">
                  <p><strong>Valuation:</strong> {aiAnalysis.comparison.valuation}</p>
                  <p><strong>Growth:</strong> {aiAnalysis.comparison.growth}</p>
                  <p><strong>Risk:</strong> {aiAnalysis.comparison.risk}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stock Comparison Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {stocks.map((stock) => (
            <StockComparisonCard
              key={stock.symbol}
              stock={stock}
              recommendation={aiAnalysis?.recommendations.find(r => r.symbol === stock.symbol)}
              isWinner={aiAnalysis?.winner === stock.symbol}
            />
          ))}
        </div>

        {/* Risks & Opportunities */}
        {aiAnalysis && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risks */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold text-white">Key Risks</h3>
              </div>
              <ul className="space-y-2">
                {aiAnalysis.risks.map((risk, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{risk}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Opportunities */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Target className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Opportunities</h3>
              </div>
              <ul className="space-y-2">
                {aiAnalysis.opportunities.map((opportunity, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{opportunity}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            This analysis is for informational purposes only and should not be considered as financial advice. 
            Always consult with a qualified financial advisor before making investment decisions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StockComparisonPage;