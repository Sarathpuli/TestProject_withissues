// components/ReusableHeader.tsx - Flexible Header for All Pages
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User } from 'firebase/auth';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { 
  BarChart3,
  Bell,
  Crown,
  UserCircle,
  ChevronDown,
  UserIcon,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  Clock,
  ArrowLeft,
  Home,
  TrendingUp,
  Search
} from 'lucide-react';

interface HeaderProps {
  user: User | null;
  variant?: 'home' | 'stock' | 'portfolio' | 'minimal';
  title?: string;
  showBackButton?: boolean;
  customActions?: React.ReactNode;
  onBack?: () => void;
}

// Backend API Configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const ReusableHeader: React.FC<HeaderProps> = ({ 
  user, 
  variant = 'home', 
  title,
  showBackButton = false,
  customActions,
  onBack 
}) => {
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [marketHours, setMarketHours] = useState('');
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const navigate = useNavigate();
  const location = useLocation();

  // Check server health
  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/health`);
        setServerStatus(response.ok ? 'online' : 'offline');
      } catch {
        setServerStatus('offline');
      }
    };

    checkServerHealth();
    const interval = setInterval(checkServerHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Market hours logic
  useEffect(() => {
    const updateMarketStatus = () => {
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();
      const minute = now.getMinutes();
      
      const isWeekday = day >= 1 && day <= 5;
      const currentTime = hour * 60 + minute;
      const marketOpen = 9 * 60 + 30; // 9:30 AM
      const marketClose = 16 * 60; // 4:00 PM
      
      const isOpen = isWeekday && currentTime >= marketOpen && currentTime < marketClose;
      setIsMarketOpen(isOpen);
      
      if (isOpen) {
        setMarketHours(`Open until 4:00 PM ET`);
      } else if (isWeekday && currentTime < marketOpen) {
        setMarketHours(`Opens at 9:30 AM ET`);
      } else {
        setMarketHours('Closed - Opens Monday 9:30 AM ET');
      }
    };

    updateMarketStatus();
    const interval = setInterval(updateMarketStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Handle back button
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  // Get page-specific navigation items
  const getNavigationItems = () => {
    switch (variant) {
      case 'stock':
        return [
          { to: '/', label: 'Home', icon: Home },
          { to: '/portfolio', label: 'Portfolio', icon: TrendingUp },
          { to: '/search', label: 'Search', icon: Search }
        ];
      case 'portfolio':
        return [
          { to: '/', label: 'Home', icon: Home },
          { to: '/search', label: 'Search', icon: Search }
        ];
      case 'minimal':
        return [
          { to: '/', label: 'Home', icon: Home }
        ];
      default: // home
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <header className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Back Button */}
            {showBackButton && (
              <button
                onClick={handleBack}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white">TechInvestorAI</span>
                {title && variant !== 'home' && (
                  <span className="text-sm text-gray-400">{title}</span>
                )}
              </div>
            </Link>

            {/* Navigation Items */}
            {navigationItems.length > 0 && (
              <nav className="hidden md:flex items-center space-x-1">
                {navigationItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={index}
                      to={item.to}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-600/20 text-blue-300 border border-blue-600/30'
                          : 'text-gray-300 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Center Section - Market Status (only on home and portfolio) */}
          {(variant === 'home' || variant === 'portfolio') && (
            <div className="hidden lg:block">
              <div className="bg-gradient-to-br from-gray-800 to-gray-750 p-3 rounded-xl border border-gray-700">
                <div className="flex items-center space-x-3 mb-1">
                  <div className={`w-2 h-2 rounded-full ${isMarketOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                  <span className="text-sm font-semibold text-white">{isMarketOpen ? 'Market Open' : 'Market Closed'}</span>
                </div>
                <p className="text-xs text-gray-400 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {marketHours}
                </p>
              </div>
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Server Status */}
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs ${
              serverStatus === 'online' ? 'bg-green-900/30 text-green-300' :
              serverStatus === 'offline' ? 'bg-red-900/30 text-red-300' :
              'bg-yellow-900/30 text-yellow-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                serverStatus === 'online' ? 'bg-green-400 animate-pulse' :
                serverStatus === 'offline' ? 'bg-red-400' :
                'bg-yellow-400'
              }`}></div>
              <span className="hidden sm:inline">
                {serverStatus === 'online' ? 'Live Data' : serverStatus === 'offline' ? 'Offline' : 'Checking'}
              </span>
            </div>

            {/* Custom Actions */}
            {customActions}

            {/* User Section */}
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Notifications */}
                <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
                  <Bell className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                </button>

                {/* Pro Upgrade */}
                <Link
                  to="/upgrade-pro"
                  className="hidden sm:flex bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-3 py-2 rounded-lg font-medium transition-all duration-200 items-center hover:scale-105 text-sm"
                >
                  <Crown className="w-4 h-4 mr-1" />
                  <span className="hidden md:inline">Upgrade Pro</span>
                </Link>

                {/* User Dropdown */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-700 transition-colors">
                    <UserCircle className="w-6 h-6 text-gray-400" />
                    <span className="text-white hidden md:block text-sm">
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-lg border border-gray-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <Link
                      to="/account"
                      className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-600 rounded-t-lg transition-colors text-sm"
                    >
                      <UserIcon className="w-4 h-4 mr-2" />
                      Account
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-600 transition-colors text-sm"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-gray-600 rounded-b-lg transition-colors text-sm"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="flex items-center px-3 py-2 text-gray-300 hover:text-white transition-colors text-sm"
                >
                  <LogIn className="w-4 h-4 mr-1" />
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {navigationItems.length > 0 && (
        <div className="md:hidden border-t border-gray-700 px-4 py-2">
          <nav className="flex items-center space-x-1">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={index}
                  to={item.to}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-600/30'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};

export default ReusableHeader;