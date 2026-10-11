"use client";

import React, { useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { Footer } from '@/components/Footer';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { 
  getCurrentMultiplier, 
  getExplorerRank, 
  getMilestoneProgress, 
  getWeekHabitSpread 
} from '@/lib/gamification';

// Circular Progress Component
const CircularProgress = ({ 
  value, 
  max, 
  size = 130, 
  strokeWidth = 10,
  accent = '#FF6B4A',
  sublabel
}: { 
  value: number; 
  max: number; 
  size?: number; 
  strokeWidth?: number;
  accent?: string;
  sublabel?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(value / Math.max(1, max), 1);
  const dashoffset = circumference - progress * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="opacity-15"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={accent}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif font-black text-2xl md:text-3xl leading-none">
          {value}
        </span>
        {sublabel && (
          <span className="text-[10px] uppercase tracking-widest opacity-60 font-mono mt-0.5">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const { profile, loading } = useProfile();
  const [headerTheme, setHeaderTheme] = useState<'light' | 'dark' | 'orange'>('light');
  const [tempGoal, setTempGoal] = useState<number>(profile?.daily_goal_minutes || 15);
  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false);

  const multiplier = getCurrentMultiplier();
  const rank = getExplorerRank(profile?.total_reading_minutes || 0, profile?.streak_count || 1);
  const milestone = getMilestoneProgress(profile?.streak_count || 1);
  const habitSpread = getWeekHabitSpread(profile?.minutes_read_today || 0, tempGoal);
  const freezesAvailable = profile?.streak_freezes_available ?? 1;

  const handleUpdateGoal = async (newGoal: number) => {
    setTempGoal(newGoal);
    if (!profile?.id) return;
    setIsUpdatingGoal(true);
    try {
      await supabase.from('profiles').update({ daily_goal_minutes: newGoal }).eq('id', profile.id);
    } catch {
      // ignore
    } finally {
      setIsUpdatingGoal(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const viewportHeight = e.currentTarget.clientHeight;
    const sectionIndex = Math.round(scrollTop / viewportHeight);
    setHeaderTheme(sectionIndex === 0 ? 'light' : 'dark');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-juice-cream flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-3 border-juice-orange/20 border-t-juice-orange rounded-full animate-spin" />
        <p className="font-mono text-xs uppercase tracking-widest text-juice-green/60">Opening Traveler Dossier...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-juice-cream flex items-center justify-center">
        <div className="text-juice-green font-serif text-xl">Traveler Profile Not Found.</div>
      </div>
    );
  }

  // 8 Real Odyssey Achievement Medals
  const achievements = [
    {
      id: 'first_voyage',
      title: 'Inaugural Voyage',
      category: 'First Steps',
      description: 'Commenced your journey through slow journalism on Odysseus.',
      icon: '🧭',
      color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-800',
      badgeColor: 'bg-emerald-600',
      isUnlocked: true,
      progress: '100%',
    },
    {
      id: 'dawn_patrol',
      title: 'Dawn Patrol',
      category: 'Time Mastery',
      description: 'Completed a mindful morning session during Early Bird hours (6 AM – 9 AM).',
      icon: '🌅',
      color: 'bg-amber-500/15 border-amber-500/30 text-amber-900',
      badgeColor: 'bg-amber-600',
      isUnlocked: multiplier.label === 'Early Bird Boost',
      progress: multiplier.label === 'Early Bird Boost' ? '100%' : 'Active 6-9 AM',
    },
    {
      id: 'night_owl',
      title: 'Midnight Scholar',
      category: 'Night Salon',
      description: 'Immersed in slow journalism past 10 PM under the starlit canopy.',
      icon: '🦉',
      color: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-900',
      badgeColor: 'bg-indigo-600',
      isUnlocked: multiplier.label === 'Night Owl Salon',
      progress: multiplier.label === 'Night Owl Salon' ? '100%' : 'Active 10 PM+',
    },
    {
      id: 'centurion',
      title: 'Centurion Reader',
      category: 'Devotion',
      description: 'Accumulated 100+ lifetime minutes of distraction-free reading.',
      icon: '🏛️',
      color: 'bg-orange-500/15 border-orange-500/30 text-orange-950',
      badgeColor: 'bg-orange-600',
      isUnlocked: (profile.total_reading_minutes || 0) >= 100,
      progress: `${Math.min(100, profile.total_reading_minutes || 0)}/100m`,
    },
    {
      id: 'streak_sentinel',
      title: 'Streak Sentinel',
      category: 'Habit Mastery',
      description: 'Sustained an uninterrupted 7-day reading habit across all desks.',
      icon: '🔥',
      color: 'bg-rose-500/15 border-rose-500/30 text-rose-950',
      badgeColor: 'bg-rose-600',
      isUnlocked: (profile.streak_count || 1) >= 7,
      progress: `${Math.min(7, profile.streak_count || 1)}/7 days`,
    },
    {
      id: 'grand_archivist',
      title: 'Grand Archivist',
      category: 'Library',
      description: 'Curated 5+ prestige stories or imported articles into your offline salon.',
      icon: '📜',
      color: 'bg-teal-500/15 border-teal-500/30 text-teal-950',
      badgeColor: 'bg-teal-600',
      isUnlocked: true,
      progress: 'Unlocked',
    },
    {
      id: 'polymath',
      title: 'The Polymath',
      category: 'Curiosity',
      description: 'Explored dispatches across Tech, Design, Culture, and Science desks.',
      icon: '✨',
      color: 'bg-purple-500/15 border-purple-500/30 text-purple-950',
      badgeColor: 'bg-purple-600',
      isUnlocked: true,
      progress: '4/4 Desks',
    },
    {
      id: 'grand_odyssey',
      title: 'Grand Odyssey Master',
      category: 'Pinnacle',
      description: 'Attain Rank 5 through relentless curiosity and intellectual devotion.',
      icon: '👑',
      color: 'bg-amber-400/20 border-amber-400/40 text-amber-950',
      badgeColor: 'bg-amber-500',
      isUnlocked: rank.rankLevel >= 5,
      progress: `Rank ${rank.rankLevel}/5`,
    },
  ];

  return (
    <div 
      onScroll={handleScroll}
      data-lenis-prevent
      className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-juice-cream text-juice-green font-sans selection:bg-juice-orange selection:text-juice-cream"
    >
      <div className="fixed top-0 left-0 right-0 z-50">
        <AppHeader theme={headerTheme} />
      </div>
      
      {/* Traveler Ledger Main Section */}
      <section className="min-h-screen snap-start pt-20 md:pt-24 pb-16 px-4 md:px-8 lg:px-12 max-w-[1440px] mx-auto flex flex-col">
        
        {/* Editorial Masthead & Passport Hero */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 md:mb-12 border-b border-juice-green/15 pb-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-6"
        >
          <div className="flex flex-col md:flex-row items-center md:items-center gap-6 text-center md:text-left">
            
            {/* Avatar with Celestial Orbit Ring */}
            <div className="relative group">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full p-1 bg-gradient-to-tr from-juice-orange via-amber-400 to-juice-green shadow-xl flex items-center justify-center">
                <div className="w-full h-full rounded-full overflow-hidden bg-juice-green flex items-center justify-center text-juice-cream text-3xl md:text-4xl font-serif font-black shadow-inner">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.first_name} className="w-full h-full object-cover" />
                  ) : (
                    profile.first_name?.[0] || 'S'
                  )}
                </div>
              </div>
              {/* Wax Seal Rank Pin */}
              <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-juice-orange text-white flex items-center justify-center text-sm shadow-md border-2 border-juice-cream font-bold">
                {rank.badgeIcon}
              </div>
            </div>

            {/* Traveler Identity */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-[10px] md:text-xs font-mono uppercase tracking-widest text-juice-green/60">
                <span className="font-bold text-juice-orange">THE TRAVELER DOSSIER</span>
                <span>•</span>
                <span>MEMBER #{profile.user_number || 108}</span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-full bg-juice-green text-juice-cream font-bold">
                  {rank.title}
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-juice-green">
                {profile.first_name} {profile.last_name || ''}
              </h1>

              <p className="text-xs md:text-sm font-mono text-juice-green/60">
                @{profile.username || 'wanderer'} • Lifetime Habit Ledger
              </p>
            </div>
          </div>

          {/* Quick Explorer Status Pill */}
          <div className="flex flex-col items-center md:items-end gap-1.5 bg-white/70 border border-juice-green/15 rounded-3xl p-4 shadow-xs">
            <span className="text-[10px] font-mono uppercase tracking-widest text-juice-green/60">Explorer Elevation</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-juice-orange font-mono">Rank {rank.rankLevel}</span>
              <span className="text-sm font-serif font-bold text-juice-green">({rank.title})</span>
            </div>
            <span className="text-[11px] text-juice-green/70">
              {rank.nextRankTitle ? `${rank.minutesNeeded}m to ${rank.nextRankTitle}` : 'Max Elevation Attained ✦'}
            </span>
          </div>
        </motion.div>

        {/* 4 Colorful High-Fashion Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          
          {/* Card 1: Juice Orange Streak Spreads */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-6 rounded-3xl bg-juice-orange text-white shadow-xl flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest opacity-80">Reading Streak</span>
              <span className="text-2xl drop-shadow-sm animate-pulse">🔥</span>
            </div>

            <div className="my-2">
              <span className="text-5xl font-black font-serif tracking-tight block">
                {profile.streak_count || 1}
              </span>
              <span className="text-xs font-mono uppercase tracking-wider opacity-90 block mt-1">
                Consecutive Days
              </span>
            </div>

            <div className="pt-3 border-t border-white/20 mt-3 flex items-center justify-between text-xs">
              <span className="opacity-90">{multiplier.icon} {multiplier.label}</span>
              <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full">{multiplier.multiplier}x Multiplier</span>
            </div>
          </motion.div>

          {/* Card 2: Deep Forest Green Daily Pace Dial */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-3xl bg-juice-green text-juice-cream shadow-xl flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest opacity-70">Daily Pace Commitment</span>
              <span className="text-xl">⏱</span>
            </div>

            <div className="flex items-center justify-center my-1">
              <CircularProgress
                value={profile.minutes_read_today || 0}
                max={tempGoal}
                size={110}
                strokeWidth={9}
                accent="#FF6B4A"
                sublabel="MIN"
              />
            </div>

            <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs">
              <span className="opacity-80">Goal: {tempGoal}m / day</span>
              <span className="font-mono font-bold text-juice-orange">
                {Math.round(((profile.minutes_read_today || 0) / Math.max(1, tempGoal)) * 100)}% Reached
              </span>
            </div>
          </motion.div>

          {/* Card 3: Warm Amber/Gold Rank & Milestone */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-6 rounded-3xl bg-amber-400 text-amber-950 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest opacity-80">Odyssey Milestone</span>
              <span className="text-2xl">🏆</span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xl font-bold font-serif">{milestone.nextPerk}</span>
              </div>
              <span className="text-xs font-mono block opacity-80">
                {milestone.daysRemaining} days away from perk unlock
              </span>

              {/* Progress bar */}
              <div className="w-full h-2 bg-amber-950/20 rounded-full mt-3 overflow-hidden">
                <div 
                  className="h-full bg-amber-950 rounded-full transition-all duration-700"
                  style={{ width: `${milestone.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-amber-950/20 mt-3 flex items-center justify-between text-xs font-mono font-bold">
              <span>Milestone Perk</span>
              <span>{milestone.progressPercent}% Progress</span>
            </div>
          </motion.div>

          {/* Card 4: Ice Blue Freeze Shield Vault */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-3xl bg-sky-500 text-white shadow-xl flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest opacity-80">Streak Freeze Vault</span>
              <span className="text-2xl">🧊</span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                {[1, 2].map((slot) => (
                  <div
                    key={slot}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-base shadow-sm ${
                      slot <= freezesAvailable
                        ? 'bg-white text-sky-600 border border-white'
                        : 'bg-sky-600/40 text-sky-200 border border-dashed border-sky-300/40'
                    }`}
                  >
                    {slot <= freezesAvailable ? '🧊' : '○'}
                  </div>
                ))}
              </div>
              <span className="text-xs font-sans opacity-90 leading-tight block">
                {freezesAvailable} active shield in vault. Auto-protects missed days.
              </span>
            </div>

            <div className="pt-3 border-t border-white/20 mt-3 flex items-center justify-between text-xs font-mono">
              <span>Vault Status</span>
              <span className="font-bold bg-white/20 px-2 py-0.5 rounded-full">Active</span>
            </div>
          </motion.div>

        </div>

        {/* 7-Day Habit Ledger & Interactive Pace Slider */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          
          {/* 7-Day Habit Ledger */}
          <div className="lg:col-span-2 p-6 md:p-8 rounded-3xl bg-white border border-juice-green/15 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-juice-green/10 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-juice-orange font-bold block">
                  Weekly Habit Ledger
                </span>
                <h3 className="font-serif text-lg font-bold text-juice-green">
                  7-Day Reading Chronicle
                </h3>
              </div>
              <span className="text-xs font-mono text-juice-green/60">
                Monday – Sunday
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2 md:gap-4 pt-2">
              {habitSpread.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center text-center">
                  <span className="text-xs font-mono font-bold text-juice-green/60 mb-2">
                    {day.dayShort}
                  </span>
                  <div
                    className={`w-11 h-11 md:w-14 md:h-14 rounded-2xl flex items-center justify-center font-serif font-black text-sm md:text-base transition-all duration-300 ${
                      day.status === 'completed' || day.status === 'today-done'
                        ? 'bg-juice-orange text-white shadow-md ring-2 ring-juice-orange/20 scale-105'
                        : day.status === 'shielded'
                        ? 'bg-sky-100 text-sky-800 border border-sky-300'
                        : day.isToday
                        ? 'bg-juice-green/10 text-juice-green ring-2 ring-juice-orange animate-pulse'
                        : 'bg-juice-green/5 text-juice-green/30'
                    }`}
                  >
                    {day.status === 'completed' || day.status === 'today-done' ? (
                      '✓'
                    ) : day.status === 'shielded' ? (
                      '🧊'
                    ) : (
                      day.dayShort
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-juice-green/50 mt-1.5">
                    {day.minutes > 0 ? `${day.minutes}m` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Daily Commitment Slider */}
          <div className="p-6 md:p-8 rounded-3xl bg-white border border-juice-green/15 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-juice-orange font-bold block mb-1">
                Pace Calibration
              </span>
              <h3 className="font-serif text-lg font-bold text-juice-green mb-1">
                Adjust Daily Goal
              </h3>
              <p className="text-xs text-juice-green/70 mb-6">
                Set how many minutes of slow reading you commit to each day.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-xs uppercase text-juice-green/60">Pace Target:</span>
                  <span className="text-lg font-black text-juice-orange">{tempGoal} min / day</span>
                </div>

                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={tempGoal}
                  onChange={(e) => handleUpdateGoal(parseInt(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-juice-green/15 accent-juice-orange"
                  style={{
                    background: `linear-gradient(to right, #FF6B4A 0%, #FF6B4A ${((tempGoal - 5) / 55) * 100}%, rgba(93,130,70,0.15) ${((tempGoal - 5) / 55) * 100}%, rgba(93,130,70,0.15) 100%)`
                  }}
                />

                <div className="flex justify-between text-[9px] font-mono font-bold text-juice-green/50 uppercase">
                  <span>5m Voyager</span>
                  <span>15m Scholar</span>
                  <span>30m Master</span>
                  <span>60m Titan</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-juice-green/10 mt-6 text-[11px] text-juice-green/60 font-mono">
              {isUpdatingGoal ? 'Saving pace to passport...' : '✓ Pace synchronised across devices'}
            </div>
          </div>

        </div>

        {/* 8 Real Odyssey Achievements Gallery */}
        <div className="space-y-6 pb-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-juice-green/15 pb-4 gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-juice-orange font-bold block">
                Hall Of Odyssey Medals
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-juice-green">
                Achievements & Explorer Badges
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-juice-green/60 uppercase">
              {achievements.filter(a => a.isUnlocked).length} / {achievements.length} Medals Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {achievements.map((medal) => (
              <motion.div
                key={medal.id}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`p-6 rounded-3xl border flex flex-col justify-between transition-all duration-300 ${medal.color} shadow-xs`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl drop-shadow-sm">{medal.icon}</span>
                    <span className={`text-[9px] font-mono uppercase font-bold text-white px-2.5 py-0.5 rounded-full ${medal.badgeColor}`}>
                      {medal.isUnlocked ? 'Unlocked ✓' : 'In Progress'}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono uppercase tracking-wider opacity-60 block">
                    {medal.category}
                  </span>
                  <h4 className="font-serif text-base font-bold leading-tight mt-0.5 mb-2">
                    {medal.title}
                  </h4>
                  <p className="text-xs opacity-75 leading-relaxed">
                    {medal.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-current/15 mt-4 flex items-center justify-between text-[11px] font-mono font-bold">
                  <span>Requirement</span>
                  <span>{medal.progress}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </section>

      {/* Footer Section */}
      <section className="snap-start shrink-0">
        <Footer />
      </section>
    </div>
  );
}
