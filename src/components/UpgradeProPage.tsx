// UpgradeProPage.tsx - Updated to use backend APIs
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db, doc, getDoc, updateDoc } from '../firebase';
import { 
  Crown, 
  Check, 
  CreditCard, 
  ArrowLeft, 
  Star, 
  Zap, 
  BarChart3, 
  Bell, 
  Shield, 
  Smartphone, 
  TrendingUp, 
  Users, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Calendar,
  Lock
} from 'lucide-react';

// Backend API Configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  save?: string;
  popular?: boolean;
  features: string[];
}

interface UserSubscription {
  plan: string;
  status: string;
  expiresAt?: Date;
  stripeSubscriptionId?: string;
}

// Backend API helper functions
const backendAPI = {
  // Get user subscription status
  getUserSubscription: async (userId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/user/subscription/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }
      return response.json();
    } catch (error) {
      console.warn('Subscription endpoint not implemented yet:', error);
      return null;
    }
  },

  // Create payment session
  createPaymentSession: async (planId: string, userId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/payments/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId, userId }),
      });
      if (!response.ok) {
        throw new Error('Failed to create payment session');
      }
      return response.json();
    } catch (error) {
      console.warn('Payment endpoint not implemented yet:', error);
      throw new Error('Payment processing not available yet. Please check back soon!');
    }
  },

  // Get AI insights for upgrade benefits
  getUpgradeInsights: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: 'Explain the benefits of upgrading to a Pro investment platform in 3 key points.',
          context: 'Pro upgrade benefits for investment platform'
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to get AI insights');
      }
      return response.json();
    } catch (error) {
      console.error('AI insights error:', error);
      return null;
    }
  }
};

