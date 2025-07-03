import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Mail, Trash2, AlertCircle } from 'lucide-react';

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
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Validate Your Email Lists Instantly
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Check if your emails are real or fake with our advanced 3-layer validation system. 
          Get accurate results for up to 10,000 emails at once.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="text-center p-4">
          <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mx-auto mb-3">
            <Mail className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Syntax Check</h3>
          <p className="text-sm text-gray-600">Validate email format and structure</p>
        </div>
        <div className="text-center p-4">
          <div className="flex items-center justify-center w-12 h-12 bg-success-100 rounded-lg mx-auto mb-3">
            <FileText className="w-6 h-6 text-success-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Domain Check</h3>
          <p className="text-sm text-gray-600">Verify domain existence and MX records</p>
        </div>
        <div className="text-center p-4">
          <div className="flex items-center justify-center w-12 h-12 bg-warning-100 rounded-lg mx-auto mb-3">
            <Upload className="w-6 h-6 text-warning-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">SMTP Verification</h3>
          <p className="text-sm text-gray-600">Test actual email deliverability</p>
        </div>
      </div>

      {/* Input Methods */}
      <div className="card p-6">
        <div className="flex space-x-4 mb-6">
          <button
            type="button"
            onClick={() => setInputMethod('text')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              inputMethod === 'text'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Paste Emails
          </button>
          <button
            type="button"
            onClick={() => setInputMethod('file')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              inputMethod === 'file'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Upload File
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {inputMethod === 'text' && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email Addresses
                </label>
                <div className="flex items-center space-x-2">
                  {emailCount > 0 && (
                    <span className="text-sm text-gray-500">
                      {emailCount} email{emailCount !== 1 ? 's' : ''} detected
                    </span>
                  )}
                  {emails && (
                    <button
                      type="button"
                      onClick={clearText}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={emails}
                onChange={handleTextChange}
                placeholder="Paste your email addresses here (one per line or comma-separated)&#10;&#10;Example:&#10;john@example.com&#10;jane@company.org&#10;test@domain.net"
                className="input min-h-[200px] resize-y"
                rows={10}
              />
              <p className="text-xs text-gray-500 mt-2">
                Supports comma-separated or line-separated email addresses. Maximum 10,000 emails.
              </p>
            </div>
          )}

          {inputMethod === 'file' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Email File
              </label>
              
              {!uploadedFile ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    isDragActive
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {isDragActive ? 'Drop your file here' : 'Drop your file here or click to browse'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports CSV and TXT files up to 10MB
                  </p>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-8 h-8 text-primary-600" />
                      <div>
                        <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                CSV files should have emails in the first column or a column named 'email'. 
                TXT files should have one email per line.
              </p>
            </div>
          )}

          {/* Warning for large lists */}
          {(emailCount > 1000 || (uploadedFile && uploadedFile.size > 100000)) && (
            <div className="mb-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-warning-600 mr-2" />
                <p className="text-sm text-warning-800">
                  Large email lists may take several minutes to process. 
                  You'll be able to track progress in real-time.
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || (inputMethod === 'text' && !emails.trim()) || (inputMethod === 'file' && !uploadedFile)}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
              isSubmitting || (inputMethod === 'text' && !emails.trim()) || (inputMethod === 'file' && !uploadedFile)
                ? 'btn-disabled'
                : 'btn-primary'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : (
              'Validate Emails'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmailInput; 