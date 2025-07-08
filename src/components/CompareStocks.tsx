// Enhanced CompareStocks.tsx - Original UI Design
import React, { useState, useCallback } from 'react';
import { 
  GitCompare, 
  Plus, 
  X, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  DollarSign,
  Activity,
  Globe,
  Calculator,
  Shield,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Target,
  Zap,
  Star,
  Eye,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

interface CompareStock {
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
  industry?: string;
}

interface ComparisonMetric {
  label: string;
  key: keyof CompareStock;
  format: (value: any) => string;
  icon: React.ComponentType<any>;
  color: string;
  tooltip?: string;
}

// Mock stock data for comparison
const generateMockStockData = (symbol: string): CompareStock => {
  const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (min: number, max: number) => min + ((seed * 9301 + 49297) % 233280) / 233280 * (max - min);
  
  const price = 50 + random(0, 200);
  const changePercent = random(-5, 5);
  
  return {
    symbol,
    name: `${symbol} Corporation`,
    price,
    change: (price * changePercent) / 100,
    changePercent,
    marketCap: random(1000, 500000),
    peRatio: random(10, 35),
    beta: random(0.5, 2.0),
    dividendYield: random(0, 5),
    volume: Math.floor(random(1000000, 100000000)),
    sector: ['Technology', 'Healthcare', 'Financial', 'Energy', 'Consumer'][Math.floor(random(0, 5))],
    industry: 'Software'
  };
};

// Comparison metrics configuration
const comparisonMetrics: ComparisonMetric[] = [
  {
    label: 'Price',
    key: 'price',
    format: (value) => `$${value?.toFixed(2) || 'N/A'}`,
    icon: DollarSign,
    color: 'text-green-400',
    tooltip: 'Current stock price'
  },
  {
    label: 'Change %',
    key: 'changePercent',
    format: (value) => value ? `${value >= 0 ? '+' : ''}${value.toFixed(2)}%` : 'N/A',
    icon: Activity,
    color: 'text-blue-400',
    tooltip: 'Daily percentage change'
  },
  {
    label: 'Market Cap',
    key: 'marketCap',
    format: (value) => {
      if (!value) return 'N/A';
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}T`;
      if (value >= 1000) return `$${(value / 1000).toFixed(1)}B`;
      return `$${value.toFixed(0)}M`;
    },
    icon: Globe,
    color: 'text-purple-400',
    tooltip: 'Total market value'
  },
  {
    label: 'P/E Ratio',
    key: 'peRatio',
    format: (value) => value ? value.toFixed(1) : 'N/A',
    icon: Calculator,
    color: 'text-yellow-400',
    tooltip: 'Price-to-Earnings ratio'
  },
  {
    label: 'Beta',
    key: 'beta',
    format: (value) => value ? value.toFixed(2) : 'N/A',
    icon: Shield,
    color: 'text-red-400',
    tooltip: 'Stock volatility vs market'
  },
  {
    label: 'Dividend Yield',
    key: 'dividendYield',
    format: (value) => value ? `${value.toFixed(2)}%` : 'N/A',
    icon: Target,
    color: 'text-cyan-400',
    tooltip: 'Annual dividend yield'
  }
];

// Stock Search Input Component
const StockSearchInput: React.FC<{
  onStockAdd: (symbol: string) => void;
  placeholder: string;
  disabled?: boolean;
}> = ({ onStockAdd, placeholder, disabled }) => {
  const [input, setInput] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;

    setSearching(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      onStockAdd(input.trim().toUpperCase());
      setInput('');
    } catch (error) {
      console.error('Error adding stock:', error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
        />
      </div>
      <button
        type="submit"
        disabled={!input.trim() || searching || disabled}
        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg transition-all duration-200 disabled:cursor-not-allowed hover:scale-105 disabled:hover:scale-100"
      >
        {searching ? (
          <RefreshCw className="w-5 h-5 animate-spin" />
        ) : (
          <Plus className="w-5 h-5" />
        )}
      </button>
    </form>
  );
};

// Stock Card Component
const StockCard: React.FC<{
  stock: CompareStock;
  onRemove: () => void;
  isWinner?: boolean;
  isLoser?: boolean;
}> = ({ stock, onRemove, isWinner, isLoser }) => {
  const cardClass = `
    relative p-6 rounded-xl border transition-all duration-300 hover:shadow-lg
    ${isWinner ? 'bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-600/50' :
      isLoser ? 'bg-gradient-to-br from-red-900/30 to-red-800/20 border-red-600/50' :
      'bg-gradient-to-br from-gray-800 to-gray-750 border-gray-600 hover:border-gray-500'}
  `;

  return (
    <div className={cardClass}>
      {/* Winner/Loser Badge */}
      {(isWinner || isLoser) && (
        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
          isWinner ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
        }`}>
          {isWinner ? '🏆 Best' : '📉 Worst'}
        </div>
      )}

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="absolute top-3 left-3 p-1 hover:bg-gray-700 rounded-full transition-colors opacity-0 group-hover:opacity-100"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>

      {/* Stock Header */}
      <div className="mb-4 pt-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">{stock.symbol.charAt(0)}</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{stock.symbol}</h3>
            <p className="text-sm text-gray-400 truncate">{stock.name}</p>
          </div>
        </div>

        {/* Price and Change */}
        <div className="flex items-baseline space-x-3">
          <span className="text-2xl font-bold text-white">${stock.price.toFixed(2)}</span>
          <div className={`flex items-center space-x-1 ${
            stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {stock.changePercent >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-400">P/E</p>
            <p className="text-sm font-semibold text-white">{stock.peRatio?.toFixed(1) || 'N/A'}</p>
          </div>
          <div className="text-center p-2 bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-400">Beta</p>
            <p className="text-sm font-semibold text-white">{stock.beta?.toFixed(2) || 'N/A'}</p>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Market Cap</p>
          <p className="text-sm font-semibold text-white">
            {stock.marketCap ? `$${(stock.marketCap / 1000).toFixed(0)}B` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Sector Info */}
      {stock.sector && (
        <div className="mt-4 pt-3 border-t border-gray-600">
          <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded-full">
            {stock.sector}
          </span>
        </div>
      )}
    </div>
  );
};

// Comparison Table Component
const ComparisonTable: React.FC<{ stocks: CompareStock[] }> = ({ stocks }) => {
  if (stocks.length < 2) return null;

  const getBestWorst = (metric: ComparisonMetric) => {
    const values = stocks.map((stock, index) => ({
      index,
      value: stock[metric.key] as number
    })).filter(item => item.value != null);

    if (values.length === 0) return { best: -1, worst: -1 };

    const sortedValues = [...values].sort((a, b) => {
      // For change percentage, higher is better
      if (metric.key === 'changePercent') return b.value - a.value;
      // For beta, lower is better
      if (metric.key === 'beta') return a.value - b.value;
      // For most others, higher is better
      return b.value - a.value;
    });

    return {
      best: sortedValues[0]?.index ?? -1,
      worst: sortedValues[sortedValues.length - 1]?.index ?? -1
    };
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-6 rounded-xl border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
        <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
        Detailed Comparison
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Metric</th>
              {stocks.map((stock, index) => (
                <th key={index} className="text-center py-3 px-4 text-white font-medium">
                  {stock.symbol}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonMetrics.map((metric, metricIndex) => {
              const { best, worst } = getBestWorst(metric);
              const Icon = metric.icon;

              return (
                <tr key={metricIndex} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <Icon className={`w-4 h-4 ${metric.color}`} />
                      <span className="text-gray-300 font-medium">{metric.label}</span>
                    </div>
                  </td>
                  {stocks.map((stock, stockIndex) => {
                    const value = stock[metric.key];
                    const isBest = stockIndex === best && stocks.length > 1;
                    const isWorst = stockIndex === worst && stocks.length > 1;

                    return (
                      <td key={stockIndex} className="py-4 px-4 text-center">
                        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded ${
                          isBest ? 'bg-green-900/30 text-green-300' :
                          isWorst ? 'bg-red-900/30 text-red-300' :
                          'text-white'
                        }`}>
                          {isBest && <Star className="w-3 h-3" />}
                          <span className="font-medium">{metric.format(value)}</span>
                          {isWorst && <AlertCircle className="w-3 h-3" />}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Main CompareStocks Component
