import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useSavedStories(userId: string | undefined) {
  const [savedStoryIds, setSavedStoryIds] = useState<Set<string>>(new Set());
  const [savedStories, setSavedStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedStories = async () => {
    if (!userId) {
      console.log('useSavedStories: No userId, skipping fetch');
      return;
    }
    setLoading(true);
    try {
      console.log('useSavedStories: Fetching for user', userId);
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`/api/read-later?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`
        }
      });
      const data = await res.json();
      console.log('useSavedStories: Fetch response', data);
      
      if (data.success) {
        setSavedStories(data.items);
        const ids = new Set<string>();
        data.items.forEach((item: any) => {
          // Store the URL as the key, as that's what we use for uniqueness
          if (item.url) ids.add(item.url);
        });
        console.log('useSavedStories: Set IDs', Array.from(ids));
        setSavedStoryIds(ids);
      }
    } catch (e) {
      console.error('Failed to fetch saved stories', e);
    } finally {
      setLoading(false);
    }
  };

  const isSaved = (story: any) => {
    // We primarily track by URL
    const urlToCheck = story.link || story.url || (story.id && String(story.id));
    const isSaved = urlToCheck && savedStoryIds.has(String(urlToCheck));
    // console.log('isSaved check:', { urlToCheck, isSaved, availableIds: Array.from(savedStoryIds) });
    return isSaved;
  };

  const addSavedStory = async (story: any) => {
    const storyUrl = String(story.link || story.url || story.id);
    console.log('useSavedStories: Adding story', storyUrl);
    
    // Optimistic update
    setSavedStoryIds(prev => {
      const newSet = new Set(prev);
      newSet.add(storyUrl);
      return newSet;
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/read-later', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          userId,
          url: storyUrl,
          title: story.title,
          excerpt: story.contentSnippet || story.excerpt,
          image_url: story.enclosure?.url || story.imageUrl || story.image_url,
          source_name: story.source || story.source_name,
          content: story.content
        })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }
      
      console.log('useSavedStories: Save successful');
      fetchSavedStories();
    } catch (e) {
      console.error("Failed to save story", e);
      // Revert optimistic update
      setSavedStoryIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(storyUrl);
        return newSet;
      });
      throw e; 
    }
  };

  const removeSavedStory = async (story: any) => {
    const storyUrl = String(story.link || story.url || story.id);
    console.log('useSavedStories: Removing story', storyUrl);
    
    // Optimistic update
    setSavedStoryIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(storyUrl);
      return newSet;
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = encodeURIComponent(storyUrl);
      const res = await fetch(`/api/read-later?userId=${userId}&url=${url}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
      });

      if (!res.ok) {
        throw new Error('Failed to remove');
      }

      fetchSavedStories();
    } catch (e) {
      console.error("Failed to remove story", e);
      // Revert optimistic update
      setSavedStoryIds(prev => {
        const newSet = new Set(prev);
        newSet.add(storyUrl);
        return newSet;
      });
      throw e;
    }
  };

  useEffect(() => {
    fetchSavedStories();
  }, [userId]);

  return { savedStoryIds, savedStories, isSaved, addSavedStory, removeSavedStory, refetch: fetchSavedStories, loading };
}
