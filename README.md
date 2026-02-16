# Odysseus

A modern, full-stack RSS reader built with Next.js and Supabase.

Odysseus allows users to subscribe to feeds, read articles in a distraction-free interface, and save stories for later. The project focuses on performance, content extraction, and scalable backend architecture.

---

## Highlights

- Built with Next.js App Router and Supabase (PostgreSQL)
- Serverless architecture using Next.js API Routes
- RSS parsing and full-article content extraction
- Secure authentication via Supabase Auth
- Clean, distraction-free reading experience
- Type-safe development with TypeScript
- Scalable and production-ready infrastructure
- Modular, component-driven frontend structure

---

## Overview

Odysseus is designed to provide a streamlined reading workflow. It aggregates RSS feeds, extracts readable article content, and presents it in a minimal interface optimized for focus.

The system handles feed parsing, content sanitization, article extraction, and persistent storage using a modern serverless stack.

---

## Core Features

### Feed Subscription
Follow and manage multiple RSS feeds.

### Article Aggregation
Automatically fetch and parse RSS entries.

### Readability Mode
Extract full article content using Mozilla Readability.

### Save for Later
Bookmark articles for future reading.

### Authentication
Secure user accounts powered by Supabase Auth.

### Responsive Interface
Optimized for desktop and mobile reading.

---

## Architecture

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Framer Motion
- date-fns

### Backend
- Next.js API Routes (serverless functions)
- rss-parser for feed ingestion
- @mozilla/readability + jsdom for content extraction
- isomorphic-dompurify for sanitization

### Database & Infrastructure
- Supabase (PostgreSQL)
- Supabase Auth
- Vercel (recommended deployment platform)

---

## Project Structure

```
├── src/
│   ├── app/              # Application routes (App Router)
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and Supabase clients
├── supabase/             # Database schema & SQL scripts
└── configuration files
```

---

## Running Locally

### Prerequisites
- Node.js installed
- A Supabase project configured

### Setup

```bash
git clone <repository-url>
cd odysseus
npm install
```

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start the development server:

```bash
npm run dev
```

Visit: http://localhost:3000

---

## Future Improvements

- Feed categorization and folders
- Offline reading support
- Full-text search
- Article recommendation system
- Import/export feed OPML

---

## License

MIT License
