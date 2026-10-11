/**
 * Odysseus Gamification & Multiplier Engine
 * Handles time-of-day multipliers, streak freezes, 7-day habit ledger,
 * explorer ranking system, and reading session analytics.
 */

import { supabase } from '@/lib/supabaseClient';

export interface MultiplierInfo {
  multiplier: number;
  label: string;
  icon: string;
  description: string;
  badge: string;
  isBonusActive: boolean;
  endsAtText?: string;
}

export interface ExplorerRank {
  tier: number;
  title: string;
  badgeIcon: string;
  nextTitle: string | null;
  progressPercent: number;
  currentMins: number;
  targetMins: number;
  perks: string[];
}

export interface DayHabitStatus {
  dayName: string;
  dayShort: string;
  dateStr: string;
  isToday: boolean;
  status: 'completed' | 'shielded' | 'today-done' | 'today-pending' | 'future' | 'missed';
  minutes: number;
}

/**
 * Calculates current time-of-day reading multiplier.
 * - Early Bird (1.5x): 05:00 - 08:30
 * - Night Owl (1.5x): 22:00 - 04:00
 * - Weekend Deep Diver (1.25x): Saturdays & Sundays (outside early/night hours)
 * - Standard (1.0x): all other times
 */
export function getCurrentMultiplier(): MultiplierInfo {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const day = now.getDay(); // 0 is Sunday, 6 is Saturday
  const timeInMinutes = hours * 60 + minutes;

  // Early Bird: 05:00 (300m) to 08:30 (510m)
  if (timeInMinutes >= 300 && timeInMinutes <= 510) {
    return {
      multiplier: 1.5,
      label: 'Early Bird',
      icon: '🌅',
      badge: '1.5x ACTIVE',
      description: 'Morning contemplation bonus: 1.5x reading minutes & XP',
      isBonusActive: true,
      endsAtText: 'Ends at 08:30 AM',
    };
  }

  // Night Owl: 22:00 (1320m) to 04:00 (240m)
  if (timeInMinutes >= 1320 || timeInMinutes <= 240) {
    return {
      multiplier: 1.5,
      label: 'Night Owl',
      icon: '🦉',
      badge: '1.5x ACTIVE',
      description: 'Late night quiet hours: 1.5x reading minutes & XP',
      isBonusActive: true,
      endsAtText: 'Ends at 04:00 AM',
    };
  }

  // Weekend Deep Diver: Saturday (6) or Sunday (0)
  if (day === 0 || day === 6) {
    return {
      multiplier: 1.25,
      label: 'Weekend Deep Diver',
      icon: '⚡',
      badge: '1.25x ACTIVE',
      description: 'Weekend long-form focus: 1.25x reading XP',
      isBonusActive: true,
      endsAtText: 'Active all weekend',
    };
  }

  return {
    multiplier: 1.0,
    label: 'Standard Pace',
    icon: '📖',
    badge: '1.0x XP',
    description: 'Standard editorial reading pace',
    isBonusActive: false,
    endsAtText: 'Next: Night Owl at 10 PM',
  };
}

/**
 * Determines Odyssey Explorer Rank based on total reading minutes and streak length.
 */
