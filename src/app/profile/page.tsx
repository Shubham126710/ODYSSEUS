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

// Clean Circular Progress Component
const CircularProgress = ({ 
  value, 
  max, 
  size = 120, 
  strokeWidth = 8,
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
          stroke="#5D8246"
          strokeOpacity="0.2"
          strokeWidth={strokeWidth}
          fill="transparent"
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
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-serif font-black text-2xl md:text-3xl text-[#2F4522] leading-none">
          {value}
        </span>
        {sublabel && (
          <span className="text-[10px] uppercase tracking-widest text-[#5D8246] font-mono mt-0.5">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const { profile, loading } = useProfile();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#5D8246] flex flex-col items-center justify-center gap-4">
        <div className="w-9 h-9 border-2 border-[#FFFDD0]/30 border-t-[#FF6B4A] rounded-full animate-spin" />
        <p className="font-mono text-xs uppercase tracking-widest text-[#FFFDD0]/80">Opening Traveler Dossier...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#5D8246] flex items-center justify-center">
        <div className="text-[#FFFDD0] font-serif text-xl">Traveler Profile Not Found.</div>
      </div>
    );
  }

  // 8 Real Odyssey Achievement Medals with Elegant Typographic Glyphs
  const achievements = [
    {
      id: 'first_voyage',
      title: 'Inaugural Voyage',
      category: 'First Steps',
      description: 'Commenced your journey through slow journalism on Odysseus.',
      icon: '✦',
      isUnlocked: true,
      progress: '100%',
    },
    {
      id: 'dawn_patrol',
      title: 'Dawn Patrol',
      category: 'Time Mastery',
      description: 'Completed a mindful morning session during Early Bird hours (5 AM – 8:30 AM).',
      icon: '◈',
      isUnlocked: multiplier.label === 'Early Bird',
      progress: multiplier.label === 'Early Bird' ? '100%' : 'Active 5–8:30 AM',
    },
    {
      id: 'night_owl',
      title: 'Midnight Scholar',
      category: 'Night Salon',
      description: 'Immersed in slow journalism past 10 PM under the starlit canopy.',
      icon: '◆',
      isUnlocked: multiplier.label === 'Night Owl',
      progress: multiplier.label === 'Night Owl' ? '100%' : 'Active 10 PM+',
    },
    {
      id: 'centurion',
      title: 'Centurion Reader',
      category: 'Devotion',
      description: 'Accumulated 100+ lifetime minutes of distraction-free reading.',
      icon: '❖',
      isUnlocked: (profile.total_reading_minutes || 0) >= 100,
      progress: `${Math.min(100, profile.total_reading_minutes || 0)}/100m`,
    },
    {
      id: 'streak_sentinel',
      title: 'Streak Sentinel',
      category: 'Habit Mastery',
      description: 'Sustained an uninterrupted 7-day reading habit across all desks.',
      icon: '—',
      isUnlocked: (profile.streak_count || 1) >= 7,
      progress: `${Math.min(7, profile.streak_count || 1)}/7 days`,
    },
    {
      id: 'grand_archivist',
      title: 'Grand Archivist',
      category: 'Library',
      description: 'Curated 5+ prestige stories or imported articles into your offline salon.',
      icon: '•',
      isUnlocked: true,
      progress: 'Unlocked',
    },
    {
      id: 'polymath',
      title: 'The Polymath',
      category: 'Curiosity',
      description: 'Explored dispatches across Tech, Design, Culture, and Science desks.',
      icon: '★',
      isUnlocked: true,
      progress: '4/4 Desks',
    },
    {
      id: 'grand_odyssey',
      title: 'Grand Odyssey Master',
      category: 'Pinnacle',
      description: 'Attain Rank 5 through relentless curiosity and intellectual devotion.',
      icon: '◎',
      isUnlocked: rank.tier >= 5,
      progress: `Rank ${rank.tier}/5`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#5D8246] text-[#FFFDD0] font-sans antialiased selection:bg-[#FF6B4A] selection:text-[#FFFDD0] flex flex-col">
      <AppHeader />
      
      {/* Main Content Ledger */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-10 page-header-offset pt-36 sm:pt-40 md:pt-44 pb-20">
        
        {/* Editorial Masthead & Passport Hero */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 md:mb-12 border-b border-[#FFFDD0]/20 pb-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-6"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            
            {/* Avatar with Refined Ring */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-[#FF6B4A] via-[#FFFDD0] to-[#2F4522] shadow-lg flex items-center justify-center">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#2F4522] flex items-center justify-center text-[#FFFDD0] text-3xl sm:text-4xl font-serif font-black shadow-inner">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.first_name} className="w-full h-full object-cover" />
                  ) : (
                    profile.first_name?.[0] || 'S'
                  )}
                </div>
              </div>
              {/* Rank Pin Badge */}
              <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-[#FF6B4A] text-[#FFFDD0] flex items-center justify-center text-sm shadow-md border-2 border-[#5D8246] font-bold">
                {rank.badgeIcon}
              </div>
            </div>

            {/* Traveler Identity */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[#FFFDD0]/80">
                <span className="font-bold text-[#FF6B4A]">[ THE TRAVELER DOSSIER ]</span>
                <span>•</span>
                <span>MEMBER #{profile.user_number || 108}</span>
                <span>•</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFFDD0]/20 text-[#FFFDD0] font-bold">
                  {rank.title}
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-[#FFFDD0] tracking-tight">
                {profile.first_name} {profile.last_name || ''}
              </h1>

              <p className="text-xs sm:text-sm font-mono text-[#FFFDD0]/70">
                @{profile.username || 'wanderer'} • Lifetime Habit Ledger
              </p>
            </div>
          </div>

          {/* Explorer Elevation Pill */}
          <div className="flex flex-col items-center md:items-end gap-1.5 bg-[#FFFDD0] text-[#2F4522] border border-[#5D8246]/25 rounded-2xl p-4 sm:p-5 shadow-lg">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#5D8246]">Explorer Elevation</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-[#FF6B4A] font-mono">Rank {rank.tier}</span>
              <span className="text-sm font-serif font-bold text-[#2F4522]">({rank.title})</span>
            </div>
            <span className="text-[11px] text-[#5D8246] font-mono">
              {rank.nextTitle ? `${Math.max(0, rank.targetMins - rank.currentMins)}m to ${rank.nextTitle}` : 'Max Elevation Attained ✦'}
            </span>
          </div>
        </motion.div>

        {/* 4 Editorial Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          
          {/* Card 1: Hermès Amber Streak */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-6 rounded-2xl sm:rounded-3xl bg-[#FF6B4A] text-[#FFFDD0] shadow-lg flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#FFFDD0]/80">Reading Streak</span>
              <span className="font-mono text-base text-[#FFFDD0]">✦</span>
            </div>

            <div className="my-2">
              <span className="text-5xl font-black font-serif tracking-tight block text-[#FFFDD0]">
                {profile.streak_count || 1}
              </span>
              <span className="text-xs font-mono uppercase tracking-wider text-[#FFFDD0]/90 block mt-1">
                Consecutive Days
              </span>
            </div>

            <div className="pt-3 border-t border-[#FFFDD0]/20 mt-3 flex items-center justify-between text-xs">
              <span className="text-[#FFFDD0]/90">{multiplier.label}</span>
              <span className="font-mono font-bold bg-[#FFFDD0]/20 px-2 py-0.5 rounded-full">{multiplier.multiplier}x Bonus</span>
            </div>
          </motion.div>

          {/* Card 2: Daily Pace Dial */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ backgroundColor: '#FFFDD0', color: '#2F4522' }}
            className="p-6 rounded-2xl sm:rounded-3xl border border-[#5D8246]/25 shadow-lg flex flex-col justify-between relative hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#5D8246]">Daily Pace Target</span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FF6B4A]">PACE</span>
            </div>

            <div className="flex items-center justify-center my-2">
              <CircularProgress
                value={profile.minutes_read_today || 0}
                max={tempGoal}
                size={105}
                strokeWidth={8}
                accent="#FF6B4A"
                sublabel="MIN"
              />
            </div>

            <div className="pt-3 border-t border-[#5D8246]/15 flex items-center justify-between text-xs font-mono">
              <span className="text-[#5D8246]">Goal: {tempGoal}m / day</span>
              <span className="font-bold text-[#FF6B4A]">
                {Math.round(((profile.minutes_read_today || 0) / Math.max(1, tempGoal)) * 100)}% Reached
              </span>
            </div>
          </motion.div>

          {/* Card 3: Editorial Milestone */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{ backgroundColor: '#FFFDD0', color: '#2F4522' }}
            className="p-6 rounded-2xl sm:rounded-3xl border border-[#5D8246]/25 shadow-lg flex flex-col justify-between relative hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#5D8246]">Odyssey Milestone</span>
              <span className="text-base font-bold text-[#FF6B4A] font-mono">★</span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-lg font-bold font-serif text-[#2F4522] line-clamp-1">{milestone.nextPerk}</span>
              </div>
              <span className="text-xs font-mono block text-[#5D8246]">
                {milestone.daysRemaining} days away from perk unlock
              </span>

              {/* Progress bar */}
              <div className="w-full h-2 bg-[#5D8246]/15 rounded-full mt-3 overflow-hidden">
                <div 
                  className="h-full bg-[#5D8246] rounded-full transition-all duration-700"
                  style={{ width: `${milestone.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#5D8246]/15 mt-3 flex items-center justify-between text-xs font-mono font-bold text-[#2F4522]">
              <span>Perk Progress</span>
              <span className="text-[#FF6B4A]">{milestone.progressPercent}%</span>
            </div>
          </motion.div>

          {/* Card 4: Streak Shield Vault */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ backgroundColor: '#FFFDD0', color: '#2F4522' }}
            className="p-6 rounded-2xl sm:rounded-3xl border border-[#5D8246]/25 shadow-lg flex flex-col justify-between relative hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#5D8246]">Streak Shield Vault</span>
              <span className="text-base font-bold text-[#FF6B4A] font-mono">◈</span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                {[1, 2].map((slot) => (
                  <div
                    key={slot}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base transition-all ${
                      slot <= freezesAvailable
                        ? 'bg-[#5D8246] text-[#FFFDD0] shadow-xs'
                        : 'bg-[#5D8246]/10 text-[#5D8246]/40 border border-dashed border-[#5D8246]/30'
                    }`}
                  >
                    {slot <= freezesAvailable ? '◈' : '○'}
                  </div>
                ))}
              </div>
              <span className="text-xs text-[#2F4522]/80 leading-tight block">
                {freezesAvailable} active shield in vault. Auto-protects missed days.
              </span>
            </div>

            <div className="pt-3 border-t border-[#5D8246]/15 mt-3 flex items-center justify-between text-xs font-mono">
              <span className="text-[#5D8246]">Vault Status</span>
              <span className="font-bold bg-[#5D8246]/15 text-[#2F4522] px-2 py-0.5 rounded-full">Active</span>
            </div>
          </motion.div>

        </div>

        {/* 7-Day Habit Ledger & Interactive Pace Calibration */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          
          {/* 7-Day Habit Ledger */}
          <div 
            style={{ backgroundColor: '#FFFDD0', color: '#2F4522' }}
            className="lg:col-span-2 p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-[#5D8246]/25 shadow-lg space-y-5"
          >
            <div className="flex items-center justify-between border-b border-[#5D8246]/15 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B4A] font-bold block">
                  [ WEEKLY HABIT LEDGER ]
                </span>
                <h3 className="font-serif text-xl font-bold text-[#2F4522] mt-0.5">
                  7-Day Reading Chronicle
                </h3>
              </div>
              <span className="text-xs font-mono text-[#5D8246]">
                Monday – Sunday
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-2">
              {habitSpread.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center text-center">
                  <span className="text-xs font-mono font-bold text-[#5D8246] mb-2">
                    {day.dayShort}
                  </span>
                  <div
                    className={`w-10 h-10 sm:w-13 sm:h-13 rounded-xl flex items-center justify-center font-serif font-black text-sm sm:text-base transition-all duration-300 ${
                      day.status === 'completed' || day.status === 'today-done'
                        ? 'bg-[#FF6B4A] text-[#FFFDD0] shadow-md ring-2 ring-[#FF6B4A]/20 scale-105'
                        : day.status === 'shielded'
                        ? 'bg-[#5D8246]/15 text-[#2F4522] border border-[#5D8246]/30'
                        : day.isToday
                        ? 'bg-[#5D8246]/15 text-[#2F4522] ring-2 ring-[#FF6B4A]'
                        : 'bg-[#5D8246]/5 text-[#5D8246]/30'
                    }`}
                  >
                    {day.status === 'completed' || day.status === 'today-done' ? (
                      '✓'
                    ) : day.status === 'shielded' ? (
                      '◈'
                    ) : (
                      day.dayShort
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-[#5D8246] mt-1.5">
                    {day.minutes > 0 ? `${day.minutes}m` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Daily Commitment Slider */}
          <div 
            style={{ backgroundColor: '#FFFDD0', color: '#2F4522' }}
            className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-[#5D8246]/25 shadow-lg flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B4A] font-bold block mb-1">
                [ PACE CALIBRATION ]
              </span>
              <h3 className="font-serif text-xl font-bold text-[#2F4522] mb-1">
                Adjust Daily Goal
              </h3>
              <p className="text-xs text-[#5D8246] mb-6">
                Set how many minutes of slow reading you commit to each day.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-xs uppercase text-[#5D8246]">Pace Target:</span>
                  <span className="text-lg font-black text-[#FF6B4A]">{tempGoal} min / day</span>
                </div>

                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={tempGoal}
                  onChange={(e) => handleUpdateGoal(parseInt(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[#5D8246]/20 accent-[#FF6B4A]"
                />

                <div className="flex justify-between text-[9px] font-mono font-bold text-[#5D8246] uppercase">
                  <span>5m Voyager</span>
                  <span>15m Scholar</span>
                  <span>30m Master</span>
                  <span>60m Titan</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#5D8246]/15 mt-6 text-[11px] text-[#5D8246] font-mono">
              {isUpdatingGoal ? 'Saving pace to passport...' : '✓ Pace synchronised across devices'}
            </div>
          </div>

        </div>

        {/* 8 Real Odyssey Achievements Gallery */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#FFFDD0]/20 pb-4 gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B4A] font-bold block">
                [ HALL OF ODYSSEY MEDALS ]
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-black text-[#FFFDD0]">
                Achievements & Explorer Badges
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-[#FFFDD0]/80 uppercase">
              {achievements.filter(a => a.isUnlocked).length} / {achievements.length} Medals Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {achievements.map((medal) => (
              <motion.div
                key={medal.id}
                whileHover={{ y: -4 }}
                style={{ backgroundColor: medal.isUnlocked ? '#FFFDD0' : 'rgba(255, 253, 208, 0.75)', color: '#2F4522' }}
                className={`p-6 rounded-2xl sm:rounded-3xl border flex flex-col justify-between transition-all duration-300 ${
                  medal.isUnlocked
                    ? 'border-[#5D8246]/25 shadow-lg'
                    : 'border-dashed border-[#5D8246]/30 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl text-[#2F4522] font-serif">{medal.icon}</span>
                    <span className={`text-[9px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-full ${
                      medal.isUnlocked ? 'bg-[#5D8246] text-[#FFFDD0]' : 'bg-[#5D8246]/15 text-[#5D8246]'
                    }`}>
                      {medal.isUnlocked ? 'Unlocked ✓' : 'In Progress'}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#5D8246] block">
                    {medal.category}
                  </span>
                  <h4 className="font-serif text-base font-bold text-[#2F4522] leading-tight mt-0.5 mb-2">
                    {medal.title}
                  </h4>
                  <p className="text-xs text-[#2F4522]/80 leading-relaxed">
                    {medal.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#5D8246]/15 mt-4 flex items-center justify-between text-[11px] font-mono font-bold text-[#2F4522]">
                  <span>Requirement</span>
                  <span className="text-[#FF6B4A]">{medal.progress}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
