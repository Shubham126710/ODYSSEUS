/**
 * Instapaper & Pocket-Style Clean Article Extraction & Sanitizer Engine
 * 
 * Aggressively purges:
 * - Author bylines, author bios, avatars, and social follow cards
 * - Newsletter subscriptions, Substack promo widgets, and callout popups
 * - Related articles, trending carousels, and footer link farms
 * - Navigation links, breadcrumbs, tags, and category chips
 * - Social share bars, tweet embeds, and tracking pixels
 * 
 * Returns ONLY pristine, clean article prose formatted into elegant paragraphs.
 */

import { parseHTML } from 'linkedom';
import createDOMPurify from 'dompurify';

let cachedDOMPurify: any = null;
function getPurifier() {
  if (cachedDOMPurify) return cachedDOMPurify;
  if (typeof window !== 'undefined') {
    cachedDOMPurify = (createDOMPurify as any)(window);
  } else {
    const { window: linkedomWindow } = parseHTML('<!DOCTYPE html><html><body></body></html>');
    cachedDOMPurify = (createDOMPurify as any)(linkedomWindow);
  }
  return cachedDOMPurify;
}

export interface CleanArticleResult {
  title: string;
  leadImage: string | null;
  readTime: string;
  wordCount: number;
  cleanHtml: string;
  plainText: string;
}

// Selectors to remove unconditionally (Instapaper / Pocket purge list)
const PURGE_SELECTORS = [
  // Authors & Bylines
  '.byline', '.author', '.author-bio', '.author-info', '.author-card', '.author-box',
  '[class*="author"]', '[class*="byline"]', '[class*="writer"]', '[class*="contributor"]',
  '[itemprop="author"]', '[rel="author"]', '.post-author', '.article-author',
  // Social & Share
  '.social-share', '.share-buttons', '.share-bar', '[class*="social-share"]',
  '[class*="sharing"]', '[class*="share-box"]', '.tweet-button', '.facebook-share',
  // Newsletters & Subscriptions
  '.newsletter', '.newsletter-signup', '.subscribe', '.subscription-box',
  '[class*="newsletter"]', '[class*="subscribe"]', '[id*="newsletter"]', '[id*="subscribe"]',
  // Related & Recommendations
  '.related', '.related-posts', '.related-stories', '.recommended', '.more-stories',
  '.trending', '[class*="related"]', '[class*="recommended"]', '[class*="read-next"]',
  // Ads & Trackers
  '.ad', '.ads', '.advertisement', '.sponsor', '.sponsored', '[class*="ad-"]',
  '[class*="advertisement"]', '.cookie-banner', '.gdpr',
  // Navs, Headers & Footers
  'nav', 'header', 'footer', 'aside', '.sidebar', '[class*="sidebar"]',
  '.breadcrumbs', '[class*="breadcrumb"]', '.tags', '[class*="tag-list"]',
  // Comments
  '#comments', '.comments', '[class*="comment"]', '.disqus'
];

/**
 * Strips raw HTML and extracts purely the article text paragraphs.
 */