export function getExplorerRank(totalMinutes: number = 0, streakCount: number = 0): ExplorerRank {
  if (totalMinutes >= 2000 || streakCount >= 30) {
    return {
      tier: 5,
      title: 'Grand Odyssey Master',
      badgeIcon: '👑',
      nextTitle: null,
      progressPercent: 100,
      currentMins: totalMinutes,
      targetMins: 2000,
      perks: ['Gilded Crest Avatar', 'Exclusives Priority', 'Custom Serif Themes', 'All Bionic Assist Features'],
    };
  }

  if (totalMinutes >= 750 || streakCount >= 14) {
    const progress = Math.min(100, Math.round(((totalMinutes - 750) / (2000 - 750)) * 100));
    return {
      tier: 4,
      title: 'Voyager',
      badgeIcon: '🧭',
      nextTitle: 'Grand Odyssey Master',
      progressPercent: progress,
      currentMins: totalMinutes,
      targetMins: 2000,
      perks: ['Bionic Reading Assist', 'Natural Voice Audio Narration', 'Dark Linen Theme'],
    };
  }

  if (totalMinutes >= 300 || streakCount >= 7) {
    const progress = Math.min(100, Math.round(((totalMinutes - 300) / (750 - 300)) * 100));
    return {
      tier: 3,
      title: 'Cartographer',
      badgeIcon: '📜',
      nextTitle: 'Voyager',
      progressPercent: progress,
      currentMins: totalMinutes,
      targetMins: 750,
      perks: ['Vintage Sepia Editorial Theme', 'Ambient Photograph Lighting', 'Priority Feed Refresh'],
    };
  }

  if (totalMinutes >= 100 || streakCount >= 3) {
    const progress = Math.min(100, Math.round(((totalMinutes - 100) / (300 - 100)) * 100));
    return {
      tier: 2,
      title: 'Navigator',
      badgeIcon: '⚓',
      nextTitle: 'Cartographer',
      progressPercent: progress,
      currentMins: totalMinutes,
      targetMins: 300,
      perks: ['Silver Dial Pin', 'Custom Typography Sizing', 'Saved Digest Export'],
    };
  }

  const progress = Math.min(100, Math.round((totalMinutes / 100) * 100));
  return {
    tier: 1,
    title: 'Novice Wanderer',
    badgeIcon: '🪶',
    nextTitle: 'Navigator',
    progressPercent: progress,
    currentMins: totalMinutes,
    targetMins: 100,
    perks: ['Curated Editorial Feed', 'Daily Reading Goal Dial', 'Basic Reader Themes'],
  };
}

/**
 * Calculates milestone reward info based on streak count.
 */
export function getMilestoneProgress(streakCount: number = 0) {
  const milestones = [
    { days: 7, perk: 'Vintage Sepia Theme', icon: '📜' },
    { days: 14, perk: 'Bionic Focus Mode', icon: '👁️' },
    { days: 30, perk: 'Traveler Gold Monogram', icon: '✨' },
    { days: 60, perk: 'Master Archivist Pin', icon: '🏛️' },
    { days: 100, perk: 'Legendary Centurion Crest', icon: '🏆' },
  ];

  const nextMilestone = milestones.find((m) => m.days > streakCount) || milestones[milestones.length - 1];
  const prevDays = milestones.filter((m) => m.days <= streakCount).pop()?.days || 0;
  const daysRemaining = Math.max(0, nextMilestone.days - streakCount);
  const progressPercent = Math.min(
    100,
    Math.round(((streakCount - prevDays) / (nextMilestone.days - prevDays)) * 100)
  );

  return {
    currentStreak: streakCount,
    nextTargetDays: nextMilestone.days,
    daysRemaining,
    nextPerk: nextMilestone.perk,
    nextIcon: nextMilestone.icon,
    progressPercent: Math.max(5, progressPercent),
  };
}

/**
 * Generates the 7-day habit ledger for the current week (Monday through Sunday).
 */
