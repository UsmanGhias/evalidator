import React, { useState, useEffect } from 'react';
import EmailInput from './components/EmailInput';
import ValidationResults from './components/ValidationResults';
import ProgressTracker from './components/ProgressTracker';
import Header from './components/Header';
import Footer from './components/Footer';
import PremiumFeatures from './components/PremiumFeatures';
import { validateEmails, getJobStatus, getResults } from './services/api';

function App() {
  const [currentStep, setCurrentStep] = useState('input'); // 'input', 'processing', 'results', 'premium'
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [userPlan, setUserPlan] = useState('free');
  const [usage, setUsage] = useState({ emails_used: 0, emails_limit: 100 });

  // Generate user ID (in production, get from authentication)
  const userId = localStorage.getItem('userId') || `user_${Math.random().toString(36).substr(2, 9)}`;
  
  useEffect(() => {
    localStorage.setItem('userId', userId);
    // Load user usage on app start
    loadUserUsage();
  }, []);

  const loadUserUsage = async () => {
    try {
      const response = await fetch(`/api/subscription?user_id=${userId}`);
      const data = await response.json();
      setUserPlan(data.plan);
      setUsage({
        emails_used: data.emails_used,
        emails_limit: data.emails_limit
      });
    } catch (err) {
      console.error('Failed to load usage:', err);
    }
  };

  const handleEmailSubmit = async (emails, file) => {
    try {
      setError(null);
      setCurrentStep('processing');
      
      const response = await validateEmails(emails, file, userId);
      
      // Check if upgrade is required
      if (response.error && response.upgrade_required) {
        setError('Usage limit exceeded. Please upgrade to premium for unlimited validations.');
        setCurrentStep('premium');
        return;
      }
      
      setJobId(response.job_id);
      setJobStatus(response);
      
      // Update usage
      if (response.usage) {
        setUsage({
          emails_used: response.usage.emails_used,
          emails_limit: response.usage.emails_limit
        });
      }
      
      // Start polling for status updates
      pollJobStatus(response.job_id);
    } catch (err) {
      setError(err.message || 'Failed to submit emails for validation');
      setCurrentStep('input');
    }
  };

  const pollJobStatus = async (jobId) => {
    const poll = async () => {
      try {
        const status = await getJobStatus(jobId);
        setJobStatus(status);
        
        if (status.status === 'completed') {
          // Fetch results
          const resultsData = await getResults(jobId);
          setResults(resultsData);
          setCurrentStep('results');
        } else if (status.status === 'failed') {
          setError(status.error || 'Validation failed');
          setCurrentStep('input');
        } else if (status.status === 'processing' || status.status === 'pending') {
          // Continue polling
          setTimeout(poll, 2000);
        }
      } catch (err) {
        setError('Failed to get job status');
        setCurrentStep('input');
      }
    };
    
    poll();
  };

  const handleStartOver = () => {
    setCurrentStep('input');
    setJobId(null);
    setJobStatus(null);
    setResults(null);
    setError(null);
  };

  const handleUpgrade = async () => {
    try {
      // In production, redirect to Stripe checkout
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upgrade',
          user_id: userId,
          payment_data: { method: 'stripe' }
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setUserPlan('premium');
        setUsage(data.usage);
        setCurrentStep('input');
        setError(null);
      }
    } catch (err) {
      setError('Failed to process upgrade. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      <Header userPlan={userPlan} usage={usage} />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-error-50 to-red-50 border border-error-200 rounded-xl shadow-soft animate-fade-in">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-r from-error-500 to-red-500 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-semibold text-error-800">Error</h3>
                <p className="text-sm text-error-700 mt-1">{error}</p>
              </div>
              <div className="ml-auto">
                <button
                  onClick={() => setError(null)}
                  className="text-error-400 hover:text-error-600 transition-colors duration-200"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'input' && (
          <div className="animate-fade-in">
            <EmailInput onSubmit={handleEmailSubmit} userPlan={userPlan} usage={usage} />
          </div>
        )}

        {currentStep === 'processing' && (
          <div className="animate-slide-up">
            <ProgressTracker 
              jobStatus={jobStatus} 
              onCancel={handleStartOver}
            />
          </div>
        )}

        {currentStep === 'results' && (
          <div className="animate-scale-in">
            <ValidationResults 
              results={results} 
              jobId={jobId}
              onStartOver={handleStartOver}
              userPlan={userPlan}
            />
          </div>
        )}

        {currentStep === 'premium' && (
          <div className="animate-fade-in">
            <PremiumFeatures 
              onUpgrade={handleUpgrade}
              currentPlan={userPlan}
              usage={usage}
            />
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}

export default App; 