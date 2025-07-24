import React, { useState, useEffect, useCallback } from 'react';
import EmailInput from './components/EmailInput';
import ValidationResults from './components/ValidationResults';
import ProgressTracker from './components/ProgressTracker';
import Header from './components/Header';
import Footer from './components/Footer';
import PricingPlans from './components/PricingPlans';
import Auth from './components/Auth';
import { validateEmails, validateEmailsAnonymous, getCurrentUser, getSubscription, upgradeSubscription, getJobStatus, getResults } from './services/api';

function App() {
  const [currentStep, setCurrentStep] = useState('input'); // 'input', 'processing', 'results', 'pricing'
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [usage, setUsage] = useState({ emails_used: 0, emails_limit: 100 });
  const [showAuth, setShowAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const API_BASE_URL = 'http://localhost:8000/api';

  // Check authentication on app start
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const userData = await getCurrentUser();
        setUser(userData.user);
        setUsage(userData.usage);
        setIsAnonymous(false);
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setIsAnonymous(true);
      }
    } else {
      setIsAnonymous(true);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleAuthSuccess = async (authData) => {
    setUser(authData.user);
    setIsAnonymous(false);
    try {
      const subscriptionData = await getSubscription();
      setUsage(subscriptionData);
    } catch (err) {
      console.error('Failed to load subscription:', err);
    }
    setShowAuth(false);
  };

  const handleEmailSubmit = async (emails, file) => {
    try {
      setError(null);
      setCurrentStep('processing');
      
      let response;
      
      if (user) {
        // Authenticated user
        response = await validateEmails(emails, file);
        
        // Check if upgrade is required
        if (response.error && response.upgrade_required) {
          setError('Usage limit exceeded. Please upgrade to a paid plan for unlimited validations.');
          setCurrentStep('pricing');
          return;
        }
      } else {
        // Anonymous user
        response = await validateEmailsAnonymous(emails, file);
        
        // Check if upgrade is required for anonymous users
        if (response.error && response.upgrade_required) {
          setError('Anonymous users can validate up to 10 emails. Please sign up for more.');
          setCurrentStep('pricing');
          return;
        }
      }
      
      setJobId(response.job_id);
      setJobStatus(response);
      
      // Update usage for authenticated users
      if (user && response.usage) {
        setUsage(response.usage);
      }
      
      // If results are already available (synchronous processing)
      if (response.results) {
        setResults(response);
        setCurrentStep('results');
      } else {
        // Start polling for status updates
        pollJobStatus(response.job_id);
      }
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

  const handleSelectPlan = async (plan, billingCycle) => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    try {
      const response = await upgradeSubscription(plan, billingCycle);
      if (response.success) {
        setUsage(response.usage);
        setCurrentStep('input');
        setError(null);
      }
    } catch (err) {
      setError('Failed to process upgrade. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    setUsage({ emails_used: 0, emails_limit: 100 });
    setIsAnonymous(true);
    setCurrentStep('input');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50 to-indigo-50">
      <Header 
        user={user} 
        usage={usage} 
        onLogin={() => setShowAuth(true)}
        onLogout={handleLogout}
        isAnonymous={isAnonymous}
      />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-6 bg-gradient-to-r from-error-50 to-red-50 border border-error-200 rounded-2xl shadow-medium animate-fade-in">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-error-500 to-red-500 rounded-xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-error-800">Error</h3>
                <p className="text-error-700 mt-1">{error}</p>
              </div>
              <div className="ml-auto">
                <button
                  onClick={() => setError(null)}
                  className="text-error-400 hover:text-error-600 transition-colors duration-200 p-2 rounded-lg hover:bg-error-100"
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
            <EmailInput 
              onSubmit={handleEmailSubmit} 
              user={user}
              usage={usage}
              onLogin={() => setShowAuth(true)}
              isAnonymous={isAnonymous}
            />
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
              user={user}
              isAnonymous={isAnonymous}
            />
          </div>
        )}

        {currentStep === 'pricing' && (
          <div className="animate-fade-in">
            <PricingPlans 
              onSelectPlan={handleSelectPlan}
              currentPlan={user?.plan || 'free'}
              usage={usage}
            />
          </div>
        )}
      </main>
      
      <Footer />

      {/* Authentication Modal */}
      {showAuth && (
        <Auth 
          onAuthSuccess={handleAuthSuccess}
          onClose={() => setShowAuth(false)}
        />
      )}
    </div>
  );
}

export default App; 