const CompareStocks: React.FC = () => {
  const [stocks, setStocks] = useState<CompareStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addStock = useCallback(async (symbol: string) => {
    if (stocks.length >= 4) {
      setError('Maximum 4 stocks can be compared at once');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (stocks.some(stock => stock.symbol === symbol)) {
      setError(`${symbol} is already in comparison`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const stockData = generateMockStockData(symbol);
      setStocks(prev => [...prev, stockData]);
    } catch (err) {
      setError(`Failed to fetch data for ${symbol}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  }, [stocks]);

  const removeStock = useCallback((symbol: string) => {
    setStocks(prev => prev.filter(stock => stock.symbol !== symbol));
  }, []);

  const clearAll = () => {
    setStocks([]);
    setError(null);
  };

  // Determine best and worst performers
  const getBestWorstPerformers = () => {
    if (stocks.length < 2) return { best: undefined, worst: undefined };
    
    const sorted = [...stocks].sort((a, b) => b.changePercent - a.changePercent);
    return {
      best: sorted[0]?.symbol,
      worst: sorted[sorted.length - 1]?.symbol
    };
  };

  const { best, worst } = getBestWorstPerformers();

  return (
    <div className="space-y-6">
      {/* Add Stock Input */}
      <div className="space-y-4">
        <StockSearchInput
          onStockAdd={addStock}
          placeholder="Enter stock symbol (e.g., AAPL, TSLA, GOOGL)"
          disabled={loading || stocks.length >= 4}
        />

        {/* Quick Add Suggestions */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Quick add:</span>
          {['AAPL', 'TSLA', 'MSFT', 'GOOGL'].map(symbol => (
            <button
              key={symbol}
              onClick={() => addStock(symbol)}
              disabled={loading || stocks.length >= 4 || stocks.some(s => s.symbol === symbol)}
              className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 disabled:bg-gray-600/20 disabled:cursor-not-allowed text-blue-300 disabled:text-gray-500 rounded text-sm transition-colors"
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-600 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-6">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Adding stock to comparison...</p>
          </div>
        </div>
      )}

      {/* Stock Cards */}
      {stocks.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <GitCompare className="w-5 h-5 mr-2 text-purple-400" />
              Comparing {stocks.length} Stock{stocks.length > 1 ? 's' : ''}
            </h3>
            <button
              onClick={clearAll}
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              Clear All
            </button>
          </div>

          {/* Performance Summary */}
          {stocks.length > 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-900/20 border border-green-600/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-green-300 font-medium">Best Performer</p>
                    <p className="text-white text-lg font-bold">{best}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-red-900/20 border border-red-600/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-red-300 font-medium">Worst Performer</p>
                    <p className="text-white text-lg font-bold">{worst}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stock Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 group">
            {stocks.map((stock, index) => (
              <StockCard
                key={stock.symbol}
                stock={stock}
                onRemove={() => removeStock(stock.symbol)}
                isWinner={stock.symbol === best && stocks.length > 1}
                isLoser={stock.symbol === worst && stocks.length > 1}
              />
            ))}
          </div>

          {/* Comparison Table */}
          <ComparisonTable stocks={stocks} />

          {/* Call to Action */}
          <div className="text-center p-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl border border-purple-600/30">
            <h4 className="text-lg font-semibold text-white mb-2 flex items-center justify-center">
              <Eye className="w-5 h-5 mr-2" />
              Ready to Invest?
            </h4>
            <p className="text-gray-300 text-sm mb-4">
              Analyze these stocks further or add them to your portfolio
            </p>
            <div className="flex items-center justify-center space-x-4">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                View Detailed Analysis
              </button>
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm">
                Add to Portfolio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {stocks.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <GitCompare className="w-10 h-10 text-white" />
          </div>
          
          <h4 className="text-xl font-semibold text-white mb-3">
            Compare Stocks Side by Side
          </h4>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Add stocks to compare their performance, valuation metrics, and key financial data
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <h5 className="font-medium text-white mb-1">Quick Analysis</h5>
              <p className="text-xs text-gray-400">Compare key metrics instantly</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <h5 className="font-medium text-white mb-1">Smart Insights</h5>
              <p className="text-xs text-gray-400">Identify best performers</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <h5 className="font-medium text-white mb-1">Investment Ready</h5>
              <p className="text-xs text-gray-400">Make informed decisions</p>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            Start by entering a stock symbol above (e.g., AAPL, TSLA, MSFT)
          </p>
        </div>
      )}
    </div>
  );
};

export default CompareStocks;