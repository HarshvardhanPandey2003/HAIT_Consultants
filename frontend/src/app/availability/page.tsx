'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ConflictDetail {
    date: string;
    sessionId: number;
    enquiryId: string;
    topicName: string;
    technology: string;
    customerName: string | null;
    status: string;
    existingTime: string;
    requestedTime: string;
    isCompleted: boolean;
}

interface BusyDate {
    date: string;
    dayOfWeek: string;
    conflicts: ConflictDetail[];
}

interface AvailableDate {
    date: string;
    dayOfWeek: string;
}

interface AvailabilityResponse {
    available: boolean;
    summary: {
        totalDates: number;
        availableDates: number;
        busyDates: number;
        availabilityPercentage: number;
    };
    availableDates: AvailableDate[];
    busyDates: BusyDate[];
    conflicts?: ConflictDetail[];
    message: string;
}

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Timezone options with proper IANA names
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

export default function AvailabilityPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AvailabilityResponse | null>(null);

    // Form state
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sessionStartTime, setSessionStartTime] = useState('');
    const [sessionEndTime, setSessionEndTime] = useState('');
    const [selectedTimezone, setSelectedTimezone] = useState('Asia/Kolkata'); // Default to IST
    const [daysType, setDaysType] = useState<'Weekdays' | 'Weekends' | 'Custom'>('Weekdays');
    const [customDays, setCustomDays] = useState<string[]>([]);

    const toggleCustomDay = (day: string) => {
        setCustomDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    // Convert time display based on selected timezone
    const getTimezoneLabel = () => {
        const tz = timezones.find(t => t.value === selectedTimezone);
        return tz ? tz.label.split(' - ')[0] : 'IST';
    };

    const handleCheckAvailability = async () => {
        if (!startDate || !endDate || !sessionStartTime || !sessionEndTime) {
            alert('Please fill in all required fields');
            return;
        }

        if (daysType === 'Custom' && customDays.length === 0) {
            alert('Please select at least one day for custom pattern');
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const response = await fetch('http://localhost:5000/api/availability/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startDate,
                    endDate,
                    sessionStartTime,
                    sessionEndTime,
                    timezone: selectedTimezone, // Send selected timezone
                    daysType,
                    customDays: daysType === 'Custom' ? customDays : null
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || 'Failed to check availability');
                return;
            }

            setResult(data);
        } catch (error) {
            console.error('Error checking availability:', error);
            alert('Failed to check availability');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
            {/* Background effects */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]"></div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                {/* Header */}
                <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 mb-6">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => router.push('/')}
                            className="w-10 h-10 bg-slate-700/50 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Check Availability</h1>
                            <p className="text-slate-400 mt-0.5 text-sm">Find out if you're free for new sessions</p>
                        </div>
                    </div>
                </div>

                {/* Input Form */}
                <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 mb-6">
                    <h2 className="text-lg font-bold text-white mb-4">📅 Enter Details</h2>

                    {/* Timezone Selector */}
                    <div className="mb-6 p-4 bg-slate-900/50 border border-cyan-500/30 rounded-lg">
                        <label className="block text-sm font-medium text-cyan-400 mb-2">
                            🌍 Select Your Timezone <span className="text-red-400">*</span>
                        </label>
                        <select
                            value={selectedTimezone}
                            onChange={(e) => setSelectedTimezone(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            {timezones.map((tz) => (
                                <option key={tz.value} value={tz.value}>
                                    {tz.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-slate-400 text-xs mt-2">
                            ℹ️ Times will be converted to IST for comparison with existing schedules
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Date Range */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Start Date <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                End Date <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>

                        {/* Time Range */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Session Start Time ({getTimezoneLabel()}) <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="time"
                                value={sessionStartTime}
                                onChange={(e) => setSessionStartTime(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Session End Time ({getTimezoneLabel()}) <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="time"
                                value={sessionEndTime}
                                onChange={(e) => setSessionEndTime(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>
                    </div>

                    {/* Days Pattern */}
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Days Pattern <span className="text-red-400">*</span>
                        </label>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setDaysType('Weekdays')}
                                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${daysType === 'Weekdays'
                                        ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white'
                                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                                    }`}
                            >
                                Weekdays
                            </button>
                            <button
                                onClick={() => setDaysType('Weekends')}
                                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${daysType === 'Weekends'
                                        ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white'
                                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                                    }`}
                            >
                                Weekends
                            </button>
                            <button
                                onClick={() => setDaysType('Custom')}
                                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${daysType === 'Custom'
                                        ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white'
                                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                                    }`}
                            >
                                Custom
                            </button>
                        </div>
                    </div>

                    {/* Custom Days Selection */}
                    {daysType === 'Custom' && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Select Days <span className="text-red-400">*</span>
                            </label>
                            <div className="grid grid-cols-7 gap-2">
                                {daysOfWeek.map((day) => (
                                    <button
                                        key={day}
                                        onClick={() => toggleCustomDay(day)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${customDays.includes(day)
                                                ? 'bg-cyan-500 text-white'
                                                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        {day.substring(0, 3)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Check Button */}
                    <button
                        onClick={handleCheckAvailability}
                        disabled={loading}
                        className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Checking...</span>
                            </div>
                        ) : (
                            '🔍 Check Availability'
                        )}
                    </button>
                </div>

                {/* Results (keeping your existing results display code) */}
                {result && (
                    <div className="space-y-6">
                        {/* Summary Card */}
                        <div className={`bg-slate-800/40 backdrop-blur-xl border-2 rounded-xl p-6 ${result.available ? 'border-emerald-500/50' : 'border-yellow-500/50'
                            }`}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-4xl mb-2">
                                        {result.available ? '✅' : '⚠️'}
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">
                                        {result.message}
                                    </h3>
                                    <div className="flex items-center space-x-6 mt-4">
                                        <div>
                                            <p className="text-slate-400 text-sm">Total Dates</p>
                                            <p className="text-white text-2xl font-bold">{result.summary.totalDates}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-sm">Available</p>
                                            <p className="text-emerald-400 text-2xl font-bold">{result.summary.availableDates}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-sm">Busy</p>
                                            <p className="text-yellow-400 text-2xl font-bold">{result.summary.busyDates}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                                        {result.summary.availabilityPercentage}%
                                    </div>
                                    <p className="text-slate-400 text-sm mt-1">Available</p>
                                </div>
                            </div>
                        </div>

                        {/* Available Dates */}
                        {result.availableDates.length > 0 && (
                            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-emerald-400 mb-4">
                                    ✅ Available Dates ({result.availableDates.length})
                                </h3>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    {result.availableDates.map((date, index) => (
                                        <div
                                            key={index}
                                            className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3"
                                        >
                                            <p className="text-emerald-400 font-semibold">{formatDate(date.date)}</p>
                                            <p className="text-slate-400 text-sm">{date.dayOfWeek}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Busy Dates with Conflicts */}
                        {result.busyDates.length > 0 && (
                            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-yellow-400 mb-4">
                                    ⚠️ Busy Dates ({result.busyDates.length})
                                </h3>
                                <div className="space-y-4">
                                    {result.busyDates.map((busyDate, index) => (
                                        <div key={index} className="bg-slate-900/50 rounded-lg p-4 border border-yellow-500/30">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <p className="text-white font-semibold">{formatDate(busyDate.date)}</p>
                                                    <p className="text-slate-400 text-sm">{busyDate.dayOfWeek}</p>
                                                </div>
                                                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm font-semibold rounded">
                                                    {busyDate.conflicts.length} conflict{busyDate.conflicts.length > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                {busyDate.conflicts.map((conflict, cIndex) => (
                                                    <div key={cIndex} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <p className="text-white font-medium">{conflict.topicName}</p>
                                                                <p className="text-slate-400 text-sm mt-1">
                                                                    {conflict.technology} • {conflict.enquiryId}
                                                                </p>
                                                                {conflict.customerName && (
                                                                    <p className="text-slate-400 text-sm">Client: {conflict.customerName}</p>
                                                                )}
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-red-400 font-mono text-sm">{conflict.existingTime}</p>
                                                                {conflict.isCompleted && (
                                                                    <span className="text-xs text-emerald-400">✓ Completed</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
