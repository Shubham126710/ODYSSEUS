<div align="center">

  <img src="public/logo.svg" alt="Odysseus Compass Logo" width="108" height="108" />

  # ODYSSEUS
  ### *The Living Book Salon & Slow-Journalism Publication*

  <p align="center">
    <strong>An independent, typography-led editorial publication designed for intellectual curiosity, deep reading, and distraction-free prose.</strong>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Next.js_16-Turbopack-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 16" />
    <img src="https://img.shields.io/badge/React_19-Server_Components-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS_v4-Editorial_Theme-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Supabase-Auth_%26_PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Edge_Image_Proxy-Anti--Hotlinking_Bypass-243624?style=for-the-badge" alt="Image Proxy" />
    <img src="https://img.shields.io/badge/Chrome_Extension-Manifest_V3-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Chrome Extension" />
  </p>

  <p align="center">
    <a href="#-the-odysseus-philosophy">Philosophy</a> •
    <a href="#-the-editorial-minimalism-redesign-offscreen-canvas-inspired">Editorial Redesign</a> •
    <a href="#-curated-editorial-desks">Editorial Desks</a> •
    <a href="#-backend-pipeline--image-resiliency-architecture">Backend & Image Proxy</a> •
    <a href="#-purified-reading-pipeline--zen-chamber">Zen Chamber & Purifier</a> •
    <a href="#-secondary-interfaces--luxury-overlays">Secondary Interfaces</a> •
    <a href="#-the-odyssey-chrome-companion">Chrome Companion</a> •
    <a href="#-gamification--the-travelers-passport">Gamification & Passport</a> •
    <a href="#-architecture--tech-stack">Tech Stack</a> •
    <a href="#-repository-structure">Repository Structure</a>
  </p>

</div>

---

## ✦ The Odysseus Philosophy

The modern web is inundated with algorithmic rage-bait, aggressive newsletter popups, intrusive cookie walls, auto-playing video sidebars, and cluttered clickbait. Reading thoughtful, slow journalism has become an obstacle course.

**Odysseus is our antidote.**

Built as an **independent, typography-led digital broadside**, Odysseus combines the storytelling of prestige print broadsheets (*The New Yorker*, *The Paris Review*, *Monocle*, *Wired*, *Bloomberg Markets*) with the bold visual restraint of modern web design:
- **Typography First. Stories Second. UI Last**: Interfaces that feel like a publication that happens to be interactive, not a dashboard displaying aggregated information.
- **Zero Noise**: No author bylines, author bios, social follow cards, newsletter subscription boxes, or tracking pixels inside articles. Pure narrative prose only.
- **Editorial Palette**: Forest and pressroom greens (`#5D8246`, `#243624`), warm editorial creams (`#FFFDD0`, `#FAF7EE`, `#FAF7F0`), and vibrant cadmium coral/orange accents (`#FF694F`, `#FF6B4A`).
- **Tactile Ergonomics**: Generous negative space, organic rounded image corners (`rounded-2xl` / `rounded-xl`), and bespoke SVG vector monogram artwork for an authentic print feel.
- **Strict Typographic Glyph Discipline**: Zero emojis throughout editorial interfaces. Replaced by timeless typographic glyphs (`✦`, `◈`, `◆`, `❖`, `⬡`, `—`) and classical typography.
- **Resilient Media Architecture**: Backed by an Edge Image Proxy and vector `EditorialMonogramPoster` fallback engine that guarantees zero broken cards or missing thumbnails across all feeds.
- **Mindful Habit Cultivation**: Daily reading rhythm rewarded through quiet contemplation multipliers, explorer rank elevations, streak freeze shields, and a weekly habit ledger.

---

## ❖ The Editorial Minimalism Redesign (Offscreen Canvas Inspired)

The Odysseus **"For You"** hub (`/feed`) has undergone a comprehensive editorial minimalism redesign, drawing primary visual inspiration from **Offscreen Canvas** (*offscreencanvas.com*), paired with the refinement of independent prestige magazines and Odysseus's compass identity.

