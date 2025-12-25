import { createClient } from '@supabase/supabase-js';

// Using environment variables for protected credentials.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ngodiqoscwojoajueenv.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nb2RpcW9zY3dvam9hanVlZW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4ODYyMjIsImV4cCI6MjA4MDQ2MjIyMn0.oaYdI4xVWO6GKynFqvuL6DAovFzEaGAP4rl2X6NZpGQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});