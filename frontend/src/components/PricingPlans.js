import React, { useState } from 'react';
import { Check, Star, Zap, Shield, ArrowRight, Users, Database, Globe } from 'lucide-react';

const PricingPlans = ({ onSelectPlan, currentPlan = 'free', usage = {} }) => {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'
  const [isUpgrading, setIsUpgrading] = useState(false);

  const plans = [
    {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      emails: 100,
      features: [
        'Basic email validation',
        'Syntax & domain checks',
        'CSV export',
        'Email support',
        '1 user'
      ],
      limitations: [
        'No SMTP verification',
        'No API access',
        'No bulk processing',
        'No advanced reports'
      ],
      popular: false,
      color: 'secondary'
    },
    {
      name: 'Starter',
      price: { monthly: 29, yearly: 290 },
      emails: 1000,
      features: [
        'Advanced SMTP verification',
        'Disposable email detection',
        'Role-based email detection',
        'Bulk processing (up to 1K)',
        'API access',
        'Priority support',
        'Basic analytics',
        '5 users'
      ],
      limitations: [
        'Limited to 1K emails/month',
        'No custom integrations'
      ],
      popular: true,
      color: 'primary'
    },
    {
      name: 'Professional',
      price: { monthly: 99, yearly: 990 },
      emails: 10000,
      features: [
        'Everything in Starter',
        'Unlimited validations',
        'Advanced analytics',
        'Custom integrations',
        'Webhook support',
        'Dedicated support',
        'White-label options',
        '25 users'
      ],
      limitations: [
        'No enterprise features'
      ],
      popular: false,
      color: 'success'
    },
    {
      name: 'Enterprise',
      price: { monthly: 299, yearly: 2990 },
      emails: 100000,
      features: [
        'Everything in Professional',
        'Custom SMTP servers',
        'Advanced reporting',
        'SLA guarantees',
        'Dedicated account manager',
        'Custom development',
        'On-premise options',
        'Unlimited users'
      ],
      limitations: [],
      popular: false,
      color: 'warning'
    }
  ];

  const handleUpgrade = async (plan) => {
    setIsUpgrading(true);
    try {
      await onSelectPlan(plan, billingCycle);
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-large">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-neutral-900 mb-4">
          Choose Your Plan
        </h2>
        <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
          Professional email validation for every business size. Start free, scale as you grow.
        </p>
        
        {/* Billing Toggle */}
        <div className="flex items-center justify-center mt-8 space-x-4">
          <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-neutral-900' : 'text-neutral-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              billingCycle === 'yearly' ? 'bg-primary-600' : 'bg-neutral-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-neutral-900' : 'text-neutral-500'}`}>
            Yearly
            <span className="ml-1 text-xs bg-success-100 text-success-700 px-2 py-1 rounded-full">
              Save 20%
            </span>
          </span>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {plans.map((plan, index) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl p-6 border-2 transition-all duration-300 hover:shadow-large ${
              plan.popular
                ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-blue-50 shadow-medium'
                : 'border-neutral-200 hover:border-neutral-300'
            } ${currentPlan === plan.name.toLowerCase() ? 'ring-2 ring-primary-500' : ''}`}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-primary-600 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </span>
              </div>
            )}

            {/* Plan Header */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-neutral-900 mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-neutral-900">
                  ${plan.price[billingCycle]}
                </span>
                <span className="text-neutral-500">
                  {plan.price[billingCycle] === 0 ? '' : billingCycle === 'monthly' ? '/month' : '/year'}
                </span>
              </div>
              <p className="text-sm text-neutral-600">
                Up to {plan.emails.toLocaleString()} emails
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-6">
              {plan.features.map((feature, featureIndex) => (
                <div key={featureIndex} className="flex items-center space-x-3">
                  <Check className="w-4 h-4 text-success-600 flex-shrink-0" />
                  <span className="text-sm text-neutral-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* Limitations */}
            {plan.limitations.length > 0 && (
              <div className="space-y-2 mb-6">
                {plan.limitations.map((limitation, limitationIndex) => (
                  <div key={limitationIndex} className="flex items-center space-x-3">
                    <div className="w-4 h-4 text-neutral-400 flex-shrink-0">×</div>
                    <span className="text-sm text-neutral-500">{limitation}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Action Button */}
            {currentPlan === plan.name.toLowerCase() ? (
              <div className="text-center p-3 bg-success-100 rounded-xl">
                <Check className="w-5 h-5 text-success-600 mx-auto mb-1" />
                <span className="text-sm font-medium text-success-800">Current Plan</span>
              </div>
            ) : (
              <button
                onClick={() => handleUpgrade(plan.name.toLowerCase())}
                disabled={isUpgrading}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-primary-600 to-blue-600 text-white hover:from-primary-700 hover:to-blue-700 shadow-medium hover:shadow-large'
                    : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isUpgrading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    {plan.price[billingCycle] === 0 ? 'Get Started' : 'Upgrade'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                )}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Features Comparison */}
      <div className="bg-neutral-50 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-neutral-900 mb-4 text-center">
          Feature Comparison
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-primary-600" />
            </div>
            <h4 className="font-semibold text-neutral-900 mb-2">Real-time Validation</h4>
            <p className="text-sm text-neutral-600">Instant results with 99.9% accuracy</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-success-600" />
            </div>
            <h4 className="font-semibold text-neutral-900 mb-2">Advanced Security</h4>
            <p className="text-sm text-neutral-600">Enterprise-grade data protection</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Database className="w-6 h-6 text-warning-600" />
            </div>
            <h4 className="font-semibold text-neutral-900 mb-2">Bulk Processing</h4>
            <p className="text-sm text-neutral-600">Handle millions of emails efficiently</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-error-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Globe className="w-6 h-6 text-error-600" />
            </div>
            <h4 className="font-semibold text-neutral-900 mb-2">Global Coverage</h4>
            <p className="text-sm text-neutral-600">Works with all email providers worldwide</p>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="mt-8 text-center">
        <p className="text-sm text-neutral-500 mb-4">
          Trusted by 10,000+ companies worldwide
        </p>
        <div className="flex items-center justify-center space-x-6 text-neutral-400">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm">4.9/5 rating</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span className="text-sm">10K+ users</span>
          </div>
          <div className="flex items-center space-x-1">
            <Shield className="w-4 h-4" />
            <span className="text-sm">SOC 2 compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPlans; 