```
┌────────────────────────────────────────────────────────────────────────┐
│  ODYSSEUS [Compass]          FOR YOU   TECH   DESIGN   CULTURE   ...   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  STORIES WORTH                                                         │
│  YOUR TIME.                                                            │
│                                                                        │
│  AN INDEPENDENT CURATION OF THE FINEST ESSAYS, DISPATCHES, AND          │
│  JOURNALISTIC INQUIRIES FROM ACROSS THE GLOBE.                         │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ [ < ]                   FEATURED SHOWCASE                  [ > ] │  │
│  │                    (Dual-Layer Ambient Blur)                     │  │
│  │                      object-fit: contain                         │  │
│  │                                                                  │  │
│  │  01 / 05  •  THE VERGE  •  TECHNOLOGY  •  8 MIN READ             │  │
│  │  The Next Architecture of Edge Neural Computing                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│  ● THE LATEST WIRE  ───  Breaking Dispatches (Horizontal Rail)         │
├────────────────────────────────────────────────────────────────────────┤
│  THE DAILY DISPATCH  ──  2/3 Primary Lead  +  1/3 Compact Columns      │
├────────────────────────────────────────────────────────────────────────┤
│  CATEGORY DESKS      ──  Numbered Editorial Bands (02 - 06)            │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Deliberate Two-Line Typographic Hierarchy
* Located in `src/components/magazine/EditorialTypographyHero.tsx`.
* **Two-Line Composition**:
  ```text
  STORIES WORTH
  YOUR TIME.
  ```
  `"STORIES"` renders in bold uppercase sans display; `"WORTH"` uses the distinctive Playfair Display italic serif (`playfair.className`); `"YOUR TIME."` breaks deliberately onto the second line.
* **Fluid Scaling**: Configured with `clamp(2.75rem, 8.2vw, 8.8rem)`, tight line height (`0.92`), and negative letter spacing (`-0.035em`), ensuring the headline scales gracefully across desktop, tablet, and mobile viewports without arbitrary wrapping or clipping.
* **Minimalist Whitespace**: De-cluttered supporting editorial copy without redundant horizontal hairline dividers.

### 2. Single-Story Focal Showcase (Offscreen Canvas Inspired)
* Located in `src/components/magazine/FeaturedImageGallery.tsx`.
* **Single Story at a Time**: Replaced crowded multi-card carousels with a spacious, single-story focal showcase featuring the top 5 curated stories with high-resolution photography.
* **Uncropped Presentation (`object-fit: contain`)**: The active story image is horizontally centered with natural aspect ratio preservation. Important infographic diagrams, technical figures, and photojournalism are never cropped.
* **Dual-Layer Ambient Framing**: Subtle 25% blurred background frame (`blur-2xl opacity-25`) fills letterboxing organically from the story's own color palette.
* **Understated Navigation Controls**:
  * Circular previous/next arrow chevrons with backdrop blur and border accents (`opacity-80 hover:opacity-100`).
  * Editorial slide counter: `01 / 05`.
  * Preserved keyboard arrow navigation (`←` / `→`) and touch swipe gestures.
* **Synchronized Metadata**: Active story category badge, publication source, reading time, bookmarking toggle (`isSaved`), and direct click handling to open the full `ReadingModal`.

### 3. The Latest Wire
* Located in `src/components/magazine/TheLatestList.tsx`.
* Restrained editorial ticker wire showcasing breaking dispatches with live timestamps, source monograms, and instant reader access.

### 4. The Daily Dispatch
* Located in `src/components/magazine/DailyDispatchFeed.tsx`.
* An asymmetrical 2/3 primary lead and 1/3 secondary column layout, accompanied by compact dispatches with large typography and zero card border clutter.

### 5. Category Desks Grid
* Located in `src/components/magazine/CategoryEditorialSection.tsx`.
* Numbered editorial bands (`02 TECHNOLOGY`, `03 DESIGN`, `04 CULTURE`, `05 SCIENCE`, `06 SPORTS`) presenting deep journalistic coverage across diverse layout variations (`grid-3` and `feature-2`).

---

## ◈ Curated Editorial Desks

Odysseus organizes global slow journalism across 5 prestigious editorial desks, styled like an architectural anthology:

1. **The Vanguard (`/feed/tech`)** — `◈`
   - *Domain*: Frontier computation, artificial intelligence, edge cryptography & digital craft.
   - *Sources*: TechCrunch, The Verge, Wired, Ars Technica, Hacker News, MIT Technology Review.
2. **The Atelier (`/feed/design`)** — `◆`
   - *Domain*: Typographic discipline, visual ergonomics, physical architecture & interactive form.
   - *Sources*: Smashing Magazine, UX Collective, A List Apart, Dezeen, Designboom, It's Nice That.
3. **The Forum (`/feed/culture`)** — `✦`
   - *Domain*: Contemporary criticism, transatlantic essays, philosophy & human affairs.
   - *Sources*: The Atlantic, The New Yorker, Paris Review, Harper's Magazine, Aeon, The Dial.
4. **The Chronicle (`/feed/chronicle`)** — `❖`
   - *Domain*: Global finance, macroeconomic architecture, institutional statecraft & markets.
   - *Sources*: Bloomberg, Financial Times, The Wall Street Journal, Reuters, The Economist.
5. **The Observatory (`/feed/science`)** — `⬡`
   - *Domain*: Fundamental astrophysics, cosmic expeditions, quantum physics & biological frontiers.
   - *Sources*: Scientific American, Nature, Quanta Magazine, NASA Dispatches, Nautilus, Phys.org.

---

## ◈ Backend Pipeline & Image Resiliency Architecture

On modern serverless platforms like Vercel, traditional scrapers routinely fail due to 10-second edge timeouts and publisher anti-hotlinking defenses. Odysseus implements a **4-tier media resiliency architecture**:

```
                       Article Ingestion / Request
                                   │
                                   ▼
        ┌───────────────────────────────────────────────────────┐
        │ 1. Anti-Hotlinking Edge Proxy (/api/image-proxy)      │
        │    • Spoofs dynamic Referer: ${origin}/ & User-Agents │
        │    • Bypasses 403 Forbidden on NYT, Bloomberg, Wired  │
        │    • 7-Day Immutable Edge Caching                     │
        └──────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
        ┌───────────────────────────────────────────────────────┐
        │ 2. High-Res Thumbnail Upgrade Engine                  │
        │    • Intercepts low-res CDN query parameters          │
        │    • Dynamic regex upgrades for WordPress/Substack    │
        └──────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
        ┌───────────────────────────────────────────────────────┐
        │ 3. Client-Side Image Fallback Proxy                   │
        │    • Retries failed assets automatically via Proxy    │
        └──────────────────────────┬────────────────────────────┘
                                   │ (If image permanently missing)
                                   ▼
        ┌───────────────────────────────────────────────────────┐
        │ 4. Vector Monogram Poster Engine                      │
        │    • Bespoke SVG graphic typography & coordinate grid │
        │    • 100% card presentation coverage guaranteed       │
        └───────────────────────────────────────────────────────┘
