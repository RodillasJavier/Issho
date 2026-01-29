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

### Phase 2: User Anime Lists (Priority: HIGH) 🔄 **IN PROGRESS**
**Goal:** Allow users to track their personal anime lists

**Overview:** 
Phase 2 focuses on implementing the personal anime list feature using the existing `user_anime_entries` table. Users will be able to:
- Add anime to their personal list with a status (not_started, watching, completed, dropped)
- Update their status as they watch
- Add personal ratings (1-10) and private review notes
- View their entire collection organized by status

**Database Status:**
- ✅ `user_anime_entries` table exists with proper RLS policies
- ✅ Status enum: not_started, watching, completed, dropped
- ✅ Supports rating (integer, 1-10) and review (text) fields
- ✅ Auto-timestamps with created_at and updated_at

**Implementation Tasks:**

1. **Create Core Components**
   - [ ] `MyAnimeList.tsx` - Main page component displaying user's list
     - Grid/list view of user's anime
     - Filter tabs by status (All, Watching, Completed, etc.)
     - Stats summary (total anime, avg rating, etc.)
   
   - [ ] `MyAnimeListItem.tsx` - Individual anime card in user's list
     - Display anime cover, name, status badge
     - Quick status change dropdown
     - Personal rating display
     - Edit/delete buttons
     - Link to anime detail page
   
   - [ ] `AddToListButton.tsx` - Button component for adding anime to list
     - Display on anime detail page
     - Show "Add to List" if not in list
     - Show current status badge if already in list
     - Click opens status picker modal
   
   - [ ] `EditListEntryModal.tsx` - Modal for editing list entry
     - Status dropdown (not_started, watching, completed, dropped)
     - Rating input (1-10 scale)
     - Personal review textarea (private notes)
     - Save/Cancel buttons
     - Delete from list option

2. **Create Data Layer Functions**
   - [ ] `src/api/userAnimeList.ts` - API functions for user anime list
     ```typescript
     - fetchUserAnimeList(userId: string, status?: AnimeStatus)
     - addUserAnimeEntry(animeId: string, userId: string, status: AnimeStatus)
     - updateUserAnimeEntry(entryId: string, updates: Partial<UserAnimeEntry>)
     - removeUserAnimeEntry(entryId: string)
     - getUserAnimeEntry(animeId: string, userId: string)
     ```

3. **Add Page Route**
   - [ ] Create `/my-list` page
   - [ ] Add route to `App.tsx`
   - [ ] Add "My List" link to Navbar (only when authenticated)
   - [ ] Add protected route wrapper

4. **Enhance Anime Detail Page**
   - [ ] Add `AddToListButton` component
   - [ ] Check if anime is in user's list on load
   - [ ] Display current status if in list
   - [ ] Allow quick status updates

5. **Database Constraints & Validation**
   - [ ] Create unique constraint: one entry per user per anime
     ```sql
     ALTER TABLE user_anime_entries 
     ADD CONSTRAINT user_anime_unique 
     UNIQUE (user_id, anime_id);
     ```
   - [ ] Add check constraint for rating range (1-10)
     ```sql
     ALTER TABLE user_anime_entries
     ADD CONSTRAINT rating_range 
     CHECK (rating >= 1 AND rating <= 10);
     ```
   - [ ] Add trigger to auto-update updated_at timestamp

6. **UI/UX Enhancements**
   - [ ] Status badge component with color coding
     - Not Started: Gray
     - Watching: Blue
     - Completed: Green
     - Dropped: Red
   - [ ] Loading states for all operations
   - [ ] Success/error toast notifications
   - [ ] Optimistic updates for status changes
   - [ ] Empty state when list is empty

**Success Criteria:** 
- Users can add anime to their personal list with a status
- Users can view their list filtered by status
- Users can update status, rating, and personal notes
- Users can remove anime from their list
- Anime detail page shows if user has it in their list

**Technical Notes:**
- Use TanStack Query for data fetching and caching
- Invalidate queries after mutations for instant UI updates
- Use modal/drawer for edit forms (better UX on mobile)
- Consider adding pagination for large lists (>50 anime)

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
