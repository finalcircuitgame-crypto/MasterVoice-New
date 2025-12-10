# Architecture & Deployment Guide

## 1. System Components

+----------------+       +-------------------+       +------------------------+
| React Client A | <---> |  Supabase (Cloud) | <---> |     React Client B     |
+----------------+       +-------------------+       +------------------------+
       |   ^               | Auth (JWT)             |   ^
       |   |               | Postgres (Data)        |   |
       |   |               | Realtime (Sig/Msg)     |   |
       |   |               +-------------------+        |   |
       |   |                                            |   |
       |   +--------------------------------------------+   |
       |                   (Signaling)                      |
       |                                                    |
       v                                                    v
+----------------+                                   +----------------+
|   OpenRelay    |  <-- (TURN Traffic if P2P fails) --> |   OpenRelay    |
| (STUN/TURN)    |                                   | (STUN/TURN)    |
+----------------+                                   +----------------+

---

## 2. SQL Schema (Run in Supabase SQL Editor)

**CRITICAL: Run this ENTIRE block to fix "Row-Level Security" errors and "Avatar" issues:**

```sql
-- 1. DROP OLD POLICIES TO PREVENT CONFLICTS
drop policy if exists "Authenticated users can upload avatars" on storage.objects;
drop policy if exists "Public can view avatars" on storage.objects;
drop policy if exists "Authenticated users can upload attachments" on storage.objects;
drop policy if exists "Public can view attachments" on storage.objects;
drop policy if exists "Authenticated users can insert avatars" on storage.objects;
drop policy if exists "Users can update their own avatars" on storage.objects;
drop policy if exists "Users can delete their own avatars" on storage.objects;
drop policy if exists "Authenticated users can insert attachments" on storage.objects;

-- 2. CREATE ROBUST STORAGE POLICIES (Insert, Select, Update, Delete)

-- Avatars Bucket
create policy "Public can view avatars"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- Allow ANY authenticated user to insert into avatars (needed for the first upload of a hash)
create policy "Authenticated users can insert avatars"
on storage.objects for insert
with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- Allow users to update their OWN avatars (not strictly needed with deduplication, but good for cleanup)
create policy "Users can update their own avatars"
on storage.objects for update
using ( bucket_id = 'avatars' and auth.uid() = owner );

create policy "Users can delete their own avatars"
on storage.objects for delete
using ( bucket_id = 'avatars' and auth.uid() = owner );

-- Attachments Bucket
create policy "Public can view attachments"
on storage.objects for select
using ( bucket_id = 'attachments' );

create policy "Authenticated users can insert attachments"
on storage.objects for insert
with check ( bucket_id = 'attachments' and auth.role() = 'authenticated' );

-- 3. ENSURE TABLE COLUMNS EXIST
alter table public.profiles add column if not exists avatar_url text;
alter table public.messages add column if not exists reactions jsonb default '{}'::jsonb;
alter table public.messages add column if not exists reply_to_id uuid references public.messages(id);
alter table public.messages add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

-- 4. ENSURE MESSAGE POLICIES ALLOW REACTIONS
-- Allow users to update messages where they are the sender OR receiver (needed for reactions)
drop policy if exists "Users can update their own messages or reaction targets." on messages;
drop policy if exists "Users can update messages they are involved in" on messages;

create policy "Users can update messages they are involved in"
  on messages for update
  using ( auth.uid() = sender_id or auth.uid() = receiver_id );
```

---

## 3. Environment Variables

Create a `.env` file in your root (or configure in your deployment platform):

```env
# Get these from Supabase Dashboard -> Project Settings -> API
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
