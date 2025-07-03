import React from 'react';
import { Clock, Mail, CheckCircle, XCircle, Loader } from 'lucide-react';

const ProgressTracker = ({ jobStatus, onCancel }) => {
  if (!jobStatus) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="card p-8">
          <Loader className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Initializing Validation...
          </h3>
          <p className="text-gray-600">
            Setting up your email validation job
          </p>
        </div>
      </div>
    );
  }

  const { status, progress, processed, total_emails } = jobStatus;

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="w-8 h-8 text-warning-600" />;
      case 'processing':
        return <Loader className="w-8 h-8 text-primary-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-success-600" />;
      case 'failed':
        return <XCircle className="w-8 h-8 text-error-600" />;
      default:
        return <Mail className="w-8 h-8 text-gray-600" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Queued for Processing';
      case 'processing':
        return 'Validating Emails';
      case 'completed':
        return 'Validation Complete';
      case 'failed':
        return 'Validation Failed';
      default:
        return 'Unknown Status';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'text-warning-600';
      case 'processing':
        return 'text-primary-600';
      case 'completed':
        return 'text-success-600';
      case 'failed':
        return 'text-error-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            {getStatusIcon()}
          </div>
          <h3 className={`text-xl font-semibold mb-2 ${getStatusColor()}`}>
            {getStatusText()}
          </h3>
          <p className="text-gray-600">
            {status === 'processing' && processed && total_emails
              ? `Processing ${processed} of ${total_emails} emails`
              : `Validating ${total_emails} email${total_emails !== 1 ? 's' : ''}`
            }
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">
              {Math.round(progress || 0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-primary-600 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress || 0}%` }}
            />
          </div>
        </div>

        {/* Status Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Total Emails</span>
            <span className="text-sm font-medium text-gray-900">
              {total_emails?.toLocaleString() || 0}
            </span>
          </div>
          
          {processed && (
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Processed</span>
              <span className="text-sm font-medium text-gray-900">
                {processed.toLocaleString()}
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Status</span>
            <span className={`text-sm font-medium capitalize ${getStatusColor()}`}>
              {status}
            </span>
          </div>
        </div>

        {/* Validation Steps */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Validation Process</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-success-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Syntax validation</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-success-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Domain & MX record check</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${
                status === 'processing' ? 'bg-primary-500 animate-pulse' : 'bg-success-500'
              }`}></div>
              <span className="text-sm text-gray-600">SMTP server verification</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          {status === 'processing' && (
            <button
              onClick={onCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          )}
          
          {status === 'failed' && (
            <button
              onClick={onCancel}
              className="btn btn-primary"
            >
              Try Again
            </button>
          )}
        </div>

        {/* Estimated Time */}
        {status === 'processing' && total_emails && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Estimated time: {Math.ceil(total_emails / 100)} minutes
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressTracker; 