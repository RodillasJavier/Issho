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

### Jikan API

The [Jikan API](https://jikan.moe/) is used to fetch anime data from MyAnimeList. See the [Jikan API Documentation](https://docs.api.jikan.moe/) for more details.

Jikan provides a RESTful API that allows us to search for anime, retrieving detailed information such as:
  - Titles (we collect both English and Japanese titles)
  - Synopses
  - Episode counts
  - Airing status
  - Cover images
  - Year of release

#### Implementation Details

**Base Configuration**
- Base URL: `https://api.jikan.moe/v4`
- Primary endpoint: `/anime` for search and retrieval
- Response format: JSON with nested objects and pagination metadata

**Rate Limiting Strategy**
The Jikan API has the following limits:
- Daily Limit: unlimited requests
- Rate Limit: 60 requests per minute
- Burst Limit: 3 requests per second

To prevent rate limit violations, we implemented:
- **Client-side throttling** with a 1-second delay between requests
- **Last request timestamp tracking** to enforce minimum intervals

**Error Handling**
- HTTP status code validation (400, 404, 500 errors)
- Graceful degradation when Jikan API is unavailable

**Content Filtering**
- `sfw: true` parameter to exclude adult content (Rx-rated anime)
- Client-side validation before database insertion

**Performance Optimizations**
- Pagination support (max 25 results per request per Jikan limit)
- Results sorted by popularity for better user experience

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