export const UpgradeProPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [aiInsights, setAIInsights] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const plans: Record<string, PricingPlan> = {
    monthly: { 
      id: 'monthly',
      name: 'Pro Monthly',
      price: 29.99, 
      period: 'month', 
      features: [
        'Unlimited AI-powered stock analysis',
        'Real-time portfolio tracking',
        'Advanced technical indicators',
        'Premium news and insights',
        'Priority customer support',
        'Export capabilities',
        'Custom alerts and notifications',
        'Advanced risk analysis tools'
      ]
    },
    annual: { 
      id: 'annual',
      name: 'Pro Annual',
      price: 299.99, 
      period: 'year', 
      save: 'Save 17%',
      popular: true,
      features: [
        'All monthly features included',
        'Save $60 per year',
        'Advanced portfolio analytics',
        'Custom dashboard layouts',
        'API access for developers',
        'Historical data (10+ years)',
        'Advanced screening tools',
        'Unlimited watchlists'
      ]
    }
  };

  const freeFeatures = [
    'Basic stock search',
    'Limited AI analysis (5 per day)',
    'Basic portfolio tracking',
    'Standard news feed',
    'Community support'
  ];

  const proFeatures = [
    'Unlimited AI-powered analysis',
    'Real-time data and alerts',
    'Advanced technical indicators',
    'Premium research reports',
    'Priority support (24/7)',
    'Export and API access',
    'Custom screening tools',
    'Risk analysis suite',
    'Portfolio optimization',
    'Advanced charting tools',
    'Institutional-grade data',
    'Mobile app premium features'
  ];

  // Load user subscription and AI insights
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        // Check current subscription
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.plan === 'pro' || userData.isPro) {
              setSubscription({
                plan: 'pro',
                status: 'active',
                expiresAt: userData.proExpiresAt?.toDate()
              });
            }
          }
        } catch (error) {
          console.error('Error checking subscription:', error);
        }

        // Load AI insights
        try {
          const insights = await backendAPI.getUpgradeInsights();
          if (insights?.response) {
            setAIInsights(insights.response);
          }
        } catch (error) {
          console.error('Error loading AI insights:', error);
        }
      }
    };

    loadData();
  }, [user]);

  const handleSubscribe = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'Please sign in to upgrade your account.' });
      return;
    }

    if (subscription?.status === 'active') {
      setMessage({ type: 'info', text: 'You already have an active Pro subscription!' });
      return;
    }

    setLoading(true);
    try {
      // Try to create payment session via backend
      const session = await backendAPI.createPaymentSession(selectedPlan, user.uid);
      
      // If successful, redirect to payment processor
      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      
      // Fallback: Show coming soon message or manual upgrade
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Payment processing is not available yet. Please contact support for manual upgrade.' 
      });
      
      // For demo purposes, allow manual "upgrade"
      setTimeout(() => {
        setMessage({ 
          type: 'info', 
          text: 'For demo purposes, you can manually activate Pro features. Contact support for actual payment processing.' 
        });
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  // Demo function to manually activate Pro (remove in production)
  const handleDemoUpgrade = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      await updateDoc(doc(db, 'users', user.uid), {
        plan: 'pro',
        isPro: true,
        proExpiresAt: expiryDate,
        upgradeDate: new Date()
      });

      setSubscription({
        plan: 'pro',
        status: 'active',
        expiresAt: expiryDate
      });

      setMessage({ type: 'success', text: 'Demo Pro upgrade successful! All Pro features are now unlocked.' });
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Demo upgrade error:', error);
      setMessage({ type: 'error', text: 'Demo upgrade failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Crown className="w-8 h-8 text-yellow-400 mr-3" />
              Upgrade to Pro
            </h1>
            <p className="text-gray-400">Unlock premium features and advanced analytics</p>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center space-x-3 ${
            message.type === 'success' ? 'bg-green-900/30 border-green-700 text-green-300' :
            message.type === 'error' ? 'bg-red-900/30 border-red-700 text-red-300' :
            'bg-blue-900/30 border-blue-700 text-blue-300'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
             message.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
             <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Current Subscription Status */}
        {subscription?.status === 'active' && (
          <div className="mb-8 p-6 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">🎉 You're a Pro Member!</h2>
                <p className="text-yellow-100">
                  Your Pro subscription is active
                  {subscription.expiresAt && ` until ${subscription.expiresAt.toLocaleDateString()}`}
                </p>
              </div>
              <Crown className="w-12 h-12 text-yellow-200" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pricing Plans */}
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-6">Choose Your Plan</h2>
              
              <div className="space-y-4">
                {Object.entries(plans).map(([key, plan]) => (
                  <div
                    key={key}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedPlan === key
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    } ${plan.popular ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}`}
                    onClick={() => setSelectedPlan(key)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold">{plan.name}</h3>
                          {plan.popular && (
                            <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-medium">
                              Most Popular
                            </span>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-yellow-400 mt-1">
                          ${plan.price}
                          <span className="text-sm text-gray-400">/{plan.period}</span>
                        </div>
                        {plan.save && (
                          <div className="text-green-400 text-sm font-medium">{plan.save}</div>
                        )}
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedPlan === key ? 'bg-yellow-500 border-yellow-500' : 'border-gray-400'
                      }`} />
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Features:</h4>
                      <ul className="text-sm text-gray-400 space-y-1">
                        {plan.features.slice(0, 4).map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <Check className="w-3 h-3 text-green-400 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                        {plan.features.length > 4 && (
                          <li className="text-yellow-400 text-xs">
                            +{plan.features.length - 4} more features
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subscribe Button */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleSubscribe}
                  disabled={loading || subscription?.status === 'active'}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : subscription?.status === 'active' ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Already Subscribed</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Subscribe Now</span>
                    </>
                  )}
                </button>

                {/* Demo Upgrade Button (remove in production) */}
                {!subscription?.status && process.env.NODE_ENV === 'development' && (
                  <button
                    onClick={handleDemoUpgrade}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Demo Upgrade (Dev Only)</span>
                  </button>
                )}
              </div>

              {/* Security & Guarantee */}
              <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-1" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center">
                    <RefreshCw className="w-4 h-4 mr-1" />
                    <span>Cancel Anytime</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span>30-Day Guarantee</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Comparison */}
          <div className="space-y-6">
            {/* AI Insights */}
            {aiInsights && (
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-purple-400" />
                  AI Insights: Why Upgrade?
                </h3>
                <div className="text-gray-300 text-sm leading-relaxed">
                  {aiInsights}
                </div>
              </div>
            )}

            {/* Feature Comparison */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-6">Free vs Pro Features</h3>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Free Features */}
                <div>
                  <h4 className="font-medium text-gray-300 mb-3 flex items-center">
                    <Lock className="w-4 h-4 mr-2 text-gray-400" />
                    Free Plan
                  </h4>
                  <ul className="space-y-2">
                    {freeFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <Check className="w-3 h-3 text-gray-400 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-gray-400">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pro Features */}
                <div>
                  <h4 className="font-medium text-yellow-400 mb-3 flex items-center">
                    <Crown className="w-4 h-4 mr-2 text-yellow-400" />
                    Pro Plan
                  </h4>
                  <ul className="space-y-2">
                    {proFeatures.slice(0, 8).map((feature, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <Check className="w-3 h-3 text-green-400 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-white">{feature}</span>
                      </li>
                    ))}
                    <li className="text-yellow-400 text-xs mt-2">
                      +{proFeatures.length - 8} more premium features
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Premium Features</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                  <BarChart3 className="w-8 h-8 text-blue-400" />
                  <div>
                    <div className="font-medium text-white">Advanced Analytics</div>
                    <div className="text-xs text-gray-400">Deep market insights</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                  <Bell className="w-8 h-8 text-green-400" />
                  <div>
                    <div className="font-medium text-white">Real-time Alerts</div>
                    <div className="text-xs text-gray-400">Never miss opportunities</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                  <Zap className="w-8 h-8 text-purple-400" />
                  <div>
                    <div className="font-medium text-white">AI-Powered Analysis</div>
                    <div className="text-xs text-gray-400">Unlimited AI insights</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                  <Smartphone className="w-8 h-8 text-orange-400" />
                  <div>
                    <div className="font-medium text-white">Mobile Premium</div>
                    <div className="text-xs text-gray-400">Full mobile experience</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial/ROI */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-white">
                Investment in Your Success
              </h3>
              <p className="text-green-100 text-sm mb-4">
                "Pro features helped me identify winning investments and avoid costly mistakes. 
                The AI insights alone saved me thousands in my first month."
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>Average 15% better returns</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  <span>10,000+ Pro users</span>
                </div>
              </div>
            </div>

            {/* Money Back Guarantee */}
            <div className="bg-gray-800 p-4 rounded-lg border border-green-600/30">
              <div className="flex items-center justify-center space-x-3 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">30-Day Money-Back Guarantee</span>
              </div>
              <p className="text-center text-sm text-gray-400 mt-2">
                If you're not satisfied, we'll refund your money.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};