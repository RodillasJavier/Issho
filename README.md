# Issho (一緒)
**Designed and developed by Javier Agustin Rodillas**

> Your companion for tracking and sharing anime

Issho is a community-driven platform for anime watchers to track, rate, and discuss their favorite shows. Issho aims to provide a seamless experience for managing your anime watchlist and engaging with/joining communities of fellow fans.

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
- **Voting System** - Reddit-style upvote/downvote on entries
- **Comments** - Discuss entries with the community
- **Nested Replies** - Threaded comment conversations

### Anime Database
- Integration with [Jikan API](https://docs.api.jikan.moe/) (MyAnimeList unofficial API)
- Rich anime metadata including descriptions, episode counts, and cover images
- Comprehensive anime search and discovery

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **State Management**: TanStack Query (Formerly React Query)
- **Routing**: React Router
- **External API**: Jikan API

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
Create a `.env` file in the root directory with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

## Usage
1. **Sign Up/Sign In** - Create an account or log in to get started
2. **Browse Anime** - Explore the anime database powered by Jikan API
3. **Create Entries** - Add reviews, ratings, or status updates for any anime
4. **Engage** - Vote on entries and join discussions through comments
5. **Track Progress** - Manage your personal anime watchlist

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Database Schema

The application uses Supabase with the following core tables:
- `anime` - Anime metadata
- `entries` - User reviews, ratings, and status updates
- `votes` - Entry and comment voting records
- `comments` - Entry comments with nested reply support
- `user_anime_entries` - User watchlist and personal anime data

## License

This project is open source and available under the MIT License.