// Fixed StockQuiz.tsx - Corrected API endpoint to match backend
import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  X, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Trophy,
  Star,
  Brain,
  Target,
  Zap,
  BookOpen,
  Award,
  TrendingUp
} from 'lucide-react';

interface Question {
  id: number;
  text: string;
  options: string[];
  answer: number;
  explanation: string;
}

// Backend API Configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Fixed Backend API helper to match your backend routes
const backendAPI = {
  getQuizQuestion: async () => {
    // Fixed: Use the correct endpoint that matches your backend route
    const response = await fetch(`${BACKEND_URL}/api/quiz/generate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
      // Removed body - your backend route doesn't expect any body data
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Quiz request failed: ${response.status}`);
    }
    
    return response.json();
  },

  checkHealth: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`, {
        headers: { 'Accept': 'application/json' }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
};

// Enhanced Loading Component
const QuizLoading: React.FC = () => (
  <div className="flex items-center justify-center py-8">
    <div className="text-center">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
        <Brain className="w-6 h-6 text-white" />
      </div>
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto mb-3"></div>
      <p className="text-gray-400 text-sm">Generating quiz question...</p>
    </div>
  </div>
);

// Score Badge Component
const ScoreBadge: React.FC<{ score: number; total: number }> = ({ score, total }) => {
  const percentage = total > 0 ? (score / total) * 100 : 0;
  
  const getBadgeConfig = () => {
    if (percentage >= 80) return { color: 'from-green-500 to-green-600', icon: Trophy, label: 'Expert' };
    if (percentage >= 60) return { color: 'from-blue-500 to-blue-600', icon: Star, label: 'Good' };
    if (percentage >= 40) return { color: 'from-yellow-500 to-yellow-600', icon: Target, label: 'Learning' };
    return { color: 'from-gray-500 to-gray-600', icon: BookOpen, label: 'Beginner' };
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r ${config.color} rounded-full text-white text-sm font-medium`}>
      <Icon className="w-4 h-4" />
      <span>{score}/{total}</span>
      <span className="hidden sm:inline">- {config.label}</span>
    </div>
  );
};

