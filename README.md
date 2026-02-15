# Odysseus

A modern, feature-rich RSS reader application built with Next.js and Supabase. Odysseus allows you to follow your favorite feeds, read articles in a distraction-free mode, and save stories for later.

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Date Handling**: [date-fns](https://date-fns.org/)
- **Sanitization**: [isomorphic-dompurify](https://github.com/kkomelin/isomorphic-dompurify)

### Backend
- **Serverless Functions**: Next.js API Routes
- **RSS Parsing**: [rss-parser](https://github.com/rbren/rss-parser)
- **Content Extraction**: [@mozilla/readability](https://github.com/mozilla/readability), [jsdom](https://github.com/jsdom/jsdom)

### Database & Infrastructure
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: Supabase Auth
- **Hosting**: Vercel (recommended)

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- A Supabase project set up

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd odysseus
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🏗 Project Structure

- `src/app`: Application source code (Next.js App Router).
- `src/components`: Reusable UI components.
- `src/hooks`: Custom React hooks for data fetching and state management.
- `src/lib`: Utility functions and clients (Supabase, mock data).
- `supabase`: Database schemas and SQL scripts.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
