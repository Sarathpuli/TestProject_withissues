// CompareStocks.tsx - Clean screener.in inspired design
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search,
  Plus, 
  X, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  ExternalLink,
  Heart,
  RefreshCw,
  AlertCircle,
  CheckCircle
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
  pbRatio?: number;
  eps?: number;
  revenue?: number;
}

// Mock stock data generator
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
    industry: 'Software',
    pbRatio: random(1, 5),
    eps: random(1, 15),
    revenue: random(1000, 50000)
  };
};

// Utility functions
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

const formatVolume = (value?: number): string => {
  if (!value) return 'N/A';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
};

// Add to portfolio function
const addToPortfolio = async (stocks: CompareStock[]) => {
  try {
    // Get existing saved stocks
    const existingSavedStocks = localStorage.getItem('savedStocks');
    const savedStocks = existingSavedStocks ? JSON.parse(existingSavedStocks) : [];
    
    // Filter out duplicates
    const newStocks = stocks.filter(stock => 
      !savedStocks.some((saved: any) => saved.symbol === stock.symbol)
    );
    
    if (newStocks.length === 0) {
      throw new Error('All stocks are already in your saved list');
    }
    
    // Add new stocks with additional metadata
    const stocksToAdd = newStocks.map(stock => ({
      symbol: stock.symbol,
      companyName: stock.name,
      price: stock.price,
      change: stock.change,
      changePercent: stock.changePercent,
      addedDate: new Date().toISOString(),
      tags: ['compared'],
      notes: `Added from comparison on ${new Date().toLocaleDateString()}`
    }));
    
    // Save to localStorage
    const updatedStocks = [...savedStocks, ...stocksToAdd];
    localStorage.setItem('savedStocks', JSON.stringify(updatedStocks));
    
    return { success: true, added: newStocks.length };
  } catch (error) {
    console.error('Error saving to portfolio:', error);
    throw error;
  }
};

// Search Input Component
const StockSearchInput: React.FC<{
  onStockAdd: (symbol: string) => void;
  disabled?: boolean;
}> = ({ onStockAdd, disabled }) => {
  const [input, setInput] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;

    setSearching(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
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
          placeholder="Enter stock symbol (e.g., AAPL, MSFT, TSLA)"
          disabled={disabled}
          className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
      </div>
      <button
        type="submit"
        disabled={!input.trim() || searching || disabled}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded"
      >
        {searching ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
      </button>
    </form>
  );
};

// Main CompareStocks Component
const CompareStocks: React.FC = () => {
  const [stocks, setStocks] = useState<CompareStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const addStock = useCallback(async (symbol: string) => {
    if (stocks.length >= 5) {
      setError('Maximum 5 stocks can be compared at once');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (stocks.some(stock => stock.symbol === symbol)) {
      setError(`${symbol} is already being compared`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
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
    setSuccess(null);
  };

  const handleDetailedAnalysis = () => {
    if (stocks.length < 2) {
      setError('Add at least 2 stocks to compare');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    // Pass stocks data through URL params or localStorage for the comparison page
    localStorage.setItem('comparisonStocks', JSON.stringify(stocks));
    navigate('/stock-comparison');
  };

  const handleAddToPortfolio = async () => {
    if (stocks.length === 0) {
      setError('No stocks to add');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      const result = await addToPortfolio(stocks);
      setSuccess(`Added ${result.added} stocks to your portfolio`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to portfolio');
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Compare Stocks</h2>
          {stocks.length > 0 && (
            <button
              onClick={clearAll}
              className="text-sm text-gray-400 hover:text-white"
            >
              Clear All
            </button>
          )}
        </div>
        
        <StockSearchInput 
          onStockAdd={addStock} 
          disabled={loading || stocks.length >= 5} 
        />
        
        {/* Quick Add */}
        <div className="flex items-center space-x-2 mt-3">
          <span className="text-sm text-gray-400">Quick add:</span>
          {['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN'].map(symbol => (
            <button
              key={symbol}
              onClick={() => addStock(symbol)}
              disabled={loading || stocks.length >= 5 || stocks.some(s => s.symbol === symbol)}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded"
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2 text-green-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      {stocks.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-6 text-sm font-medium text-gray-400">Stock</th>
                <th className="text-right py-3 px-6 text-sm font-medium text-gray-400">Price</th>
                <th className="text-right py-3 px-6 text-sm font-medium text-gray-400">Change</th>
                <th className="text-right py-3 px-6 text-sm font-medium text-gray-400">P/E Ratio</th>
                <th className="text-right py-3 px-6 text-sm font-medium text-gray-400">Market Cap</th>
                <th className="text-right py-3 px-6 text-sm font-medium text-gray-400">Beta</th>
                <th className="text-right py-3 px-6 text-sm font-medium text-gray-400">Dividend</th>
                <th className="text-center py-3 px-6 text-sm font-medium text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock, index) => (
                <tr key={stock.symbol} className="border-b border-gray-700 hover:bg-gray-700/30">
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-white">{stock.symbol}</div>
                      <div className="text-sm text-gray-400">{stock.name}</div>
                      <div className="text-xs text-gray-500">{stock.sector}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right text-white">
                    ${stock.price.toFixed(2)}
                  </td>
                  <td className={`py-4 px-6 text-right ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <div className="flex items-center justify-end space-x-1">
                      {stock.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right text-white">
                    {formatNumber(stock.peRatio, 1)}
                  </td>
                  <td className="py-4 px-6 text-right text-white">
                    {stock.marketCap ? `$${(stock.marketCap / 1000).toFixed(0)}B` : 'N/A'}
                  </td>
                  <td className="py-4 px-6 text-right text-white">
                    {formatNumber(stock.beta)}
                  </td>
                  <td className="py-4 px-6 text-right text-white">
                    {formatPercent(stock.dividendYield)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => removeStock(stock.symbol)}
                      className="text-gray-400 hover:text-red-400"
                      title="Remove stock"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Compare Stocks Side by Side</h3>
          <p className="text-gray-400 mb-4">Add stocks using the search above to compare their key metrics</p>
          <p className="text-sm text-gray-500">You can compare up to 5 stocks at once</p>
        </div>
      )}

      {/* Action Buttons */}
      {stocks.length > 0 && (
        <div className="p-6 border-t border-gray-700">
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleDetailedAnalysis}
              disabled={stocks.length < 2}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded"
            >
              View Detailed Analysis
            </button>
            <button
              onClick={handleAddToPortfolio}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded flex items-center space-x-2"
            >
              <Heart className="w-4 h-4" />
              <span>Add to Portfolio</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            Detailed analysis requires at least 2 stocks
          </p>
        </div>
      )}
    </div>
  );
};

export default CompareStocks;