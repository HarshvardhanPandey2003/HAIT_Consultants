'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Session {
    id: number;
    enquiryId: string;
    sessionDate: string;
    sessionStartTime: string;
    sessionEndTime: string;
    isCompleted: boolean;
    notes: string | null;
    timezone?: string;
    displayTimezone?: string;
    dateChanged?: boolean;
    originalSessionDate?: string;
    originalSessionStartTime?: string;
    originalSessionEndTime?: string;
    enquiry: {
        enquiryId: string;
        topicName: string;
        technology: string;
        customerName: string | null;
        location: string;
        status: string;
    };
}

interface Timezone {
    label: string;
    value: string;
    offset: string;
}

interface GroupedSessions {
    [monthYear: string]: {
        [date: string]: Session[];
    };
}

export default function SchedulePage() {
    const router = useRouter();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [selectedTimezone, setSelectedTimezone] = useState<string>('Asia/Kolkata');
    const [availableTimezones, setAvailableTimezones] = useState<Timezone[]>([]);
    const [timezoneLoading, setTimezoneLoading] = useState(false);

    useEffect(() => {
        fetchTimezones();
    }, []);

    useEffect(() => {
        fetchSessions();
    }, [filter, selectedTimezone]);

    const fetchTimezones = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/schedule/timezones');
            const data = await response.json();
            setAvailableTimezones(data.supported);
        } catch (error) {
            console.error('Failed to fetch timezones:', error);
            // Fallback to default
            setAvailableTimezones([
                { label: 'IST - India (UTC+5:30)', value: 'Asia/Kolkata', offset: '+05:30' }
            ]);
        }
    };

    const fetchSessions = async () => {
        setTimezoneLoading(true);
        try {
            let url = `http://localhost:5000/api/schedule?timezone=${selectedTimezone}`;

            if (filter === 'upcoming') {
                url += '&upcoming=true';
            }

            const response = await fetch(url);
            const data = await response.json();
            setSessions(data.sessions || data);
        } catch (error) {
            console.error('Failed to fetch schedule:', error);
        } finally {
            setLoading(false);
            setTimezoneLoading(false);
        }
    };

    const markAsComplete = async (sessionId: number, notes?: string) => {
        try {
            const response = await fetch(`http://localhost:5000/api/schedule/${sessionId}/complete`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes }),
            });

            if (response.ok) {
                fetchSessions();
            }
        } catch (error) {
            console.error('Failed to mark session as complete:', error);
        }
    };

    const deleteSession = async (sessionId: number) => {
        if (!confirm('Are you sure you want to delete this session?')) return;

        try {
            const response = await fetch(`http://localhost:5000/api/schedule/${sessionId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchSessions();
            }
        } catch (error) {
            console.error('Failed to delete session:', error);
        }
    };

    // Group sessions by month and date
    const groupedSessions: GroupedSessions = sessions.reduce((acc, session) => {
        const date = new Date(session.sessionDate);
        const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const dateKey = date.toISOString().split('T')[0];

        if (!acc[monthYear]) acc[monthYear] = {};
        if (!acc[monthYear][dateKey]) acc[monthYear][dateKey] = [];

        acc[monthYear][dateKey].push(session);
        return acc;
    }, {} as GroupedSessions);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });
    };

    const format24Hour = (time: string) => {
        if (/^\d{2}:\d{2}$/.test(time)) {
            return time;
        }
        return time;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open': return 'text-cyan-400';
            case 'Delivered': return 'text-emerald-400';
            case 'Lost': return 'text-red-400';
            default: return 'text-slate-400';
        }
    };

    const getTimezoneLabel = () => {
        const tz = availableTimezones.find(t => t.value === selectedTimezone);
        return tz ? tz.label.split(' - ')[0] : 'IST';
    };

    const filteredGrouped = selectedMonth
        ? { [selectedMonth]: groupedSessions[selectedMonth] || {} }
        : groupedSessions;

    const stats = {
        total: sessions.length,
        upcoming: sessions.filter(s => new Date(s.sessionDate) >= new Date() && !s.isCompleted).length,
        completed: sessions.filter(s => s.isCompleted).length,
        today: sessions.filter(s => {
            const today = new Date().toISOString().split('T')[0];
            const sessionDate = new Date(s.sessionDate).toISOString().split('T')[0];
            return sessionDate === today;
        }).length,
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
                                    <h1 className="text-2xl font-bold text-white">Training Schedule</h1>
                                    <p className="text-slate-400 mt-0.5 text-sm">View and manage all scheduled sessions</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => router.push('/availability')}
                                className="px-5 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 font-semibold rounded-md transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <span className="text-sm">Check Availability</span>
                            </button>

                            <button
                                onClick={() => router.push('/enquiries')}
                                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold rounded-md transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-cyan-500/25 flex items-center justify-center space-x-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="text-sm">Manage Enquiries</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Timezone Selector */}
                <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                                <span className="text-xl">🌍</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300">
                                    Display Timezone
                                </label>
                                <p className="text-xs text-slate-500">Times stored in IST, displayed in selected timezone</p>
                            </div>
                        </div>
                        
                        <div className="flex-1 lg:max-w-md">
                            <select
                                value={selectedTimezone}
                                onChange={(e) => setSelectedTimezone(e.target.value)}
                                disabled={timezoneLoading}
                                className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {availableTimezones.map((tz) => (
                                    <option key={tz.value} value={tz.value}>
                                        {tz.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {timezoneLoading && (
                            <div className="flex items-center space-x-2 text-cyan-400">
                                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm">Converting...</span>
                            </div>
                        )}

                        {selectedTimezone !== 'Asia/Kolkata' && !timezoneLoading && (
                            <div className="flex items-center space-x-2 text-yellow-400 text-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Viewing in {getTimezoneLabel()}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-slate-500/20 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">📅</span>
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Total Sessions</p>
                                <p className="text-white text-2xl font-bold">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">🔜</span>
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Upcoming</p>
                                <p className="text-white text-2xl font-bold">{stats.upcoming}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">✅</span>
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Completed</p>
                                <p className="text-white text-2xl font-bold">{stats.completed}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <span className="text-2xl">📍</span>
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Today</p>
                                <p className="text-white text-2xl font-bold">{stats.today}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                    <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-2 inline-flex space-x-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${filter === 'all'
                                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            All Sessions
                        </button>
                        <button
                            onClick={() => setFilter('upcoming')}
                            className={`px-6 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${filter === 'upcoming'
                                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            Upcoming Only
                        </button>
                    </div>

                    {Object.keys(groupedSessions).length > 0 && (
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="px-4 py-2.5 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            <option value="">All Months</option>
                            {Object.keys(groupedSessions).map((month) => (
                                <option key={month} value={month}>{month}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Sessions List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
                        <p className="text-slate-400 mt-4">Loading schedule...</p>
                    </div>
                ) : Object.keys(filteredGrouped).length > 0 ? (
                    <div className="space-y-8">
                        {Object.entries(filteredGrouped).map(([monthYear, dates]) => (
                            <div key={monthYear}>
                                {/* Month Header */}
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                                    <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                                        📅 {monthYear}
                                    </h2>
                                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                                </div>

                                {/* Dates */}
                                <div className="space-y-6">
                                    {Object.entries(dates).sort().map(([date, sessions]) => (
                                        <div key={date} className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
                                            {/* Date Header */}
                                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700/50">
                                                <h3 className="text-lg font-semibold text-white">
                                                    {formatDate(date)}
                                                </h3>
                                                <span className="text-sm text-slate-400">
                                                    {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>

                                            {/* Sessions for this date */}
                                            <div className="space-y-4">
                                                {sessions.map((session) => (
                                                    <div
                                                        key={session.id}
                                                        className={`bg-slate-900/50 rounded-lg p-4 border ${session.isCompleted
                                                            ? 'border-emerald-500/30'
                                                            : 'border-slate-700/50'
                                                            } hover:border-slate-600 transition-all`}
                                                    >
                                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                            {/* Left: Time and Topic */}
                                                            <div className="flex items-start space-x-4 flex-1">
                                                                <div className="flex flex-col items-center bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-3 py-2 min-w-[80px]">
                                                                    <span className="text-cyan-400 font-bold text-lg">
                                                                        {format24Hour(session.sessionStartTime)}
                                                                    </span>
                                                                    <span className="text-slate-500 text-xs">to</span>
                                                                    <span className="text-cyan-400 font-bold text-lg">
                                                                        {format24Hour(session.sessionEndTime)}
                                                                    </span>
                                                                    {session.dateChanged && (
                                                                        <span className="text-yellow-400 text-[10px] mt-1">
                                                                            ⚠️ Date adjusted
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex-1">
                                                                    <div className="flex items-center space-x-2 mb-1">
                                                                        <span className="text-slate-500 font-mono text-sm">{session.enquiryId}</span>
                                                                        {session.isCompleted && (
                                                                            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded">
                                                                                ✓ Completed
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <h4 className="text-lg font-bold text-white mb-1">
                                                                        {session.enquiry.topicName}
                                                                    </h4>
                                                                    <div className="flex flex-wrap gap-3 text-sm">
                                                                        <span className="text-slate-400">
                                                                            <span className="text-slate-500">Tech:</span> {session.enquiry.technology}
                                                                        </span>
                                                                        {session.enquiry.customerName && (
                                                                            <span className="text-slate-400">
                                                                                <span className="text-slate-500">Client:</span> {session.enquiry.customerName}
                                                                            </span>
                                                                        )}
                                                                        <span className="text-slate-400">
                                                                            <span className="text-slate-500">Mode:</span> {session.enquiry.location}
                                                                        </span>
                                                                        <span className={getStatusColor(session.enquiry.status)}>
                                                                            {session.enquiry.status}
                                                                        </span>
                                                                    </div>
                                                                    {/* Show original IST time if timezone is different */}
                                                                    {selectedTimezone !== 'Asia/Kolkata' && session.originalSessionStartTime && (
                                                                        <div className="mt-2 text-xs text-slate-500 flex items-center space-x-2">
                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                            </svg>
                                                                            <span>
                                                                                IST: {session.originalSessionStartTime} - {session.originalSessionEndTime}
                                                                                {session.originalSessionDate !== date && ` on ${formatDate(session.originalSessionDate!)}`}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    {session.notes && (
                                                                        <p className="text-slate-400 text-sm mt-2 italic">
                                                                            📝 {session.notes}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Right: Actions */}
                                                            <div className="flex items-center space-x-2">
                                                                {!session.isCompleted && (
                                                                    <button
                                                                        onClick={() => {
                                                                            const notes = prompt('Add notes (optional):');
                                                                            markAsComplete(session.id, notes || undefined);
                                                                        }}
                                                                        className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-semibold rounded-lg transition-all text-sm"
                                                                    >
                                                                        Mark Complete
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => router.push(`/enquiries/${session.enquiryId}`)}
                                                                    className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 font-semibold rounded-lg transition-all text-sm"
                                                                >
                                                                    View Details
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteSession(session.id)}
                                                                    className="w-10 h-10 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-all flex items-center justify-center"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-12 text-center">
                        <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No scheduled sessions yet</h3>
                        <p className="text-slate-400 mb-6">Generate schedule from confirmed enquiries to see sessions here</p>
                        <button
                            onClick={() => router.push('/enquiries')}
                            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all"
                        >
                            Go to Enquiries
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
