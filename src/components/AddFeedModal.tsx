"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { PRESTIGE_SOURCES, PRESTIGE_DESKS } from '@/data/prestigeSources';

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
  const [selectedDesk, setSelectedDesk] = useState<string>('all');

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

                {/* Editorial Desks Filter & Prestige Sources */}
                <div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    <h3 className="text-xs font-bold text-juice-green/40 uppercase tracking-widest font-mono">
                      Curated Editorial Desks
                    </h3>
                    
                    {/* Desk Filter Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      <button
                        onClick={() => setSelectedDesk('all')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                          selectedDesk === 'all'
                            ? 'bg-juice-orange text-white shadow-sm'
                            : 'bg-juice-green/5 text-juice-green/60 hover:text-juice-green hover:bg-juice-green/10'
                        }`}
                      >
                        All Desks
                      </button>
                      {PRESTIGE_DESKS.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => setSelectedDesk(d.id)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                            selectedDesk === d.id
                              ? 'bg-juice-orange text-white shadow-sm'
                              : 'bg-juice-green/5 text-juice-green/60 hover:text-juice-green hover:bg-juice-green/10'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {PRESTIGE_SOURCES
                      .filter((feed) => selectedDesk === 'all' || feed.desk === selectedDesk)
                      .map((feed) => {
                        const isSubscribed = subscribedUrls.has(feed.feedUrl);
                        return (
                          <button
                            key={feed.id}
                            onClick={() => !isSubscribed && handleAddFeed(feed.feedUrl)}
                            disabled={loading || isSubscribed}
                            className={`group flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-200 text-left relative ${
                              isSubscribed
                                ? 'bg-juice-green/5 border-juice-green/10 opacity-70 cursor-default'
                                : 'bg-white/60 hover:bg-white border-juice-green/15 hover:border-juice-green/30 hover:shadow-md'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-serif font-bold text-xs shrink-0 ${
                              isSubscribed ? 'bg-juice-green text-white' : 'bg-juice-green/10 text-juice-green group-hover:bg-juice-orange group-hover:text-white transition-colors'
                            }`}>
                              {feed.monogram}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={`font-serif text-sm font-bold truncate ${isSubscribed ? 'text-juice-green' : 'text-juice-green group-hover:text-juice-orange'}`}>
                                  {feed.name}
                                </span>
                                {isSubscribed ? (
                                  <span className="text-[10px] font-bold text-juice-green">✓ Stamped</span>
                                ) : (
                                  <span className="text-[10px] text-juice-green/40 group-hover:text-juice-orange font-bold font-mono">+ Add</span>
                                )}
                              </div>
                              <span className="text-[9px] font-mono text-juice-green/50 uppercase tracking-wider block mt-0.5">
                                {feed.category}
                              </span>
                              <p className="text-[11px] text-juice-green/60 leading-snug line-clamp-1 mt-1">
                                {feed.tagline}
                              </p>
                            </div>
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