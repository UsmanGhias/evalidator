import React from 'react';
import { Mail, Shield, CheckCircle, Zap, Crown, User, Bell, LogOut } from 'lucide-react';

const Header = ({ user, usage = {}, onLogin, onLogout, isAnonymous = false }) => {
  const getPlanColor = (plan) => {
    switch (plan) {
      case 'premium':
      case 'professional':
      case 'enterprise':
        return 'text-warning-600';
      case 'starter':
        return 'text-primary-600';
      default:
        return 'text-neutral-600';
    }
  };

  const getPlanIcon = (plan) => {
    switch (plan) {
      case 'premium':
      case 'professional':
      case 'enterprise':
        return <Crown className="w-4 h-4" />;
      case 'starter':
        return <Zap className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  return (
    <header className="bg-white shadow-card border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-primary-600 to-blue-600 rounded-xl shadow-medium">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">
                EmailValidator
              </h1>
              <p className="text-sm text-neutral-600 font-medium">Professional Email Validation Service</p>
            </div>
          </div>
          
          {/* Features */}
          <div className="hidden lg:flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm text-neutral-600 bg-neutral-50 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-success-500 rounded-full"></div>
              <Shield className="w-4 h-4 text-success-600" />
              <span className="font-medium">99.9% Accuracy</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-neutral-600 bg-neutral-50 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              <Zap className="w-4 h-4 text-primary-600" />
              <span className="font-medium">Real-time Results</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-neutral-600 bg-neutral-50 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
              <CheckCircle className="w-4 h-4 text-warning-600" />
              <span className="font-medium">Enterprise Ready</span>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Plan Status */}
                <div className="hidden md:flex items-center space-x-2 text-sm">
                  <div className={`flex items-center space-x-1 ${getPlanColor(user.plan)}`}>
                    {getPlanIcon(user.plan)}
                    <span className="font-medium capitalize">{user.plan}</span>
                  </div>
                  {user.plan === 'free' && usage.emails_used !== undefined && (
                    <div className="text-neutral-500">
                      {usage.emails_used}/{usage.emails_limit}
                    </div>
                  )}
                </div>

                {/* Notifications */}
                <button className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors duration-200">
                  <Bell className="w-5 h-5" />
                </button>

                {/* User Menu */}
                <div className="flex items-center space-x-2 bg-neutral-50 rounded-lg px-3 py-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-neutral-700 hidden sm:block">
                    {user.email}
                  </span>
                  <button
                    onClick={onLogout}
                    className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : isAnonymous ? (
              /* Anonymous User Status */
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex items-center space-x-2 text-sm bg-info-50 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-info-500 rounded-full"></div>
                  <span className="text-info-700 font-medium">Anonymous User</span>
                  <span className="text-info-600">(10 emails max)</span>
                </div>
                <button
                  onClick={onLogin}
                  className="px-6 py-2 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-blue-700 transition-all duration-300 shadow-medium hover:shadow-large"
                >
                  Sign Up
                </button>
              </div>
            ) : (
              /* Login Button */
              <button
                onClick={onLogin}
                className="px-6 py-2 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-blue-700 transition-all duration-300 shadow-medium hover:shadow-large"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 