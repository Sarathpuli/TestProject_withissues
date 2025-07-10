// components/ReusableHeader.tsx - Enhanced Header with Beautiful Market Widget
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
  Search,
  Activity,
  Wifi,
  WifiOff,
  RefreshCw
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

// Real-time Market Status Component
const MarketStatusWidget: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [marketHours, setMarketHours] = useState('');
  const [timeUntilChange, setTimeUntilChange] = useState('');

  useEffect(() => {
    const updateMarketStatus = () => {
      const now = new Date();
      setCurrentTime(now);
      
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
        const minutesUntilClose = marketClose - currentTime;
        const hoursUntil = Math.floor(minutesUntilClose / 60);
        const minsUntil = minutesUntilClose % 60;
        setMarketHours('Market Open');
        setTimeUntilChange(`Closes in ${hoursUntil}h ${minsUntil}m`);
      } else if (isWeekday && currentTime < marketOpen) {
        const minutesUntilOpen = marketOpen - currentTime;
        const hoursUntil = Math.floor(minutesUntilOpen / 60);
        const minsUntil = minutesUntilOpen % 60;
        setMarketHours('Market Closed');
        setTimeUntilChange(`Opens in ${hoursUntil}h ${minsUntil}m`);
      } else {
        setMarketHours('Market Closed');
        const daysUntilMonday = day === 0 ? 1 : (8 - day);
        setTimeUntilChange(`Opens ${daysUntilMonday === 1 ? 'Monday' : `in ${daysUntilMonday} days`}`);
      }
    };

    updateMarketStatus();
    const interval = setInterval(updateMarketStatus, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-gradient-to-r from-gray-800/90 to-gray-700/90 backdrop-blur-sm border border-gray-600/50 rounded-xl p-3 shadow-lg">
      <div className="flex items-center space-x-3">
        {/* Market Status Indicator */}
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isMarketOpen 
              ? 'bg-green-400 shadow-green-400/50 shadow-lg animate-pulse' 
              : 'bg-red-400 shadow-red-400/50 shadow-lg'
          }`}></div>
          <div className="flex flex-col">
            <span className={`text-sm font-semibold ${
              isMarketOpen ? 'text-green-300' : 'text-red-300'
            }`}>
              {marketHours}
            </span>
            <span className="text-xs text-gray-400">
              {timeUntilChange}
            </span>
          </div>
        </div>

        {/* Live Clock */}
        <div className="border-l border-gray-600 pl-3">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-blue-400" />
            <span className="text-sm font-mono text-blue-300">
              {formatTime(currentTime)}
            </span>
          </div>
          <span className="text-xs text-gray-500">ET</span>
        </div>
      </div>
    </div>
  );
};

// Server Status Widget
const ServerStatusWidget: React.FC<{ status: 'online' | 'offline' | 'checking' }> = ({ status }) => {
  return (
    <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs border ${
      status === 'online' 
        ? 'bg-green-900/30 text-green-300 border-green-600/30' :
      status === 'offline' 
        ? 'bg-red-900/30 text-red-300 border-red-600/30' :
        'bg-yellow-900/30 text-yellow-300 border-yellow-600/30'
    }`}>
      {status === 'online' ? (
        <Wifi className="w-3 h-3" />
      ) : status === 'offline' ? (
        <WifiOff className="w-3 h-3" />
      ) : (
        <RefreshCw className="w-3 h-3 animate-spin" />
      )}
      <span className="hidden sm:inline font-medium">
        {status === 'online' ? 'Live Data' : 
         status === 'offline' ? 'Offline Mode' : 
         'Connecting...'}
      </span>
    </div>
  );
};

const ReusableHeader: React.FC<HeaderProps> = ({ 
  user, 
  variant = 'home', 
  title,
  showBackButton = false,
  customActions,
  onBack 
}) => {
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
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
    <header className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-50 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Back Button */}
            {showBackButton && (
              <button
                onClick={handleBack}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50 transition-all duration-200"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                  TechInvestorAI
                </span>
                {title && variant !== 'home' && (
                  <span className="text-sm text-gray-400 font-medium">{title}</span>
                )}
              </div>
            </Link>

            {/* Navigation Items */}
            {navigationItems.length > 0 && (
              <nav className="hidden md:flex items-center space-x-1 ml-6">
                {navigationItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={index}
                      to={item.to}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-600/20 text-blue-300 border border-blue-600/30'
                          : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Center Section - Market Status Widget */}
          <div className="hidden lg:block">
            <MarketStatusWidget />
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Server Status */}
            <ServerStatusWidget status={serverStatus} />

            {/* Custom Actions */}
            {customActions}

            {/* User Section */}
            {user ? (
              <div className="relative">
                <div className="flex items-center space-x-3">
                  {/* Pro Badge (if applicable) */}
                  {user.email?.includes('pro') && (
                    <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 px-2 py-1 rounded-full">
                      <div className="flex items-center space-x-1">
                        <Crown className="w-3 h-3 text-yellow-100" />
                        <span className="text-xs font-bold text-yellow-100">PRO</span>
                      </div>
                    </div>
                  )}

                  {/* User Menu */}
                  <div className="relative group">
                    <button
                      className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-700/50 transition-all duration-200"
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <UserCircle className="w-5 h-5 text-white" />
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                    </button>

                    {/* Dropdown Menu */}
                    {showUserDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-xl shadow-2xl border border-gray-600/50 overflow-hidden z-10">
                        <div className="p-3 border-b border-gray-700">
                          <p className="text-white font-medium text-sm truncate">
                            {user.displayName || user.email?.split('@')[0]}
                          </p>
                          <p className="text-gray-400 text-xs truncate">{user.email}</p>
                        </div>
                        
                        <div className="py-1">
                          <Link
                            to="/account"
                            className="flex items-center px-3 py-2 text-gray-300 hover:bg-gray-700/50 transition-colors text-sm"
                            onClick={() => setShowUserDropdown(false)}
                          >
                            <UserIcon className="w-4 h-4 mr-3" />
                            Account
                          </Link>
                          <Link
                            to="/settings"
                            className="flex items-center px-3 py-2 text-gray-300 hover:bg-gray-700/50 transition-colors text-sm"
                            onClick={() => setShowUserDropdown(false)}
                          >
                            <Settings className="w-4 h-4 mr-3" />
                            Settings
                          </Link>
                          <Link
                            to="/upgrade"
                            className="flex items-center px-3 py-2 text-yellow-300 hover:bg-yellow-900/20 transition-colors text-sm"
                            onClick={() => setShowUserDropdown(false)}
                          >
                            <Crown className="w-4 h-4 mr-3" />
                            Upgrade to Pro
                          </Link>
                        </div>

                        <div className="border-t border-gray-700">
                          <button
                            onClick={() => {
                              setShowUserDropdown(false);
                              handleLogout();
                            }}
                            className="flex items-center w-full px-3 py-2 text-red-300 hover:bg-red-900/20 transition-colors text-sm"
                          >
                            <LogOut className="w-4 h-4 mr-3" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="flex items-center px-3 py-2 text-gray-300 hover:text-white transition-colors text-sm font-medium"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-blue-500/25"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {navigationItems.length > 0 && (
          <div className="md:hidden border-t border-gray-700/50 px-4 py-3">
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
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Mobile Market Status Widget */}
        <div className="lg:hidden border-t border-gray-700/50 p-3">
          <MarketStatusWidget />
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showUserDropdown && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowUserDropdown(false)}
        />
      )}
    </header>
  );
};

export default ReusableHeader;