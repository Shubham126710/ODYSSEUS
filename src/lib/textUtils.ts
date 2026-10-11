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