// Answer Option Component
const AnswerOption: React.FC<{
  option: string;
  index: number;
  selected: boolean;
  correct: boolean;
  answered: boolean;
  onClick: () => void;
}> = ({ option, index, selected, correct, answered, onClick }) => {
  const getOptionStyle = () => {
    if (!answered) {
      return selected 
        ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500' 
        : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600 hover:border-gray-500';
    }
    
    if (correct) {
      return 'bg-green-600 text-white border-green-500';
    }
    
    if (selected && !correct) {
      return 'bg-red-600 text-white border-red-500';
    }
    
    return 'bg-gray-700 text-gray-400 border-gray-600';
  };

  const getIcon = () => {
    if (!answered) return null;
    if (correct) return <CheckCircle className="w-4 h-4" />;
    if (selected && !correct) return <X className="w-4 h-4" />;
    return null;
  };

  return (
    <button
      onClick={onClick}
      disabled={answered}
      className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left flex items-center justify-between ${getOptionStyle()} ${
        !answered ? 'hover:scale-105 active:scale-95' : ''
      }`}
    >
      <div className="flex items-center space-x-3">
        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
          {String.fromCharCode(65 + index)}
        </span>
        <span className="font-medium">{option}</span>
      </div>
      {getIcon()}
    </button>
  );
};

// Main StockQuiz Component
const StockQuiz: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverOnline, setServerOnline] = useState(true);

  // Check server status
  useEffect(() => {
    const checkServer = async () => {
      try {
        const isOnline = await backendAPI.checkHealth();
        setServerOnline(isOnline);
      } catch {
        setServerOnline(false);
      }
    };

    checkServer();
  }, []);

  // Fetch new question from backend
  const fetchNewQuestion = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!serverOnline) {
        throw new Error('Quiz server is offline. Please try again later.');
      }

      console.log('🧩 Fetching quiz question from backend...');
      const data: Question = await backendAPI.getQuizQuestion();
      console.log('✅ Quiz question received:', data);
      
      // Validate the question structure
      if (!data.text || !Array.isArray(data.options) || data.options.length !== 4) {
        throw new Error('Invalid question format received from server');
      }
      
      // Validate answer index
      if (typeof data.answer !== 'number' || data.answer < 0 || data.answer >= 4) {
        throw new Error('Invalid answer index in question');
      }
      
      setCurrentQuestion(data);
      setSelectedOption(null);
      setAnswered(false);
      setError(null);
      
    } catch (err) {
      console.error('Quiz Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load question';
      setError(errorMessage);
      
      // Use a fallback question if server has issues
      if (errorMessage.includes('server') || errorMessage.includes('offline') || errorMessage.includes('failed')) {
        const fallbackQuestions: Question[] = [
          {
            id: 1,
            text: "What is a stock?",
            options: [
              "A share of ownership in a company",
              "A type of bond",
              "A bank account",
              "A cryptocurrency"
            ],
            answer: 0,
            explanation: "A stock represents a share of ownership in a company. When you buy stock, you become a shareholder and own a piece of that business."
          },
          {
            id: 2,
            text: "What does P/E ratio stand for?",
            options: [
              "Price to Equity",
              "Profit to Expense", 
              "Price to Earnings",
              "Performance to Expectations"
            ],
            answer: 2,
            explanation: "P/E ratio stands for Price-to-Earnings ratio. It compares a company's stock price to its earnings per share, helping investors evaluate if a stock is overvalued or undervalued."
          },
          {
            id: 3,
            text: "What is diversification in investing?",
            options: [
              "Buying only one stock",
              "Spreading investments across different assets",
              "Only investing in bonds",
              "Timing the market perfectly"
            ],
            answer: 1,
            explanation: "Diversification means spreading your investments across different types of assets, sectors, and geographic regions to reduce risk. The idea is that if one investment performs poorly, others may perform better."
          },
          {
            id: 4,
            text: "What is a dividend?",
            options: [
              "A stock trading fee",
              "A payment made by companies to shareholders",
              "A type of bond",
              "A market index"
            ],
            answer: 1,
            explanation: "A dividend is a payment made by companies to their shareholders, typically from profits. It's a way for profitable companies to share their success with investors."
          },
          {
            id: 5,
            text: "What does 'bull market' mean?",
            options: [
              "A market that's falling",
              "A market with high volatility",
              "A market that's rising",
              "A market that's closed"
            ],
            answer: 2,
            explanation: "A bull market refers to a period when stock prices are rising or are expected to rise. The term comes from the way a bull attacks - by thrusting its horns upward."
          }
        ];
        
        const randomQuestion = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
        setCurrentQuestion(randomQuestion);
        setSelectedOption(null);
        setAnswered(false);
        setError(null);
        console.log('📚 Using fallback question:', randomQuestion.text);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (optionIndex: number) => {
    if (answered) return;
    
    setSelectedOption(optionIndex);
    setAnswered(true);
    setQuestionCount(prev => prev + 1);
    
    if (optionIndex === currentQuestion?.answer) {
      setScore(prev => prev + 1);
      console.log('✅ Correct answer!');
    } else {
      console.log('❌ Incorrect answer. Correct was:', currentQuestion?.answer);
    }
  };

  // Get next question
  const handleNextQuestion = () => {
    fetchNewQuestion();
  };

  // Reset quiz
  const resetQuiz = () => {
    setScore(0);
    setQuestionCount(0);
    setCurrentQuestion(null);
    setSelectedOption(null);
    setAnswered(false);
    setError(null);
    console.log('🔄 Quiz reset');
  };

  // Start quiz
  const startQuiz = () => {
    setIsOpen(true);
    if (!currentQuestion && !loading) {
      fetchNewQuestion();
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
      {/* Quiz Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center text-white">
          <Brain className="w-5 h-5 mr-2 text-purple-400" />
          Investment Quiz
        </h3>
        {questionCount > 0 && (
          <ScoreBadge score={score} total={questionCount} />
        )}
      </div>

      {!isOpen ? (
        /* Quiz Start Screen */
        <div className="text-center py-8 space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
            <HelpCircle className="w-10 h-10 text-white" />
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">Test Your Investment Knowledge</h4>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              Challenge yourself with AI-generated questions about stocks, investing, and financial markets
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-xs text-gray-400">Learn & Earn</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-xs text-gray-400">AI Generated</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-xs text-gray-400">Improve Skills</p>
            </div>
          </div>

          <button
            onClick={startQuiz}
            disabled={!serverOnline}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {serverOnline ? 'Start Quiz' : 'Server Offline'}
          </button>

          {!serverOnline && (
            <p className="text-red-400 text-xs">
              Quiz server is currently offline. Fallback questions will be used.
            </p>
          )}
        </div>
      ) : (
        /* Quiz Content */
        <div className="space-y-6">
          {/* Quiz Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                Question {questionCount + (currentQuestion ? 1 : 0)}
              </span>
              {questionCount > 0 && (
                <span className="text-sm text-green-400">
                  Score: {score}/{questionCount} ({Math.round((score/questionCount) * 100)}%)
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={resetQuiz}
                className="text-xs text-gray-400 hover:text-gray-300 transition-colors px-2 py-1 rounded hover:bg-gray-700"
              >
                Reset
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="Close Quiz"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Question Content */}
          {loading ? (
            <QuizLoading />
          ) : error ? (
            <div className="p-6 bg-red-900/20 border border-red-600 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-red-300 font-medium">Quiz Error</span>
              </div>
              <p className="text-red-300 text-sm mb-4">{error}</p>
              <div className="flex space-x-3">
                <button
                  onClick={fetchNewQuestion}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => {
                    setError(null);
                    fetchNewQuestion();
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Use Fallback
                </button>
              </div>
            </div>
          ) : currentQuestion ? (
            <div className="space-y-6">
              {/* Question */}
              <div className="p-6 bg-gray-700/50 rounded-lg border border-gray-600">
                <h4 className="text-lg font-medium text-white mb-1">
                  {currentQuestion.text}
                </h4>
                <p className="text-sm text-gray-400">Choose the best answer:</p>
              </div>

              {/* Answer Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <AnswerOption
                    key={index}
                    option={option}
                    index={index}
                    selected={selectedOption === index}
                    correct={index === currentQuestion.answer}
                    answered={answered}
                    onClick={() => handleAnswerSelect(index)}
                  />
                ))}
              </div>

              {/* Explanation */}
              {answered && (
                <div className="p-6 bg-blue-900/20 border border-blue-600 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h5 className="text-blue-300 font-medium mb-2">Explanation</h5>
                      <p className="text-blue-100 text-sm leading-relaxed">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Question Button */}
              {answered && (
                <div className="text-center">
                  <button
                    onClick={handleNextQuestion}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-2 mx-auto"
                  >
                    <span>Next Question</span>
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No question loaded</p>
              <button
                onClick={fetchNewQuestion}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Load Question
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StockQuiz;