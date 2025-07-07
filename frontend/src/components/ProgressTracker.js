import React from 'react';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Zap, Shield, Database } from 'lucide-react';

const ProgressTracker = ({ jobStatus, onCancel }) => {
  if (!jobStatus) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-neutral-600">Initializing validation...</p>
      </div>
    );
  }

  const getProgressPercentage = () => {
    if (jobStatus.status === 'completed') return 100;
    if (jobStatus.status === 'failed') return 100;
    return jobStatus.progress || 0;
  };

  const getStatusIcon = () => {
    switch (jobStatus.status) {
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-success-600" />;
      case 'failed':
        return <XCircle className="w-8 h-8 text-error-600" />;
      case 'processing':
        return <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-warning-600" />;
    }
  };

  const getStatusColor = () => {
    switch (jobStatus.status) {
      case 'completed':
        return 'text-success-600';
      case 'failed':
        return 'text-error-600';
      case 'processing':
        return 'text-primary-600';
      default:
        return 'text-warning-600';
    }
  };

  const getStatusMessage = () => {
    switch (jobStatus.status) {
      case 'completed':
        return 'Validation completed successfully!';
      case 'failed':
        return 'Validation failed. Please try again.';
      case 'processing':
        return 'Validating your email addresses...';
      case 'pending':
        return 'Preparing validation...';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary-600 to-blue-600 rounded-3xl shadow-large mb-6">
          <Database className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl font-bold text-neutral-900 mb-4">
          Processing Your Emails
        </h2>
        <p className="text-xl text-neutral-600">
          Our advanced 4-layer validation system is working to ensure maximum accuracy
        </p>
      </div>

      {/* Progress Card */}
      <div className="bg-white rounded-3xl shadow-large border border-neutral-200 p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {getStatusIcon()}
            <div>
              <h3 className={`text-xl font-semibold ${getStatusColor()}`}>
                {getStatusMessage()}
              </h3>
              <p className="text-neutral-600">
                Job ID: {jobStatus.job_id}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-neutral-900">
              {getProgressPercentage()}%
            </div>
            <div className="text-sm text-neutral-600">Complete</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-neutral-200 rounded-full h-3 mb-6">
          <div 
            className="bg-gradient-to-r from-primary-600 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>

        {/* Stats */}
        {jobStatus.total_emails && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-neutral-50 rounded-xl">
              <div className="text-2xl font-bold text-neutral-900">{jobStatus.total_emails}</div>
              <div className="text-sm text-neutral-600">Total Emails</div>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-xl">
              <div className="text-2xl font-bold text-primary-600">
                {jobStatus.results_count || 0}
              </div>
              <div className="text-sm text-neutral-600">Processed</div>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-xl">
              <div className="text-2xl font-bold text-success-600">
                {jobStatus.plan || 'Free'}
              </div>
              <div className="text-sm text-neutral-600">Plan</div>
            </div>
          </div>
        )}
      </div>

      {/* Validation Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-card border border-neutral-200 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h4 className="font-semibold text-neutral-900 mb-2">Syntax Check</h4>
          <p className="text-sm text-neutral-600">Validating email format and structure</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-card border border-neutral-200 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-success-500 to-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Database className="w-6 h-6 text-white" />
          </div>
          <h4 className="font-semibold text-neutral-900 mb-2">Domain Check</h4>
          <p className="text-sm text-neutral-600">Verifying MX records and DNS</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-card border border-neutral-200 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-warning-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h4 className="font-semibold text-neutral-900 mb-2">SMTP Test</h4>
          <p className="text-sm text-neutral-600">Testing server connectivity</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-card border border-neutral-200 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-error-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <h4 className="font-semibold text-neutral-900 mb-2">Final Check</h4>
          <p className="text-sm text-neutral-600">Role-based email detection</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="text-center">
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-neutral-100 text-neutral-700 rounded-xl hover:bg-neutral-200 transition-all duration-300 font-semibold"
        >
          Cancel Validation
        </button>
      </div>

      {/* Info */}
      <div className="mt-8 text-center">
        <p className="text-sm text-neutral-500">
          Processing time depends on the number of emails and server response times. 
          Large lists may take several minutes to complete.
        </p>
      </div>
    </div>
  );
};

export default ProgressTracker; 