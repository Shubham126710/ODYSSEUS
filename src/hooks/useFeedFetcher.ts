import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';

export interface Story {
  id: string;
  title: string;
  excerpt: string;
  source: string;
  readTime: string;
  date: string;
  category: string;
  imageUrl: string | null;
  link: string;
  content: string;
  author?: string;
}

// Helper to map feed titles to categories (fallback)
const getCategoryForFeed = (source: string) => {
  const s = source.toLowerCase();
  if (s.includes('verge') || s.includes('tech') || s.includes('wired') || s.includes('hacker')) return 'tech';
  if (s.includes('design') || s.includes('smashing') || s.includes('ux')) return 'design';
  if (s.includes('culture') || s.includes('atlantic') || s.includes('new yorker')) return 'culture';
  if (s.includes('science') || s.includes('space') || s.includes('nature')) return 'science';
  return 'general';
};

// Helper to calculate read time
const calculateReadTime = (text: string, isSnippet: boolean = false) => {
  const wordsPerMinute = 350; 
  // Strip scripts, styles, and HTML tags
  const plainText = text
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
    .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
    .replace(/<[^>]*>/g, ' ');
    
  let words = plainText.trim().split(/\s+/).length;
  
  // If it's a snippet, estimate the full length (assuming snippet is ~20-25% of content)
  if (isSnippet && words > 30) {
    words = words * 4;
  }

  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min`;
};

export function useFeedFetcher(userId: string | undefined) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeeds = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/rss?userId=${userId}&t=${Date.now()}`, { 
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`
        }
      });
      const data = await res.json();
      
      if (data.success && data.items.length > 0) {
        const processedStories = data.items.map((item: any, index: number) => {
          // Better image extraction logic
          let imageUrl = null;

          // 1. Check media:thumbnail (Common in Wired, Verge, etc)
          if (item['media:thumbnail']) {
             if (Array.isArray(item['media:thumbnail'])) {
                imageUrl = item['media:thumbnail'][0]?.['$']?.url || item['media:thumbnail'][0]?.url;
             } else {
                imageUrl = item['media:thumbnail']?.['$']?.url || item['media:thumbnail']?.url;
             }
          }

          // 2. Check media:content (Yahoo, Bing, etc)
          if (!imageUrl && item['media:content']) {
            if (Array.isArray(item['media:content'])) {
               const media = item['media:content'].find((m: any) => m['$']?.type?.startsWith('image') || m.type?.startsWith('image'));
               imageUrl = media?.['$']?.url || media?.url || item['media:content'][0]?.['$']?.url || item['media:content'][0]?.url;
            } else {
               imageUrl = item['media:content']?.['$']?.url || item['media:content']?.url;
            }
          }

          // 3. Check standard enclosure
          if (!imageUrl && item.enclosure && item.enclosure.type?.startsWith('image')) {
            imageUrl = item.enclosure.url;
          }
          
          // 4. Regex to find <img src="..."> in content
          const imgRegex = /<img[^>]+src=["']([^"']+)["']/;
          
          if (!imageUrl && item.content) {
            const match = item.content.match(imgRegex);
            if (match) imageUrl = match[1];
          }
          
          if (!imageUrl && item['content:encoded']) {
            const match = item['content:encoded'].match(imgRegex);
            if (match) imageUrl = match[1];
          }

          if (!imageUrl && item.description) {
             const match = item.description.match(imgRegex);
             if (match) imageUrl = match[1];
          }

          // Fallback for TechCrunch and others if no image found
          if (!imageUrl) {
             const sourceLower = (item.source || '').toLowerCase();
             if (sourceLower.includes('techcrunch')) {
                imageUrl = 'https://techcrunch.com/wp-content/uploads/2015/02/cropped-cropped-favicon-gradient.png?w=600';
             } else if (sourceLower.includes('verge')) {
                imageUrl = 'https://cdn.vox-cdn.com/uploads/chorus_asset/file/7395361/verge-social-share.jpg';
             } else if (sourceLower.includes('wired')) {
                imageUrl = 'https://www.wired.com/verso/static/wired/assets/logo-header.svg';
             }
          }

          // Clean excerpt
          const rawExcerpt = item.contentSnippet || item.content || item.summary || '';
          const cleanExcerpt = rawExcerpt.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...';

          // Calculate read time based on the longest available content to be most accurate
          const candidates = [
            item['content:encoded'],
            item.content,
            item.summary,
            item.description
          ].filter(Boolean);
          
          // Find the longest string
          const fullText = candidates.reduce((a, b) => (a.length > b.length ? a : b), '');
          
          // Determine if we likely have the full content
          // If we don't have content:encoded and the text is relatively short, assume it's a snippet
          const isLikelySnippet = !item['content:encoded'] && fullText.length < 2000;
          
          const readTime = calculateReadTime(fullText, isLikelySnippet);

          return {
            id: item.guid || item.link || index,
            title: item.title,
            excerpt: cleanExcerpt,
            source: item.source || 'RSS Feed',
            readTime: readTime,
            date: item.isoDate ? formatDistanceToNow(new Date(item.isoDate), { addSuffix: true }) : 'Just now',
            category: getCategoryForFeed(item.source || ''),
            imageUrl: imageUrl,
            link: item.link,
            content: item.content || item['content:encoded'] || item.description || item.summary,
            author: item.creator || item.author || item.dc?.creator
          };
        });
        setStories(processedStories);
      } else {
        setStories([]);
      }
    } catch (err) {
      console.error('Failed to fetch feeds', err);
      setError('Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeds();
  }, [userId]);

  return { stories, loading, error, refetch: fetchFeeds };
}
