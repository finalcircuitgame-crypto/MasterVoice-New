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

**CRITICAL: Run this ENTIRE block to fix "Row-Level Security" errors, "Avatar" issues, and Enable Groups:**

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

-- 5. GROUPS FEATURE SCHEMA
create table if not exists public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.group_members (
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (group_id, user_id)
);

-- RLS for Groups
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- Policy: Users can view groups they are members of
create policy "View groups if member" on public.groups
  for select using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = groups.id
      and group_members.user_id = auth.uid()
    )
  );

-- Policy: Users can create groups
create policy "Users can create groups" on public.groups
  for insert with check ( auth.role() = 'authenticated' );

-- Policy: Users can view members of groups they are in
create policy "View members if in group" on public.group_members
  for select using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
    )
  );

-- Policy: Users can add members (simplified for demo: anyone can join/add for now or creator only)
-- Allowing creator to add members
create policy "Creator can add members" on public.group_members
  for insert with check (
    exists (
      select 1 from public.groups
      where groups.id = group_members.group_id
      and groups.created_by = auth.uid()
    )
    or auth.uid() = user_id -- Allow self-join if we implement invite codes later
  );
```

---

## 3. Environment Variables

Create a `.env` file in your root (or configure in your deployment platform):

```env
# Get these from Supabase Dashboard -> Project Settings -> API
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```