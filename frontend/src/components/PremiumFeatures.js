import React, { useState } from 'react';
import { Crown, Zap, Shield, CheckCircle, Star, ArrowRight, Lock } from 'lucide-react';

const PremiumFeatures = ({ onUpgrade, currentPlan = 'free', usage = {} }) => {
  const [isUpgrading, setIsUpgrading] = useState(false);

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Unlimited Validations",
      description: "Validate unlimited email addresses without restrictions",
      free: false
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Advanced SMTP Checks",
      description: "Enhanced SMTP validation for better accuracy",
      free: false
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "Priority Processing",
      description: "Faster validation with priority queue",
      free: false
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Bulk Export",
      description: "Export large datasets in multiple formats",
      free: false
    },
    {
      icon: <Crown className="w-6 h-6" />,
      title: "API Access",
      description: "Direct API access for integrations",
      free: false
    }
  ];

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      // In production, integrate with Stripe/PayPal
      await onUpgrade();
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 rounded-3xl p-8 shadow-large">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-gold-500 to-yellow-500 rounded-2xl shadow-premium mb-4">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent mb-2">
          Upgrade to Premium
        </h2>
        <p className="text-secondary-600 text-lg">
          Unlock unlimited email validations and advanced features
        </p>
      </div>

      {/* Current Usage */}
      {currentPlan === 'free' && (
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-soft">
          <h3 className="text-lg font-semibold text-secondary-800 mb-4">Current Usage</h3>
          <div className="flex items-center justify-between">
            <span className="text-secondary-600">Emails Used</span>
            <span className="font-bold text-secondary-800">
              {usage.emails_used || 0} / {usage.emails_limit || 100}
            </span>
          </div>
          <div className="w-full bg-secondary-200 rounded-full h-2 mt-2">
            <div 
              className="bg-gradient-to-r from-primary-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(((usage.emails_used || 0) / (usage.emails_limit || 100)) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Pricing */}
      <div className="bg-white rounded-2xl p-6 mb-8 shadow-soft">
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-secondary-800 mb-2">
            $5
            <span className="text-lg text-secondary-600 font-normal">/week</span>
          </div>
          <p className="text-secondary-600">Cancel anytime, no commitment</p>
        </div>
        
        <div className="space-y-4 mb-6">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                feature.free 
                  ? 'bg-success-100 text-success-600' 
                  : 'bg-gradient-to-r from-primary-500 to-purple-500 text-white'
              }`}>
                {feature.free ? <CheckCircle className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-secondary-800">{feature.title}</h4>
                <p className="text-sm text-secondary-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {currentPlan === 'free' ? (
          <button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className="w-full bg-gradient-to-r from-gold-500 to-yellow-500 text-white font-bold py-4 px-6 rounded-xl hover:from-gold-600 hover:to-yellow-600 transition-all duration-300 shadow-premium hover:shadow-large transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpgrading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Processing...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Crown className="w-5 h-5 mr-2" />
                Upgrade Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            )}
          </button>
        ) : (
          <div className="text-center p-4 bg-gradient-to-r from-success-100 to-green-100 rounded-xl">
            <CheckCircle className="w-8 h-8 text-success-600 mx-auto mb-2" />
            <p className="font-semibold text-success-800">Premium Active</p>
            <p className="text-sm text-success-600">
              Expires: {new Date((usage.subscription_expires || 0) * 1000).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-soft">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-success-500 to-green-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-secondary-800">99.9% Accuracy</h4>
              <p className="text-sm text-secondary-600">Industry-leading validation</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-soft">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-info-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-secondary-800">Secure & Private</h4>
              <p className="text-sm text-secondary-600">Your data is protected</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumFeatures; 