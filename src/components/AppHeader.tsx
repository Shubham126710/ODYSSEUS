"use client";

import React, { useState, useEffect, useRef } from 'react';
import { StaticOrangeCompass } from './StaticOrangeCompass';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';
import { useProfile } from '@/hooks/useProfile';
import { CustomizeTabsModal } from './CustomizeTabsModal';
import { SearchModal } from './SearchModal';
import { OnboardingModal } from './OnboardingModal';
import { ImportArticleModal } from './ImportArticleModal';
import { ReadingModal } from './ReadingModal';
import { 
  getCurrentMultiplier, 
  getExplorerRank, 
  getMilestoneProgress, 
  getWeekHabitSpread, 
  MultiplierInfo 
} from '@/lib/gamification';

// Icons
const UserIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const BookmarkIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
);
const SettingsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const LogOutIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);

// Fire Icon — clean vector flame in signature Juice Orange (#FF6B4A)
const FireIcon = ({ className = "w-3.5 h-3.5", size = 14 }: { className?: string; size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={`shrink-0 text-juice-orange ${className}`}
    style={{ width: `${size}px`, height: `${size}px`, maxWidth: `${size}px`, maxHeight: `${size}px` }}
    aria-hidden="true"
  >
    <path d="M12 23c-4.97 0-9-3.95-9-8.82 0-3.6 2.37-6.72 4.1-8.52.47-.49 1.28-.27 1.45.38.4 1.54 1.2 3.16 2.45 3.96.22-2.14 1.45-5.11 3.56-7.85.42-.54 1.25-.43 1.51.21 1.47 3.57 4.93 9.4 1.93 14.64C16.88 19.06 14.61 23 12 23zm-.08-4.2c2.06 0 3.73-1.63 3.73-3.65 0-1.25-.63-2.36-1.59-3.03-.23-.16-.54-.08-.66.17-.18.37-.47.88-.93 1.13-.23.12-.51-.01-.56-.27-.14-.73-.08-1.52.17-2.31.06-.2-.1-.41-.31-.41-.53 0-1.15.42-1.72.97-1.12 1.09-1.86 2.44-1.86 3.77 0 2.02 1.67 3.65 3.73 3.65z" />
  </svg>
);

// Compact Circular Progress
const CompactCircularProgress = ({ value, max, size = 60, strokeWidth = 6 }: { value: number, max: number, size?: number, strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(value / max, 1);
  const dashoffset = circumference - progress * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-white/10" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={dashoffset} strokeLinecap="round" className="text-juice-orange transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-juice-cream">
        <span className="text-sm font-bold">{Math.round((value / max) * 100)}%</span>
      </div>
    </div>
  );
};

export const AppHeader = ({ theme = 'light' }: { theme?: 'light' | 'dark' | 'orange' }) => {
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [tempGoal, setTempGoal] = useState(15);
  const [tabs, setTabs] = useState(['Tech', 'Design', 'Culture', 'Science']);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [readerArticle, setReaderArticle] = useState<any | null>(null);
  const [multiplier, setMultiplier] = useState<MultiplierInfo>(getCurrentMultiplier());
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useProfile();

  const textColor = theme === 'orange' ? 'text-juice-cream' : 'text-juice-cream';
  const bgColor = theme === 'orange' ? 'bg-juice-orange' : 'bg-juice-green';
  const borderColor = theme === 'orange' ? 'border-juice-cream/10' : 'border-juice-cream/10';
  const navTextColor = theme === 'orange' ? 'text-juice-cream/60 hover:text-juice-cream' : 'text-juice-cream/60 hover:text-juice-cream';

  useEffect(() => {
    const handleOpenImport = () => setIsImportOpen(true);
    const handleOpenReader = (e: any) => {
      if (e.detail) setReaderArticle(e.detail);
    };
    window.addEventListener('odysseus:open-import', handleOpenImport);
    window.addEventListener('odysseus:open-reader', handleOpenReader);
    return () => {
      window.removeEventListener('odysseus:open-import', handleOpenImport);
      window.removeEventListener('odysseus:open-reader', handleOpenReader);
    };
  }, []);

  useEffect(() => {
    setMultiplier(getCurrentMultiplier());
    const interval = setInterval(() => {
      setMultiplier(getCurrentMultiplier());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // First-time visitor automatic guide trigger
  useEffect(() => {
    if (profile) {
      const alreadyDone = profile.has_completed_onboarding || 
        (typeof window !== 'undefined' && localStorage.getItem('odysseus_onboarding_completed') === 'true');
      if (!alreadyDone) {
        const timer = setTimeout(() => {
          setIsOnboardingOpen(true);
        }, 1400);
        return () => clearTimeout(timer);
      }
    }
  }, [profile]);

  const habitSpread = getWeekHabitSpread(profile?.minutes_read_today || 0, tempGoal);
  const rank = getExplorerRank(profile?.total_reading_minutes || 0, profile?.streak_count || 1);
  const milestone = getMilestoneProgress(profile?.streak_count || 1);
  const freezesAvailable = profile?.streak_freezes_available ?? 1;
  const minutesToday = profile?.minutes_read_today || 0;
  const percentOfGoal = Math.min(100, Math.round((minutesToday / tempGoal) * 100));

  useEffect(() => {
    const saved = localStorage.getItem('nav_tabs');
    if (saved) {
      setTabs(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (profile) {
      setTempGoal(prev => {
        if (prev !== profile.daily_goal_minutes) return profile.daily_goal_minutes;
        return prev;
      });
    }
  }, [profile]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const updateGoal = async (newGoal: number) => {
    setTempGoal(newGoal);
    if (profile) {
      await supabase.from('profiles').update({ daily_goal_minutes: newGoal }).eq('id', profile.id);
    }
  };

  // Close stats dropdown when clicking outside
  const statsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isStatsOpen && statsRef.current && !statsRef.current.contains(e.target as Node)) {
        setIsStatsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isStatsOpen]);

  return (
    <header className={`sticky top-0 z-50 border-b transition-colors duration-500 ${bgColor} ${borderColor}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 md:h-20 flex items-center justify-between gap-3 md:gap-4">
        
        {/* Brand Logo */}
        <Link href="/feed" className="flex items-center gap-2 md:gap-3 group shrink-0">
          <StaticOrangeCompass className="w-7 h-7 md:w-8 md:h-8 group-hover:rotate-45 transition-transform duration-500 shrink-0" />
          <span className={`font-serif text-lg md:text-xl font-bold tracking-wide transition-colors duration-500 whitespace-nowrap ${textColor}`}>ODYSSEUS</span>
        </Link>

        {/* Desks Navigation */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-8 shrink-0">
          <Link 
            href="/feed" 
            className={`text-xs xl:text-sm font-bold uppercase tracking-wider xl:tracking-widest whitespace-nowrap transition-colors ${
              pathname === '/feed' 
                ? 'text-juice-cream' 
                : 'text-juice-cream/60 hover:text-juice-cream'
            }`}
          >
            For You
          </Link>
          {tabs.map((item) => {
            const isActive = pathname === `/feed/${item.toLowerCase()}`;
            return (
              <Link 
                key={item} 
                href={`/feed/${item.toLowerCase()}`}
                className={`text-xs xl:text-sm font-bold uppercase tracking-wider xl:tracking-widest whitespace-nowrap transition-colors duration-500 ${
                  isActive 
                    ? 'text-juice-cream'
                    : navTextColor
                } hover:text-juice-orange`}
              >
                {item}
              </Link>
            );
          })}
          <button 
            onClick={() => setIsCustomizeOpen(true)} 
            className={`p-1.5 rounded-full hover:bg-black/5 transition-colors shrink-0 ${navTextColor}`} 
            title="Customize Tabs"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Custom Article Import Button */}
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 h-8 md:h-9 rounded-full border border-juice-cream/30 hover:border-juice-cream bg-juice-cream/10 hover:bg-juice-cream/20 text-juice-cream text-xs font-mono uppercase tracking-wider whitespace-nowrap shrink-0 transition-all duration-200"
            title="Import Article (Pocket & Instapaper Clean Reader)"
            aria-label="Import Article"
          >
            <span className="font-bold text-xs leading-none text-juice-orange">✦</span>
            <span className="font-semibold tracking-wider">Import</span>
          </button>

          {/* Traveler's Guide (?) button */}
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-juice-cream/30 hover:border-juice-cream bg-juice-cream/10 hover:bg-juice-cream/20 text-juice-cream flex items-center justify-center font-serif text-xs font-bold shrink-0 transition-all duration-200"
            title="Traveler's Guide"
            aria-label="Open Traveler's Guide"
          >
            ?
          </button>

          {/* Streak button */}
          {profile && (
            <div className="relative shrink-0" ref={statsRef}>
              <button 
                onClick={() => setIsStatsOpen(!isStatsOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 h-8 md:h-9 rounded-full shrink-0 whitespace-nowrap transition-all duration-200 border ${
                  isStatsOpen 
                    ? 'bg-juice-cream text-juice-green border-juice-cream shadow-sm' 
                    : 'bg-juice-cream/10 hover:bg-juice-cream/20 text-juice-cream border-juice-cream/30'
                }`}
                title="Open Traveler's Chamber"
                aria-label="Open Traveler's Chamber"
              >
                <FireIcon size={14} />
                <span className="font-mono text-xs font-bold tracking-wider leading-none">{profile.streak_count || 1}D</span>
                {multiplier.isBonusActive && (
                  <span className="text-[9px] font-mono font-bold bg-juice-orange text-white px-1.5 py-0.5 rounded-full hidden xl:inline-block leading-none">
                    {multiplier.multiplier}x
                  </span>
                )}
              </button>

              {/* Stats Dropdown — The Traveler's Chamber */}
              <div 
                className={`absolute right-0 top-full mt-3 rounded-3xl p-5 md:p-6 transform transition-all duration-300 origin-top-right z-50 overflow-hidden bg-juice-cream border border-juice-green/20 shadow-2xl ${
                  isStatsOpen 
                    ? 'opacity-100 scale-100 visible translate-y-0' 
                    : 'opacity-0 scale-95 invisible -translate-y-4'
                }`}
                style={{ width: '340px' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4 border-b border-juice-green/10 pb-3">
                  <div className="flex items-center gap-2">
                    <FireIcon size={16} />
                    <div>
                      <h3 className="font-serif text-sm font-bold text-juice-green">Traveler&apos;s Chamber</h3>
                      <span className="text-[9px] font-mono text-juice-green/60 uppercase tracking-widest">
                        {rank.badgeIcon} {rank.title}
                      </span>
                    </div>
                  </div>
                  <Link 
                    href="/profile" 
                    onClick={() => setIsStatsOpen(false)} 
                    className="text-[9px] font-bold uppercase tracking-widest text-juice-green/60 hover:text-juice-orange transition-colors flex items-center gap-1 font-mono"
                  >
                    Ledger →
                  </Link>
                </div>

                {/* Active Multiplier Banner (Minimalist Typographic) */}
                <div className={`p-3 rounded-2xl mb-4 border transition-all ${
                  multiplier.isBonusActive 
                    ? 'bg-juice-orange/10 border-juice-orange/30 text-juice-green' 
                    : 'bg-juice-green/5 border-juice-green/15 text-juice-green'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs font-mono uppercase tracking-wider">
                      <span className="text-juice-orange font-bold">✦</span>
                      <span>{multiplier.label}</span>
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      multiplier.isBonusActive 
                        ? 'bg-juice-orange text-white' 
                        : 'bg-juice-green/15 text-juice-green'
                    }`}>
                      {multiplier.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-juice-green/75 leading-tight">
                    {multiplier.description}
                  </p>
                  {multiplier.endsAtText && (
                    <span className="text-[9px] font-mono text-juice-green/50 mt-1 block">
                      • {multiplier.endsAtText}
                    </span>
                  )}
                </div>

                {/* Main Stats: Streak & Minutes Today */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex flex-col items-center p-3 bg-white/70 rounded-2xl border border-juice-green/10">
                    <span className="text-2xl font-black text-juice-orange mb-0.5 font-serif">{profile.streak_count || 1}</span>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-juice-green/60">Day Streak</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-white/70 rounded-2xl border border-juice-green/10">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-juice-green mb-0.5 font-serif">{minutesToday}</span>
                      <span className="text-[10px] text-juice-green/40 font-mono">/ {tempGoal}m</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-juice-green/60">
                      {percentOfGoal >= 100 ? 'Goal Reached ✓' : `${Math.max(1, tempGoal - minutesToday)}m to goal`}
                    </span>
                  </div>
                </div>

                {/* Streak Freeze Shields */}
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/50 border border-juice-green/10 mb-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-juice-green/10 flex items-center justify-center text-juice-green font-mono text-[10px] font-bold">
                      ◈
                    </div>
                    <div>
                      <span className="font-bold text-juice-green text-[11px] block">Streak Shields</span>
                      <span className="text-[9px] text-juice-green/60">Auto-shields missed days</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    {[1, 2].map((slot) => (
                      <div 
                        key={slot} 
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                          slot <= freezesAvailable 
                            ? 'bg-juice-green text-juice-cream shadow-xs' 
                            : 'bg-juice-green/5 text-juice-green/20 border border-dashed border-juice-green/25'
                        }`}
                        title={slot <= freezesAvailable ? 'Active shield' : 'Empty slot (earned every 7 days)'}
                      >
                        {slot <= freezesAvailable ? '◈' : '○'}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7-Day Magazine Weekly Spread (GUARANTEED HORIZONTAL FLEX-ROW) */}
                <div className="mb-4 w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-juice-green/60">7-Day Habit Ledger</span>
                    <span className="text-[9px] font-mono text-juice-green/50">Mon – Sun</span>
                  </div>
                  <div className="flex flex-row items-center justify-between w-full gap-1">
                    {habitSpread.map((day, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center min-w-0">
                        <span className="text-[9px] font-mono font-bold text-juice-green/60 mb-1">{day.dayShort}</span>
                        <div 
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                            day.status === 'completed' || day.status === 'today-done'
                              ? 'bg-juice-orange text-white shadow-xs'
                              : day.status === 'shielded'
                              ? 'bg-juice-green/20 text-juice-green border border-juice-green/40'
                              : day.isToday
                              ? 'border-2 border-juice-orange text-juice-orange animate-pulse bg-white'
                              : 'bg-juice-green/5 text-juice-green/30 border border-juice-green/10'
                          }`}
                          title={`${day.dayName}: ${day.minutes} min`}
                        >
                          {day.status === 'completed' || day.status === 'today-done' ? (
                            '✓'
                          ) : day.status === 'shielded' ? (
                            '◈'
                          ) : (
                            day.dayShort
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Milestone Track */}
                <div className="mb-4 p-2.5 rounded-2xl bg-white/60 border border-juice-green/10">
                  <div className="flex items-center justify-between text-[10px] font-bold text-juice-green mb-1.5">
                    <span className="flex items-center gap-1.5 font-mono">
                      <span className="text-juice-orange">{milestone.nextIcon}</span>
                      <span>{milestone.nextPerk}</span>
                    </span>
                    <span className="text-juice-orange font-mono">{milestone.daysRemaining}d away</span>
                  </div>
                  <div className="w-full h-1.5 bg-juice-green/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-juice-orange transition-all duration-500 rounded-full"
                      style={{ width: `${milestone.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Daily Goal Slider */}
                <div className="pt-1 border-t border-juice-green/10">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-juice-green/60">Pace Commitment</span>
                    <span className="text-[10px] font-bold text-juice-orange font-mono">{tempGoal} min / day</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="60" 
                    step="5" 
                    value={tempGoal}
                    onChange={(e) => updateGoal(parseInt(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-juice-green/10 accent-juice-orange"
                  />
                  <div className="flex justify-between text-[8px] font-bold text-juice-green/50 mt-1 uppercase font-mono">
                    <span>5m Voyager</span>
                    <span>30m Scholar</span>
                    <span>60m Master</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button 
            onClick={() => setIsSearchOpen(true)}
            className="p-2 transition-colors text-juice-cream/60 hover:text-juice-cream"
            aria-label="Search articles"
          >
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          
          {/* Desktop profile dropdown */}
          <div className="relative group hidden md:block">
            <button className="w-10 h-10 rounded-full bg-juice-green text-juice-cream flex items-center justify-center font-serif font-bold text-lg hover:bg-juice-orange transition-colors overflow-hidden ring-2 ring-transparent hover:ring-juice-orange">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{profile?.first_name?.[0] || 'S'}</span>
              )}
            </button>
            
            {/* Modern Dropdown */}
            <div className="absolute right-0 top-full mt-4 w-64 bg-juice-cream rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-juice-green/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50 overflow-hidden">
              
              {profile && (
                <div className="p-5 border-b border-juice-green/10 bg-juice-green/5">
                  <p className="font-bold text-juice-green truncate text-lg">{profile.first_name} {profile.last_name}</p>
                  <p className="text-xs text-juice-green/60 font-medium mt-0.5">@{profile.username}</p>
                </div>
              )}

              <div className="p-2">
                <Link href="/profile" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-juice-green/80 hover:text-juice-green hover:bg-juice-green/10 rounded-xl transition-all group/item">
                  <UserIcon className="w-4 h-4 text-juice-green/40 group-hover/item:text-juice-orange transition-colors" />
                  Profile
                </Link>
                <Link href="/saved" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-juice-green/80 hover:text-juice-green hover:bg-juice-green/10 rounded-xl transition-all group/item">
                  <BookmarkIcon className="w-4 h-4 text-juice-green/40 group-hover/item:text-juice-orange transition-colors" />
                  Saved Stories
                </Link>
                <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-juice-green/80 hover:text-juice-green hover:bg-juice-green/10 rounded-xl transition-all group/item">
                  <SettingsIcon className="w-4 h-4 text-juice-green/40 group-hover/item:text-juice-orange transition-colors" />
                  Settings
                </Link>
                <div className="h-px bg-juice-green/10 my-2 mx-2" />
                <button onClick={handleSignOut} className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-all group/item">
                  <LogOutIcon className="w-4 h-4 text-red-400 group-hover/item:text-red-500 transition-colors" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-juice-cream/60 hover:text-juice-cream transition-colors"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? (
              <svg style={{ width: 22, height: 22 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg style={{ width: 22, height: 22 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-juice-cream/10" style={{ backgroundColor: '#5D8246' }}>
          <nav className="px-4 py-3 space-y-1">
            <Link 
              href="/feed" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-colors ${pathname === '/feed' ? 'text-juice-cream bg-white/10' : 'text-juice-cream/60'}`}
            >
              For You
            </Link>
            {tabs.map((item) => {
              const isActive = pathname === `/feed/${item.toLowerCase()}`;
              return (
                <Link 
                  key={item} 
                  href={`/feed/${item.toLowerCase()}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-juice-cream bg-white/10' : 'text-juice-cream/60'}`}
                >
                  {item}
                </Link>
              );
            })}
            <div className="h-px bg-juice-cream/10 my-2" />
            <button 
              onClick={() => { setIsImportOpen(true); setIsMobileMenuOpen(false); }} 
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-juice-cream hover:text-juice-orange rounded-xl w-full text-left"
            >
              <span className="text-juice-orange font-bold text-base leading-none">✦</span> Import Custom Article
            </button>
            <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-juice-cream/60 rounded-xl">
              <UserIcon className="w-4 h-4" /> Profile
            </Link>
            <Link href="/saved" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-juice-cream/60 rounded-xl">
              <BookmarkIcon className="w-4 h-4" /> Saved Stories
            </Link>
            <Link href="/settings" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-juice-cream/60 rounded-xl">
              <SettingsIcon className="w-4 h-4" /> Settings
            </Link>
            <div className="h-px bg-juice-cream/10 my-2" />
            <button onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-300 rounded-xl w-full">
              <LogOutIcon className="w-4 h-4" /> Sign Out
            </button>
          </nav>
        </div>
      )}
      <CustomizeTabsModal 
        isOpen={isCustomizeOpen} 
        onClose={() => setIsCustomizeOpen(false)} 
        currentTabs={tabs} 
        onSave={(newTabs) => {
          setTabs(newTabs);
          localStorage.setItem('nav_tabs', JSON.stringify(newTabs));
        }} 
      />
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
      <OnboardingModal 
        isOpen={isOnboardingOpen} 
        onClose={() => setIsOnboardingOpen(false)} 
        userId={profile?.id}
        userName={profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Traveler'}
      />
      <ImportArticleModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        userId={profile?.id}
        onReadArticle={(art) => {
          setReaderArticle(art);
          setIsImportOpen(false);
        }}
        onSavedSuccess={() => {
          if (pathname === '/saved') {
            window.location.reload();
          }
        }}
      />
      <ReadingModal 
        isOpen={!!readerArticle} 
        onClose={() => setReaderArticle(null)} 
        article={readerArticle} 
      />
    </header>
  );
};
