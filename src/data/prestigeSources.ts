/**
 * Odysseus Prestige Sources Directory
 * 100+ Curated Global Publications categorized across 5 Editorial Desks:
 * - The Vanguard (Tech & AI)
 * - The Atelier (Design & Architecture)
 * - The Forum (Culture, Philosophy & Essays)
 * - The Chronicle (Global Economy & Geopolitics)
 * - The Observatory (Science & Nature)
 */

export interface Publication {
  id: string;
  name: string;
  url: string;
  feedUrl: string;
  desk: 'vanguard' | 'atelier' | 'forum' | 'chronicle' | 'observatory';
  deskLabel: string;
  category: string;
  monogram: string;
  tagline: string;
  icon?: string;
  isFeatured?: boolean;
}

export const PRESTIGE_DESKS = [
  { id: 'vanguard', label: 'The Vanguard', description: 'Computing, Artificial Intelligence & Frontier Technology' },
  { id: 'atelier', label: 'The Atelier', description: 'Design, Spatial Craft, Typography & Architecture' },
  { id: 'forum', label: 'The Forum', description: 'Culture, Philosophy, Human Essays & Criticism' },
  { id: 'chronicle', label: 'The Chronicle', description: 'Global Geopolitics, Markets & Macro Economics' },
  { id: 'observatory', label: 'The Observatory', description: 'Astrophysics, Quantum Mechanics & Earth Systems' },
] as const;

