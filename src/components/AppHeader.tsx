"use client";

import React, { useState, useEffect } from 'react';
import { StaticOrangeCompass } from './StaticOrangeCompass';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';
import { useProfile } from '@/hooks/useProfile';
import { CustomizeTabsModal } from './CustomizeTabsModal';

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

// Duolingo-style Fire Icon (Enhanced)
const FireIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className}>
    <defs>
      <linearGradient id="flameGradient" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FF9600" />
        <stop offset="100%" stopColor="#FF5000" />
      </linearGradient>
    </defs>
    {/* Main Flame Body - 3 Prongs, Wide Base */}
    <path 
      d="M50 92C25 92 15 75 15 55C15 35 5 20 5 20C15 25 25 40 30 50C30 40 35 15 50 5C65 15 70 40 70 50C75 40 85 25 95 20C95 20 85 35 85 55C85 75 75 92 50 92Z" 
      fill="url(#flameGradient)" 
      stroke="#E64A19" 
      strokeWidth="3" 
      strokeLinejoin="round"
    />
    {/* Inner Core - Lighter */}
    <path 
      d="M50 82C35 82 28 70 28 55C28 45 22 35 22 35C28 38 35 48 38 55C38 48 42 32 50 25C58 32 62 48 62 55C65 48 72 38 78 35C78 35 72 45 72 55C72 70 65 82 50 82Z" 
      fill="#FFC107" 
    />
    {/* Shine */}
    <path 
      d="M35 55Q35 45 40 40" 
      stroke="white" 
      strokeWidth="3" 
      strokeLinecap="round" 
      opacity="0.6"
    />
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
  const [tempGoal, setTempGoal] = useState(15);
  const [tabs, setTabs] = useState(['Tech', 'Design', 'Culture', 'Science']);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useProfile();

  const isLight = theme === 'light';
  const isOrange = theme === 'orange';
  
  const textColor = isLight ? 'text-juice-green' : 'text-juice-cream';
  const bgColor = isLight ? 'bg-juice-cream/80' : isOrange ? 'bg-juice-orange/80' : 'bg-juice-green/80';
  const borderColor = isLight ? 'border-juice-green/10' : 'border-juice-cream/10';
  const navTextColor = isLight ? 'text-juice-green/60 hover:text-juice-green' : 'text-juice-cream/60 hover:text-juice-cream';

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

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-500 ${bgColor} ${borderColor}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        
        <Link href="/feed" className="flex items-center gap-3 group">
          <StaticOrangeCompass className="w-8 h-8 group-hover:rotate-45 transition-transform duration-500" />
          <span className={`font-serif text-xl font-bold tracking-wide transition-colors duration-500 ${textColor}`}>ODYSSEUS</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link 
            href="/feed" 
            className={`text-sm font-bold uppercase tracking-widest transition-colors ${
              pathname === '/feed' 
                ? (isOrange ? 'text-juice-cream' : 'text-juice-orange') 
                : (isOrange ? 'text-juice-cream/60 hover:text-juice-cream' : 'text-juice-green/60 hover:text-juice-green')
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
                    ? 'text-juice-orange' 
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

        <div className="flex items-center gap-6">
          
          {profile && (
            <div className="relative">
              <button 
                onClick={() => setIsStatsOpen(!isStatsOpen)}
                className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${isStatsOpen ? 'bg-juice-green text-juice-cream ring-4 ring-juice-green/20' : 'bg-juice-orange text-white hover:bg-juice-orange/90'}`}
              >
                <FireIcon className="w-5 h-5" />
                <span className="font-bold text-sm">{profile.streak_count}</span>
              </button>

              {/* Modern Stats Dropdown */}
              <div className={`absolute right-0 top-full mt-4 w-80 bg-juice-orange/95 backdrop-blur-xl text-juice-cream rounded-3xl shadow-[0_20px_60px_-15px_rgba(255,107,0,0.5)] p-6 transform transition-all duration-300 origin-top-right z-50 border border-white/20 ring-1 ring-black/5 ${isStatsOpen ? 'opacity-100 scale-100 visible translate-y-0' : 'opacity-0 scale-95 invisible -translate-y-2'}`}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-full">
                      <FireIcon className="w-4 h-4" />
                    </div>
                    <h3 className="font-sans text-lg font-bold tracking-tight text-white">Daily Progress</h3>
                  </div>
                  <Link href="/profile" className="text-[10px] font-black uppercase tracking-widest text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-all">
                    View Profile
                  </Link>
                </div>

                <div className="flex items-center gap-6 mb-8 relative">
                  {/* Glow effect behind progress */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[70px] h-[70px] bg-white/20 blur-2xl rounded-full pointer-events-none" />
                  
                  <CompactCircularProgress value={profile.minutes_read_today} max={tempGoal} size={70} strokeWidth={6} />
                  <div className="flex-1 space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Read Today</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-4xl font-black text-white tracking-tight">{profile.minutes_read_today}</p>
                      <span className="text-sm text-white/60 font-bold">min</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-black/10 rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-white/60">Daily Goal</span>
                    <span className="text-white">{tempGoal} min</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="60" 
                    step="5" 
                    value={tempGoal}
                    onChange={(e) => updateGoal(parseInt(e.target.value))}
                    className="w-full h-2 bg-black/20 rounded-full appearance-none cursor-pointer accent-white hover:accent-juice-green transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          <button className={`p-2 transition-colors ${isLight ? 'text-juice-green/60 hover:text-juice-orange' : 'text-juice-cream/60 hover:text-juice-cream'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          
          <div className="relative group">
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
        </div>
      </div>
      <CustomizeTabsModal 
        isOpen={isCustomizeOpen} 
        onClose={() => setIsCustomizeOpen(false)} 
        currentTabs={tabs} 
        onSave={(newTabs) => {
          setTabs(newTabs);
          localStorage.setItem('nav_tabs', JSON.stringify(newTabs));
        }} 
      />
    </header>
  );
};
