# Issho - Current State & Implementation Plan

## Project Overview
Issho is an anime social platform where users can share reviews, ratings, and status updates for anime titles. It includes a voting system (Reddit-style) and nested comments on entries.

---

## Current Supabase Schema

### Enums

#### `Entry Types` (enum)
- `review` - Full text reviews of anime
- `rating` - Numeric rating (1-10)
- `status_update` - Updates to watching status

#### `Anime Status` (enum)
- `not_started` - User hasn't started watching
- `watching` - Currently watching
- `completed` - Finished watching
- `dropped` - Stopped watching

### Tables

#### `anime`
Stores anime information (from Jikan API or user-created)
- `id` (uuid, PK) - Auto-generated
- `created_at` (timestamptz) - Auto-set
- `name` (text) - Anime title
- `description` (text) - Anime description
- `episode_count` (integer, nullable) - Number of episodes
- `cover_image_url` (text) - URL to cover image
- `year` (integer, nullable) - Release year
- `external_id` (text, unique) - ID from Jikan API

**RLS Policies:**
- SELECT: Public read access
- INSERT: Authenticated users only

#### `user_anime_entries`
Personal anime lists - each user's private tracking of their anime
- `id` (uuid, PK) - Auto-generated
- `created_at` (timestamptz) - Auto-set
- `user_id` (uuid) - Auto-set to auth.uid()
- `anime_id` (uuid, FK → anime.id)
- `status` (Anime Status) - Default: 'not_started'
- `rating` (integer, nullable) - Personal rating (1-10)
- `review` (text, nullable) - Personal review
- `updated_at` (timestamptz) - Auto-set

**RLS Policies:**
- SELECT: Users can only view their own entries
- INSERT: Users can only insert with their own user_id
- UPDATE: Users can only update their own entries

#### `entries`
Public posts/entries about anime (reviews, ratings, status updates)
- `id` (uuid, PK) - Auto-generated
- `created_at` (timestamptz) - Auto-set
- `content` (text, nullable) - Entry content/description
- `anime_id` (uuid, FK → anime.id)
- `entry_type` (Entry Types) - Type of entry
- `user_id` (uuid) - Auto-set to auth.uid()

**RLS Policies:**
- SELECT: Public read access
- INSERT: Authenticated users only

#### `votes`
Votes on entries (upvote/downvote system)
- `id` (uuid, PK) - Auto-generated
- `created_at` (timestamptz) - Auto-set
- `entry_id` (uuid, FK → entries.id)
- `user_id` (uuid) - Auto-set to auth.uid()
- `vote` (integer) - +1 for upvote, -1 for downvote

**RLS Policies:**
- SELECT: Public read access
- INSERT: Users can only insert with their own user_id
- UPDATE: Users can only update their own votes

#### `comments`
Nested comments on entries
- `id` (uuid, PK) - Auto-generated
- `created_at` (timestamptz) - Auto-set
- `entry_id` (uuid, FK → entries.id)
- `user_id` (uuid) - Auto-set to auth.uid()
- `parent_comment_id` (uuid, nullable, FK → comments.id) - For nested replies
- `content` (text) - Comment text
- `is_spoiler` (boolean) - Default: false

**RLS Policies:**
- SELECT: Public read access
- INSERT: Authenticated users only
- DELETE: Users can only delete their own comments

### Installed Extensions
- `pgcrypto` (for UUID generation)
- `uuid-ossp` (UUID utilities)
- `pg_stat_statements` (query statistics)
- `supabase_vault` (Supabase secrets)
- `pg_graphql` (GraphQL support)
- `plpgsql` (PostgreSQL procedural language)

---

## Current Tech Stack

### Frontend
- **React 19.2.0** with TypeScript
- **Vite 7.2.4** - Build tool
- **TailwindCSS 4.1.18** - Styling
- **React Router 7.13.0** - Navigation
- **TanStack Query 5.90.20** - Data fetching & caching
- **Supabase JS 2.91.1** - Database client

### Backend
- **Supabase** - PostgreSQL database with RLS
- **Row Level Security (RLS)** - All tables protected
- **Jikan API** - External anime data source (not yet integrated)

---

## Current Application Structure

### Pages
- `/` - Home (likely feed of all entries)
- `/signin` - Sign in page
- `/signup` - Sign up page
- `/post/create` - Create post page (needs updating to "entry")
- `/post/:id` - Post detail page (needs updating to "entry")
- `/anime` - Anime list page
- `/anime/create` - Create anime page
- `/anime/:id` - Anime detail page

### Components
- `AnimeFeed` - Display posts for a specific anime (needs update)
- `AnimeList` - List of anime
- `CommentItem` - Single comment display
- `CommentSection` - Comments display with nesting
- `CreateAnime` - Form to create anime
- `CreatePost` - Form to create post (needs update to "entry")
- `LikeButton` - Voting button
- `Navbar` - Navigation bar
- `PostDetail` - Post detail view (needs update)
- `PostItem` - Single post display (needs update)
- `PostList` - List of posts (needs update)

### Context
- `AuthContext` - Auth context definition
- `AuthProvider` - Auth state management

