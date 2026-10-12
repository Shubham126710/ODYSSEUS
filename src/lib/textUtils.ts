/**
 * Utilities for decoding HTML entities, cleaning RSS snippets, and normalizing article content.
 */

export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8212;/g, '—')
    .replace(/&#8211;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&#8230;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

/**
 * Strips all HTML tags and decodes all HTML entities.
 * Ensures zero literal tags (e.g. <em>, <b>, <font>) or encoded artifacts appear in text.
 */
export function sanitizeText(raw: string): string {
  if (!raw) return '';
  let cleaned = decodeHtmlEntities(raw);
  // Strip all HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');
  // Decode entities again in case of double-encoding
  cleaned = decodeHtmlEntities(cleaned);
  // Normalize whitespace
  return cleaned.replace(/\s+/g, ' ').trim();
}

export function cleanExcerpt(raw: string, maxLength: number = 180): string {
  if (!raw) return '';
  const sanitized = sanitizeText(raw);
  if (sanitized.length <= maxLength) return sanitized;
  return sanitized.substring(0, maxLength).trim() + '...';
}

/**
 * Cleans raw source names: strips feed breadcrumbs (e.g. "NYT > TOP STORIES" -> "NYT")
 */
export function cleanSource(raw?: string): string {
  if (!raw) return 'DISPATCH';
  let s = raw.trim();
  // Strip breadcrumbs like "> Top Stories" or "| Tech"
  if (s.includes('>')) s = s.split('>')[0].trim();
  if (s.includes('|')) s = s.split('|')[0].trim();
  if (s.includes(' - ')) s = s.split(' - ')[0].trim();
  
  // Specific normalization for popular sources
  const upper = s.toUpperCase();
  if (upper.includes('NEW YORK TIMES') || upper === 'NYT') return 'NYT';
  if (upper.includes('THE VERGE') || upper === 'VERGE') return 'THE VERGE';
  if (upper.includes('TECHCRUNCH')) return 'TECHCRUNCH';
  if (upper.includes('WIRED')) return 'WIRED';
  if (upper.includes('BLOOMBERG')) return 'BLOOMBERG';
  if (upper.includes('BBC')) return 'BBC NEWS';
  if (upper.includes('REUTERS')) return 'REUTERS';
  if (upper.includes('ATLANTIC')) return 'THE ATLANTIC';
  if (upper.includes('ARS TECHNICA')) return 'ARS TECHNICA';
  if (upper.includes('QUANTA')) return 'QUANTA';
  if (upper.includes('NATURE')) return 'NATURE';

  return s.toUpperCase();
}

const VALID_REAL_CATEGORIES = new Set([
  'TECH',
  'DESIGN',
  'CULTURE',
  'SCIENCE',
  'SPORTS',
]);

/**
 * Returns category only when it is a recognized real editorial category (Tech, Design, Culture, Science, Sports).
 * Filters out raw feeds like "GENERAL", "TOP STORIES", "NEWS", etc.
 */
export function cleanCategory(raw?: string): string | null {
  if (!raw) return null;
  const upper = raw.trim().toUpperCase();
  if (VALID_REAL_CATEGORIES.has(upper)) {
    return upper;
  }
  // Check substring matches
  for (const cat of VALID_REAL_CATEGORIES) {
    if (upper.includes(cat)) {
      return cat;
    }
  }
  return null;
}

/**
 * Hides read time unless it is computed from actual article content (> 1 min).
 * "1 MIN" placeholder on every RSS item is suppressed.
 */
export function computeReadTime(story: { content?: string; excerpt?: string; readTime?: string }): string | null {
  if (story.content && story.content.length > 500) {
    const words = story.content.replace(/<[^>]+>/g, ' ').split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    if (minutes >= 2) {
      return `${minutes} MIN`;
    }
  }
  if (story.readTime) {
    const trimmed = story.readTime.trim().toUpperCase();
    if (trimmed !== '1 MIN' && trimmed !== '1 MIN READ' && trimmed !== '1M' && !trimmed.startsWith('1 ')) {
      return story.readTime.toUpperCase();
    }
  }
  return null;
}

/**
 * Detects whether an image URL is a publisher placeholder, logo tile (e.g. Bloomberg BL black tile),
 * favicon, or tracking pixel, so it can be omitted in favor of clean typography.
 */
export function isPlaceholderOrLogoUrl(url?: string | null): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();
  if (lower.includes('favicon') || lower.endsWith('.ico') || lower.includes('.ico?')) return true;
  if (lower.includes('placeholder') || lower.includes('default_image') || lower.includes('no-image') || lower.includes('no_image')) return true;
  if (lower.includes('blank.') || lower.includes('dummy.')) return true;
  if (lower.includes('bloomberg') && (lower.includes('logo') || lower.includes('default') || lower.includes('badge') || lower.includes('placeholder'))) return true;
  if (lower.includes('bwbx.io') && (lower.includes('avatar') || lower.includes('logo') || lower.includes('badge') || lower.includes('icon') || lower.includes('assets/'))) return true;
  if (lower.includes('publisher-logo') || lower.includes('brand-logo') || lower.includes('site-logo')) return true;
  if (lower.includes('logo.png') || lower.includes('logo.jpg') || lower.includes('logo.svg') || lower.includes('/logos/')) return true;
  if (lower.includes('1x1') || lower.includes('tracking') || lower.includes('pixel')) return true;
  return false;
}

/**
 * Capitalizes only the first letter of a headline (e.g. "florim channels..." -> "Florim channels...")
 */
export function capitalizeFirstLetter(text?: string | null): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Checks if an image URL indicates a small thumbnail (< 300px) that should be avoided for lead story.
 */
export function isSmallThumbnailUrl(url?: string | null): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();
  if (lower.includes('width=140') || lower.includes('width=150') || lower.includes('width=200')) return true;
  if (lower.includes('140x') || lower.includes('150x150') || lower.includes('100x100')) return true;
  return false;
}


