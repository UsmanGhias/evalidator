import React, { useState } from 'react';
import { Download, Filter, Search, CheckCircle, XCircle, AlertTriangle, Clock, RefreshCw, FileText, Users, Mail, Target, Zap } from 'lucide-react';

const ValidationResults = ({ results, jobId, onStartOver, userPlan = 'free', isAnonymous = false }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('email');
  const [sortOrder, setSortOrder] = useState('asc');

  if (!results || !results.results) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-neutral-600">Loading results...</p>
      </div>
    );
  }

  const filteredResults = results.results.filter(result => {
    const matchesFilter = filter === 'all' || result.status === filter;
    const matchesSearch = result.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'email') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    } else if (sortBy === 'deliverability_score') {
      aValue = aValue || 0;
      bValue = bValue || 0;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Valid':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      case 'Invalid':
        return <XCircle className="w-5 h-5 text-error-600" />;
      case 'Unknown':
        return <AlertTriangle className="w-5 h-5 text-warning-600" />;
      case 'Disposable':
        return <Clock className="w-5 h-5 text-warning-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-neutral-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Valid':
        return 'bg-success-50 text-success-700 border-success-200';
      case 'Invalid':
        return 'bg-error-50 text-error-700 border-error-200';
      case 'Unknown':
        return 'bg-warning-50 text-warning-700 border-warning-200';
      case 'Disposable':
        return 'bg-warning-50 text-warning-700 border-warning-200';
      default:
        return 'bg-neutral-50 text-neutral-700 border-neutral-200';
    }
  };

  const getDeliverabilityColor = (score) => {
    if (score >= 90) return 'text-success-600';
    if (score >= 70) return 'text-warning-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-error-600';
  };

  const exportToCSV = () => {
    const headers = ['Email', 'Status', 'Details', 'Is Role Email', 'Deliverability Score', 'Validation Time'];
    const csvContent = [
      headers.join(','),
      ...sortedResults.map(result => 
        `"${result.email}","${result.status}","${result.details}","${result.is_role ? 'Yes' : 'No'}","${result.deliverability_score || 'N/A'}","${result.validation_time || 'N/A'}s"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-validation-results-${jobId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const stats = {
    total: results.results.length,
    valid: results.results.filter(r => r.status === 'Valid').length,
    invalid: results.results.filter(r => r.status === 'Invalid').length,
    unknown: results.results.filter(r => r.status === 'Unknown').length,
    disposable: results.results.filter(r => r.status === 'Disposable').length,
    role: results.results.filter(r => r.is_role).length
  };

  // Calculate average deliverability score
  const avgDeliverability = results.results.reduce((acc, r) => acc + (r.deliverability_score || 0), 0) / results.results.length;
  
  // Get accuracy based on plan
  const getAccuracy = () => {
    if (isAnonymous) return '93%';
    switch (userPlan) {
      case 'enterprise': return '99%';
      case 'professional': return '97%';
      case 'starter': return '95%';
      default: return '93%';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-success-600 to-green-600 rounded-2xl shadow-large mb-4">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-4xl font-bold text-neutral-900 mb-2">
          Validation Complete!
        </h2>
        <p className="text-xl text-neutral-600">
          Processed {stats.total} email addresses with {getAccuracy()} accuracy
        </p>
        {isAnonymous && (
          <div className="mt-4 inline-flex items-center space-x-2 bg-info-50 px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-info-500 rounded-full"></div>
            <span className="text-sm text-info-700 font-medium">Anonymous validation</span>
          </div>
        )}
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-card border border-neutral-200 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{stats.total}</div>
          <div className="text-sm text-neutral-600">Total</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-card border border-neutral-200 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-success-500 to-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div className="text-2xl font-bold text-success-600">{stats.valid}</div>
          <div className="text-sm text-neutral-600">Valid</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-card border border-neutral-200 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-error-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <XCircle className="w-6 h-6 text-white" />
          </div>
          <div className="text-2xl font-bold text-error-600">{stats.invalid}</div>
          <div className="text-sm text-neutral-600">Invalid</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-card border border-neutral-200 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-warning-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div className="text-2xl font-bold text-warning-600">{stats.unknown}</div>
          <div className="text-sm text-neutral-600">Unknown</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-card border border-neutral-200 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-warning-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div className="text-2xl font-bold text-warning-600">{stats.disposable}</div>
          <div className="text-sm text-neutral-600">Disposable</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-card border border-neutral-200 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-neutral-500 to-gray-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="text-2xl font-bold text-neutral-600">{stats.role}</div>
          <div className="text-sm text-neutral-600">Role Emails</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-card border border-neutral-200 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div className={`text-2xl font-bold ${getDeliverabilityColor(avgDeliverability)}`}>
            {Math.round(avgDeliverability)}%
          </div>
          <div className="text-sm text-neutral-600">Avg Score</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-large border border-neutral-200 p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Filters */}
          <div className="flex flex-wrap items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-neutral-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                <option value="all">All Results</option>
                <option value="Valid">Valid</option>
                <option value="Invalid">Invalid</option>
                <option value="Unknown">Unknown</option>
                <option value="Disposable">Disposable</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm w-48"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-all duration-300 font-semibold text-sm shadow-medium"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onStartOver}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-300 font-semibold text-sm shadow-medium"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Validate More</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl shadow-large border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">
                  <button
                    onClick={() => {
                      setSortBy('email');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="flex items-center space-x-1 hover:text-neutral-900 transition-colors duration-200"
                  >
                    <span>Email Address</span>
                    {sortBy === 'email' && (
                      <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">
                  <button
                    onClick={() => {
                      setSortBy('status');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="flex items-center space-x-1 hover:text-neutral-900 transition-colors duration-200"
                  >
                    <span>Status</span>
                    {sortBy === 'status' && (
                      <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Details</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">
                  <button
                    onClick={() => {
                      setSortBy('deliverability_score');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="flex items-center space-x-1 hover:text-neutral-900 transition-colors duration-200"
                  >
                    <span>Score</span>
                    {sortBy === 'deliverability_score' && (
                      <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {sortedResults.map((result, index) => (
                <tr key={index} className="hover:bg-neutral-50 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(result.status)}
                      <span className="font-medium text-neutral-900">{result.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(result.status)}`}>
                      {result.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600 max-w-xs truncate">
                    {result.details}
                  </td>
                  <td className="px-6 py-4">
                    {result.is_role ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                        Role Email
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
                        Personal
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className={`text-sm font-medium ${getDeliverabilityColor(result.deliverability_score || 0)}`}>
                        {result.deliverability_score || 0}%
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {result.validation_time ? `${result.validation_time}s` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {sortedResults.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-600">No results match your current filters.</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-8 bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-6 border border-primary-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Validation Summary</h3>
            <p className="text-neutral-600">
              {stats.valid} valid emails ({((stats.valid / stats.total) * 100).toFixed(1)}% deliverability rate)
            </p>
            <p className="text-sm text-neutral-500 mt-1">
              Processed with {getAccuracy()} accuracy • Average confidence: {Math.round(avgDeliverability)}%
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-600">
              {((stats.valid / stats.total) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-neutral-600">Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationResults; 