```

1. **Anti-Hotlinking Edge Proxy (`/api/image-proxy`)**:
   - Bypasses HTTP 403 Forbidden restrictions enforced by major publications by injecting dynamic `Referer: ${origin}/` and valid browser user-agent headers.
   - Streams optimized binary images with 7-day immutable edge caching (`Cache-Control: public, s-maxage=604800, stale-while-revalidate=86400`).
2. **High-Resolution Thumbnail Upgrade Pipeline**:
   - Built into `src/lib/textUtils.ts` via `upgradeThumbnailResolution()`.
   - Strips resizing parameters and low-res thumbnails from major CDNs (e.g., converting `resize=300,200` to full resolution, upgrading Substack, WordPress, and Medium imagery).
3. **Throttled Ingestion & XML Parsing (`/api/rss`)**:
   - Extracts images across all RSS variants: `<media:content>`, `<media:thumbnail>`, `<enclosure>`, and `<media:group>`.
   - Validates MIME types to prevent podcast/audio MP3 enclosures from being misparsed as article artwork.
   - Limits concurrent OpenGraph HTML scrapes, eliminating Vercel serverless timeouts.
   - Enforces strict category isolation so market feeds never bleed into cultural or design sections.
4. **Client-Side Proxy Retry**:
   - When an image fails to load in a reader's browser, cards automatically attempt fallback retrieval via the edge proxy before declaring an error.
5. **Editorial Monogram Poster Engine (`EditorialMonogramPoster.tsx`)**:
   - If an article lacks photography or if the publisher CDN is unavailable, cards automatically render a bespoke SVG collector's print featuring the publication's monogram, architectural coordinate lines, category glyph, and deckle frame. **100% card presentation coverage is guaranteed.**

---

## ✦ Purified Reading Pipeline & Zen Chamber

Odysseus features an aggressive, distraction-free prose extraction pipeline that transforms noisy web pages into pure narrative journalism:

### 1. High-Performance Serverless HTML Parser (`/api/read-mode`)
* **Lightweight `linkedom` Engine**: Replaced heavy, memory-intensive `jsdom` with `linkedom` and `dompurify`, cutting CPU overhead by 80% and eliminating serverless 500 edge timeouts on Vercel.
* **Multi-Strategy Content Fetching**:
  1. *Direct Fetch*: High-speed direct fetching with rotating browser & Googlebot headers for standard publications (Guardian, Verge, BBC, etc.).
  2. *Jina AI Reader Fallback*: Secondary fallback handling JS-heavy single-page applications and sites behind strict bot barriers.
* **Prose Isolation Protocol (`cleanArticleExtraction.ts`)**:
  - **Author Byline & Bio Purging**: Strips all `By [Author]`, contributor cards, author headshots, and social follow cards. You receive only the story.
  - **Web Cruft Removal**: Purges newsletter signup forms, Substack subscription embeds, cookie banners, navigation breadcrumbs, related article link farms, and ad sidebars.
* **Universal URL Import (`ImportArticleModal.tsx`)**:
  - Paste any URL from Medium, Substack, Bloomberg, The Verge, or personal blogs into the navigation bar or reading salon.
  - Instantly sanitizes the HTML, computes word counts and estimated reading time, and lets you either **Read In Zen Chamber** or **Save to Offline Library**.

### 2. The Zen Chamber Reading Interface (`ReadingModal.tsx`)
Designed to feel like reading in a quiet private library:
* **Dual Reading Progress Indicators**:
  - **Header Meter**: Elegant slim reading progress bar tracking exact percentage down the story.
  - **Floating Tactical HUD**: A tactile floating pill showing live percentage read, elapsed reading minutes, and celebratory completion stamp (`Completed ✦`). Clicking the HUD smoothly scrolls back to the top of the story.
* **Typography & Theme Switcher**:
  - **Zen Night** (`#0f1117`), **Parchment Sepia** (`#f4ecd8`), and **Gallery Light** (`#ffffff`).
  - Fluid font sizing (`A-` / `A+`) and typography with generous line heights and pull quotes.
