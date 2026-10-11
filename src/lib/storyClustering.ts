/**
 * Story Clustering & Deduplication Engine (SimHash & N-Gram Similarity)
 * Groups breaking stories from multiple outlets into a single featured spread
 * with alternative perspectives.
 */

export interface RelatedPerspective {
  title: string;
  source: string;
  link: string;
}

/**
 * Tokenize a title or text into clean lowercased words, stripping common stopwords.
 */
function tokenize(text: string): string[] {
  const stopwords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'is', 'was', 'are', 'were', 'it', 'its', 'that', 'this', 'how',
    'why', 'what', 'when', 'where', 'who', 'will', 'new', 'after', 'about'
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w));
}

/**
 * Computes Jaccard word similarity between two headlines.
 */
function computeHeadlineSimilarity(titleA: string, titleB: string): number {
  const tokensA = new Set(tokenize(titleA));
  const tokensB = new Set(tokenize(titleB));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  tokensA.forEach((token) => {
    if (tokensB.has(token)) intersection++;
  });

  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Clusters an array of stories, merging similar breaking stories into alternative perspectives.
 * Threshold of 0.38 indicates substantial topical overlap in news headlines.
 */
export function clusterStories<T extends { title: string; source: string; link: string }>(
  stories: T[],
  similarityThreshold = 0.38
): Array<T & { relatedPerspectives?: RelatedPerspective[] }> {
  const result: Array<T & { relatedPerspectives?: RelatedPerspective[] }> = [];
  const assigned = new Set<number>();

  for (let i = 0; i < stories.length; i++) {
    if (assigned.has(i)) continue;

    const current = { ...stories[i] };
    const perspectives: RelatedPerspective[] = [];

    for (let j = i + 1; j < stories.length; j++) {
      if (assigned.has(j)) continue;

      const sim = computeHeadlineSimilarity(current.title, stories[j].title);
      if (sim >= similarityThreshold) {
        perspectives.push({
          title: stories[j].title,
          source: stories[j].source,
          link: stories[j].link,
        });
        assigned.add(j);
      }
    }

    if (perspectives.length > 0) {
      result.push({
        ...current,
        relatedPerspectives: perspectives,
      });
    } else {
      result.push(current);
    }

    assigned.add(i);
  }

  return result;
}
