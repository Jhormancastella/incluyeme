/**
 * supabase.js - Supabase client singleton
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL  = 'https://smfosjgmdsdxsdbjigks.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtZm9zamdtZHNkeHNkYmppZ2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NDMxNjcsImV4cCI6MjA5NTIxOTE2N30.OIirDUbrfjkhLDumyXxhmpvjeRqGdA8TjwaY-4K043w';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: false
  },
  global: {
    // Tolera hasta 5 minutos de diferencia de reloj
    headers: { 'x-client-info': 'te-incluye/1.0' }
  }
});