### Hooks
- `useAuth` - Hook to access auth context

---

## Issues to Fix

### Schema Migration Mismatch
The application was built following a tutorial with a `posts` table, but the schema has been migrated to use `entries` instead. Current components still reference `posts` which no longer exists.

**Components referencing `posts`:**
- `AnimeFeed.tsx` - queries "posts" table
- `PostList.tsx` - likely queries "posts" table
- `PostItem.tsx` - displays post data
- `PostDetail.tsx` - displays post details
- `CreatePost.tsx` - creates posts

**Required Changes:**
1. Update all `posts` references to `entries`
2. Add entry type selection when creating entries
3. Update voting system to work with entries
4. Update comments to work with entries

### Missing Features
1. **Jikan API Integration** - Anime data not yet pulled from external API
2. **User Anime List Management** - UI for `user_anime_entries` table
3. **Entry Type Differentiation** - UI should handle reviews, ratings, and status updates differently
4. **Vote Count Display** - Aggregate vote counts for entries
5. **Comment Votes** - Comments can't be voted on yet (would need a `comment_votes` table)
6. **Rating Validation** - Ensure ratings are 1-10

---

## Implementation Plan for MVP

### Phase 1: Fix Current Functionality (Priority: HIGH)
**Goal:** Get the app working with the current schema

1. **Update Database Terminology** ✅ (Schema already updated)
   - ✅ Schema uses `entries` instead of `posts`

2. **Update Frontend Components**
   - [ ] Rename all "post" files to "entry"
     - [ ] `PostList.tsx` → `EntryList.tsx`
     - [ ] `PostItem.tsx` → `EntryItem.tsx`
     - [ ] `PostDetail.tsx` → `EntryDetail.tsx`
     - [ ] `CreatePost.tsx` → `CreateEntry.tsx`
     - [ ] `CreatePostPage.tsx` → `CreateEntryPage.tsx`
     - [ ] `PostPage.tsx` → `EntryPage.tsx`
   
   - [ ] Update all database queries from `posts` to `entries`
     - [ ] `AnimeFeed.tsx`
     - [ ] `EntryList.tsx` (renamed from PostList)
     - [ ] `EntryItem.tsx` (renamed from PostItem)
     - [ ] `EntryDetail.tsx` (renamed from PostDetail)
   
   - [ ] Update all TypeScript types/interfaces
     - [ ] Rename `Post` interface to `Entry`
     - [ ] Add `entry_type` field to Entry interface
     - [ ] Update all imports

   - [ ] Update routes in App.tsx
     - [ ] `/post/*` → `/entry/*`
     - [ ] Update all navigation links

3. **Add Entry Type Support**
   - [ ] Update `CreateEntry` form to include entry type selection
   - [ ] Add conditional rendering based on entry type
     - [ ] Review: Show full content text
     - [ ] Rating: Show numeric input (1-10)
     - [ ] Status Update: Show status dropdown
   
   - [ ] Update `EntryItem` to display differently based on type
     - [ ] Review entries: Show title + preview
     - [ ] Rating entries: Show score prominently
     - [ ] Status updates: Show status badge

4. **Fix Voting System**
   - [ ] Update `LikeButton` to work with entries
   - [ ] Add vote count display
   - [ ] Implement upvote/downvote logic (update if exists, insert if new)
   - [ ] Add visual feedback for user's vote

5. **Fix Comments System**
   - [ ] Update `CommentSection` to reference entry_id instead of post_id
   - [ ] Verify nested comments work correctly
   - [ ] Add spoiler toggle/warning for spoiler comments

**Success Criteria:** Users can create entries (reviews/ratings/status updates), vote on them, and comment on them.

---

### Phase 2: User Anime Lists (Priority: HIGH)
**Goal:** Allow users to track their personal anime lists

1. **Create User List Components**
   - [ ] `MyAnimeList.tsx` - Display user's anime list
   - [ ] `AnimeListItem.tsx` - Single anime in user's list
   - [ ] `AddToListButton.tsx` - Button to add anime to list
   - [ ] `EditListEntry.tsx` - Modal/form to edit list entry

2. **Add User List Page**
   - [ ] Create `/my-list` route
   - [ ] Add link in Navbar
   - [ ] Fetch user's anime entries from `user_anime_entries`

3. **Implement List Management**
   - [ ] Add anime to list with status
   - [ ] Update status (dropdown or buttons)
   - [ ] Add/edit personal rating
   - [ ] Add/edit personal review (private notes)
   - [ ] Remove from list

4. **Add List Status Indicators**
   - [ ] Show on anime detail page if user has it in list
   - [ ] Display current status badge
   - [ ] Quick status update from detail page

**Success Criteria:** Users can maintain their personal anime list with status, ratings, and private reviews.

---

### Phase 3: Jikan API Integration (Priority: MEDIUM)
**Goal:** Populate anime database from external API

1. **Set Up Jikan API Client**
   - [ ] Create `src/services/jikanApi.ts`
   - [ ] Add search functionality
   - [ ] Add fetch anime details by ID
   - [ ] Handle rate limiting (Jikan has limits)