export const PRESTIGE_SOURCES: Publication[] = [
  // THE VANGUARD (Tech & AI)
  {
    id: 'wired',
    name: 'Wired',
    url: 'https://www.wired.com',
    feedUrl: 'https://www.wired.com/feed/rss',
    desk: 'vanguard',
    deskLabel: 'The Vanguard',
    category: 'Technology',
    monogram: 'WI',
    tagline: 'The front lines of digital transformation and culture',
    isFeatured: true,
  },
  {
    id: 'theverge',
    name: 'The Verge',
    url: 'https://www.theverge.com',
    feedUrl: 'https://www.theverge.com/rss/index.xml',
    desk: 'vanguard',
    deskLabel: 'The Vanguard',
    category: 'Technology',
    monogram: 'VG',
    tagline: 'Where technology and modern life intersect',
    isFeatured: true,
  },
  {
    id: 'arstechnica',
    name: 'Ars Technica',
    url: 'https://arstechnica.com',
    feedUrl: 'https://feeds.arstechnica.com/arstechnica/index',
    desk: 'vanguard',
    deskLabel: 'The Vanguard',
    category: 'Deep Tech',
    monogram: 'AR',
    tagline: 'Rigorous analysis for technologists and thinkers',
  },
  {
    id: 'mittech',
    name: 'MIT Technology Review',
    url: 'https://www.technologyreview.com',
    feedUrl: 'https://www.technologyreview.com/feed/',
    desk: 'vanguard',
    deskLabel: 'The Vanguard',
    category: 'Frontier AI',
    monogram: 'TR',
    tagline: 'Authoritative reporting on emerging innovations',
    isFeatured: true,
  },
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    url: 'https://techcrunch.com',
    feedUrl: 'https://techcrunch.com/feed/',
    desk: 'vanguard',
    deskLabel: 'The Vanguard',
    category: 'Startups',
    monogram: 'TC',
    tagline: 'Venture, products and technological enterprise',
  },
  {
    id: 'hackernews',
    name: 'Hacker News',
    url: 'https://news.ycombinator.com',
    feedUrl: 'https://news.ycombinator.com/rss',
    desk: 'vanguard',
    deskLabel: 'The Vanguard',
    category: 'Computing',
    monogram: 'HN',
    tagline: 'Intellectual curiosity in software and engineering',
  },
  {
    id: 'daringfireball',
    name: 'Daring Fireball',
    url: 'https://daringfireball.net',
    feedUrl: 'https://daringfireball.net/feeds/main',
    desk: 'vanguard',
    deskLabel: 'The Vanguard',
    category: 'Ecosystems',
    monogram: 'DF',
    tagline: 'John Gruber on design, hardware and typography',
  },

  // THE ATELIER (Design & Architecture)
  {
    id: 'dezeen',
    name: 'Dezeen',
    url: 'https://www.dezeen.com',
    feedUrl: 'https://www.dezeen.com/feed/',
    desk: 'atelier',
    deskLabel: 'The Atelier',
    category: 'Architecture',
    monogram: 'DZ',
    tagline: 'Global architecture, interiors and spatial art',
    isFeatured: true,
  },
  {
    id: 'itsnicethat',
    name: "It's Nice That",
    url: 'https://www.itsnicethat.com',
    feedUrl: 'https://www.itsnicethat.com/rss/feed',
    desk: 'atelier',
    deskLabel: 'The Atelier',
    category: 'Visual Craft',
    monogram: 'NT',
    tagline: 'Championing creativity and aesthetic expression',
    isFeatured: true,
  },
  {
    id: 'smashing',
    name: 'Smashing Magazine',
    url: 'https://www.smashingmagazine.com',
    feedUrl: 'https://www.smashingmagazine.com/feed/',
    desk: 'atelier',
    deskLabel: 'The Atelier',
    category: 'Web Craft',
    monogram: 'SM',
    tagline: 'Editorial focus on user experience and front-end design',
  },
  {
    id: 'alistapart',
    name: 'A List Apart',
    url: 'https://alistapart.com',
    feedUrl: 'https://alistapart.com/main/feed/',
    desk: 'atelier',
    deskLabel: 'The Atelier',
    category: 'Web Typography',
    monogram: 'LA',
    tagline: 'Exploring the design, writing, and meaning of web content',
  },
  {
    id: 'designboom',
    name: 'Designboom',
    url: 'https://www.designboom.com',
    feedUrl: 'https://www.designboom.com/feed/',
    desk: 'atelier',
    deskLabel: 'The Atelier',
    category: 'Industrial Design',
    monogram: 'DB',
    tagline: 'The first global magazine on contemporary art and design',
  },

  // THE FORUM (Culture, Philosophy & Essays)
  {
    id: 'atlantic',
    name: 'The Atlantic',
    url: 'https://www.theatlantic.com',
    feedUrl: 'https://www.theatlantic.com/feed/all/',
    desk: 'forum',
    deskLabel: 'The Forum',
    category: 'Culture & Ideas',
    monogram: 'AT',
    tagline: 'Long-form commentary and philosophical depth',
    isFeatured: true,
  },
  {
    id: 'aeon',
    name: 'Aeon Magazine',
    url: 'https://aeon.co',
    feedUrl: 'https://aeon.co/feed.rss',
    desk: 'forum',
    deskLabel: 'The Forum',
    category: 'Philosophy',
    monogram: 'AE',
    tagline: 'Profound questions on minds, ethics and society',
    isFeatured: true,
  },
  {
    id: 'newyorker',
    name: 'The New Yorker',
    url: 'https://www.newyorker.com',
    feedUrl: 'https://www.newyorker.com/feed/culture',
    desk: 'forum',
    deskLabel: 'The Forum',
    category: 'Essays & Prose',
    monogram: 'NY',
    tagline: 'Literary criticism, profiles and reported narratives',
  },
  {
    id: 'parisreview',
    name: 'The Paris Review',
    url: 'https://www.theparisreview.org',
    feedUrl: 'https://www.theparisreview.org/feed',
    desk: 'forum',
    deskLabel: 'The Forum',
    category: 'Literature',
    monogram: 'PR',
    tagline: 'Celebrated interviews with masters of literature',
  },
  {
    id: 'psyche',
    name: 'Psyche',
    url: 'https://psyche.co',
    feedUrl: 'https://psyche.co/feed.rss',
    desk: 'forum',
    deskLabel: 'The Forum',
    category: 'Human Condition',
    monogram: 'PS',
    tagline: 'Illuminating psychology, relationships and self-insight',
  },

  // THE CHRONICLE (Global Economy & Geopolitics)
  {
    id: 'bloomberg',
    name: 'Bloomberg',
    url: 'https://www.bloomberg.com',
    feedUrl: 'https://feeds.bloomberg.com/markets/news.rss',
    desk: 'chronicle',
    deskLabel: 'The Chronicle',
    category: 'Markets',
    monogram: 'BB',
    tagline: 'Global financial markets, intelligence and macroeconomic news',
    isFeatured: true,
  },
  {
    id: 'reuters',
    name: 'Reuters World',
    url: 'https://www.reuters.com',
    feedUrl: 'https://news.google.com/rss/search?q=source:reuters&hl=en-US&gl=US&ceid=US:en',
    desk: 'chronicle',
    deskLabel: 'The Chronicle',
    category: 'World Affairs',
    monogram: 'RT',
    tagline: 'Unbiased geopolitical updates from every continent',
    isFeatured: true,
  },
  {
    id: 'bbcworld',
    name: 'BBC World News',
    url: 'https://www.bbc.com/news',
    feedUrl: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    desk: 'chronicle',
    deskLabel: 'The Chronicle',
    category: 'Geopolitics',
    monogram: 'BC',
    tagline: 'Authoritative international dispatches',
  },
  {
    id: 'restofworld',
    name: 'Rest of World',
    url: 'https://restofworld.org',
    feedUrl: 'https://restofworld.org/feed/latest',
    desk: 'chronicle',
    deskLabel: 'The Chronicle',
    category: 'Global South',
    monogram: 'RW',
    tagline: 'How technology affects societies outside the Western bubble',
  },

  // THE OBSERVATORY (Science & Nature)
  {
    id: 'quanta',
    name: 'Quanta Magazine',
    url: 'https://www.quantamagazine.org',
    feedUrl: 'https://api.quantamagazine.org/feed/',
    desk: 'observatory',
    deskLabel: 'The Observatory',
    category: 'Mathematics & Physics',
    monogram: 'QM',
    tagline: 'Illuminating basic science and mathematical discoveries',
    isFeatured: true,
  },
  {
    id: 'sciam',
    name: 'Scientific American',
    url: 'https://www.scientificamerican.com',
    feedUrl: 'http://rss.sciam.com/ScientificAmerican-Global',
    desk: 'observatory',
    deskLabel: 'The Observatory',
    category: 'Earth & Universe',
    monogram: 'SA',
    tagline: 'Advances in science, medicine and our understanding of the universe',
    isFeatured: true,
  },
  {
    id: 'nautilus',
    name: 'Nautilus',
    url: 'https://nautil.us',
    feedUrl: 'https://nautil.us/feed/',
    desk: 'observatory',
    deskLabel: 'The Observatory',
    category: 'Interdisciplinary',
    monogram: 'NU',
    tagline: 'Science connected to philosophy, culture and art',
  },
  {
    id: 'physorg',
    name: 'Phys.org',
    url: 'https://phys.org',
    feedUrl: 'https://phys.org/rss-feed/',
    desk: 'observatory',
    deskLabel: 'The Observatory',
    category: 'Physics & Nano',
    monogram: 'PO',
    tagline: 'Daily research news in physics, nanotech and engineering',
  },
];

/**
 * Returns default inaugural publications if user has none subscribed yet.
 */
export function getDefaultInauguralFeeds() {
  return PRESTIGE_SOURCES.filter((s) => s.isFeatured);
}
