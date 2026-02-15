"use client";

import React, { useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { Footer } from '@/components/Footer';
import { useProfile } from '@/hooks/useProfile';

// Duolingo-style Fire Icon (Enhanced)
const FireIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className}>
    <defs>
      <linearGradient id="fireGradientProfile" x1="16" y1="3" x2="16" y2="29" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF9600" />
        <stop offset="1" stopColor="#FF7B00" />
      </linearGradient>
    </defs>
    {/* Outer Flame with Gradient */}
    <path 
      d="M16.5 2.5C16.5 2.5 10 8.5 10 16.5C10 22.5 14 26.5 18 26.5C23 26.5 26 22.5 26 16.5C26 10.5 20.5 5.5 16.5 2.5Z" 
      fill="url(#fireGradientProfile)"
      stroke="#E56A00"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    {/* Inner Flame */}
    <path 
      d="M18 24.5C21 24.5 23.5 21.5 23.5 17.5C23.5 13.5 20 9.5 18 7.5C15.5 9.5 12.5 13.5 12.5 17.5C12.5 21.5 15 24.5 18 24.5Z" 
      fill="#FFC800"
    />
    {/* Core Flame */}
    <path 
      d="M18 22.5C19.5 22.5 21 20.5 21 18C21 15.5 19 13 18 11.5C17 13 15 15.5 15 18C15 20.5 16.5 22.5 18 22.5Z" 
      fill="#FFE600"
    />
    {/* Shine/Highlight */}
    <path 
      d="M21 10C21 10 22.5 12 23 15" 
      stroke="white" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeOpacity="0.4"
    />
  </svg>
);

const TrophyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

// Circular Progress Component
const CircularProgress = ({ 
  value, 
  max, 
  size = 120, 
  strokeWidth = 8,
  sublabel
}: { 
  value: number, 
  max: number, 
  size?: number, 
  strokeWidth?: number,
  sublabel?: string
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(value / max, 1);
  const dashoffset = circumference - progress * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-juice-cream/10"
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          className="text-juice-orange transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-juice-cream">
        <span style={{ fontSize: size < 120 ? '1.25rem' : '1.875rem' }} className="font-serif font-bold">{value}</span>
        {sublabel && <span className="text-[10px] uppercase tracking-widest opacity-60">{sublabel}</span>}
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const { profile, loading } = useProfile();
  const [headerTheme, setHeaderTheme] = useState<'light' | 'dark' | 'orange'>('light');

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const viewportHeight = e.currentTarget.clientHeight;
    const sectionIndex = Math.round(scrollTop / viewportHeight);

    if (sectionIndex === 0) {
      setHeaderTheme('light');
    } else {
      setHeaderTheme('dark');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-juice-cream flex items-center justify-center">
        <div className="animate-pulse text-juice-green font-serif text-xl">Loading Profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-juice-cream flex items-center justify-center">
        <div className="text-juice-green font-serif text-xl">Profile not found.</div>
      </div>
    );
  }

  return (
    <div 
      onScroll={handleScroll}
      className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-juice-cream text-juice-green font-sans selection:bg-juice-orange selection:text-juice-cream"
    >
      <div className="fixed top-0 left-0 right-0 z-50">
        <AppHeader theme={headerTheme} />
      </div>
      
      <section className="min-h-screen snap-start pt-20 md:pt-24 pb-10 px-4 md:px-8 max-w-4xl mx-auto flex flex-col">
        
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center mb-8 md:mb-12">
          <div className="relative w-24 h-24 md:w-32 md:h-32 mb-4 md:mb-6 rounded-full overflow-hidden ring-4 ring-juice-orange shadow-2xl">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.first_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-juice-green flex items-center justify-center text-4xl text-juice-cream font-serif">
                {profile.first_name[0]}
              </div>
            )}
          </div>
          
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-2">{profile.first_name} {profile.last_name}</h1>
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 opacity-60">
            <p className="font-mono">@{profile.username}</p>
            <span className="hidden sm:inline">•</span>
            <span className="bg-juice-green/10 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-widest">
              Member #{profile.user_number}
            </span>
          </div>
        </div>

        {/* Dark Dashboard Card */}
        <div className="bg-juice-green text-juice-cream rounded-2xl md:rounded-3xl p-5 md:p-8 lg:p-12 shadow-2xl mb-10 md:mb-16 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-juice-orange/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

          <div className="relative z-10 grid grid-cols-3 gap-4 md:gap-12 items-center">
            
            {/* Left: Streak */}
            <div className="flex flex-col items-center gap-2 md:gap-4 text-center">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center text-juice-orange">
                <FireIcon className="w-4 h-4 md:w-6 md:h-6" />
              </div>
              <div>
                <p className="text-xl md:text-3xl font-serif font-bold">{profile.streak_count}</p>
                <p className="text-[8px] md:text-xs uppercase tracking-widest opacity-60 mt-1">Day Streak</p>
              </div>
            </div>

            {/* Center: Daily Goal (Circular Progress) */}
            <div className="flex flex-col items-center gap-3 md:gap-6">
              <div className="hidden md:block">
                <CircularProgress 
                  value={profile.minutes_read_today} 
                  max={profile.daily_goal_minutes} 
                  size={160}
                  strokeWidth={12}
                  sublabel="Min"
                />
              </div>
              <div className="block md:hidden">
                <CircularProgress 
                  value={profile.minutes_read_today} 
                  max={profile.daily_goal_minutes} 
                  size={90}
                  strokeWidth={8}
                  sublabel="Min"
                />
              </div>
              <div className="text-center">
                <p className="text-xs md:text-sm font-bold uppercase tracking-widest opacity-80">Daily Goal</p>
                <p className="text-[10px] md:text-xs opacity-40 mt-1">{profile.daily_goal_minutes} min target</p>
              </div>
            </div>

            {/* Right: Rank */}
            <div className="flex flex-col items-center gap-2 md:gap-4 text-center">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center text-yellow-400">
                <TrophyIcon className="w-4 h-4 md:w-6 md:h-6" />
              </div>
              <div>
                <p className="text-xl md:text-3xl font-serif font-bold">Novice</p>
                <p className="text-[8px] md:text-xs uppercase tracking-widest opacity-60 mt-1">Current Rank</p>
              </div>
            </div>

          </div>
        </div>

        {/* Achievements Section */}
        <div className="space-y-6 md:space-y-8 pb-20">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl md:text-3xl font-bold">Achievements</h2>
            <span className="text-sm font-mono opacity-40">0 / 12 Unlocked</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-juice-green/5 border border-juice-green/10 rounded-2xl flex flex-col items-center justify-center p-6 text-center gap-3 hover:bg-juice-green hover:text-juice-cream transition-all duration-300 group cursor-help">
                <div className="w-12 h-12 bg-juice-green/10 rounded-full flex items-center justify-center text-juice-green/40 group-hover:text-juice-orange group-hover:bg-white/10 transition-colors">
                  <LockIcon className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Locked</p>
              </div>
            ))}
          </div>
        </div>

      </section>

      <section className="snap-start shrink-0">
        <Footer />
      </section>
    </div>
  );
}
