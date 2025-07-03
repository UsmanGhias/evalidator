import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Mail, Trash2, AlertCircle, Zap, Shield, CheckCircle } from 'lucide-react';

const EmailInput = ({ onSubmit }) => {
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl shadow-large mb-6">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-primary-700 to-purple-700 bg-clip-text text-transparent mb-4">
          Validate Your Email Lists Instantly
        </h2>
        <p className="text-xl text-secondary-600 max-w-3xl mx-auto leading-relaxed">
          Check if your emails are real or fake with our advanced 3-layer validation system. 
          Get accurate results for up to 100 emails at once with real-time processing.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="text-center p-6 bg-white rounded-2xl shadow-soft border border-blue-100 hover:shadow-medium transition-all duration-300">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-blue-500 rounded-xl mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold text-secondary-800 mb-2 text-lg">Syntax Check</h3>
          <p className="text-secondary-600">Validate email format and structure with advanced regex patterns</p>
        </div>
        <div className="text-center p-6 bg-white rounded-2xl shadow-soft border border-green-100 hover:shadow-medium transition-all duration-300">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-success-500 to-green-500 rounded-xl mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold text-secondary-800 mb-2 text-lg">Domain Check</h3>
          <p className="text-secondary-600">Verify domain existence and MX records for deliverability</p>
        </div>
        <div className="text-center p-6 bg-white rounded-2xl shadow-soft border border-orange-100 hover:shadow-medium transition-all duration-300">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-warning-500 to-orange-500 rounded-xl mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold text-secondary-800 mb-2 text-lg">SMTP Verification</h3>
          <p className="text-secondary-600">Test actual email deliverability with live server checks</p>
        </div>
      </div>

      {/* Input Methods */}
      <div className="bg-white rounded-2xl shadow-large border border-blue-100 p-8">
        <div className="flex space-x-4 mb-8">
          <button
            type="button"
            onClick={() => setInputMethod('text')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              inputMethod === 'text'
                ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-medium'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 hover:shadow-soft'
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
                ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-medium'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 hover:shadow-soft'
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
                <label className="block text-sm font-semibold text-secondary-700">
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
                      className="text-secondary-400 hover:text-secondary-600 transition-colors duration-200"
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
                className="w-full px-4 py-3 border border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y min-h-[200px] text-secondary-700 placeholder-secondary-400"
                rows={10}
              />
              <p className="text-xs text-secondary-500 mt-3 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Supports comma-separated or line-separated email addresses. Maximum 100 emails for instant processing.
              </p>
            </div>
          )}

          {inputMethod === 'file' && (
            <div className="mb-8">
              <label className="block text-sm font-semibold text-secondary-700 mb-3">
                Upload Email File
              </label>
              
              {!uploadedFile ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer ${
                    isDragActive
                      ? 'border-primary-400 bg-gradient-to-r from-primary-50 to-blue-50'
                      : 'border-secondary-300 hover:border-primary-400 hover:bg-secondary-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="w-16 h-16 bg-gradient-to-r from-secondary-200 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-secondary-500" />
                  </div>
                  <p className="text-xl font-semibold text-secondary-800 mb-2">
                    {isDragActive ? 'Drop your file here' : 'Drop your file here or click to browse'}
                  </p>
                  <p className="text-secondary-600">
                    Supports CSV and TXT files up to 10MB
                  </p>
                </div>
              ) : (
                <div className="border border-secondary-200 rounded-xl p-6 bg-gradient-to-r from-success-50 to-green-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-success-500 to-green-500 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-secondary-800">{uploadedFile.name}</p>
                        <p className="text-sm text-secondary-600">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-secondary-400 hover:text-secondary-600 transition-colors duration-200"
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
                  ? 'bg-secondary-300 text-secondary-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-600 to-purple-600 text-white hover:from-primary-700 hover:to-purple-700 shadow-medium hover:shadow-large transform hover:scale-105'
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