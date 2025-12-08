'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

// Timezone options
const timezones = [
    { label: 'IST - India (UTC+5:30)', value: 'Asia/Kolkata', offset: '+05:30' },
    { label: 'GST - UAE/Oman (UTC+4:00)', value: 'Asia/Dubai', offset: '+04:00' },
    { label: 'PST - Pacific (UTC-8:00)', value: 'America/Los_Angeles', offset: '-08:00' },
    { label: 'EST - Eastern (UTC-5:00)', value: 'America/New_York', offset: '-05:00' },
    { label: 'GMT - London (UTC+0:00)', value: 'Europe/London', offset: '+00:00' },
    { label: 'CET - Central Europe (UTC+1:00)', value: 'Europe/Paris', offset: '+01:00' },
    { label: 'JST - Japan (UTC+9:00)', value: 'Asia/Tokyo', offset: '+09:00' },
    { label: 'AEST - Australia East (UTC+10:00)', value: 'Australia/Sydney', offset: '+10:00' },
];

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
  sessionStartTime: string | null;
  sessionEndTime: string | null;
  daysType: string | null;
  customDays: string | null;
}

export default function EnquiryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  // Timezone converter state
  const [showConverter, setShowConverter] = useState(false);
  const [converterTimezone, setConverterTimezone] = useState('Asia/Dubai');
  const [converterDate, setConverterDate] = useState('');
  const [converterStartTime, setConverterStartTime] = useState('');
  const [converterEndTime, setConverterEndTime] = useState('');
  const [convertedResult, setConvertedResult] = useState<any>(null);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    fetchEnquiry();
  }, []);

  const fetchEnquiry = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/enquiries/${params.id}`);
      const data = await response.json();
      setEnquiry(data);

      // Parse customDays if it exists
      let parsedCustomDays: string[] = [];
      if (data.customDays) {
        try {
          parsedCustomDays = JSON.parse(data.customDays);
        } catch (e) {
          console.error('Failed to parse customDays:', e);
        }
      }

      // Initialize form data with enquiry data
      setFormData({
        topicName: data.topicName,
        technology: data.technology || '',
        spoc: data.spoc,
        partnerName: data.partnerName || '',
        vendorName: data.vendorName || '',
        customerName: data.customerName || '',
        solutionType: data.solutionType || '',
        perHourRate: data.perHourRate || '',
        hoursDelivery: data.hoursDelivery || '',
        enquiryDate: data.enquiryDate ? data.enquiryDate.split('T')[0] : '',
        startDate: data.startDate ? data.startDate.split('T')[0] : '',
        endDate: data.endDate ? data.endDate.split('T')[0] : '',
        location: data.location || '',
        status: data.status || '',
        remarks: data.remarks || '',
        learning: data.learning || '',
        sessionStartTime: data.sessionStartTime || '',
        sessionEndTime: data.sessionEndTime || '',
        daysType: data.daysType || '',
        customDays: parsedCustomDays,
      });
    } catch (error) {
      console.error('Failed to fetch enquiry:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToIST = async () => {
    if (!converterDate || !converterStartTime || !converterEndTime) {
      alert('Please fill in date and both time fields');
      return;
    }

    setConverting(true);
    try {
      const [startResponse, endResponse] = await Promise.all([
        fetch('http://localhost:5000/api/enquiries/convert-to-ist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            time: converterStartTime,
            date: converterDate,
            timezone: converterTimezone
          })
        }),
        fetch('http://localhost:5000/api/enquiries/convert-to-ist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            time: converterEndTime,
            date: converterDate,
            timezone: converterTimezone
          })
        })
      ]);

      const startData = await startResponse.json();
      const endData = await endResponse.json();

      setConvertedResult({
        startTime: startData.converted.time,
        endTime: endData.converted.time,
        date: startData.converted.date,
        dateChanged: startData.converted.dateChanged || endData.converted.dateChanged
      });
    } catch (error) {
      console.error('Conversion error:', error);
      alert('Failed to convert timezone');
    } finally {
      setConverting(false);
    }
  };

  const applyConvertedTimes = () => {
    if (!convertedResult) return;

    setFormData({
      ...formData,
      sessionStartTime: convertedResult.startTime,
      sessionEndTime: convertedResult.endTime
    });

    alert(`✅ Times applied in IST!\nStart: ${convertedResult.startTime}\nEnd: ${convertedResult.endTime}`);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`http://localhost:5000/api/enquiries/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updated = await response.json();
        setEnquiry(updated);
        setIsEditing(false);
        alert('Enquiry updated successfully!');
        fetchEnquiry();
      } else {
        alert('Failed to update enquiry');
      }
    } catch (error) {
      console.error('Failed to update enquiry:', error);
      alert('Failed to update enquiry');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this enquiry?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/enquiries/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/enquiries');
      } else {
        alert('Failed to delete enquiry');
      }
    } catch (error) {
      console.error('Failed to delete enquiry:', error);
      alert('Failed to delete enquiry');
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'Open': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'Confirmed': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Delivered': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Lost': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const displayDays = () => {
    if (!enquiry?.daysType) return 'Not specified';

    if (enquiry.daysType === 'Weekdays') return 'Weekdays (Mon-Fri)';
    if (enquiry.daysType === 'Weekends') return 'Weekends (Sat-Sun)';

    if (enquiry.daysType === 'Custom' && enquiry.customDays) {
      try {
        const days = JSON.parse(enquiry.customDays);
        return days.join(', ');
      } catch (e) {
        return 'Custom';
      }
    }

    return enquiry.daysType;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!enquiry || !formData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Enquiry not found</p>
          <button
            onClick={() => router.push('/enquiries')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold rounded-lg"
          >
            Back to Enquiries
          </button>
        </div>
      </div>
    );
  }

  const totalAmount = (enquiry.perHourRate && enquiry.hoursDelivery) ? (enquiry.perHourRate * enquiry.hoursDelivery) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

        {/* Header */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 bg-slate-700/50 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <span className="text-slate-500 font-mono text-sm">{enquiry.enquiryId}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(enquiry.status)}`}>
                    {enquiry.status}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-white">{enquiry.topicName}</h1>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => router.push('/schedule')}
                    className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 font-semibold rounded-lg transition-all flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Schedule</span>
                  </button>

                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 font-semibold rounded-lg transition-all flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-semibold rounded-lg transition-all flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      fetchEnquiry();
                    }}
                    className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={saving}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <p className="text-slate-400 text-sm mb-2">Per Hour Rate</p>
            <p className="text-3xl font-bold text-cyan-400">{enquiry.perHourRate ? `₹${enquiry.perHourRate}` : 'N/A'}</p>
          </div>
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <p className="text-slate-400 text-sm mb-2">Total Hours</p>
            <p className="text-3xl font-bold text-emerald-400">{enquiry.hoursDelivery ? `${enquiry.hoursDelivery}h` : 'N/A'}</p>
          </div>
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <p className="text-slate-400 text-sm mb-2">Total Amount</p>
            <p className="text-3xl font-bold text-purple-400">{totalAmount > 0 ? `₹${totalAmount.toLocaleString()}` : 'N/A'}</p>
          </div>
        </div>

        {/* Timezone Converter Widget - Only show in edit mode */}
        {isEditing && (
          <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 backdrop-blur-xl border border-purple-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🌍</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Timezone Converter</h3>
                  <p className="text-slate-400 text-sm">Convert session times from any timezone to IST</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConverter(!showConverter)}
                className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-all text-sm font-medium"
              >
                {showConverter ? 'Hide' : 'Show'} Converter
              </button>
            </div>

            {showConverter && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Your Timezone</label>
                    <select
                      value={converterTimezone}
                      onChange={(e) => setConverterTimezone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {timezones.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Reference Date</label>
                    <input
                      type="date"
                      value={converterDate}
                      onChange={(e) => setConverterDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Start Time (Your TZ)</label>
                    <input
                      type="time"
                      value={converterStartTime}
                      onChange={(e) => setConverterStartTime(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">End Time (Your TZ)</label>
                    <input
                      type="time"
                      value={converterEndTime}
                      onChange={(e) => setConverterEndTime(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConvertToIST}
                  disabled={converting}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed"
                >
                  {converting ? 'Converting...' : '🔄 Convert to IST'}
                </button>

                {convertedResult && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-emerald-400 font-semibold mb-2">✅ Converted to IST:</p>
                        <div className="space-y-1 text-sm">
                          <p className="text-white">
                            <span className="text-slate-400">Start Time:</span> <span className="font-mono font-bold">{convertedResult.startTime}</span>
                          </p>
                          <p className="text-white">
                            <span className="text-slate-400">End Time:</span> <span className="font-mono font-bold">{convertedResult.endTime}</span>
                          </p>
                          {convertedResult.dateChanged && (
                            <p className="text-yellow-400 text-xs mt-2">
                              ⚠️ Note: Date adjusted due to timezone conversion
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={applyConvertedTimes}
                        className="ml-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all text-sm whitespace-nowrap"
                      >
                        Apply to Form
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-500 italic">
                  💡 Tip: All times are stored in IST in the database. Use this converter when scheduling from different timezones.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Details or Edit Form */}
        {!isEditing ? (
          // VIEW MODE
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-8 space-y-8">

            {/* Basic Info */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Technology</p>
                  <p className="text-white font-medium">{enquiry.technology || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Solution Type</p>
                  <p className="text-white font-medium">{enquiry.solutionType || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Location</p>
                  <p className="text-white font-medium">{enquiry.location || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">SPOC</p>
                  <p className="text-white font-medium">{enquiry.spoc}</p>
                </div>
              </div>
            </div>

            {/* Session Timing & Days */}
            {(enquiry.sessionStartTime || enquiry.sessionEndTime || enquiry.daysType) && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Session Schedule</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {enquiry.sessionStartTime && enquiry.sessionEndTime && (
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Session Timing (IST)</p>
                      <p className="text-white font-medium">
                        {enquiry.sessionStartTime} - {enquiry.sessionEndTime}
                      </p>
                    </div>
                  )}
                  {enquiry.daysType && (
                    <div className="md:col-span-2">
                      <p className="text-slate-400 text-sm mb-1">Training Days</p>
                      <p className="text-white font-medium">{displayDays()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Client Details */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Client Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Customer Name</p>
                  <p className="text-white font-medium">{enquiry.customerName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Partner Name</p>
                  <p className="text-white font-medium">{enquiry.partnerName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Vendor Name</p>
                  <p className="text-white font-medium">{enquiry.vendorName || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Timeline</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Enquiry Date</p>
                  <p className="text-white font-medium">{enquiry.enquiryDate ? new Date(enquiry.enquiryDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Start Date</p>
                  <p className="text-white font-medium">
                    {enquiry.startDate ? new Date(enquiry.startDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">End Date</p>
                  <p className="text-white font-medium">
                    {enquiry.endDate ? new Date(enquiry.endDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {(enquiry.remarks || enquiry.learning) && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Notes</h2>
                {enquiry.remarks && (
                  <div className="mb-4">
                    <p className="text-slate-400 text-sm mb-2">Remarks</p>
                    <p className="text-white bg-slate-900/50 rounded-lg p-4">{enquiry.remarks}</p>
                  </div>
                )}
                {enquiry.learning && (
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Learning Notes</p>
                    <p className="text-white bg-slate-900/50 rounded-lg p-4">{enquiry.learning}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // EDIT MODE
          <form onSubmit={handleUpdate} className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-8">
            <div className="space-y-6">

              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Topic Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      value={formData.topicName}
                      onChange={(e) => setFormData({ ...formData, topicName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Technology</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      value={formData.technology}
                      onChange={(e) => setFormData({ ...formData, technology: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">SPOC *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      value={formData.spoc}
                      onChange={(e) => setFormData({ ...formData, spoc: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Customer Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Partner Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      value={formData.partnerName}
                      onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Vendor Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      value={formData.vendorName}
                      onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Session Timing */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Session Timing (IST - 24 Hour Format)</h3>
                <p className="text-sm text-slate-400 mb-4">
                  ℹ️ Enter times in IST. Use the converter above if scheduling from a different timezone.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Start Time</label>
                    <input
                      type="time"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      value={formData.sessionStartTime}
                      onChange={(e) => setFormData({ ...formData, sessionStartTime: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">End Time</label>
                    <input
                      type="time"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      value={formData.sessionEndTime}
                      onChange={(e) => setFormData({ ...formData, sessionEndTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Days Configuration */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Training Days</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Days Type</label>
                    <select
                      value={formData.daysType}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      onChange={(e) => setFormData({ ...formData, daysType: e.target.value, customDays: [] })}
                    >
                      <option value="">Select days pattern</option>
                      <option value="Weekdays">Weekdays (Mon-Fri)</option>
                      <option value="Weekends">Weekends (Sat-Sun)</option>
                      <option value="Custom">Custom Days</option>
                    </select>
                  </div>

                  {formData.daysType === 'Custom' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Select Days</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              const newDays = formData.customDays.includes(day)
                                ? formData.customDays.filter((d: string) => d !== day)
                                : [...formData.customDays, day];
                              setFormData({ ...formData, customDays: newDays });
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${formData.customDays.includes(day)
                              ? 'bg-cyan-500 text-white'
                              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                              }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                      {formData.customDays.length > 0 && (
                        <p className="text-sm text-slate-400 mt-2">
                          Selected: {formData.customDays.join(', ')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Project Details */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Project Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Solution Type</label>
                    <select
                      value={formData.solutionType}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      onChange={(e) => setFormData({ ...formData, solutionType: e.target.value })}
                    >
                      <option value="">Select type</option>
                      <option value="Training">Training</option>
                      <option value="Content Development">Content Development</option>
                      <option value="Consulting">Consulting</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                    <select
                      value={formData.location}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    >
                      <option value="">Select location</option>
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Per Hour Rate (₹)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      value={formData.perHourRate}
                      onChange={(e) => setFormData({ ...formData, perHourRate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Hours of Delivery</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      value={formData.hoursDelivery}
                      onChange={(e) => setFormData({ ...formData, hoursDelivery: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                    <select
                      value={formData.status}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="">Select status</option>
                      <option value="Open">Open</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Lost">Lost</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Enquiry Date</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      value={formData.enquiryDate}
                      onChange={(e) => setFormData({ ...formData, enquiryDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Additional Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Remarks</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Learning Notes</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      value={formData.learning}
                      onChange={(e) => setFormData({ ...formData, learning: e.target.value })}
                    />
                  </div>
                </div>
              </div>

            </div>
          </form>
        )}
      </div>
    </div>
  );
}
