'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewEnquiryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    topicName: '',      // REQUIRED
    spoc: '',           // REQUIRED
    technology: '',     // Optional
    partnerName: '',
    vendorName: '',
    customerName: '',
    solutionType: '',   // Changed from 'Training' to ''
    perHourRate: '',
    hoursDelivery: '',
    enquiryDate: '',    // Changed from new Date()... to ''
    startDate: '',
    endDate: '',
    location: '',       // Changed from 'Online' to ''
    status: '',         // Changed from 'Open' to ''
    remarks: '',
    learning: '',
    sessionStartTime: '',
    sessionEndTime: '',
    daysType: '',
    customDays: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicName: formData.topicName,
          spoc: formData.spoc,
          // Send null for empty optional fields
          technology: formData.technology || null,
          partnerName: formData.partnerName || null,
          vendorName: formData.vendorName || null,
          customerName: formData.customerName || null,
          solutionType: formData.solutionType || null,
          location: formData.location || null,
          status: formData.status || null,
          perHourRate: formData.perHourRate ? parseInt(formData.perHourRate) : null,
          hoursDelivery: formData.hoursDelivery ? parseInt(formData.hoursDelivery) : null,
          enquiryDate: formData.enquiryDate ? new Date(formData.enquiryDate) : null,
          startDate: formData.startDate ? new Date(formData.startDate) : null,
          endDate: formData.endDate ? new Date(formData.endDate) : null,
          remarks: formData.remarks || null,
          learning: formData.learning || null,
          sessionStartTime: formData.sessionStartTime || null,
          sessionEndTime: formData.sessionEndTime || null,
          daysType: formData.daysType || null,
          customDays: formData.customDays.length > 0 ? formData.customDays : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to create enquiry');

      router.push('/enquiries');
    } catch (err) {
      setError('Failed to create enquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

        {/* Header */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/enquiries')}
              className="w-10 h-10 bg-slate-700/50 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">New Enquiry</h1>
              <p className="text-slate-400 text-sm">Create a new client enquiry or project</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

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
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="e.g., AWS Cloud Practitioner"
                    value={formData.topicName}
                    onChange={(e) => setFormData({ ...formData, topicName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Technology</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="e.g., AWS, Azure, Python"
                    value={formData.technology}
                    onChange={(e) => setFormData({ ...formData, technology: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">SPOC (Point of Contact) *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Contact person name"
                    value={formData.spoc}
                    onChange={(e) => setFormData({ ...formData, spoc: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Customer Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Client/Company name"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Session Timings </h3>
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

                {/* Days Configuration Section */}
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
                                  ? formData.customDays.filter(d => d !== day)
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

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Partner Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Partner organization"
                    value={formData.partnerName}
                    onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Vendor Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Vendor name"
                    value={formData.vendorName}
                    onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                  />
                </div>
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
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="e.g., 2000"
                    value={formData.perHourRate}
                    onChange={(e) => setFormData({ ...formData, perHourRate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Hours of Delivery</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="e.g., 40"
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
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Any additional notes or remarks..."
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Learning Notes</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="What to learn or prepare for this enquiry..."
                    value={formData.learning}
                    onChange={(e) => setFormData({ ...formData, learning: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4 mt-8 pt-6 border-t border-slate-700">
            <button
              type="button"
              onClick={() => router.push('/enquiries')}
              className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Enquiry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
