import React from 'react';
import { Mail, Shield, CheckCircle, Zap } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-gradient-to-r from-white via-blue-50 to-indigo-50 shadow-medium border-b border-blue-100">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl shadow-soft">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-700 to-purple-700 bg-clip-text text-transparent">
                EmailValidator
              </h1>
              <p className="text-sm text-secondary-600 font-medium">Professional Email Validation Service</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-2 text-sm text-secondary-600 bg-white px-3 py-2 rounded-lg shadow-soft">
              <div className="w-2 h-2 bg-gradient-to-r from-success-500 to-green-500 rounded-full"></div>
              <Shield className="w-4 h-4 text-primary-600" />
              <span className="font-medium">Secure & Fast</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-secondary-600 bg-white px-3 py-2 rounded-lg shadow-soft">
              <div className="w-2 h-2 bg-gradient-to-r from-warning-500 to-orange-500 rounded-full"></div>
              <CheckCircle className="w-4 h-4 text-success-600" />
              <span className="font-medium">99.9% Accuracy</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-secondary-600 bg-white px-3 py-2 rounded-lg shadow-soft">
              <div className="w-2 h-2 bg-gradient-to-r from-info-500 to-blue-500 rounded-full"></div>
              <Zap className="w-4 h-4 text-warning-600" />
              <span className="font-medium">Real-time Results</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 