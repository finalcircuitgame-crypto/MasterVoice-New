import { createClient } from '@supabase/supabase-js';

// Safely handle environment variables to avoid "process is not defined" errors in browser
const getEnv = (key: string, fallback: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // Fallback for Vercel/Vite environments if process isn't polyfilled
  // Note: In Vite you would typically use import.meta.env
  return fallback;
};

const SUPABASE_URL = getEnv('SUPABASE_URL', 'https://ngodiqoscwojoajueenv.supabase.co');
const SUPABASE_ANON_KEY = getEnv('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nb2RpcW9zY3dvam9hanVlZW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4ODYyMjIsImV4cCI6MjA4MDQ2MjIyMn0.oaYdI4xVWO6GKynFqvuL6DAovFzEaGAP4rl2X6NZpGQ');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("Missing Supabase credentials. Auth will fail.");
}

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