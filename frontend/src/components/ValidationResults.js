import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Trash2, 
  Download, 
  Filter,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { getResults, downloadResults } from '../services/api';

const ValidationResults = ({ results: initialResults, jobId, onStartOver }) => {
  const [results, setResults] = useState(initialResults);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const loadResults = async (page = 1, filter = '') => {
    setLoading(true);
    try {
      const data = await getResults(jobId, page, 50, filter);
      setResults(data);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filter) => {
    setStatusFilter(filter);
    loadResults(1, filter);
  };

  const handlePageChange = (page) => {
    loadResults(page, statusFilter);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadResults(jobId);
    } catch (error) {
      console.error('Failed to download results:', error);
      alert('Failed to download results. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'valid':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      case 'invalid':
        return <XCircle className="w-5 h-5 text-error-600" />;
      case 'catch-all':
        return <AlertTriangle className="w-5 h-5 text-warning-600" />;
      case 'disposable':
        return <Trash2 className="w-5 h-5 text-orange-600" />;
      case 'syntax error':
        return <XCircle className="w-5 h-5 text-error-600" />;
      case 'no mx record':
        return <XCircle className="w-5 h-5 text-error-600" />;
      case 'smtp error':
        return <XCircle className="w-5 h-5 text-error-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium border";
    
    switch (status.toLowerCase()) {
      case 'valid':
        return `${baseClasses} status-valid`;
      case 'invalid':
      case 'syntax error':
      case 'no mx record':
      case 'smtp error':
        return `${baseClasses} status-invalid`;
      case 'catch-all':
        return `${baseClasses} status-warning`;
      case 'disposable':
        return `${baseClasses} status-disposable`;
      default:
        return `${baseClasses} bg-gray-50 text-gray-800 border-gray-200`;
    }
  };

  const statusCounts = results?.summary || {};
  const totalResults = results?.pagination?.total || 0;
  const currentResults = results?.results || [];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Validation Results</h2>
            <p className="text-gray-600">
              {results?.total_emails?.toLocaleString() || 0} emails processed
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="btn btn-success flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Downloading...' : 'Download CSV'}</span>
            </button>
            <button
              onClick={onStartOver}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Start Over</span>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="card p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                {getStatusIcon(status)}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {count.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 capitalize">
                {status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange('')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === '' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {Object.keys(statusCounts).map((status) => (
              <button
                key={status}
                onClick={() => handleFilterChange(status)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                  statusFilter === status 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status} ({statusCounts[status]})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      <span className="ml-2 text-gray-600">Loading results...</span>
                    </div>
                  </td>
                </tr>
              ) : currentResults.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                    No results found
                  </td>
                </tr>
              ) : (
                currentResults.map((result, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {result.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(result.status)}
                        <span className={getStatusBadge(result.status)}>
                          {result.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {result.details || 'No additional details'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {results?.pagination && results.pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * 50) + 1} to{' '}
                {Math.min(currentPage * 50, totalResults)} of{' '}
                {totalResults.toLocaleString()} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg ${
                    currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center space-x-1">
                  {[...Array(Math.min(5, results.pagination.pages))].map((_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          currentPage === page
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === results.pagination.pages}
                  className={`p-2 rounded-lg ${
                    currentPage === results.pagination.pages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationResults; 