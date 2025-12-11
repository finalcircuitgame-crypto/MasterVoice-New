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

-- ============================
-- === GROUP POLICIES FIX ===
-- ============================

-- Drop old table policies to ensure clean slate for groups
drop policy if exists "View groups if member" on public.groups;
drop policy if exists "View groups if member or creator" on public.groups;
drop policy if exists "Users can create groups" on public.groups;
drop policy if exists "View members if in group" on public.group_members;
drop policy if exists "Creator can add members" on public.group_members;
drop policy if exists "View own membership" on public.group_members;

-- (Re)Create Tables if not exist
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

-- Enable RLS
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- 1. View groups (Select)
-- CRITICAL: Must allow creator to see group immediately after creation (before member row is added)
create policy "View groups if member or creator" on public.groups
  for select using (
    created_by = auth.uid() OR
    exists (
      select 1 from public.group_members
      where group_members.group_id = groups.id
      and group_members.user_id = auth.uid()
    )
  );

-- 2. Create groups (Insert)
create policy "Users can create groups" on public.groups
  for insert with check (
    auth.role() = 'authenticated' AND
    created_by = auth.uid()
  );

-- 3. View own membership (Select)
create policy "View own membership" on public.group_members
  for select using ( user_id = auth.uid() );

-- 4. Manage members (Insert)
create policy "Creator can add members" on public.group_members
  for insert with check (
    exists (
      select 1 from public.groups
      where groups.id = group_members.group_id
      and groups.created_by = auth.uid()
    )
    or auth.uid() = user_id -- Allow self-join
  );

-- ============================
-- === GROUP MESSAGES FIX ===
-- ============================

-- Add group_id to messages
alter table public.messages add column if not exists group_id uuid references public.groups(id) on delete cascade;

-- Recreate Message Policies to handle Groups AND DMs
drop policy if exists "Users can update messages they are involved in" on messages;
drop policy if exists "Users can insert messages" on messages;
drop policy if exists "Users can view messages" on messages;

-- 1. Insert Messages
create policy "Users can insert messages" on messages for insert with check (
  auth.uid() = sender_id AND (
    (receiver_id is not null) OR -- Direct Message
    (group_id is not null AND exists (select 1 from public.group_members where group_id = messages.group_id and user_id = auth.uid())) -- Group Message
  )
);

-- 2. Select Messages
create policy "Users can view messages" on messages for select using (
  (auth.uid() = sender_id) OR
  (auth.uid() = receiver_id) OR
  (group_id is not null AND exists (select 1 from public.group_members where group_id = messages.group_id and user_id = auth.uid()))
);

-- 3. Update (React/Edit) Messages
create policy "Users can update messages they are involved in"
  on messages for update
  using ( 
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id OR
    (group_id is not null AND exists (select 1 from public.group_members where group_id = messages.group_id and user_id = auth.uid()))
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