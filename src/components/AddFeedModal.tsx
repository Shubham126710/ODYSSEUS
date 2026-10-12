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
        const { data } = await supabase
          .from('user_subscriptions')
          .select('feeds(url)')
          .eq('user_id', userId);
        
        if (data) {
          const urls = new Set(data.map((item: any) => item.feeds?.url).filter(Boolean));
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
      // 1. Validate Feed via API
      const res = await fetch(`/api/rss?url=${encodeURIComponent(feedUrl)}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error('Invalid RSS Feed URL');
      }

      const feedTitle = data.feed?.title || 'Unknown Feed';

      // 2. Check/Insert Feed in Supabase
      let { data: existingFeed, error: fetchError } = await supabase
        .from('feeds')
        .select('id')
        .eq('url', feedUrl)
        .maybeSingle();

      if (fetchError) {
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
      }, 900);

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
            style={{ zIndex: 9998 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-modal-backdrop"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            style={{ zIndex: 9999 }}
            className="fixed inset-0 m-auto w-full max-w-3xl h-fit max-h-[90vh] z-modal px-4"
          >
            <div 
              className="bg-[#FFFDD0] text-[#2F4522] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-[#5D8246]/25"
            >
              
              {/* Header */}
              <div className="p-6 sm:p-8 pb-0 flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF6B4A] font-bold block mb-1">
                    [ ODYSSEUS ARCHIVE REPOSITORY ]
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-serif font-black text-[#2F4522] tracking-tight">
                    Add Publication Source
                  </h2>
                  <p className="text-[#5D8246] text-xs sm:text-sm mt-1">
                    Paste any custom RSS feed URL or subscribe to prestige desks below.
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-[#5D8246]/10 text-[#5D8246] hover:text-[#2F4522] transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              <div className="p-6 sm:p-8">
                {/* Input Form */}
                <form onSubmit={handleSubmit} className="mb-8 relative group">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5D8246]">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      </div>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://publication.com/feed.xml"
                        className="w-full bg-[#FFFDD0] hover:bg-white/80 focus:bg-white border border-[#5D8246]/30 focus:border-[#FF6B4A] rounded-xl pl-11 pr-4 py-3 text-sm text-[#2F4522] placeholder:text-[#5D8246]/50 outline-none focus:outline-none focus:ring-0 transition-all"
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !url}
                      className="bg-[#FF6B4A] hover:bg-[#E55A3A] text-[#FFFDD0] px-6 py-3 rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs shrink-0 cursor-pointer"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-[#FFFDD0]/30 border-t-[#FFFDD0] rounded-full animate-spin" />
                      ) : (
                        'Add Feed →'
                      )}
                    </button>
                  </div>
                  
                  {/* Status Messages */}
                  {error && (
                    <p className="text-red-600 text-xs font-mono font-bold mt-2">
                      {error}
                    </p>
                  )}
                  {success && (
                    <p className="text-[#5D8246] text-xs font-mono font-bold mt-2">
                      ✓ Publication source connected successfully
                    </p>
                  )}
                </form>

                {/* Editorial Desks Filter & Prestige Sources */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <h3 className="text-[10px] font-bold text-[#5D8246] uppercase tracking-widest font-mono">
                      Curated Editorial Desks
                    </h3>
                    
                    {/* Desk Filter Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      <button
                        onClick={() => setSelectedDesk('all')}
                        className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
                          selectedDesk === 'all'
                            ? 'bg-[#5D8246] text-[#FFFDD0] shadow-xs'
                            : 'bg-[#5D8246]/10 text-[#2F4522] hover:bg-[#5D8246]/20'
                        }`}
                      >
                        All Desks
                      </button>
                      {PRESTIGE_DESKS.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => setSelectedDesk(d.id)}
                          className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
                            selectedDesk === d.id
                              ? 'bg-[#5D8246] text-[#FFFDD0] shadow-xs'
                              : 'bg-[#5D8246]/10 text-[#2F4522] hover:bg-[#5D8246]/20'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[340px] overflow-y-auto pr-1">
                    {PRESTIGE_SOURCES
                      .filter((feed) => selectedDesk === 'all' || feed.desk === selectedDesk)
                      .map((feed) => {
                        const isSubscribed = subscribedUrls.has(feed.feedUrl);
                        return (
                          <button
                            key={feed.id}
                            onClick={() => !isSubscribed && handleAddFeed(feed.feedUrl)}
                            disabled={loading || isSubscribed}
                            className={`group flex items-start gap-3 p-3.5 rounded-xl border transition-all text-left relative ${
                              isSubscribed
                                ? 'bg-[#5D8246]/5 border-[#5D8246]/15 opacity-60 cursor-default'
                                : 'bg-[#FFFDD0] hover:bg-white border-[#5D8246]/25 hover:border-[#FF6B4A] shadow-xs cursor-pointer'
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-serif font-bold text-xs shrink-0 ${
                              isSubscribed ? 'bg-[#5D8246] text-[#FFFDD0]' : 'bg-[#5D8246]/15 text-[#2F4522] group-hover:bg-[#FF6B4A] group-hover:text-[#FFFDD0] transition-colors'
                            }`}>
                              {feed.monogram}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={`font-serif text-sm font-bold truncate ${isSubscribed ? 'text-[#5D8246]' : 'text-[#2F4522] group-hover:text-[#FF6B4A]'}`}>
                                  {feed.name}
                                </span>
                                {isSubscribed ? (
                                  <span className="text-[10px] font-mono font-bold text-[#5D8246]">✓ Added</span>
                                ) : (
                                  <span className="text-[10px] text-[#5D8246] group-hover:text-[#FF6B4A] font-bold font-mono">+ Add</span>
                                )}
                              </div>
                              <span className="text-[9px] font-mono text-[#5D8246]/80 uppercase tracking-wider block mt-0.5">
                                {feed.category}
                              </span>
                              <p className="text-[11px] text-[#2F4522]/80 leading-snug line-clamp-1 mt-1">
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