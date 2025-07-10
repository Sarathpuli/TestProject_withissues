// AskAI.tsx - Clean, minimal design inspired by screener.in
import React, { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  Send, 
  RefreshCw, 
  AlertCircle,
  User as UserIcon,
  Crown,
  MessageCircle,
  ChevronUp,
  ChevronDown
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

  // Check if user is Pro
  const isPro = user && localStorage.getItem('userPlan') === 'pro';
  const dailyLimit = isPro ? 100 : 5;

  // Common investment questions
  const commonQuestions = [
    "What is P/E ratio and how do I use it?",
    "How do I analyze a company's financial health?",
    "What's the difference between value and growth investing?",
    "How much should I diversify my portfolio?",
    "When should I buy or sell a stock?"
  ];

  // Load daily usage
  useEffect(() => {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('aiUsageDate');
    const savedUsage = localStorage.getItem('aiUsageCount');

    if (savedDate === today && savedUsage) {
      setDailyUsage(parseInt(savedUsage, 10));
    } else {
      setDailyUsage(0);
      localStorage.setItem('aiUsageDate', today);
      localStorage.setItem('aiUsageCount', '0');
    }
  }, []);

  // Auto-expand when there are conversations
  useEffect(() => {
    if (conversation.length > 0) {
      setIsExpanded(true);
    }
  }, [conversation.length]);

  // Auto-scroll conversation
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const updateDailyUsage = () => {
    const newUsage = dailyUsage + 1;
    setDailyUsage(newUsage);
    localStorage.setItem('aiUsageCount', newUsage.toString());
  };

  const handleSubmit = async (questionText?: string) => {
    const queryText = questionText || question.trim();
    
    if (!queryText) return;

    if (!isPro && dailyUsage >= dailyLimit) {
      setError('Daily limit reached. Upgrade to Pro for unlimited questions.');
      return;
    }

    if (!user) {
      setError('Please sign in to ask questions.');
      return;
    }

    setLoading(true);
    setError(null);

    const userMessage: ConversationItem = {
      id: Date.now().toString(),
      type: 'user',
      message: queryText,
      timestamp: new Date()
    };
    setConversation(prev => [...prev, userMessage]);

    try {
      const context = `User is ${isPro ? 'a Pro subscriber' : 'on the free plan'}. Previous conversation: ${
        conversation.slice(-2).map(c => `${c.type}: ${c.message}`).join('; ')
      }`;
      
      const aiResponse: AIResponse = await backendAPI.askAI(queryText, context);

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
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">
            AI Assistant
            {isPro && <Crown className="w-4 h-4 inline ml-2 text-yellow-400" />}
          </h2>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">
              {dailyUsage}/{dailyLimit} questions today
            </div>
            
            {conversation.length > 0 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-400 hover:text-white"
                title={isExpanded ? "Hide conversation" : "Show conversation"}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Conversation History */}
      {isExpanded && conversation.length > 0 && (
        <div className="p-6 border-b border-gray-700">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {conversation.map((item) => (
              <div key={item.id} className="space-y-2">
                <div className="flex items-center space-x-2">
                  {item.type === 'user' ? (
                    <UserIcon className="w-4 h-4 text-blue-400" />
                  ) : (
                    <MessageCircle className="w-4 h-4 text-green-400" />
                  )}
                  <span className="text-sm font-medium text-gray-300">
                    {item.type === 'user' ? 'You' : 'AI Assistant'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="ml-6 text-sm text-gray-200 whitespace-pre-wrap">
                  {item.message}
                </div>
              </div>
            ))}
            <div ref={conversationEndRef} />
          </div>
          
          {conversation.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <button
                onClick={clearConversation}
                className="text-sm text-gray-400 hover:text-white"
              >
                Clear conversation
              </button>
            </div>
          )}
        </div>
      )}

      {/* Question Input */}
      <div className="p-6">
        {!user ? (
          <div className="text-center py-8">
            <UserIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Sign in to use AI Assistant</h3>
            <p className="text-gray-400 mb-4">Get personalized investment advice and analysis</p>
            <div className="space-x-3">
              <button
                onClick={() => window.location.href = '/login'}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Sign In
              </button>
              <button
                onClick={() => window.location.href = '/signup'}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Sign Up
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Input Area */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  !isPro && dailyUsage >= dailyLimit
                    ? "Daily limit reached. Upgrade to Pro for unlimited questions."
                    : "Ask about stocks, investing strategies, or financial analysis..."
                }
                disabled={loading || (!isPro && dailyUsage >= dailyLimit)}
                className="w-full p-3 pr-12 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none disabled:opacity-50"
                rows={3}
              />
              <button
                onClick={() => handleSubmit()}
                disabled={!question.trim() || loading || (!isPro && dailyUsage >= dailyLimit)}
                className="absolute bottom-3 right-3 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Common Questions */}
            {conversation.length === 0 && !question && (
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-3">Common Questions</h3>
                <div className="space-y-2">
                  {commonQuestions.map((commonQuestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSubmit(commonQuestion)}
                      disabled={loading || (!isPro && dailyUsage >= dailyLimit)}
                      className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded text-sm text-gray-300 border border-gray-600 hover:border-gray-500"
                    >
                      {commonQuestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Usage Warning */}
            {!isPro && dailyUsage >= dailyLimit - 1 && (
              <div className="p-3 bg-yellow-900/20 border border-yellow-600/50 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-yellow-400">
                      {dailyUsage >= dailyLimit ? 'Daily limit reached' : 'Almost at limit'}
                    </div>
                    <div className="text-xs text-gray-400">
                      Upgrade to Pro for unlimited questions
                    </div>
                  </div>
                  <button
                    onClick={() => window.location.href = '/upgrade-pro'}
                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
                  >
                    Upgrade
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pro Features Footer */}
      {user && !isPro && (
        <div className="px-6 py-4 border-t border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-400">
              Want unlimited AI questions and advanced features?
            </div>
            <button
              onClick={() => window.location.href = '/upgrade-pro'}
              className="text-blue-400 hover:text-blue-300"
            >
              Upgrade to Pro →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AskAI;