import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

export let sb = null;

export function initSupabase() {
  const { createClient } = window.supabase;
  sb = createClient(SUPABASE_URL, SUPABASE_KEY);
  return sb;
}
