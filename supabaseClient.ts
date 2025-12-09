import { createClient } from '@supabase/supabase-js';

// NOTE: In a real app, these should be in a .env file.
// For this demo generator, we assume the user provides them or placeholders.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

if (!process.env.SUPABASE_URL) {
    console.warn("Missing SUPABASE_URL environment variable. Auth will fail.");
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