* **Speech Synthesis (TTS Read Aloud)**:
  - Built-in text-to-speech player controls allowing you to listen to any purified article hands-free.

---

## 🏛 Secondary Interfaces & Luxury Overlays

All secondary surfaces across Odysseus have been elevated into the unified, ultra-premium editorial design language, completely removing plain white, generic interfaces:

### 1. The Offline Salon (`/saved`)
* **Editorial Archive Canvas**: Rendered on rich parchment and forest green surfaces with refined typography.
* **Filter Desks**: Filter between `All Saved`, `✦ Imported Web Prose`, and `Prestige Publications`.
* **High-Fashion Article Cards**: Saturated category tags, estimated read time & word count badges, wax seal un-save buttons, and a **"Read in Chamber →"** trigger.
* **Pocket & Instapaper Quick Bar**: Inline URL input allowing one-click purification and immediate chamber reading.

### 2. The Traveler's Ledger & Passport (`/profile`)
* **Passport Identity**: User avatar with golden orbit ring, verified wax seal badge, and live explorer rank.
* **4 Saturated Metric Spreads**:
  - Juice Orange Streak card with active flame animation.
  - Deep Forest Green Daily Pace Dial with circular SVG gauge.
  - Warm Amber Milestone Perk card with progress bar.
  - Ice Blue Streak Freeze Vault holding active shields.
* **Interactive Daily Commitment Slider**: Calibrate your daily reading goal from 5 to 60 minutes with instant database sync.

