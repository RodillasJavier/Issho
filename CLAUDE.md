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
- `updated_at` (timestamptz) - Auto-set, tracks data freshness
- `name` (text) - Anime title (prefers English)
- `name_japanese` (text, nullable) - Japanese/romanized title
- `description` (text) - Anime description
- `episode_count` (integer, nullable) - Number of episodes
- `cover_image_url` (text) - URL to cover image
- `year` (integer, nullable) - Release year
- `external_id` (integer, unique, nullable) - MAL ID from Jikan API
- `genres` (text, nullable) - Comma-separated genre names
- `status` (text, nullable) - Airing status ("Finished Airing", etc.)
- `mal_url` (text, nullable) - Link to MyAnimeList page

**RLS Policies:**
- SELECT: Public read access
- INSERT: Authenticated users only

#### `user_anime_entries`
Personal anime lists - each user's private tracking of their anime
- `id` (uuid, PK) - Auto-generated
- `created_at` (timestamptz) - Auto-set
- `user_id` (uuid, FK → profiles.id) - CASCADE delete
- `anime_id` (uuid, FK → anime.id)
- `status` (Anime Status) - Default: 'not_started'
- `rating` (integer, nullable) - Personal rating (1-10)
- `review` (text, nullable) - Personal review
- `updated_at` (timestamptz) - Auto-set

**Unique Constraint:** (user_id, anime_id) - One entry per user per anime

**RLS Policies:**
- SELECT: Users can only view their own entries
- INSERT: Users can only insert with their own user_id
- UPDATE: Users can only update their own entries
- DELETE: Users can only delete their own entries

#### `entries`
Public posts/entries about anime (reviews, ratings, status updates)
- `id` (uuid, PK) - Auto-generated
- `created_at` (timestamptz) - Auto-set
- `content` (text, nullable) - Entry content/description
- `anime_id` (uuid, FK → anime.id)
- `entry_type` (Entry Types) - Type of entry
- `user_id` (uuid, FK → profiles.id) - CASCADE delete
- `rating_value` (integer, nullable) - For rating entries (1-10)
- `status_value` (Anime Status, nullable) - For status_update entries

**RLS Policies:**
- SELECT: Public read access
- INSERT: Authenticated users only
- UPDATE: Users can only update their own entries
- DELETE: Users can only delete their own entries

#### `votes`
Votes on entries (upvote/downvote system)
- `id` (uuid, PK) - Auto-generated
- `created_at` (timestamptz) - Auto-set
- `entry_id` (uuid, FK → entries.id)
- `user_id` (uuid, FK → profiles.id) - CASCADE delete
- `vote` (integer) - +1 for upvote, -1 for downvote

**Unique Constraint:** (entry_id, user_id) - One vote per user per entry

**RLS Policies:**
- SELECT: Public read access
- INSERT: Users can only insert with their own user_id
- UPDATE: Users can only update their own votes
- DELETE: Users can only delete their own votes

#### `comments`
Nested comments on entries
- `id` (uuid, PK) - Auto-generated
- `created_at` (timestamptz) - Auto-set
- `entry_id` (uuid, FK → entries.id)
- `user_id` (uuid, FK → profiles.id) - CASCADE delete
- `parent_comment_id` (uuid, nullable, FK → comments.id) - For nested replies
- `content` (text) - Comment text
- `is_spoiler` (boolean) - Default: false

**RLS Policies:**
- SELECT: Public read access
- INSERT: Authenticated users only
- UPDATE: Users can only update their own comments
- DELETE: Users can only delete their own comments

#### `profiles`
User profile information (linked to auth.users)
- `id` (uuid, PK, FK → auth.users.id) - User ID from Supabase Auth
- `username` (text, unique) - User's display name
- `avatar_url` (text, nullable) - URL to avatar in Supabase Storage
- `bio` (text, nullable) - User biography (max 500 chars)
- `created_at` (timestamptz) - Auto-set
- `updated_at` (timestamptz) - Auto-set

