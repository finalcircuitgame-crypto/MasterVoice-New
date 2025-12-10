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

**Flows:**
1.  **Auth**: User logs in -> Supabase returns Session.
2.  **Data**: Chat history fetched from Postgres `messages` table via Supabase JS Client.
3.  **Realtime Messages**: Clients subscribe to `postgres_changes` on `messages` table.
4.  **Signaling**:
    *   Clients join a specific channel `room:userA_userB` (based on sorted IDs).
    *   Signaling events (`offer`, `answer`, `candidate`, `hangup`) are sent via `channel.send({type: 'broadcast', ...})`.
5.  **Voice**:
    *   WebRTC PeerConnection established using ICE candidates exchanged via Signaling.
    *   Audio stream flows P2P (UDP) or via TURN (TCP/UDP) if NAT traversal fails.

---

## 2. SQL Schema (Run in Supabase SQL Editor)

```sql
-- Create a table for public profiles (linked to auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  updated_at timestamp with time zone,
  avatar_url text -- NEW: Added for profile pictures
);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create messages table
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) not null,
  receiver_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  attachment jsonb
);

-- Create friend_requests table
create table public.friend_requests (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) not null,
  receiver_id uuid references public.profiles(id) not null,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(sender_id, receiver_id)
);

-- Enable Realtime for messages and requests
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table friend_requests;

-- Optional: Add Row Level Security (RLS) policies
alter table public.messages enable row level security;
alter table public.profiles enable row level security;
alter table public.friend_requests enable row level security;

-- Policy: Anyone can read profiles
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );
  
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Policy: Users can insert their own messages
create policy "Users can insert their own messages."
  on messages for insert
  with check ( auth.uid() = sender_id );

-- Policy: Users can view their own messages
create policy "Users can view their own messages."
  on messages for select
  using ( auth.uid() = sender_id or auth.uid() = receiver_id );

-- Policy: Friend Requests
create policy "Users can view their own requests."
  on friend_requests for select
  using ( auth.uid() = sender_id or auth.uid() = receiver_id );

create policy "Users can insert requests."
  on friend_requests for insert
  with check ( auth.uid() = sender_id );

create policy "Users can update their own requests."
  on friend_requests for update
  using ( auth.uid() = sender_id or auth.uid() = receiver_id );
  
create policy "Users can delete their own requests."
  on friend_requests for delete
  using ( auth.uid() = sender_id or auth.uid() = receiver_id );

-- ==========================================
-- STORAGE & ATTACHMENTS SETUP
-- ==========================================

-- 1. Create the storage bucket 'attachments'
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true);

-- 2. Create the storage bucket 'avatars'
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- 3. Policy: Allow authenticated users to upload files
create policy "Authenticated users can upload attachments"
on storage.objects for insert
with check ( bucket_id = 'attachments' and auth.role() = 'authenticated' );

create policy "Authenticated users can upload avatars"
on storage.objects for insert
with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- 4. Policy: Allow anyone to view files (since bucket is public)
create policy "Public can view attachments"
on storage.objects for select
using ( bucket_id = 'attachments' );

create policy "Public can view avatars"
on storage.objects for select
using ( bucket_id = 'avatars' );
```

---

## 3. Environment Variables

Create a `.env` file in your root (or configure in your deployment platform):

```env
# Get these from Supabase Dashboard -> Project Settings -> API
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Deployment Notes:**
1.  **Vercel/Netlify**: Add the Env Vars in the project settings.
2.  **Build Command**: `npm run build`
3.  **Output Dir**: `dist` or `build`

---

## 4. Debugging & Testing

**Manual Repro Steps:**
1.  Open the app in **Incognito Window A** (User 1) and **Incognito Window B** (User 2).
2.  Sign up both users.
3.  User 1 selects User 2 from the Sidebar.
4.  Send a text message. Verify it appears instantly on both screens.
5.  User 1 clicks the **Phone Icon** (Top Right).
6.  **Check Console**: Look for `[WebRTC] Creating RTCPeerConnection`, `[WebRTC] Sending ICE candidate`.
7.  User 2 (needs to be in the chat with User 1 currently) should see "Incoming Call..." overlay (technically auto-answers in this simplified demo code, or shows "Receiving" then connects).
8.  Verify audio is flowing (feedback loop if on same machine).

**Debugging Checklist:**
*   **Signaling fails?** Check Supabase Realtime inspector in dashboard. Ensure `room:ID` matches on both clients.
*   **ICE connection fails?** Check `chrome://webrtc-internals`. Ensure `turn:openrelay.metered.ca` is being used in the candidate pairs.
*   **Audio missing?** Ensure browser permissions were granted. Check `audioRef.current.srcObject` is set.
*   **"Auth session missing"?** Check if `SUPABASE_URL` is set correctly.