export function sanitizeArticleProse(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== 'string') return '';
  const purifier = getPurifier();

  // 1. Initial sanitizer pass
  let html = purifier.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: [
      'script', 'style', 'iframe', 'form', 'input', 'button', 'svg', 'canvas',
      'nav', 'header', 'footer', 'aside', 'noscript', 'meta', 'link'
    ],
  });

  // Clean using DOM API (browser document or linkedom on server)
  const isBrowser = typeof document !== 'undefined';
  const doc = isBrowser ? document : parseHTML(`<div>${html}</div>`).document;
  const div = isBrowser ? document.createElement('div') : doc.querySelector('div') || doc.body;
  if (isBrowser) {
    (div as HTMLElement).innerHTML = html;
  }

  // Purge known junk selectors
  PURGE_SELECTORS.forEach((selector) => {
    try {
      div.querySelectorAll(selector).forEach((el: any) => el.remove());
    } catch {
      // invalid selector in some contexts
    }
  });

  // Remove elements that look like author bylines or bios
  const authorRegex = /^(by\s+|written by\s+|author:\s+|published by\s+|edited by\s+|photo by\s+|words by\s+|reported by\s+)/i;
  const authorBioRegex = /(is a writer|is a journalist|is a reporter|is a senior editor|is an author|covers technology|covers politics|based in [A-Z]|follow (him|her|them) on)/i;

  div.querySelectorAll('p, span, div, small').forEach((el: any) => {
    const text = el.textContent?.trim() || '';
    if (text.length < 140 && authorRegex.test(text)) {
      el.remove();
    } else if (text.length < 240 && authorBioRegex.test(text) && !el.querySelector('p')) {
      el.remove();
    }
  });

  // Remove elements asking for subscriptions or event ads
  const subRegex = /(subscribe to|get our newsletter|sign up for|join our mailing list|delivered to your inbox|support independent journalism|become a member|Disrupt doors open|exhibit your breakthrough|Book Exhibit Table|REGISTER NOW)/i;
  div.querySelectorAll('p, div, aside, a, span').forEach((el: any) => {
    const text = el.textContent?.trim() || '';
    if (text.length < 240 && subRegex.test(text)) {
      el.remove();
    }
  });

  // Remove countdown timers and stray button texts
  const timerRegex = /^\d{1,2}:\d{2}:\d{2}(?::\d{2})?$/;
  const strayButtonsRegex = /^(Close|Dismiss|Skip to content|Accept all cookies|TechCrunch Desktop Logo|TechCrunch Mobile Logo)$/i;
  div.querySelectorAll('p, div, span, a').forEach((el: any) => {
    const text = el.textContent?.trim() || '';
    if (timerRegex.test(text) || strayButtonsRegex.test(text)) {
      el.remove();
    }
  });

  // Remove stray "Continue reading...", "Read more", "Read the full story" teaser links
  const teaserRegex = /^(continue reading|read the full story|read more at|read full article|read more\b|read original story|see original article)/i;
  div.querySelectorAll('p, a, span, div').forEach((el: any) => {
    const text = el.textContent?.trim() || '';
    if (text.length < 100 && (teaserRegex.test(text) || /continue reading\.{0,3}$/i.test(text))) {
      el.remove();
    }
  });

  // Remove empty paragraphs
  div.querySelectorAll('p').forEach((p: any) => {
    if (!p.textContent?.trim() && !p.querySelector('img')) {
      p.remove();
    }
  });

  html = div.innerHTML;

  // Clean any stray broken anchor remnants
  html = html.replace(/Image \d+<\/a>[^<\n]*/gi, '');

  // Final allowlist to keep only clean reading tags
  return purifier.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'h2', 'h3', 'h4', 'blockquote', 'code', 'pre', 'ul', 'ol', 'li',
      'strong', 'em', 'b', 'i', 'a', 'hr', 'img', 'figure', 'figcaption'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
  });
}

/**
 * Calculates estimated reading time for given text.
 */
export function estimateReadTime(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 220));
  return `${minutes} min read`;
}

/**
 * High-level article cleanser: cleans title, removes markdown headers from Jina,
 * and extracts pure prose.
 */
export function purifyExtractedArticle({
  title,
  content,
  url,
  leadImage,
}: {
  title: string;
  content: string;
  url?: string;
  leadImage?: string | null;
}): CleanArticleResult {
  // Clean title (remove " | The Verge", " - Wired", etc.)
  let cleanTitle = title || 'Imported Article';
  cleanTitle = cleanTitle.replace(/\s*([|–—-])\s*(The Verge|Wired|New York Times|Medium|Substack|The Atlantic|Bloomberg|TechCrunch|Ars Technica|Dezeen|Quanta Magazine).*$/i, '').trim();

  // Strip Jina AI markdown headers like "Title: ...\nURL Source: ...\nMarkdown Content:\n"
  let sanitizedContent = content
    .replace(/^Title:\s*.*$/gim, '')
    .replace(/^URL Source:\s*.*$/gim, '')
    .replace(/^Published Time:\s*.*$/gim, '')
    .replace(/^Markdown Content:\s*.*$/gim, '')
    .replace(/^By\s+.*$/gim, '')
    .trim();

  const cleanHtml = sanitizeArticleProse(sanitizedContent);
  const plainText = cleanHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const readTime = estimateReadTime(plainText);

  return {
    title: cleanTitle,
    leadImage: leadImage || null,
    readTime,
    wordCount,
    cleanHtml,
    plainText,
  };
}