### 3. Archive Search Overlay (`SearchModal.tsx`)
* **Editorial Search Palette**: Unified luxury modal styled with dark forest green, warm cream, and subtle stone borders.
* **Instantaneous Live Filtering**: Real-time multi-field search across titles, excerpts, sources, categories, and article content.
* **Live Archive Statistics**: Shows live count of indexed dispatches.
* **Fast Navigation**: Suggested topic pills (`Tech`, `Design`, `Culture`, `Science`, `AI`), auto-focus on open, and keyboard shortcut support (`Escape`).

### 4. Cinematic Onboarding Orientation (`OnboardingModal.tsx`)
* **4-Step Traveler Calibration**:
  1. *Orient Your Curiosity*: Topic interests selection (Tech, Design, Culture, Science, Chronicle).
  2. *Curate Publications*: Custom vector logos for *Wired*, *The Verge*, *The Atlantic*, *The New York Times*, *TechCrunch*, *Bloomberg*, *Dezeen*, and *Quanta*.
  3. *Define Daily Reading Pace*: Select commitment level (Casual Voyager 10m, Dedicated Scholar 20m, Grand Master 35m).
  4. *Traveler's Passport*: Initializing reader profile and explorer rank.

### 5. Configuration Atelier (`/settings`)
* **Reading Cadence Card**: Calibrate daily goals (`10m`, `15m`, `30m`, `45m`).
* **Prose Isolation Protocol**: Toggles for aggressive noise filters and multiplier hour notifications.
* **Visual Chamber Themes**: Choose default lighting environments (*Zen Night*, *Parchment*, *Gallery*).
* **Curated Publication Desks**: Toggle subscriptions to individual publication desks.

---

## ✦ The Odyssey Chrome Companion (Manifest V3)

A standalone Chromium companion extension located in [`/extension`](extension/) that turns your entire browser into an Odysseus feeder:

- **1-Click Save**: Click the orange compass icon on your toolbar or press `Alt + Shift + S` (`Cmd + Shift + S` on Mac) to save the current page immediately.
- **In-Page Luxury Toast Notification**: A floating cream-and-orange magazine toast appears on the webpage confirming your save with a direct link: `Read in Zen Chamber →`.
- **Right-Click Context Menu**:
  - `✦ Save Story to Odysseus Salon`
  - `✦ Read Now in Zen Chamber ↗`
  - `✦ Save Highlight to Odysseus Notebook` (on selected text)
- **High-Fashion Popup Interface**: Inspects the active tab's domain, article title, estimated read time, and displays your recent saves history.
- **Live Sync**: Works seamlessly with your live Vercel deployment (`https://odysseus.vercel.app`) or local development (`http://localhost:3000`).

---

## ◈ Gamification & The Traveler's Passport

Odysseus turns reading into a mindful, rewarding habit without gimmicks:

- **Time-of-Day Multipliers**:
  - ✦ **Early Bird Boost (1.5x)**: Active 6:00 AM – 9:00 AM for mindful morning readers.
  - ◆ **Night Owl Salon (1.5x)**: Active 10:00 PM – 2:00 AM for late-night scholars.
  - ◈ **Weekend Explorer (1.25x)**: Active all day Saturday & Sunday.
- **5 Explorer Ranks**:
  1. `Novice Wanderer` (0 – 60 mins read)
  2. `Wayfarer` (60 – 240 mins read)
  3. `Cartographer` (240 – 600 mins read)
  4. `Odyssey Vanguard` (600 – 1,200 mins read)
  5. `Grand Odyssey Master` (1,200+ mins read)
- **Streak Shield Vault**: Dual-slot freeze vault holding streak freeze shields (`◈`) that automatically protect your streak when traveling or offline.
- **Interactive 7-Day Habit Ledger**: Weekly spread tracking daily read times with wax seal completion stamps (`✓`).
- **Hall of Odyssey Medals (8 Unlockable Achievements)**:
  - *Inaugural Voyage* (First read)
  - *Dawn Patrol* (Early morning session)
  - *Midnight Scholar* (Late night read)
  - *Centurion Reader* (100+ lifetime minutes)
  - *Streak Sentinel* (7-day uninterrupted streak)
  - *Grand Archivist* (5+ saved stories)
  - *The Polymath* (Reading across all 4 publication desks)
  - *Grand Odyssey Master* (Pinnacle Rank 5)