2. **Update Anime Search**
   - [ ] Replace/enhance `AnimeList` with search
   - [ ] Show results from Jikan API
   - [ ] Allow user to add anime from search results to database

3. **Anime Import Flow**
   - [ ] When user searches for anime, check if exists in DB
   - [ ] If not in DB, fetch from Jikan and insert
   - [ ] Store `external_id` from Jikan for future reference
   - [ ] Show anime details from Jikan

4. **Enhance Anime Detail Page**
   - [ ] Display full anime info from Jikan
   - [ ] Show genres, studios, air dates
   - [ ] Add anime trailer/PV if available
   - [ ] Link to MAL/Jikan page

**Success Criteria:** Users can search for anime from Jikan API and automatically add them to the database.

---

### Phase 4: Enhanced UX (Priority: MEDIUM)
**Goal:** Improve user experience and visual polish

1. **Better Entry Display**
   - [ ] Entry cards with proper styling
   - [ ] User avatars (if added to auth)
   - [ ] Timestamps (relative: "2 hours ago")
   - [ ] Vote count prominently displayed

2. **Feed Improvements**
   - [ ] Filter entries by type (reviews, ratings, status updates)
   - [ ] Sort by: newest, most upvoted, controversial
   - [ ] Pagination or infinite scroll
   - [ ] Show anime cover in entry cards

3. **Anime Page Enhancements**
   - [ ] Stats: avg rating from entries
   - [ ] Entry count by type
   - [ ] Top reviews (most upvoted)
   - [ ] Community status distribution chart

4. **User Profiles** (if time permits)
   - [ ] Public profile page
   - [ ] User's public entries
   - [ ] User's anime list (if they make it public)
   - [ ] Stats: total anime watched, reviews written

**Success Criteria:** App feels polished and provides good UX for browsing and interacting with content.

---

### Phase 5: Additional Features (Priority: LOW)
**Goal:** Nice-to-have features for future enhancement

1. **Comment Voting**
   - [ ] Create `comment_votes` table
   - [ ] Add voting to comments
   - [ ] Sort comments by votes

2. **Rich Text Editor**
   - [ ] Add markdown support for reviews
   - [ ] Preview mode
   - [ ] Formatting toolbar

3. **Notifications**
   - [ ] Notify when someone comments on your entry
   - [ ] Notify when someone replies to your comment
   - [ ] Use Supabase Realtime

4. **Advanced Search & Filters**
   - [ ] Search entries by content
   - [ ] Filter by anime genre
   - [ ] Filter by year
   - [ ] Filter by rating range

5. **Social Features**
   - [ ] Follow users
   - [ ] Feed from followed users
   - [ ] Trending anime
   - [ ] Weekly discussion threads

**Success Criteria:** App has advanced social features that encourage engagement.

---

## Database Functions Needed

### Aggregate Vote Count
```sql
CREATE OR REPLACE FUNCTION get_entry_vote_count(entry_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(vote), 0)::INTEGER
  FROM votes
  WHERE entry_id = entry_uuid;
$$ LANGUAGE SQL STABLE;
```

### Get User's Vote on Entry
```sql
CREATE OR REPLACE FUNCTION get_user_vote(entry_uuid UUID, user_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(vote, 0)::INTEGER
  FROM votes
  WHERE entry_id = entry_uuid AND user_id = user_uuid;
$$ LANGUAGE SQL STABLE;
```

### Upsert Vote
Can be handled in application logic or via stored procedure.

---

## TypeScript Types to Create

```typescript
// src/types/database.types.ts

export type EntryType = 'review' | 'rating' | 'status_update';
export type AnimeStatus = 'not_started' | 'watching' | 'completed' | 'dropped';

export interface Anime {
  id: string;
  created_at: string;
  name: string;
  description: string;
  episode_count: number | null;
  cover_image_url: string;
  year: number | null;
  external_id: string;
}

export interface Entry {
  id: string;
  created_at: string;
  content: string | null;
  anime_id: string;
  entry_type: EntryType;
  user_id: string;
  anime?: Anime; // When joined
  vote_count?: number; // When aggregated
  user_vote?: number; // User's vote (-1, 0, 1)
}

export interface Vote {
  id: string;
  created_at: string;
  entry_id: string;
  user_id: string;
  vote: number; // -1 or 1
}

export interface Comment {
  id: string;
  created_at: string;
  entry_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  is_spoiler: boolean;
  replies?: Comment[]; // When nested
}

export interface UserAnimeEntry {
  id: string;
  created_at: string;
  user_id: string;
  anime_id: string;
  status: AnimeStatus;
  rating: number | null;
  review: string | null;
  updated_at: string;
  anime?: Anime; // When joined
}
```

---

## Next Immediate Steps

1. **Create a todo list for Phase 1**
2. **Start by renaming components and updating imports**
3. **Update database queries from `posts` to `entries`**
4. **Test that basic CRUD works again**
5. **Add entry type support to create form**
6. **Fix voting system**

Once Phase 1 is complete, the app will be functional again and we can move to Phase 2 (User Anime Lists), then Phase 3 (Jikan API integration).
