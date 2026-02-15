"use client";

import React, { useState, useEffect, useRef } from 'react';
import { StaticOrangeCompass } from './StaticOrangeCompass';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';
import { useProfile } from '@/hooks/useProfile';
import { CustomizeTabsModal } from './CustomizeTabsModal';
import { SearchModal } from './SearchModal';

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

// Fire Icon — clean Duolingo-style flame
const FireIcon = ({ size = 20 }: { size?: number }) => (
  <span style={{ fontSize: size, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} role="img" aria-label="streak">🔥</span>
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
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useProfile();

  const textColor = 'text-juice-cream';
  const bgColor = 'bg-juice-green';
  const borderColor = 'border-juice-cream/10';
  const navTextColor = 'text-juice-cream/60 hover:text-juice-cream';

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
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 md:h-20 flex items-center justify-between">
        
        <Link href="/feed" className="flex items-center gap-2 md:gap-3 group">
          <StaticOrangeCompass className="w-7 h-7 md:w-8 md:h-8 group-hover:rotate-45 transition-transform duration-500" />
          <span className={`font-serif text-lg md:text-xl font-bold tracking-wide transition-colors duration-500 ${textColor}`}>ODYSSEUS</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link 
            href="/feed" 
            className={`text-sm font-bold uppercase tracking-widest transition-colors ${
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
                className={`text-sm font-bold uppercase tracking-widest transition-colors duration-500 ${
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
            className={`p-1.5 rounded-full hover:bg-black/5 transition-colors ${navTextColor}`} 
            title="Customize Tabs"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </nav>

        <div className="flex items-center gap-3 md:gap-6">
          
          {/* Streak button — visible on all screens */}
          {profile && (
            <div className="relative" ref={statsRef}>
              <button 
                onClick={() => setIsStatsOpen(!isStatsOpen)}
                className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: isStatsOpen ? '#5D8246' : '#FF6B4A',
                  color: 'white',
                  boxShadow: isStatsOpen ? '0 0 0 4px rgba(93,130,70,0.2)' : 'none',
                }}
              >
                <FireIcon size={16} />
                <span className="font-bold text-xs md:text-sm">{profile.streak_count}</span>
              </button>

              {/* Stats Dropdown — Responsive */}
              <div 
                className={`absolute right-0 top-full mt-3 rounded-2xl p-0 transform transition-all duration-200 origin-top-right z-50 overflow-hidden ${isStatsOpen ? 'opacity-100 scale-100 visible translate-y-0' : 'opacity-0 scale-95 invisible -translate-y-2'}`}
                style={{ 
                  width: 'min(340px, calc(100vw - 32px))',
                  backgroundColor: '#FEFDF5', 
                  border: '1px solid rgba(93,130,70,0.1)',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.12)'
                }}
              >
                {/* Header section */}
                <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(93,130,70,0.08)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <FireIcon size={22} />
                      <h3 className="font-serif text-lg font-bold" style={{ color: '#3d5a2e' }}>Reading Streak</h3>
                    </div>
                    <Link href="/profile" onClick={() => setIsStatsOpen(false)} className="text-[10px] font-bold uppercase tracking-widest transition-colors" style={{ color: 'rgba(93,130,70,0.4)' }}>
                      Profile →
                    </Link>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'rgba(93,130,70,0.45)' }}>
                    {profile.streak_count > 0 ? `${profile.streak_count} day streak! Keep it going.` : 'Start reading to build your streak!'}
                  </p>
                </div>

                {/* Progress Card */}
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 20, borderRadius: 12, backgroundColor: '#5D8246' }}>
                    <CompactCircularProgress value={profile.minutes_read_today} max={tempGoal} size={72} strokeWidth={6} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, color: 'rgba(255,253,208,0.5)', marginBottom: 4 }}>Read Today</p>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em', color: '#FFFDD0', lineHeight: 1 }}>{profile.minutes_read_today}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,253,208,0.5)' }}>/ {tempGoal} min</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div style={{ padding: '0 24px 20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 12, backgroundColor: 'rgba(93,130,70,0.06)' }}>
                      <p style={{ fontSize: 24, fontWeight: 900, color: '#3d5a2e', lineHeight: 1.2 }}>{profile.streak_count || 0}</p>
                      <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(93,130,70,0.4)', marginTop: 4 }}>Day Streak</p>
                    </div>
                    <div style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 12, backgroundColor: 'rgba(93,130,70,0.06)' }}>
                      <p style={{ fontSize: 24, fontWeight: 900, color: '#3d5a2e', lineHeight: 1.2 }}>{(profile as any).articles_read ?? 0}</p>
                      <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(93,130,70,0.4)', marginTop: 4 }}>Articles</p>
                    </div>
                    <div style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 12, backgroundColor: 'rgba(93,130,70,0.06)' }}>
                      <p style={{ fontSize: 24, fontWeight: 900, color: '#3d5a2e', lineHeight: 1.2 }}>{(profile as any).total_minutes_read ?? profile.minutes_read_today ?? 0}</p>
                      <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(93,130,70,0.4)', marginTop: 4 }}>Total Min</p>
                    </div>
                  </div>
                </div>

                {/* Goal Slider */}
                <div style={{ padding: '16px 24px 24px', borderTop: '1px solid rgba(93,130,70,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(93,130,70,0.45)' }}>Daily Goal</span>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#5D8246' }}>{tempGoal} min</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="60" 
                    step="5" 
                    value={tempGoal}
                    onChange={(e) => updateGoal(parseInt(e.target.value))}
                    className="accent-juice-orange"
                    style={{ width: '100%', height: 6, borderRadius: 999, appearance: 'none' as any, cursor: 'pointer', backgroundColor: 'rgba(93,130,70,0.1)' }}
                  />
                </div>
              </div>
            </div>
          )}

          <button 
            onClick={() => setIsSearchOpen(true)}
            className="p-2 transition-colors text-juice-cream/60 hover:text-juice-cream"
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
    </header>
  );
};
