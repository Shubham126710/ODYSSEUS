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
  getWeekHabitSpread, 
  MultiplierInfo 
} from '@/lib/gamification';

// Minimal Editorial Icons
const UserIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const BookmarkIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
);
const SettingsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const LogOutIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

export const AppHeader = () => {
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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
  const minutesToday = profile?.minutes_read_today || 0;

  useEffect(() => {
    const saved = localStorage.getItem('nav_tabs');
    if (saved) {
      try { setTabs(JSON.parse(saved)); } catch {}
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
      <header className="sticky top-0 z-50 bg-[#F9F7F1]/95 backdrop-blur-md text-[#181715] border-b border-[#E3DDD2] shadow-[0_1px_3px_rgba(40,30,20,0.03)]">
        <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-4">
          
          {/* Authentic Broadsheet Brand Logo */}
          <Link href="/feed" className="flex items-center gap-3 group shrink-0">
            <div className="w-8 h-8 rounded-full p-0.5 border border-[#D5CEBF] bg-[#FAF8F3] flex items-center justify-center shadow-2xs group-hover:border-[#EA580C] transition-colors">
              <StaticOrangeCompass className="w-6 h-6 group-hover:rotate-45 transition-transform duration-500 shrink-0" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg tracking-[0.18em] font-black uppercase text-[#181715] leading-none">
                ODYSSEUS
              </span>
              <span className="text-[9px] font-mono tracking-[0.2em] text-[#8C8275] uppercase mt-0.5">
                Salon de Presse
              </span>
            </div>
          </Link>

          {/* Archival Channel Navigation with Roman Numerals */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 shrink-0">
            <Link 
              href="/feed" 
              className={`text-xs font-mono font-medium tracking-widest uppercase transition-colors relative py-1.5 flex items-center gap-1.5 ${
                pathname === '/feed' 
                  ? 'text-[#181715] font-bold' 
                  : 'text-[#7D7569] hover:text-[#181715]'
              }`}
            >
              <span className="text-[10px] opacity-50 font-serif">I.</span>
              <span>FOR YOU</span>
              {pathname === '/feed' && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#EA580C] rounded-full" />
              )}
            </Link>

            {tabs.map((item, idx) => {
              const cleanItem = String(item).trim();
              const isActive = pathname === `/feed/${cleanItem.toLowerCase()}`;
              const numeral = ROMAN_NUMERALS[idx + 1] || `${idx + 2}.`;
              return (
                <Link 
                  key={cleanItem} 
                  href={`/feed/${cleanItem.toLowerCase()}`}
                  className={`text-xs font-mono font-medium tracking-widest uppercase transition-colors relative py-1.5 flex items-center gap-1.5 ${
                    isActive 
                      ? 'text-[#181715] font-bold' 
                      : 'text-[#7D7569] hover:text-[#181715]'
                  }`}
                >
                  <span className="text-[10px] opacity-50 font-serif">{numeral}.</span>
                  <span>{cleanItem.toUpperCase()}</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#EA580C] rounded-full" />
                  )}
                </Link>
              );
            })}

            <button 
              onClick={() => setIsCustomizeOpen(true)} 
              className="w-5 h-5 rounded-full border border-[#D5CEBF] hover:border-[#8C8275] text-[#8C8275] hover:text-[#181715] flex items-center justify-center transition-colors shrink-0" 
              title="Customize Editorial Channels"
              aria-label="Customize Channels"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </nav>

          {/* Right Action Suite */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Search Button */}
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-xl text-[#7D7569] hover:text-[#181715] hover:bg-[#EFECE3] transition-colors"
              title="Search Library (⌘K)"
              aria-label="Search"
            >
              <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Custom Article Import Pill */}
            <button
              onClick={() => setIsImportOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-[#FAF7F2] hover:bg-[#F2EFE8] text-[#2C241E] border border-[#DDD6C8] text-xs font-mono font-medium uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-2xs hover:border-[#C4BCAB]"
              title="Import Article (Pocket & Instapaper Clean Reader)"
              aria-label="Import Article"
            >
              <span className="text-[#EA580C]">✦</span>
              <span className="hidden sm:inline">Import</span>
            </button>

            {/* Traveler's Field Guide */}
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="w-7 h-7 rounded-full border border-[#DDD6C8] hover:border-[#8C8275] bg-[#FAF7F2] text-[#7D7569] hover:text-[#181715] flex items-center justify-center transition-colors text-xs font-serif font-bold shadow-2xs"
              title="Traveler's Field Guide"
              aria-label="Guide"
            >
              ?
            </button>

            {/* Streak Emblem Badge */}
            {profile && (
              <div className="relative shrink-0" ref={statsRef}>
                <button 
                  onClick={() => setIsStatsOpen(!isStatsOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono font-medium tracking-wider transition-all shadow-2xs ${
                    isStatsOpen 
                      ? 'bg-[#181715] text-[#FAF7F2] border-[#181715]' 
                      : 'bg-[#FAF7F2] hover:bg-[#F2EFE8] text-[#8A5A1C] border-[#E5DECة] border-[#E8DFCF]'
                  }`}
                  title="Traveler's Chamber"
                  aria-label="Streak"
                >
                  <span className="text-[#EA580C]">◈</span>
                  <span className="font-bold text-[#7A4B1A]">{profile.streak_count || 1}D</span>
                </button>

                {/* Sleek Floating Chamber Popover */}
                {isStatsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-[#FAF7F2] text-[#181715] rounded-2xl p-5 shadow-2xl border border-[#DDD6C8] z-50 origin-top-right">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D5] mb-4">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-[#8C8275] font-bold block">
                          TRAVELER DOSSIER
                        </span>
                        <h4 className="font-serif font-bold text-base text-[#181715]">
                          {rank.title}
                        </h4>
                      </div>
                      <Link 
                        href="/profile" 
                        onClick={() => setIsStatsOpen(false)}
                        className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#EA580C] hover:underline"
                      >
                        View Dossier →
                      </Link>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-[#F2EFE7] rounded-xl p-3 border border-[#E3DDD0] text-center">
                        <span className="font-serif font-bold text-2xl text-[#181715] block">
                          {profile.streak_count || 1}
                        </span>
                        <span className="text-[10px] font-mono text-[#8C8275] uppercase tracking-wider">
                          Day Streak
                        </span>
                      </div>
                      <div className="bg-[#F2EFE7] rounded-xl p-3 border border-[#E3DDD0] text-center">
                        <span className="font-serif font-bold text-2xl text-[#181715] block">
                          {minutesToday}m
                        </span>
                        <span className="text-[10px] font-mono text-[#8C8275] uppercase tracking-wider">
                          Today ({tempGoal}m goal)
                        </span>
                      </div>
                    </div>

                    {/* 7-Day Habit Ledger */}
                    <div className="bg-[#F2EFE7] p-3 rounded-xl border border-[#E3DDD0] mb-4">
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#8C8275] mb-2 font-bold">
                        <span>7-Day Spread</span>
                        <span>Mon – Sun</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {habitSpread.map((day, idx) => (
                          <div key={idx} className="flex flex-col items-center">
                            <span className="text-[9px] font-mono text-[#8C8275] mb-1">{day.dayShort}</span>
                            <div 
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                                day.status === 'completed' || day.status === 'today-done'
                                  ? 'bg-[#EA580C] text-white shadow-2xs'
                                  : day.status === 'shielded'
                                  ? 'bg-[#E0DAD0] text-[#554D42]'
                                  : day.isToday
                                  ? 'border-2 border-[#EA580C] text-[#EA580C] bg-[#FAF7F2] font-bold'
                                  : 'bg-[#E5DFD4]/70 text-[#ABA193]'
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
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#8C8275] mb-1 font-bold">
                        <span>Daily Pace</span>
                        <span className="text-[#EA580C]">{tempGoal} min / day</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" 
                        max="60" 
                        step="5" 
                        value={tempGoal}
                        onChange={(e) => updateGoal(parseInt(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#DDD6C8] accent-[#EA580C]"
                      />
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* Profile Dropdown with strictly bounded 32px avatar */}
            <div className="relative group hidden md:block">
              <button 
                className="rounded-full bg-[#FAF7F2] text-[#181715] flex items-center justify-center font-serif font-bold text-xs ring-1 ring-[#D5CEBF] group-hover:ring-[#8C8275] transition-all overflow-hidden shrink-0 shadow-2xs"
                style={{ width: 32, height: 32, minWidth: 32, minHeight: 32, maxWidth: 32, maxHeight: 32 }}
              >
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover block" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span>{profile?.first_name?.[0] || 'S'}</span>
                )}
              </button>
              
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#FAF7F2] rounded-2xl shadow-xl border border-[#DDD6C8] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 overflow-hidden">
                {profile && (
                  <div className="p-4 border-b border-[#E8E2D5] bg-[#F2EFE7]">
                    <p className="font-bold text-[#181715] text-sm truncate font-serif">{profile.first_name} {profile.last_name}</p>
                    <p className="text-[11px] text-[#8C8275] font-mono mt-0.5">@{profile.username}</p>
                  </div>
                )}
                <div className="p-1.5 text-xs font-mono">
                  <Link href="/profile" className="flex items-center gap-2.5 px-3.5 py-2.5 text-[#554D42] hover:text-[#181715] hover:bg-[#EFECE3] rounded-xl transition-colors">
                    <UserIcon className="w-4 h-4 text-[#8C8275]" />
                    <span>Traveler Profile</span>
                  </Link>
                  <Link href="/saved" className="flex items-center gap-2.5 px-3.5 py-2.5 text-[#554D42] hover:text-[#181715] hover:bg-[#EFECE3] rounded-xl transition-colors">
                    <BookmarkIcon className="w-4 h-4 text-[#8C8275]" />
                    <span>Saved Library</span>
                  </Link>
                  <Link href="/settings" className="flex items-center gap-2.5 px-3.5 py-2.5 text-[#554D42] hover:text-[#181715] hover:bg-[#EFECE3] rounded-xl transition-colors">
                    <SettingsIcon className="w-4 h-4 text-[#8C8275]" />
                    <span>Preferences</span>
                  </Link>
                  <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-red-700 hover:bg-red-50 rounded-xl transition-colors text-left"
                  >
                    <LogOutIcon className="w-4 h-4 text-red-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
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

      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />

      <OnboardingModal 
        isOpen={isOnboardingOpen} 
        onClose={() => setIsOnboardingOpen(false)}
        userId={profile?.id}
        userName={profile?.first_name || 'Traveler'}
      />

      <ImportArticleModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)}
        userId={profile?.id}
        onArticleImported={(art) => {
          setReaderArticle(art);
        }}
      />

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