**RLS Policies:**
- SELECT: Public read access
- INSERT: Authenticated users can only create their own profile
- UPDATE: Users can only update their own profile
- DELETE: Users can only delete their own profile

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
- `/` - Home (anime feed with all entries)
- `/signin` - Sign in page
- `/signup` - Sign up page
- `/entry/create` - Create entry page
- `/entry/:id` - Entry detail page
- `/anime` - Anime list page (browse local database)
- `/anime/create` - Create anime page (manual import)
- `/anime/:id` - Anime detail page
- `/profile/:username` - User profile and anime list (unified)
- `/profile/edit` - Edit own profile

### Components
- `AnimeFeed` - Display entries for a specific anime
- `AnimeList` - Browse anime with search functionality
- `AnimeSearch` - Search Jikan API and import anime
- `AnimeListStats` - Reusable stats cards for filtering
- `CommentItem` - Single comment display
- `CommentSection` - Comments display with nesting
- `CreateAnime` - Form to create anime manually
- `CreateEntry` - Form to create entry (review/rating/status)
- `EntryDetail` - Entry detail view
- `EntryItem` - Single entry display
- `EntryList` - List of entries
- `LikeButton` - Voting button (upvote/downvote)
- `AddToListButton` - Add anime to personal list
- `MyAnimeListItem` - Anime card in user's list
- `EditListEntryModal` - Edit personal list entry
- `UserAvatar` - Avatar display with fallback
- `UserInfo` - Username/avatar combination
- `EditProfileForm` - Profile editing form
- `Navbar` - Navigation bar

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
3. **Rating Validation** - Ensure ratings are 1-10
4. **Spoiler Support** - UI for marking and displaying spoiler comments

---

## Implementation Plan for MVP

### Phase 1: Fix Current Functionality ✅ (COMPLETED)
**Goal:** Get the app working with the current schema

1. ✅ **Update Database Terminology** 
   - ✅ Schema uses `entries` instead of `posts`

2. ✅ **Update Frontend Components**
   - ✅ Rename all "post" files to "entry"
     - ✅ `PostList.tsx` → `EntryList.tsx`
     - ✅ `PostItem.tsx` → `EntryItem.tsx`
     - ✅ `PostDetail.tsx` → `EntryDetail.tsx`
     - ✅ `CreatePost.tsx` → `CreateEntry.tsx`
     - ✅ `CreatePostPage.tsx` → `CreateEntryPage.tsx`
     - ✅ `PostPage.tsx` → `EntryPage.tsx`
   
   - ✅ Update all database queries from `posts` to `entries`
     - ✅ `AnimeFeed.tsx`
     - ✅ `EntryList.tsx`
     - ✅ `EntryItem.tsx`
     - ✅ `EntryDetail.tsx`
   
   - ✅ Update all TypeScript types/interfaces
     - ✅ Rename `Post` interface to `Entry`
     - ✅ Add `entry_type` field to Entry interface
     - ✅ Update all imports

   - ✅ Update routes in App.tsx
     - ✅ `/post/*` → `/entry/*`
     - ✅ Update all navigation links

3. ✅ **Add Entry Type Support**
   - ✅ Update `CreateEntry` form to include entry type selection
   - ✅ Add conditional rendering based on entry type
     - ✅ Review: Show full content text
     - ✅ Rating: Show numeric input (1-10)
     - ✅ Status Update: Show status dropdown
   
   - ✅ Update `EntryItem` to display differently based on type
     - ✅ Entry type labels with emojis
     - ✅ Created shared utility for entry type display

4. ✅ **Fix Voting System**
   - ✅ Update `LikeButton` to work with entries
   - ✅ Add vote count display
   - ✅ Implement upvote/downvote logic (update if exists, insert if new)
   - ✅ Add visual feedback for user's vote

5. ✅ **Fix Comments System**
   - ✅ Update `CommentSection` to reference entry_id
   - ✅ Verify nested comments work correctly with tree structure
   - ✅ Comment replies functional

**Success Criteria:** ✅ Users can create entries (reviews/ratings/status updates), vote on them, and comment on them.

---

### Phase 2: User Anime Lists ✅ **COMPLETED**
**Goal:** Allow users to track their personal anime lists

