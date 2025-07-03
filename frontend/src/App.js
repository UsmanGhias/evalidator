import React, { useState } from 'react';
import EmailInput from './components/EmailInput';
import ValidationResults from './components/ValidationResults';
import ProgressTracker from './components/ProgressTracker';
import Header from './components/Header';
import Footer from './components/Footer';
import { validateEmails, getJobStatus, getResults } from './services/api';

function App() {
  const [currentStep, setCurrentStep] = useState('input'); // 'input', 'processing', 'results'
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleEmailSubmit = async (emails, file) => {
    try {
      setError(null);
      setCurrentStep('processing');
      
      const response = await validateEmails(emails, file);
      setJobId(response.job_id);
      setJobStatus(response);
      
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-error-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-error-800">Error</h3>
                <p className="text-sm text-error-700 mt-1">{error}</p>
              </div>
              <div className="ml-auto">
                <button
                  onClick={() => setError(null)}
                  className="text-error-400 hover:text-error-600"
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
          <EmailInput onSubmit={handleEmailSubmit} />
        )}

        {currentStep === 'processing' && (
          <ProgressTracker 
            jobStatus={jobStatus} 
            onCancel={handleStartOver}
          />
        )}

        {currentStep === 'results' && (
          <ValidationResults 
            results={results} 
            jobId={jobId}
            onStartOver={handleStartOver}
          />
        )}
      </main>
      
      <Footer />
    </div>
  );
}

export default App; 