---

## 🛠 Architecture & Tech Stack

```
                          ┌──────────────────────────┐
                          │   Odyssey Chrome Ext     │
                          │      (Manifest V3)       │
                          └────────────┬─────────────┘
                                       │ 1-Click Import
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        ODYSSEUS WEB APPLICATION                        │
│                                                                        │
│   Next.js 16 (App Router + Turbopack)  •  React 19  •  TypeScript 5   │
│   Tailwind CSS v4 (Editorial Theme)    •  GSAP 3.15 Kinetic Engine    │
│   Lenis 1.3 Smooth Scroll              •  Mozilla Readability         │
│   Linkedom & DOMPurify Sanitizer       •  Edge Image Proxy Engine     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE CLOUD PLATFORM                         │
│   PostgreSQL  •  Row Level Security (RLS)  •  Supabase Auth            │
└────────────────────────────────────────────────────────────────────────┘
```

| Layer | Technologies | Description |
|---|---|---|
| **Core Framework** | **Next.js 16** (App Router, Turbopack, React 19) | Server & Client Components, Dynamic API Routes, Fast Refresh |
| **Language** | **TypeScript 5.0** (Strict Mode) | Type-safe feed modeling, gamification ledger, and RPC contracts |
| **Styling & Tokens** | **Tailwind CSS v4** | Editorial Palette (`#5D8246`, `#243624`, `#FFFDD0`, `#FF694F`), fluid clamp typography |
| **Display Typography** | **Playfair Display & Inter** | Scoped editorial serif treatments paired with modern grotesk |
| **Serverless HTML Parser**| **linkedom** + **@mozilla/readability** | Ultra-lightweight DOM parsing preventing serverless edge timeouts |
| **HTML Sanitizer** | **dompurify** | Client & server-safe prose purification stripping scripts and tracking |
| **Media Resiliency** | **Edge Image Proxy (`/api/image-proxy`)** | Referer injection, anti-hotlinking bypass & 7-day immutable caching |
| **Kinetic Motion** | **Framer Motion 12**, **GSAP 3.15** | Gesture-driven transitions, slide reveals, and compass rotation |
| **Scrolling Engine** | **Lenis 1.3** | Smooth inertial momentum scrolling with `data-lenis-prevent` boundaries |
| **Database & Auth** | **Supabase** | PostgreSQL, Row Level Security, User Profiles, and Bookmarks |
| **Browser Extension** | **Chromium Manifest V3** | Background Service Worker, Context Menus, In-Page Toast, Storage Sync |
| **Production Hosting** | **Vercel Edge Network** | Serverless functions, Edge caching, and automated CI/CD builds |

---

## ✦ Repository Structure

