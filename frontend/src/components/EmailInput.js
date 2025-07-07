import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Mail, Trash2, AlertCircle, Zap, Shield, CheckCircle, Database, LogIn } from 'lucide-react';

const EmailInput = ({ onSubmit, user, usage = {}, onLogin, isAnonymous = false }) => {
  const [emails, setEmails] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [inputMethod, setInputMethod] = useState('text'); // 'text' or 'file'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailCount, setEmailCount] = useState(0);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setUploadedFile(acceptedFiles[0]);
        setInputMethod('file');
      }
    },
  });

  const handleTextChange = (e) => {
    const text = e.target.value;
    setEmails(text);
    
    // Count emails
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = text.match(emailRegex) || [];
    setEmailCount(matches.length);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (inputMethod === 'text' && !emails.trim()) {
      alert('Please enter some email addresses');
      return;
    }
    
    if (inputMethod === 'file' && !uploadedFile) {
      alert('Please upload a file');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (inputMethod === 'text') {
        await onSubmit(emails, null);
      } else {
        await onSubmit(null, uploadedFile);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setInputMethod('text');
  };

  const clearText = () => {
    setEmails('');
    setEmailCount(0);
  };

  const getPlanLimit = () => {
    if (isAnonymous) return 10;
    if (!user) return 100;
    switch (user.plan) {
      case 'enterprise':
        return 100000;
      case 'professional':
        return 10000;
      case 'starter':
        return 1000;
      default:
        return 100;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary-600 to-blue-600 rounded-3xl shadow-large mb-6">
          <Mail className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-5xl font-bold text-neutral-900 mb-4">
          Professional Email Validation
        </h2>
        <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
          Validate emails with 99.9% accuracy using our advanced 4-layer validation system. 
          Trusted by 10,000+ companies worldwide.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="text-center p-6 bg-white rounded-2xl shadow-card border border-neutral-200 hover:shadow-medium transition-all duration-300">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-blue-500 rounded-xl mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold text-neutral-900 mb-2 text-lg">Syntax Validation</h3>
          <p className="text-neutral-600">Advanced regex and format checking</p>
        </div>
        <div className="text-center p-6 bg-white rounded-2xl shadow-card border border-neutral-200 hover:shadow-medium transition-all duration-300">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-success-500 to-green-500 rounded-xl mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold text-neutral-900 mb-2 text-lg">Domain Verification</h3>
          <p className="text-neutral-600">MX records and DNS validation</p>
        </div>
        <div className="text-center p-6 bg-white rounded-2xl shadow-card border border-neutral-200 hover:shadow-medium transition-all duration-300">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-warning-500 to-orange-500 rounded-xl mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold text-neutral-900 mb-2 text-lg">SMTP Testing</h3>
          <p className="text-neutral-600">Live server connection testing</p>
        </div>
        <div className="text-center p-6 bg-white rounded-2xl shadow-card border border-neutral-200 hover:shadow-medium transition-all duration-300">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-error-500 to-red-500 rounded-xl mx-auto mb-4">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold text-neutral-900 mb-2 text-lg">Bulk Processing</h3>
          <p className="text-neutral-600">Handle millions of emails efficiently</p>
        </div>
      </div>

      {/* Anonymous User Info */}
      {isAnonymous && (
        <div className="bg-gradient-to-r from-info-50 to-blue-50 border border-info-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-info-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Try for Free</h3>
                <p className="text-sm text-neutral-600">
                  Validate up to 10 emails instantly. No sign-up required!
                </p>
              </div>
            </div>
            <button
              onClick={onLogin}
              className="px-6 py-2 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-blue-700 transition-all duration-300 shadow-medium hover:shadow-large"
            >
              Sign Up for More
            </button>
          </div>
        </div>
      )}

      {/* Authentication Prompt for Non-Anonymous Users */}
      {!user && !isAnonymous && (
        <div className="bg-gradient-to-r from-warning-50 to-orange-50 border border-warning-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-warning-500 to-orange-500 rounded-lg flex items-center justify-center">
                <LogIn className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Sign in to continue</h3>
                <p className="text-sm text-neutral-600">
                  Create an account or sign in to start validating emails
                </p>
              </div>
            </div>
            <button
              onClick={onLogin}
              className="px-6 py-2 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-blue-700 transition-all duration-300 shadow-medium hover:shadow-large"
            >
              Sign In
            </button>
          </div>
        </div>
      )}

      {/* Usage Status for Authenticated Users */}
      {user && user.plan === 'free' && (
        <div className="bg-gradient-to-r from-warning-50 to-orange-50 border border-warning-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-warning-500 to-orange-500 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Free Plan Usage</h3>
                <p className="text-sm text-neutral-600">
                  {usage.emails_used || 0} of {usage.emails_limit || 100} emails used this month
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-neutral-900">
                {Math.round(((usage.emails_used || 0) / (usage.emails_limit || 100)) * 100)}%
              </div>
              <div className="text-sm text-neutral-600">used</div>
            </div>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2 mt-4">
            <div 
              className="bg-gradient-to-r from-warning-500 to-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(((usage.emails_used || 0) / (usage.emails_limit || 100)) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Input Methods */}
      <div className="bg-white rounded-3xl shadow-large border border-neutral-200 p-8">
        <div className="flex space-x-4 mb-8">
          <button
            type="button"
            onClick={() => setInputMethod('text')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              inputMethod === 'text'
                ? 'bg-gradient-to-r from-primary-600 to-blue-600 text-white shadow-medium'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:shadow-card'
            }`}
          >
            <Mail className="w-5 h-5 inline mr-2" />
            Paste Emails
          </button>
          <button
            type="button"
            onClick={() => setInputMethod('file')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              inputMethod === 'file'
                ? 'bg-gradient-to-r from-primary-600 to-blue-600 text-white shadow-medium'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:shadow-card'
            }`}
          >
            <Upload className="w-5 h-5 inline mr-2" />
            Upload File
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {inputMethod === 'text' && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-neutral-700">
                  Email Addresses
                </label>
                <div className="flex items-center space-x-3">
                  {emailCount > 0 && (
                    <span className="text-sm bg-gradient-to-r from-success-100 to-green-100 text-success-700 px-3 py-1 rounded-full font-medium">
                      {emailCount} email{emailCount !== 1 ? 's' : ''} detected
                    </span>
                  )}
                  {emails && (
                    <button
                      type="button"
                      onClick={clearText}
                      className="text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={emails}
                onChange={handleTextChange}
                placeholder="Paste your email addresses here (one per line or comma-separated)&#10;&#10;Example:&#10;john@example.com&#10;jane@company.org&#10;test@domain.net&#10;usmanghias@codcrafters.org"
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y min-h-[200px] text-neutral-700 placeholder-neutral-400"
                rows={10}
              />
              <p className="text-xs text-neutral-500 mt-3 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Supports comma-separated or line-separated email addresses. 
                {isAnonymous ? ' Maximum 10 emails for anonymous users.' : user ? ` Maximum ${getPlanLimit()} emails for ${user.plan} users.` : ' Sign in to start validating.'}
              </p>
            </div>
          )}

          {inputMethod === 'file' && (
            <div className="mb-8">
              <label className="block text-sm font-semibold text-neutral-700 mb-3">
                Upload Email File
              </label>
              
              {!uploadedFile ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer ${
                    isDragActive
                      ? 'border-primary-400 bg-gradient-to-r from-primary-50 to-blue-50'
                      : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="w-16 h-16 bg-gradient-to-r from-neutral-200 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-neutral-500" />
                  </div>
                  <p className="text-xl font-semibold text-neutral-800 mb-2">
                    {isDragActive ? 'Drop your file here' : 'Drop your file here or click to browse'}
                  </p>
                  <p className="text-neutral-600">
                    Supports CSV and TXT files up to 10MB
                  </p>
                </div>
              ) : (
                <div className="border border-neutral-300 rounded-xl p-6 bg-gradient-to-r from-success-50 to-green-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-success-500 to-green-500 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-800">{uploadedFile.name}</p>
                        <p className="text-sm text-neutral-600">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                isSubmitting
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-600 to-blue-600 text-white hover:from-primary-700 hover:to-blue-700 shadow-medium hover:shadow-large transform hover:scale-105'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Validating Emails...
                </div>
              ) : (
                <div className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Start Validation
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailInput; 