// AskAI.tsx - Updated to use backend APIs
import React, { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  Zap, 
  Send, 
  RefreshCw, 
  MessageCircle, 
  AlertCircle, 
  CheckCircle,
  Lightbulb,
  TrendingUp,
  DollarSign,
  BarChart3,
  Crown,
  Lock
} from 'lucide-react';

// Backend API Configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface AskAIProps {
  user: User | null;
}

interface AIResponse {
  response: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  timestamp: string;
}

interface ConversationItem {
  id: string;
  type: 'user' | 'ai';
  message: string;
  timestamp: Date;
}

// Backend API helper functions
const backendAPI = {
  // Ask AI question
  askAI: async (message: string, context?: string) => {
    const response = await fetch(`${BACKEND_URL}/api/ai/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, context }),
    });
    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }
    return response.json();
  }
};

const AskAI: React.FC<AskAIProps> = ({ user }) => {
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyUsage, setDailyUsage] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Check if user is Pro (simplified check)
  const isPro = user && localStorage.getItem('userPlan') === 'pro';
  const dailyLimit = isPro ? 100 : 5; // Pro users get 100 questions per day, free users get 5

  // Suggested questions for beginners
  const suggestedQuestions = [
    "What is a stock and how does it work?",
    "How do I start investing with $1000?",
    "What's the difference between stocks and bonds?",
    "How do I analyze a company before investing?",
    "What is diversification and why is it important?",
    "Should I invest in index funds or individual stocks?",
    "How do I manage investment risk?",
    "What are dividend stocks and are they good for beginners?"
  ];

  // Load daily usage from localStorage
  useEffect(() => {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('aiUsageDate');
    const savedUsage = localStorage.getItem('aiUsageCount');

    if (savedDate === today && savedUsage) {
      setDailyUsage(parseInt(savedUsage, 10));
    } else {
      // Reset usage for new day
      setDailyUsage(0);
      localStorage.setItem('aiUsageDate', today);
      localStorage.setItem('aiUsageCount', '0');
    }
  }, []);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [question]);

  const updateDailyUsage = () => {
    const newUsage = dailyUsage + 1;
    setDailyUsage(newUsage);
    localStorage.setItem('aiUsageCount', newUsage.toString());
  };

  const handleSubmit = async (questionText?: string) => {
    const queryText = questionText || question.trim();
    
    if (!queryText) return;

    // Check daily limit for free users
    if (!isPro && dailyUsage >= dailyLimit) {
      setError('Daily question limit reached. Upgrade to Pro for unlimited AI assistance!');
      return;
    }

    if (!user) {
      setError('Please sign in to ask AI questions.');
      return;
    }

    setLoading(true);
    setError(null);

    // Add user question to conversation
    const userMessage: ConversationItem = {
      id: Date.now().toString(),
      type: 'user',
      message: queryText,
      timestamp: new Date()
    };
    setConversation(prev => [...prev, userMessage]);

    try {
      // Get AI response from backend
      const context = `User is ${isPro ? 'a Pro subscriber' : 'on the free plan'}. Previous conversation: ${
        conversation.slice(-2).map(c => `${c.type}: ${c.message}`).join('; ')
      }`;
      
      const aiResponse: AIResponse = await backendAPI.askAI(queryText, context);

      // Add AI response to conversation
      const aiMessage: ConversationItem = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        message: aiResponse.response,
        timestamp: new Date()
      };
      setConversation(prev => [...prev, aiMessage]);

      updateDailyUsage();
      setQuestion('');
    } catch (err) {
      console.error('AI Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get AI response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearConversation = () => {
    setConversation([]);
    setError(null);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center text-white">
          <Zap className="w-5 h-5 mr-2 text-purple-400" />
          AI Investment Assistant
          {isPro && <Crown className="w-4 h-4 ml-2 text-yellow-400" />}
        </h2>
        
        <div className="flex items-center space-x-2">
          {/* Usage indicator */}
          <div className="text-xs text-gray-400">
            {dailyUsage}/{dailyLimit} today
          </div>
          
          {conversation.length > 0 && (
            <button
              onClick={clearConversation}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Clear conversation"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title={isExpanded ? "Minimize" : "Expand"}
          >
            <MessageCircle className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Usage warning for free users */}
      {!isPro && dailyUsage >= dailyLimit - 1 && (
        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-300 text-sm">
              {dailyUsage >= dailyLimit 
                ? 'Daily limit reached! Upgrade to Pro for unlimited AI assistance.'
                : 'Almost at your daily limit. Upgrade to Pro for unlimited questions!'}
            </span>
          </div>
        </div>
      )}

      {/* Conversation Area */}
      {isExpanded && conversation.length > 0 && (
        <div className="mb-4 max-h-80 overflow-y-auto bg-gray-700 rounded-lg p-4 space-y-3">
          {conversation.map((item) => (
            <div key={item.id} className={`flex ${item.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg ${
                item.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-600 text-gray-100'
              }`}>
                <div className="text-sm whitespace-pre-wrap">{item.message}</div>
                <div className="text-xs opacity-70 mt-1">
                  {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          <div ref={conversationEndRef} />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-600 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-red-300 text-sm">{error}</span>
        </div>
      )}

      {/* Question Input */}
      <div className="space-y-4">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              !user 
                ? "Please sign in to ask questions..." 
                : !isPro && dailyUsage >= dailyLimit
                ? "Daily limit reached. Upgrade to Pro for unlimited questions!"
                : "Ask me anything about investing, stocks, or financial planning..."
            }
            disabled={!user || loading || (!isPro && dailyUsage >= dailyLimit)}
            className="w-full p-3 pr-12 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none min-h-[80px] disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!user || !question.trim() || loading || (!isPro && dailyUsage >= dailyLimit)}
            className="absolute bottom-3 right-3 p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Suggested Questions */}
        {conversation.length === 0 && !question && (
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
              <Lightbulb className="w-4 h-4 mr-2 text-yellow-400" />
              Popular Questions
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {suggestedQuestions.slice(0, 4).map((suggestedQuestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSubmit(suggestedQuestion)}
                  disabled={!user || loading || (!isPro && dailyUsage >= dailyLimit)}
                  className="text-left p-3 bg-gray-700 hover:bg-gray-600 disabled:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm text-gray-300 transition-colors border border-gray-600 hover:border-gray-500"
                >
                  {suggestedQuestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pro Upgrade Prompt for Free Users */}
        {!isPro && (
          <div className="p-4 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-600/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-yellow-400 mb-1">Unlock Unlimited AI Power</h3>
                <p className="text-sm text-gray-300">
                  Get unlimited AI questions, advanced insights, and priority responses with Pro.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <Crown className="w-8 h-8 text-yellow-400" />
                <button
                  onClick={() => window.open('/upgrade-pro', '_blank')}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sign In Prompt */}
        {!user && (
          <div className="p-4 bg-blue-900/30 border border-blue-600/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-400 mb-1">Sign In to Get Started</h3>
                <p className="text-sm text-gray-300">
                  Create a free account to start asking AI questions about investing.
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => window.location.href = '/login'}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => window.location.href = '/signup'}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Tips */}
      <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
        <h4 className="text-xs font-medium text-gray-400 mb-2">💡 Tips for better AI responses:</h4>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• Be specific about your investment goals and risk tolerance</li>
          <li>• Include your experience level (beginner, intermediate, advanced)</li>
          <li>• Ask about specific stocks, sectors, or investment strategies</li>
          <li>• Request explanations in simple terms if you're new to investing</li>
        </ul>
      </div>
    </div>
  );
};

export default AskAI;