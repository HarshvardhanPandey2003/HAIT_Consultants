'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Enquiry {
  enquiryId: string;
  topicName: string;
  technology: string | null;
  spoc: string;
  partnerName: string | null;
  vendorName: string | null;
  customerName: string | null;
  solutionType: string | null;
  perHourRate: number | null;
  hoursDelivery: number | null;
  enquiryDate: string | null;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  status: string | null;
  remarks: string | null;
  learning: string | null;
  // NEW FIELDS
  sessionStartTime: string | null;
  sessionEndTime: string | null;
  daysType: string | null;
  customDays: string | null;
}

export default function EnquiriesPage() {
  const router = useRouter();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchQuery, setSearchQuery] = useState(''); // NEW: Search state

  useEffect(() => {
    fetchEnquiries();
  }, [filter, dateRange]);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:5000/api/enquiries?';

      if (filter !== 'all') {
        const capitalizedStatus = filter.charAt(0).toUpperCase() + filter.slice(1);
        url += `status=${capitalizedStatus}&`;
      }

      if (dateRange.start) {
        url += `startDate=${dateRange.start}&`;
      }
      if (dateRange.end) {
        url += `endDate=${dateRange.end}&`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setEnquiries(data);
    } catch (error) {
      console.error('Failed to fetch enquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearDateFilter = () => {
    setDateRange({ start: '', end: '' });
  };

  // NEW: Filter enquiries based on search query
  const filteredEnquiries = enquiries.filter((enquiry) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      enquiry.topicName.toLowerCase().includes(query) ||
      (enquiry.technology && enquiry.technology.toLowerCase().includes(query)) ||
      enquiry.spoc.toLowerCase().includes(query) ||
      (enquiry.customerName && enquiry.customerName.toLowerCase().includes(query)) ||
      (enquiry.partnerName && enquiry.partnerName.toLowerCase().includes(query)) ||
      (enquiry.vendorName && enquiry.vendorName.toLowerCase().includes(query)) ||
      enquiry.enquiryId.toLowerCase().includes(query) ||
      (enquiry.solutionType && enquiry.solutionType.toLowerCase().includes(query)) ||
      (enquiry.location && enquiry.location.toLowerCase().includes(query))
    );
  });

  const stats = {
    total: enquiries.length,
    open: enquiries.filter((e) => e.status === 'Open').length,
    delivered: enquiries.filter((e) => e.status === 'Delivered').length,
    lost: enquiries.filter((e) => e.status === 'Lost').length,
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'Open': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'Delivered': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Lost': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Confirmed': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDateRangeDisplay = (start: string | null, end: string | null) => {
    if (!start && !end) return 'Dates not set';
    if (start && end) {
      return `${formatDate(start)} → ${formatDate(end)}`;
    }
    if (start) return `From ${formatDate(start)}`;
    return `Until ${formatDate(end)}`;
  };

  // NEW: Format timing display
  const getTimingDisplay = (startTime: string | null, endTime: string | null) => {
    if (!startTime && !endTime) return 'N/A';
    if (startTime && endTime) return `${startTime} - ${endTime}`;
    if (startTime) return `From ${startTime}`;
    return `Until ${endTime}`;
  };

  // NEW: Format days display
  const getDaysDisplay = (daysType: string | null, customDays: string | null) => {
    if (!daysType) return 'N/A';
    if (daysType === 'Custom' && customDays) {
      try {
        const days = JSON.parse(customDays);
        return days.map((d: string) => d.slice(0, 3)).join(', ');
      } catch {
        return daysType;
      }
    }
    return daysType;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Background effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

        {/* Header */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <button
                  onClick={() => router.push('/')}
                  className="w-10 h-10 bg-slate-700/50 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white">Enquiry Management</h1>
                  <p className="text-slate-400 mt-0.5 text-sm">Track client projects and training requests</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/enquiries/new')}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold rounded-md transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-cyan-500/25 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm">New Enquiry</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total</p>
                <p className="text-white text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔓</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Open</p>
                <p className="text-white text-2xl font-bold">{stats.open}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Delivered</p>
                <p className="text-white text-2xl font-bold">{stats.delivered}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Lost</p>
                <p className="text-white text-2xl font-bold">{stats.lost}</p>
              </div>
            </div>
          </div>
        </div>

        {/* NEW: Search Bar */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 mb-6">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by topic, customer, vendor, partner, technology, SPOC, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-slate-400 mt-2">
              Found {filteredEnquiries.length} result{filteredEnquiries.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
          )}
        </div>

        {/* Filters Section */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">

            {/* Status Filter Tabs */}
            <div className="flex-shrink-0">
              <p className="text-slate-400 text-xs mb-2 font-semibold uppercase tracking-wide">Status</p>
              <div className="inline-flex space-x-2 bg-slate-900/50 rounded-lg p-1">
                {[
                  { value: 'all', label: 'All', icon: '📋' },
                  { value: 'open', label: 'Open', icon: '🔓' },
                  { value: 'confirmed', label: 'Confirmed', icon: '✔️' },
                  { value: 'delivered', label: 'Delivered', icon: '✅' },
                  { value: 'lost', label: 'Lost', icon: '❌' }
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setFilter(tab.value)}
                    className={`px-3 py-2 rounded-md font-medium transition-all whitespace-nowrap text-sm flex items-center space-x-1 ${filter === tab.value
                        ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="flex-shrink-0">
              <p className="text-slate-400 text-xs mb-2 font-semibold uppercase tracking-wide">Date Range (Start Date)</p>
              <div className="flex items-center space-x-2 bg-slate-900/50 rounded-lg p-1">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 w-40"
                />

                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>

                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 w-40"
                />

                {(dateRange.start || dateRange.end) && (
                  <button
                    onClick={clearDateFilter}
                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-md transition-colors text-sm font-medium"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active Filter Display */}
          {(filter !== 'all' || dateRange.start || dateRange.end) && (
            <div className="mt-3 flex items-center space-x-2 text-sm">
              <span className="text-slate-500">Active filters:</span>
              {filter !== 'all' && (
                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/30 text-xs font-medium">
                  Status: {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </span>
              )}
              {(dateRange.start || dateRange.end) && (
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30 text-xs font-medium">
                  📅 {dateRange.start && new Date(dateRange.start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  {dateRange.start && dateRange.end && ' → '}
                  {dateRange.end && new Date(dateRange.end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Enquiries List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 mt-4">Loading enquiries...</p>
          </div>
        ) : filteredEnquiries.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredEnquiries.map((enquiry) => (
              <div
                key={enquiry.enquiryId}
                onClick={() => router.push(`/enquiries/${enquiry.enquiryId}`)}
                className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:border-slate-600 transition-all cursor-pointer transform hover:scale-[1.01]"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

                  {/* Left Section - Main Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-slate-500 font-mono text-sm">{enquiry.enquiryId}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(enquiry.status)}`}>
                        {enquiry.status || 'N/A'}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1">{enquiry.topicName}</h3>
                    <p className="text-slate-400 text-sm mb-4">{enquiry.technology || 'N/A'}</p>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm mb-4">
                      <div>
                        <p className="text-slate-500">Customer</p>
                        <p className="text-white font-medium">{enquiry.customerName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">SPOC</p>
                        <p className="text-white font-medium">{enquiry.spoc}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Type</p>
                        <p className="text-white font-medium">{enquiry.solutionType || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Location</p>
                        <p className="text-white font-medium">{enquiry.location || 'N/A'}</p>
                      </div>
                    </div>

                    {/* NEW: Session Timing & Days Display */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <span className="text-slate-500">Timing: </span>
                          <span className="text-white font-medium">
                            {getTimingDisplay(enquiry.sessionStartTime, enquiry.sessionEndTime)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <span className="text-slate-500">Days: </span>
                          <span className="text-white font-medium">
                            {getDaysDisplay(enquiry.daysType, enquiry.customDays)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Date Range Display */}
                    <div className="flex items-center space-x-2 text-sm">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className={`${(enquiry.startDate && enquiry.endDate) ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {getDateRangeDisplay(enquiry.startDate, enquiry.endDate)}
                      </span>
                    </div>
                  </div>

                  {/* Right Section - Financial Info */}
                  <div className="flex lg:flex-col items-center lg:items-end space-x-6 lg:space-x-0 lg:space-y-3 border-t lg:border-t-0 lg:border-l border-slate-700/50 pt-4 lg:pt-0 lg:pl-6">
                    <div className="text-center lg:text-right">
                      <p className="text-slate-500 text-xs mb-1">Rate</p>
                      <p className="text-2xl font-bold text-cyan-400">{enquiry.perHourRate ? `₹${enquiry.perHourRate}/hr` : 'N/A'}</p>
                    </div>
                    <div className="text-center lg:text-right">
                      <p className="text-slate-500 text-xs mb-1">Hours</p>
                      <p className="text-lg font-semibold text-emerald-400">{enquiry.hoursDelivery ? `${enquiry.hoursDelivery}h` : 'N/A'}</p>
                    </div>
                    <div className="text-center lg:text-right">
                      <p className="text-slate-500 text-xs mb-1">Total</p>
                      <p className="text-lg font-bold text-purple-400">{(enquiry.perHourRate && enquiry.hoursDelivery) ? `₹${(enquiry.perHourRate * enquiry.hoursDelivery).toLocaleString()}` : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" stroke-linejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No enquiries found</h3>
            <p className="text-slate-400 mb-6">
              {searchQuery
                ? `No results found for "${searchQuery}". Try a different search term.`
                : (dateRange.start || dateRange.end)
                  ? 'No enquiries found in the selected date range.'
                  : filter !== 'all'
                    ? `No ${filter} enquiries found.`
                    : 'Start by creating your first enquiry'}
            </p>
            {(searchQuery || dateRange.start || dateRange.end || filter !== 'all') ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  clearDateFilter();
                  setFilter('all');
                }}
                className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all"
              >
                Clear All Filters
              </button>
            ) : (
              <button
                onClick={() => router.push('/enquiries/new')}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all"
              >
                Create Enquiry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
