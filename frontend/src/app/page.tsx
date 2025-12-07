'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const [time, setTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const modules = [
    {
      title: 'Enquiries',
      description: 'Manage client projects and training requests',
      icon: '📋',
      href: '/enquiries',
      gradient: 'from-cyan-500 to-blue-500',
      color: 'cyan',
    },
    {
      title: 'Schedule',
      description: 'View and manage session timings',
      icon: '📅',
      href: '/schedule',
      gradient: 'from-emerald-500 to-green-500',
      color: 'emerald',
    },
    {
      title: 'Analytics',
      description: 'Track revenue, sessions, and performance',
      icon: '📊',
      href: '/analytics',
      gradient: 'from-purple-500 to-pink-500',
      color: 'purple',
    },
  ];

  const greeting = () => {
    if (!time) return 'Welcome';
    const hour = time.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden">
      {/* Enhanced Gradient orbs background */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }}></div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-cyan-400/30 rounded-full animate-float-slow"></div>
        <div className="absolute top-40 right-20 w-3 h-3 bg-emerald-400/30 rounded-full animate-float-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-purple-400/30 rounded-full animate-float-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-cyan-400/20 rounded-full animate-float-slow" style={{ animationDelay: '0.5s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="min-h-screen flex flex-col justify-center py-12">
          
          {/* Time and Date - Only render after mount to avoid hydration issues */}
          {mounted && time && (
            <div className="text-center mb-8 animate-fade-in-up">
              <p className="text-slate-400 text-sm mb-1">
                {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-slate-300 text-3xl font-bold">
                {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </p>
            </div>
          )}

          {/* Welcome Header */}
          <div className="text-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="inline-block px-6 py-2 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/30 rounded-full mb-6 backdrop-blur-sm">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 text-sm font-semibold tracking-wide">
                ✨ HAIT CONSULTANTS
              </span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-400 mb-2">
              {greeting()},
            </h2>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-purple-400 bg-[length:200%_auto] animate-gradient-x">
                Omprakash
              </span>
            </h1>

            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Your specialized session management and learning tracker for freelance training business
            </p>
          </div>

          {/* Module Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full mb-8">
            {modules.map((module, index) => (
              <button
                key={module.title}
                onClick={() => router.push(module.href)}
                className="group relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-slate-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] text-left animate-slide-up-fade overflow-hidden"
                style={{ animationDelay: `${(index + 2) * 0.1}s` }}
              >
                {/* Gradient glow on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl`}></div>
                
                {/* Icon with enhanced animation */}
                <div className={`relative w-16 h-16 bg-gradient-to-br ${module.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                  <span className="text-3xl">{module.icon}</span>
                </div>
                
                <h2 className="relative text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-emerald-400 transition-all">
                  {module.title}
                </h2>
                
                <p className="relative text-slate-400 leading-relaxed mb-6">
                  {module.description}
                </p>

                <div className="relative flex items-center text-cyan-400 group-hover:text-cyan-300 transition-colors">
                  <span className="text-sm font-semibold">Open Module</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Decorative corner elements */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/5 to-transparent rounded-bl-[40px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            ))}
          </div>

          {/* Enhanced Feature Highlights */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 text-center animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-2xl font-bold text-cyan-400 mb-1">Simple</div>
                <div className="text-sm text-slate-400">No Complexity</div>
              </div>

              <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 text-center animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="text-2xl font-bold text-emerald-400 mb-1">Local</div>
                <div className="text-sm text-slate-400">Desktop Only</div>
              </div>

              <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 text-center animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="text-2xl font-bold text-purple-400 mb-1">Fast</div>
                <div className="text-sm text-slate-400">Quick Access</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