```bash
Odysseus/
├── extension/                       # ✦ The Odyssey Chromium Companion Extension
│   ├── manifest.json                # Manifest V3 configuration & permissions
│   ├── background.js                # Ephemeral service worker & context menus
│   ├── content.js                   # In-page toast notification script
│   ├── content.css                  # Luxury toast notification styling
│   ├── popup/                       # High-fashion popup UI (HTML/CSS/JS)
│   ├── options/                     # Preferences & instance URL configuration
│   ├── icons/                       # 16px, 32px, 48px, 128px compass medallions
│   └── README.md                    # Installation guide for Chrome/Brave/Arc
├── public/                          # Static assets, logos, and screenshots
│   ├── logo.svg                     # Odysseus Compass Medallion
│   └── ...                          # High-resolution UI captures
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── image-proxy/         # ✦ Edge image proxy with anti-hotlinking bypass & edge cache
│   │   │   ├── read-mode/           # ✦ Linkedom + Readability prose extraction endpoint
│   │   │   ├── read-later/          # Saved articles sync API
│   │   │   └── rss/                 # Multi-source RSS feed fetcher & OG throttler
│   │   ├── feed/                    # ✦ The "For You" Editorial Broadsheet Feed
│   │   │   └── [category]/          # The 5 Prestige Desks (Tech, Design, Culture, Science, Chronicle)
│   │   ├── saved/                   # The Offline Salon with Pocket/Instapaper quick purifier
│   │   ├── profile/                 # The Traveler's Dossier & Grand Odyssey Passport
│   │   ├── settings/                # Configuration Atelier
│   │   ├── login/                   # Authentication & Traveler Registration
│   │   └── layout.tsx               # Root layout with fonts and metadata
│   ├── components/
│   │   ├── magazine/                # ✦ Editorial Minimalism Components (For You Feed)
│   │   │   ├── EditorialTypographyHero.tsx   # Two-line display headline (STORIES WORTH YOUR TIME.)
│   │   │   ├── FeaturedImageGallery.tsx      # Single-story showcase with uncropped contain & ambient blur
│   │   │   ├── TheLatestList.tsx             # Restrained editorial ticker & wire dispatches
│   │   │   ├── DailyDispatchFeed.tsx         # Asymmetrical 2/3 lead + 1/3 compact dispatch layout
│   │   │   └── CategoryEditorialSection.tsx  # Numbered category bands (02 - 06) with multi-layout grids
│   │   ├── AppHeader.tsx            # Sticky magazine navbar with category nav & compass logo
│   │   ├── ReadingModal.tsx         # Zen Chamber reader with HUD dial & TTS controls
│   │   ├── SearchModal.tsx          # Editorial search overlay with real-time filtering
│   │   ├── ImportArticleModal.tsx   # Universal URL purification modal
│   │   ├── OnboardingModal.tsx      # 4-step cinematic traveler calibration
│   │   ├── EditorialMonogramPoster.tsx # Bespoke SVG graphic typography & monogram fallback
│   │   ├── FeedLoadingScreen.tsx    # Classical typographical loading sequence
│   │   └── StoryCard.tsx            # Living book broadside cards with proxy retry
│   ├── data/
│   │   └── prestigeSources.ts       # 100+ publication directory across all desks
│   ├── hooks/                       # Custom React hooks (useProfile, useSavedStories, useFeedFetcher)
│   └── lib/
│       ├── cleanArticleExtraction.ts# Instapaper/Pocket purification heuristics
│       ├── gamification.ts          # Multipliers, explorer ranks, and streak ledger
│       ├── textUtils.ts             # Thumbnail resolution upgrades & entity decoders
│       └── supabaseClient.ts        # Typed Supabase client
└── CHROMEWEBSTORE.md                # Chrome Web Store listing & permissions doc
```

---

## ✦ Getting Started

Follow these steps to run the complete Odysseus salon locally on your machine.

### Prerequisites
- **Node.js**: v18.18 or higher (v20+ recommended)
- **Package Manager**: `npm` or `pnpm`
- **Supabase Account**: A free Supabase project for Auth & PostgreSQL storage

### 1. Clone & Install
```bash
git clone https://github.com/Shubham126710/ODYSSEUS.git
cd ODYSSEUS
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

### 3. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to experience Odysseus.

### 4. Load the Odyssey Chrome Extension (Optional)
1. Open Google Chrome, Arc, Brave, or Edge and navigate to `chrome://extensions/`.
2. Turn on **Developer mode** (top-right toggle).
3. Click **Load unpacked** (top-left button).
4. Select the `extension/` directory from this repository.
5. The orange compass medallion `✦` will appear in your browser toolbar ready to import any webpage with 1 click.

---

## 🚢 Deployment

Odysseus is optimized for zero-config deployment on Vercel:

```bash
npm run build
```

1. Push your changes to the `main` branch on GitHub.
2. Connect your repository to [Vercel](https://vercel.com).
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to your Vercel Project Environment Variables.
4. Deploy! Automatic CI/CD builds will deploy your updates in under 60 seconds.

---

## 📄 License & Credits

This project is licensed under the **MIT License** — feel free to explore, customize, and build upon it.

<div align="center">
  <sub>Curated & Crafted with devotion by <strong>Shubham Upadhyay</strong></sub>
  <br />
  <sub>✦ <em>Slow down. Read deeply. Explore fearlessly.</em> ✦</sub>
</div>