**Overview:** 
Implemented personal anime list feature using the `user_anime_entries` table. Users can now:
- ✅ Add anime to their personal list with a status (not_started, watching, completed, dropped)
- ✅ Update their status as they watch
- ✅ Add personal ratings (1-10) and private review notes
- ✅ View their entire collection organized by status

**Database:**
- ✅ Added unique constraint (one entry per user per anime)
- ✅ Added rating validation (1-10 range)
- ✅ Auto-update trigger for `updated_at` timestamp
- ✅ Performance indexes on user_id and status

**Components Created:**
- ✅ `MyListPage.tsx` - Main list page with stats sidebar and filtering
- ✅ `MyAnimeListItem.tsx` - Anime card with status, rating, and edit options
- ✅ `AddToListButton.tsx` - Status picker with dropdown
- ✅ `EditListEntryModal.tsx` - Full edit modal for status, rating, notes, and delete

**API Layer:**
- ✅ `src/api/userAnimeList.ts` - Complete CRUD operations
  - `fetchUserAnimeList()` - Get list with optional status filter
  - `getUserAnimeEntry()` - Check if anime in list
  - `addUserAnimeEntry()` - Add anime to list
  - `updateUserAnimeEntry()` - Update existing entry
  - `removeUserAnimeEntry()` - Delete from list
  - `getUserListStats()` - Calculate statistics

**Routing & Navigation:**
- ✅ `/my-list` route added
- ✅ "My List" nav link (authenticated users only)
- ✅ Integrated into `AnimePage` with AddToListButton

**UI/UX Features:**
- ✅ Modern glassmorphism design with backdrop blur
- ✅ Color-coded status badges (blue=watching, green=completed, etc.)
- ✅ Sticky stats sidebar with flexbox layout
- ✅ Hover effects and smooth transitions
- ✅ Loading and empty states
- ✅ Filter tabs by status
- ✅ Stats dashboard (total, avg rating, counts by status)
- ✅ Responsive grid layout for anime cards

**Success Criteria Met:** ✅ All objectives achieved and tested

---

### Phase 3: Jikan API Integration ✅ **COMPLETED**
**Goal:** Populate anime database from external API

**Overview:**
Fully integrated Jikan API (unofficial MyAnimeList API) for fetching anime data. Users can now:
- ✅ Search for anime from both local database and Jikan API
- ✅ Import anime from Jikan with one click
- ✅ Browse anime with SFW content filtering
- ✅ Auto-refresh stale anime data after 7 days

**API Client:**
- ✅ `src/services/jikanApi.ts` - Complete Jikan API wrapper
  - Rate limiting: 1000ms delay between requests (3/sec limit)
  - HTTP status code validation
  - TypeScript interfaces for all API responses
  - `searchAnime()` - Search with pagination and SFW filter
  - `getAnimeById()` - Fetch full anime details

**Anime Import System:**
- ✅ `src/api/animeImport.ts` - Smart import logic
  - Checks if anime exists before importing
  - Maps Jikan data to database schema
  - Prefers English titles, stores Japanese as alternate
  - Stores essential data (title, description, episodes, year, genres, status)
  - Auto-refreshes data older than 7 days
- ✅ `src/api/animeSearch.ts` - Combined search
  - Searches both local DB and Jikan API simultaneously
  - Uses `Promise.allSettled` for graceful degradation
  - Returns partial results if one source fails

**Components:**
- ✅ `AnimeSearch.tsx` - Dual-source search with import
  - Integrated search bar with icon and clear button
  - Shows local results and Jikan results separately
  - One-click import from Jikan to database
  - Defensive error handling
- ✅ `AnimeList.tsx` - Browse local anime with search
  - Client-side search across name, description, genres
  - Search bar with results count
  - Matches styling across components

**Data Quality:**
- ✅ SFW content filtering (excludes adult content)
- ✅ Auto-refresh after 7 days using `updated_at` timestamp
- ✅ Duplicate prevention via `external_id` unique constraint
- ✅ Graceful handling of missing data (nullable fields)

**Error Handling:**
- ✅ Rate limit compliance
- ✅ HTTP error validation (400, 404, 500)
- ✅ Graceful degradation when Jikan unavailable
- ✅ Promise.allSettled prevents cascade failures