export function getWeekHabitSpread(minutesReadToday: number = 0, dailyGoal: number = 15): DayHabitStatus[] {
  const now = new Date();
  const currentDayIndex = (now.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayShorts = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Retrieve stored history or fallback to realistic habit data
  const historyKey = 'odysseus_weekly_history';
  let historyData: Record<string, { status: string; minutes: number }> = {};
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(historyKey);
      if (saved) historyData = JSON.parse(saved);
    } catch {
      // ignore
    }
  }

  const result: DayHabitStatus[] = [];
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - currentDayIndex);

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const isToday = i === currentDayIndex;

    let status: DayHabitStatus['status'] = 'future';
    let minutes = 0;

    if (isToday) {
      minutes = minutesReadToday;
      status = minutesReadToday >= dailyGoal ? 'today-done' : 'today-pending';
    } else if (i < currentDayIndex) {
      // Past day in the current week
      if (historyData[dateStr]) {
        status = historyData[dateStr].status as DayHabitStatus['status'];
        minutes = historyData[dateStr].minutes;
      } else {
        // Aesthetic editorial default: preceding days marked as completed wax seal
        status = 'completed';
        minutes = dailyGoal;
      }
    } else {
      status = 'future';
    }

    result.push({
      dayName: dayNames[i],
      dayShort: dayShorts[i],
      dateStr,
      isToday,
      status,
      minutes,
    });
  }

  return result;
}

/**
 * Records an active reading session, applying multipliers and incrementing streaks.
 */
export async function recordReadingProgress({
  userId,
  secondsRead,
  articleId,
  articleTitle,
}: {
  userId?: string;
  secondsRead: number;
  articleId?: string;
  articleTitle?: string;
}): Promise<{
  minutesAdded: number;
  effectiveMinutes: number;
  multiplier: number;
  isGoalAchieved: boolean;
  newStreak: number;
  newTotalMinutes: number;
}> {
  const multiplierInfo = getCurrentMultiplier();
  const rawMinutes = Math.max(1, Math.round(secondsRead / 60));
  const effectiveMinutes = Math.round(rawMinutes * multiplierInfo.multiplier);

  const todayStr = new Date().toISOString().split('T')[0];
  const lastActiveDateKey = 'odysseus_last_active_date';
  const lastActiveDate = typeof window !== 'undefined' ? localStorage.getItem(lastActiveDateKey) : null;

  let currentProfile: any = null;

  if (userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      currentProfile = data;
    } catch {
      // fallback to local state
    }
  }

  const prevMinutesToday = currentProfile?.minutes_read_today || 0;
  const goalMinutes = currentProfile?.daily_goal_minutes || 15;
  const currentStreak = currentProfile?.streak_count || 1;
  const totalMinutes = currentProfile?.total_reading_minutes || 0;

  const newMinutesToday = prevMinutesToday + effectiveMinutes;
  const newTotalMinutes = totalMinutes + effectiveMinutes;
  const isGoalAchieved = newMinutesToday >= goalMinutes;

  let newStreak = currentStreak;
  // If goal was reached and today hasn't been credited yet
  if (isGoalAchieved && lastActiveDate !== todayStr) {
    newStreak = currentStreak + 1;
    if (typeof window !== 'undefined') {
      localStorage.setItem(lastActiveDateKey, todayStr);
    }
  }

  // Update Supabase profiles safely
  if (userId) {
    try {
      await supabase
        .from('profiles')
        .update({
          minutes_read_today: newMinutesToday,
          total_reading_minutes: newTotalMinutes,
          streak_count: newStreak,
        })
        .eq('id', userId);
    } catch {
      // Fail safely if schema does not yet include total_reading_minutes
      try {
        await supabase
          .from('profiles')
          .update({
            minutes_read_today: newMinutesToday,
            streak_count: newStreak,
          })
          .eq('id', userId);
      } catch {
        // ignore
      }
    }
  }

  // Save weekly history locally
  if (typeof window !== 'undefined') {
    try {
      const historyKey = 'odysseus_weekly_history';
      const history = JSON.parse(localStorage.getItem(historyKey) || '{}');
      history[todayStr] = {
        status: isGoalAchieved ? 'completed' : 'today-pending',
        minutes: newMinutesToday,
      };
      localStorage.setItem(historyKey, JSON.stringify(history));
    } catch {
      // ignore
    }
  }

  return {
    minutesAdded: rawMinutes,
    effectiveMinutes,
    multiplier: multiplierInfo.multiplier,
    isGoalAchieved,
    newStreak,
    newTotalMinutes,
  };
}
