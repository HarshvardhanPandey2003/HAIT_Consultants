'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

export default function NewEnquiryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Timezone converter state
    const [showConverter, setShowConverter] = useState(false);
    const [converterTimezone, setConverterTimezone] = useState('Asia/Dubai');
    const [converterDate, setConverterDate] = useState('');
    const [converterStartTime, setConverterStartTime] = useState('');
    const [converterEndTime, setConverterEndTime] = useState('');
    const [convertedResult, setConvertedResult] = useState<any>(null);
    const [converting, setConverting] = useState(false);

    const [formData, setFormData] = useState({
        topicName: '',      // REQUIRED
        spoc: '',           // REQUIRED
        technology: '',     // Optional
        partnerName: '',
        vendorName: '',
        customerName: '',
        solutionType: '',
        perHourRate: '',
        hoursDelivery: '',
        enquiryDate: '',
        startDate: '',
        endDate: '',
        location: '',
        status: '',
        remarks: '',
        learning: '',
        sessionStartTime: '',
        sessionEndTime: '',
        daysType: '',
        customDays: [] as string[],
    });

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

                {/* Timezone Converter Widget */}
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

                        {/* Session Timings */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">Session Timings (IST - 24 Hour Format)</h3>
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
