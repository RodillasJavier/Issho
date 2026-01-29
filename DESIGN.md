# Issho Design Spec

## Features

- User Authentication (Sign Up, Sign In, Sign Out)
- Create, Read, Update, Delete (CRUD) operations for entries
- Entries for Animes can be (enum in Supabase):
    - Reviews
    - Rating (1-10 scale)
    - Status (enum in Supabase)
        - not_started
        - watching
        - completed
        - dropped
- Votes (Like/Dislike) on entries. Functions like Reddit voting system.
    - Comments on entries.
        - Nested comments (replies to comments)
- Animes retrieved from external API ([Jikan API](https://docs.api.jikan.moe/))