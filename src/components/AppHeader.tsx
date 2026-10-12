"use client";

import React, { useState, useEffect, useRef } from 'react';
import { StaticOrangeCompass } from './StaticOrangeCompass';
import { CompassNavBar, CompassSection } from './CompassNavBar';
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

export const AppHeader = ({ 
  theme = 'light',
  sections,
}: { 
  theme?: 'light' | 'dark' | 'orange';
  sections?: CompassSection[];
}) => {
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [tempGoal, setTempGoal] = useState(15);
  const [tabs, setTabs] = useState(['Tech', 'Design', 'Culture', 'Science', 'Chronicle']);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [readerArticle, setReaderArticle] = useState<any | null>(null);
  const [multiplier, setMultiplier] = useState<MultiplierInfo>(getCurrentMultiplier());
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useProfile();

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
    if (profile?.daily_goal_minutes) {
      setTempGoal(profile.daily_goal_minutes);
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
    <>
      <header 
        style={{ 
          backgroundColor: '#5D8246', 
          borderBottom: '1px solid rgba(255, 253, 208, 0.15)' 
        }}
        className="fixed top-0 left-0 right-0 w-full z-50 text-[#FFFDD0] shadow-sm transition-colors duration-300"
      >
        {/* Row 1: Brand Logo, Desktop Nav (md:flex), Right Utilities */}
        <div 
          style={{ minHeight: '72px' }}
          className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-10 min-h-14 md:min-h-[72px] h-14 md:h-[72px] flex items-center justify-between gap-4"
        >
          
          {/* Brand Logo */}
          <Link href="/feed" className="flex items-center gap-2.5 group shrink-0">
            <StaticOrangeCompass className="w-7 h-7 md:w-8 md:h-8 group-hover:rotate-45 transition-transform duration-500 shrink-0" />
            <span className="font-serif text-base md:text-lg tracking-wider font-bold uppercase text-white">
              ODYSSEUS
            </span>
          </Link>

          {/* Desktop Nav Bar (hidden on mobile) */}
          <div className="hidden md:flex flex-1 justify-center px-2 min-w-0">
            <CompassNavBar sections={sections} isMobile={false} />
          </div>

          {/* Right Utilities */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Search Button */}
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-white/15 hover:border-white/30 text-white/70 hover:text-white flex items-center justify-center transition-colors"
              title="Search Articles (⌘K)"
              aria-label="Search"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Custom Article Import Button */}
            <button
              onClick={() => setIsImportOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/90 hover:text-white border border-white/15 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs"
              title="Import Article (Pocket & Instapaper Clean Reader)"
              aria-label="Import Article"
            >
              <span className="text-[#FF6B4A]">✦</span>
              <span className="hidden sm:inline">Import</span>
            </button>

            {/* Traveler's Field Guide */}
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-white/15 hover:border-white/30 text-white/70 hover:text-white flex items-center justify-center transition-colors text-xs font-serif font-bold"
              title="Traveler's Field Guide"
              aria-label="Guide"
            >
              ?
            </button>

            {/* Streak Popover */}
            {profile && (
              <div className="relative shrink-0" ref={statsRef}>
                <button 
                  onClick={() => setIsStatsOpen(!isStatsOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-xs font-mono font-bold tracking-wider ${
                    isStatsOpen 
                      ? 'bg-[#FF6B4A] text-white border-[#FF6B4A] shadow-sm' 
                      : 'bg-white/10 hover:bg-white/15 text-white border-white/20'
                  }`}
                  title="Traveler's Chamber"
                  aria-label="Streak"
                >
                  <span className="text-[#FF6B4A]">✦</span>
                  <span>{profile.streak_count || 1}D</span>
                </button>

                {/* Sleek Floating Chamber Popover */}
                {isStatsOpen && (
                  <div 
                    style={{ zIndex: 9999, backgroundColor: '#FAF7EE', color: '#131E15' }}
                    className="absolute right-0 top-full mt-3 w-80 rounded-2xl p-5 shadow-2xl border border-[#131E15]/15 z-modal origin-top-right animate-in fade-in zoom-in-95 duration-150"
                  >
                    
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold block">
                          TRAVELER DOSSIER
                        </span>
                        <h4 className="font-serif font-bold text-base text-stone-900">
                          {rank.title}
                        </h4>
                      </div>
                      <Link 
                        href="/profile" 
                        onClick={() => setIsStatsOpen(false)}
                        className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 hover:text-amber-800"
                      >
                        Ledger →
                      </Link>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2.5 mb-4">
                      <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 text-center">
                        <span className="font-serif font-bold text-2xl text-amber-600 block">
                          {profile.streak_count || 1}
                        </span>
                        <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider font-bold">
                          Day Streak
                        </span>
                      </div>
                      <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 text-center">
                        <span className="font-serif font-bold text-2xl text-stone-900 block">
                          {minutesToday}m
                        </span>
                        <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider font-bold">
                          Today ({tempGoal}m goal)
                        </span>
                      </div>
                    </div>

                    {/* 7-Day Habit Ledger */}
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 mb-4">
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase text-stone-400 mb-2 font-bold">
                        <span>7-Day Spread</span>
                        <span>Mon – Sun</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {habitSpread.map((day, idx) => (
                          <div key={idx} className="flex flex-col items-center">
                            <span className="text-[9px] font-mono text-stone-400 mb-1">{day.dayShort}</span>
                            <div 
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                                day.status === 'completed' || day.status === 'today-done'
                                  ? 'bg-[#EA580C] text-white shadow-xs'
                                  : day.status === 'shielded'
                                  ? 'bg-stone-200 text-stone-700'
                                  : day.isToday
                                  ? 'border-2 border-[#EA580C] text-[#EA580C] bg-white font-bold'
                                  : 'bg-stone-200/50 text-stone-300'
                              }`}
                            >
                              {day.status === 'completed' || day.status === 'today-done' ? '✓' : '•'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Daily Goal Adjuster */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase text-stone-500 mb-1 font-bold">
                        <span>Daily Pace</span>
                        <span className="text-amber-700">{tempGoal} min / day</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" 
                        max="60" 
                        step="5" 
                        value={tempGoal}
                        onChange={(e) => updateGoal(parseInt(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-stone-200 accent-[#EA580C]"
                      />
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* Profile Dropdown */}
            <div className="relative group hidden md:block w-9 h-9 shrink-0">
              <button 
                style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', maxWidth: '36px', maxHeight: '36px' }}
                className="w-9 h-9 min-w-[36px] min-h-[36px] max-w-[36px] max-h-[36px] shrink-0 rounded-full bg-stone-800 text-white flex items-center justify-center font-serif font-bold text-sm ring-2 ring-white/20 group-hover:ring-[#EA580C] transition-all overflow-hidden cursor-pointer"
              >
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Profile" 
                    style={{ width: '36px', height: '36px', maxWidth: '36px', maxHeight: '36px' }}
                    className="w-9 h-9 max-w-[36px] max-h-[36px] object-cover rounded-full block shrink-0" 
                  />
                ) : (
                  <span>{profile?.first_name?.[0] || 'S'}</span>
                )}
              </button>
              
              <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 overflow-hidden">
                {profile && (
                  <div className="p-4 border-b border-stone-100 bg-stone-50">
                    <p className="font-bold text-stone-900 text-sm truncate">{profile.first_name} {profile.last_name}</p>
                    <p className="text-[11px] text-stone-400 font-mono mt-0.5">@{profile.username}</p>
                  </div>
                )}
                <div className="p-1.5 text-xs font-mono">
                  <Link href="/profile" className="flex items-center gap-2.5 px-3.5 py-2.5 text-stone-700 hover:text-stone-900 hover:bg-stone-50 rounded-xl transition-colors">
                    <UserIcon className="w-4 h-4 text-stone-400" />
                    <span>Traveler Profile</span>
                  </Link>
                  <Link href="/saved" className="flex items-center gap-2.5 px-3.5 py-2.5 text-stone-700 hover:text-stone-900 hover:bg-stone-50 rounded-xl transition-colors">
                    <BookmarkIcon className="w-4 h-4 text-stone-400" />
                    <span>Saved Library</span>
                  </Link>
                  <Link href="/settings" className="flex items-center gap-2.5 px-3.5 py-2.5 text-stone-700 hover:text-stone-900 hover:bg-stone-50 rounded-xl transition-colors">
                    <SettingsIcon className="w-4 h-4 text-stone-400" />
                    <span>Preferences</span>
                  </Link>
                  <div className="h-px bg-stone-100 my-1" />
                  <button onClick={handleSignOut} className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                    <LogOutIcon className="w-4 h-4 text-red-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-white/70 hover:text-white"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>

          </div>
        </div>

        {/* Mobile Nav Bar Row 2 (always visible on mobile, under row 1) */}
        <div className="md:hidden w-full border-t border-[#FFFDD0]/15 bg-[#5D8246] px-3 py-1 flex items-center justify-center">
          <CompassNavBar sections={sections} isMobile={true} />
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#5D8246] px-4 py-4 space-y-1">
            <Link 
              href="/feed" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-xl text-xs font-mono font-bold tracking-widest uppercase ${pathname === '/feed' ? 'bg-white/15 text-white' : 'text-white/70'}`}
            >
              FOR YOU
            </Link>
            {tabs.map((item) => {
              const cleanItem = String(item).trim();
              const isActive = pathname === `/feed/${cleanItem.toLowerCase()}`;
              return (
                <Link 
                  key={cleanItem} 
                  href={`/feed/${cleanItem.toLowerCase()}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-xl text-xs font-mono font-bold tracking-widest uppercase ${isActive ? 'bg-white/15 text-white' : 'text-white/70'}`}
                >
                  {cleanItem.toUpperCase()}
                </Link>
              );
            })}
            <div className="h-px bg-white/10 my-2" />
            <button 
              onClick={() => { setIsImportOpen(true); setIsMobileMenuOpen(false); }} 
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-mono text-white/90 hover:text-white w-full text-left"
            >
              <span className="text-[#FF6B4A]">✦</span> Import Web Article
            </button>
            <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs font-mono text-white/70">
              Profile
            </Link>
            <Link href="/saved" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs font-mono text-white/70">
              Saved Library
            </Link>
            <Link href="/settings" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs font-mono text-white/70">
              Preferences
            </Link>
            <div className="h-px bg-white/10 my-2" />
            <button onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }} className="px-4 py-2 text-xs font-mono text-red-400 w-full text-left">
              Sign Out
            </button>
          </div>
        )}
      </header>

      {/* Modals */}
      <CustomizeTabsModal 
        isOpen={isCustomizeOpen} 
        onClose={() => setIsCustomizeOpen(false)} 
        currentTabs={tabs}
        onSave={(newTabs) => {
          setTabs(newTabs);
          localStorage.setItem('nav_tabs', JSON.stringify(newTabs));
        }}
      />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <OnboardingModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} userId={profile?.id} userName={profile?.first_name} />
      <ImportArticleModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} userId={profile?.id} onReadArticle={(art) => setReaderArticle(art)} />
      {readerArticle && (
        <ReadingModal 
          isOpen={!!readerArticle} 
          onClose={() => setReaderArticle(null)} 
          article={readerArticle}
        />
      )}
    </>
  );
};