**Performance:**
- ✅ Rate limiting prevents API throttling
- ✅ Smart caching: only refresh old data
- ✅ Pagination support (25 results/request)
- ✅ Results sorted by popularity

**Success Criteria Met:** ✅ Users can search for anime from Jikan API, automatically add them to the database, and data stays fresh through auto-refresh. API integration is robust with proper error handling and rate limiting.

---

### Phase 4: User Profiles ✅ **COMPLETED**
**Goal:** Implement user profile system with customization and social features

**Overview:**
Implemented comprehensive user profile system with authentication integration. Users can now:
- ✅ View their own profile and other users' profiles
- ✅ Customize username, bio, and avatar
- ✅ See profile stats (anime count, average rating)
- ✅ Access unified list view showing anime collection with filtering
- ✅ Navigate seamlessly between profiles and lists

**Database:**
- ✅ `profiles` table with username, bio, avatar_url
- ✅ Foreign key constraints from entries/comments/votes/user_anime_entries to profiles
- ✅ Cascade delete for data integrity
- ✅ Supabase Storage integration for avatar uploads

**Components Created:**
- ✅ `UserProfilePage.tsx` - Unified profile and list view
  - Shows profile banner with avatar, username, bio
  - Displays clickable stat cards (Total, Watching, Completed, etc.)
  - Shows filtered anime list based on selected status
  - Edit pencil icon for own profile only
- ✅ `EditProfileForm.tsx` - Form component for profile editing
  - Custom file input button with hover effects
  - Username validation (3-20 chars, alphanumeric)
  - Bio with character count (500 max)
  - Avatar preview before upload
- ✅ `EditProfilePage.tsx` - Page wrapper with auth and loading
- ✅ `AnimeListStats.tsx` - Reusable stats cards component
  - Color-coded cards for each status
  - Active filter highlighting
  - Gradient average rating card
- ✅ `UserAvatar.tsx` - Avatar display component with fallback
- ✅ `UserInfo.tsx` - Username/avatar combination component

**API Layer:**
- ✅ `src/services/supabase/profiles.ts` - Profile CRUD operations
  - `getProfileById()` - Fetch profile by user ID
  - `getProfileByUsername()` - Fetch profile by username
  - `updateProfile()` - Update username and bio
  - `updateAvatar()` - Upload avatar to Supabase Storage
  - `deleteAvatar()` - Remove avatar from storage

**Routing & Navigation:**
- ✅ Removed `/my-list` route (merged with profile)
- ✅ Changed `/user/:username` to `/profile/:username`
- ✅ `/profile/edit` route for editing own profile
- ✅ Navbar "Profile" link navigates to own profile
- ✅ Auto-redirect to new username after profile update

**Data Management:**
- ✅ Auto-refresh anime data from Jikan API after 7 days
- ✅ `updated_at` field added to anime table
- ✅ Migration to track anime data freshness
- ✅ Prevents stale data while respecting rate limits

**UI/UX Features:**
- ✅ Unified design language across profile pages
- ✅ "{username}'s List" possessive title
- ✅ Edit pencil icon (only visible on own profile)
- ✅ Custom file input with proper hover isolation
- ✅ Avatar preview during upload
- ✅ Form validation with helpful error messages
- ✅ Responsive grid layout
- ✅ Component splitting for better maintainability

**Success Criteria Met:** ✅ All objectives achieved and tested. Profile system fully functional with clean component architecture.

---

### Phase 5: Enhanced UX (Priority: MEDIUM)
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
  updated_at: string;
  name: string;
  name_japanese: string | null;
  description: string | null;
  episode_count: number | null;
  cover_image_url: string | null;
  year: number | null;
  external_id: number | null;
  genres: string | null;
  status: string | null;
  mal_url: string | null;
}

export interface Entry {
  id: string;
  created_at: string;
  content: string | null;
  anime_id: string;
  entry_type: EntryType;
  user_id: string;
  rating_value: number | null;
  status_value: AnimeStatus | null;
  anime?: Anime; // When joined
  profile?: Profile; // When joined
  vote_count?: number; // When aggregated
  comment_count?: number; // When aggregated
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
  profile?: Profile; // When joined
  children?: Comment[]; // When nested
}

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
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
