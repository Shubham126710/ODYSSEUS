"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

interface AddFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

const POPULAR_FEEDS = [
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'Tech' },
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'Startups' },
  { name: 'Wired', url: 'https://www.wired.com/feed/rss', category: 'Culture' },
  { name: 'NY Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', category: 'News' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com/rss', category: 'Dev' },
  { name: 'Daring Fireball', url: 'https://daringfireball.net/feeds/main', category: 'Apple' },
  { name: 'Polygon', url: 'https://www.polygon.com/rss/index.xml', category: 'Gaming' },
  { name: 'Smashing Mag', url: 'https://www.smashingmagazine.com/feed/', category: 'Design' },
];

export const AddFeedModal = ({ isOpen, onClose, userId, onSuccess }: AddFeedModalProps) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [subscribedUrls, setSubscribedUrls] = useState<Set<string>>(new Set());

  // Fetch subscriptions when modal opens
  React.useEffect(() => {
    if (isOpen && userId) {
      const fetchSubscriptions = async () => {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('feeds(url)')
          .eq('user_id', userId);
        
        if (data) {
          const urls = new Set(data.map((item: any) => item.feeds.url));
          setSubscribedUrls(urls);
        }
      };
      fetchSubscriptions();
    }
  }, [isOpen, userId]);

  const handleAddFeed = async (feedUrl: string) => {
    if (!userId) {
      setError('You must be logged in to add feeds');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // 1. Validate Feed via API (Server-side parsing)
      const res = await fetch(`/api/rss?url=${encodeURIComponent(feedUrl)}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error('Invalid RSS Feed URL');
      }

      const feedTitle = data.feed.title || 'Unknown Feed';

      // 2. Check/Insert Feed in Supabase
      // Note: We use maybeSingle() to avoid error if no row is found
      let { data: existingFeed, error: fetchError } = await supabase
        .from('feeds')
        .select('id')
        .eq('url', feedUrl)
        .maybeSingle();

      if (fetchError) {
        console.error('Error checking feed:', fetchError);
        // If table doesn't exist, this will throw. We can't fix it from here.
        throw new Error('Database error: ' + fetchError.message);
      }

      let feedId = existingFeed?.id;

      if (!feedId) {
        const { data: newFeed, error: createError } = await supabase
          .from('feeds')
          .insert({ url: feedUrl, title: feedTitle })
          .select('id')
          .single();
        
        if (createError) throw createError;
        feedId = newFeed.id;
      }

      // 3. Subscribe User
      const { error: subError } = await supabase
        .from('user_subscriptions')
        .insert({ user_id: userId, feed_id: feedId });

      if (subError) {
        if (subError.code === '23505') {
          setError('Already subscribed');
          setLoading(false);
          return;
        }
        throw subError;
      }

      setSuccess(true);
      setSubscribedUrls(prev => new Set(prev).add(feedUrl));
      setUrl('');
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess(false);
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to add feed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) handleAddFeed(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-juice-green/20 backdrop-blur-md z-[60]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 m-auto w-full max-w-3xl h-fit max-h-[90vh] z-[70] px-4"
          >
            <div className="bg-[#FDFBF7] rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden border border-juice-green/5">
              
              {/* Minimal Header */}
              <div className="p-8 pb-0 flex justify-between items-start">
                <div>
                  <h2 className="text-4xl font-serif font-medium text-juice-green tracking-tight">Add Source</h2>
                  <p className="text-juice-green/40 mt-2 font-medium">Paste a URL or choose from our curated list.</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-juice-green/5 text-juice-green/40 hover:text-juice-green transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              <div className="p-8">
                {/* Minimal Input */}
                <form onSubmit={handleSubmit} className="mb-12 relative group">
                  <div className="relative flex items-center">
                    <div className="absolute left-4 text-juice-green/30">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    </div>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://site.com/feed"
                      className="w-full bg-juice-green/5 hover:bg-juice-green/10 focus:bg-white border border-transparent focus:border-juice-green/20 rounded-2xl pl-12 pr-32 py-5 text-lg text-juice-green placeholder:text-juice-green/30 focus:outline-none transition-all duration-300"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={loading || !url}
                      className="absolute right-2 top-2 bottom-2 bg-juice-green text-[#FDFBF7] px-6 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-juice-orange transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        'Add'
                      )}
                    </button>
                  </div>
                  
                  {/* Status Messages */}
                  <div className="absolute -bottom-8 left-2 h-6">
                    {error && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-xs font-bold flex items-center gap-2"
                      >
                        {error}
                      </motion.p>
                    )}
                    
                    {success && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-juice-green text-xs font-bold flex items-center gap-2"
                      >
                        Source added successfully
                      </motion.p>
                    )}
                  </div>
                </form>

                {/* Curated Grid */}
                <div>
                  <h3 className="text-xs font-bold text-juice-green/30 uppercase tracking-widest mb-6">Curated Collections</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {POPULAR_FEEDS.map((feed) => {
                      const isSubscribed = subscribedUrls.has(feed.url);
                      return (
                        <button
                          key={feed.name}
                          onClick={() => !isSubscribed && handleAddFeed(feed.url)}
                          disabled={loading || isSubscribed}
                          className={`group flex flex-col items-start p-4 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden ${
                            isSubscribed 
                              ? 'bg-juice-green/5 border-transparent opacity-60 cursor-default' 
                              : 'border-juice-green/5 hover:border-juice-green/20 hover:bg-white hover:shadow-lg'
                          }`}
                        >
                          {!isSubscribed && (
                            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-juice-green">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            </div>
                          )}
                          
                          {isSubscribed && (
                            <div className="absolute top-3 right-3 text-juice-green">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                          )}
                          
                          <span className="text-[10px] font-bold text-juice-green/40 uppercase tracking-wider mb-2">{feed.category}</span>
                          <span className={`font-serif text-lg font-medium transition-colors ${isSubscribed ? 'text-juice-green/60' : 'text-juice-green group-hover:text-juice-orange'}`}>
                            {feed.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};