import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useSavedStories(userId: string | undefined) {
  const [savedStoryIds, setSavedStoryIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchSavedStories = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // We can use the API or direct Supabase query. 
      // Since we just need IDs/URLs to check existence, let's query directly for efficiency if possible, 
      // or use the API if we want to keep logic encapsulated.
      // Let's use the API for consistency with the auth header handling we just fixed.
      
      const res = await fetch(`/api/read-later?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`
        }
      });
      const data = await res.json();
      
      if (data.success) {
        // Store both ID and URL to be safe, as RSS feeds might use either as unique identifier
        const ids = new Set<string>();
        data.items.forEach((item: any) => {
          if (item.url) ids.add(item.url);
          // We might also want to track by some other ID if available, but URL is usually the key for RSS items
        });
        setSavedStoryIds(ids);
      }
    } catch (e) {
      console.error('Failed to fetch saved stories', e);
    } finally {
      setLoading(false);
    }
  };

  const isSaved = (story: any) => {
    return savedStoryIds.has(story.link) || savedStoryIds.has(story.id);
  };

  const addSavedStory = (story: any) => {
    setSavedStoryIds(prev => {
      const newSet = new Set(prev);
      newSet.add(story.link || story.id);
      return newSet;
    });
  };

  const removeSavedStory = (story: any) => {
    setSavedStoryIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(story.link || story.id);
      return newSet;
    });
  };

  useEffect(() => {
    fetchSavedStories();
  }, [userId]);

  return { savedStoryIds, isSaved, addSavedStory, removeSavedStory, refetch: fetchSavedStories, loading };
}
