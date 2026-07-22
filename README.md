# Issho (一緒)
**Your companion for tracking and sharing anime**
<br>
*Designed and developed by Javier Agustin Rodillas*

Issho is a community-driven platform for anime watchers to track, rate, and discuss their favorite shows. Issho aims to provide a seamless experience for managing your anime watchlist and engaging with/joining communities of fellow fans.

**Built with:**

<p>
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&logo=ReactQuery&logoColor=white" />
  <img src="https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/AniList-02A9FF?style=for-the-badge&logo=anilist&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
</p>


## Features

### User Authentication
- Secure sign up and sign in powered by Supabase Auth
- Persistent user sessions
- Protected routes for authenticated features

### Entry Management
- **Reviews** - Share detailed thoughts and analysis
- **Ratings** - Rate anime on a 1-10 scale
- **Status Updates** - Track your watching progress with status markers:
  - Not Started
  - Watching
  - Completed
  - Dropped

### Community Engagement
- **Inline voting** - Like/dislike entries right from the activity feed, or from the entry itself, with accurate live like/dislike/comment counts
- **Comments** - Discuss entries with the community, including nested threaded replies
- **Friends** - Send/accept friend requests by username, then browse your circle two ways:
  - **Channels** - each friend's most recent activity, grouped and sorted by recency
  - **Directory** - a compact alphabetical list
- **Activity feed filters** - switch between All activity, Friends, and You without ever re-fetching
- **Following panel** - see your circle's avatars and how much they've posted this week at a glance, with a shortcut into your friends workspace

### Anime Database & Franchises
- Anime metadata sourced live from the [AniList](https://anilist.co/) GraphQL API — titles, synopses, episode counts, airing status, cover/banner art, and year of release
- Seasons and related entries of the same show are automatically grouped into **franchises** by walking AniList's relations graph (prequel/sequel chains, plus direct side-content), so browsing and list-tracking can happen at the whole-series level as well as per-season
- Combined local + AniList search when adding an anime, with automatic import (and staleness refresh) on first reference

## Installation

1. Clone the repository:
```bash
git clone https://github.com/javierrodillas/issho.git
cd issho
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with your Supabase anon key (the project URL is already configured in `src/supabase-client.ts`):
```env
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

## Usage
1. **Sign Up/Sign In** - Create an account or log in to get started
2. **Browse Anime** - Explore the anime database, sourced live from AniList and grouped into franchises
3. **Create Entries** - Add reviews, ratings, or status updates for any anime
4. **Engage** - Vote and comment on entries, right from the feed or the entry itself
5. **Build Your Circle** - Send friend requests by username, then follow their activity from the Friends page or the homepage's following panel
6. **Track Progress** - Manage your personal anime watchlist, per season or for a whole franchise at once

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Type-check, then build for production
- `npm run lint` / `npm run lint:fix` - Lint the codebase (ESLint + Prettier)
- `npm run preview` - Preview production build

## Database Schema

The application uses Supabase (Postgres) with the following core tables:
- `anime` - Anime metadata, keyed on AniList's `anilist_id` (legacy MyAnimeList ids preserved as `mal_id`/`external_id`), with `franchise_key`/`franchise_title` grouping seasons of the same show
- `entries` - User reviews, ratings, and status updates
- `votes` - Entry voting records (Reddit-style up/down)
- `comments` - Entry comments with nested reply support
- `user_anime_entries` - Personal watchlist status/rating/review, per season or movie
- `user_franchise_entries` - Series-level watchlist status/rating/review, independent of per-season entries
- `friendships` - Friend requests and connections between users

## License

This project is open source and available under the MIT License.
