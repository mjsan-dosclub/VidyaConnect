import { createClient, SupabaseClient } from '@supabase/supabase-js';
let client: SupabaseClient | undefined;
export function browserDB() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key)
    throw new Error(
      'Supabase is not configured. Add the environment variables to enable manager sign-in.',
    );
  return (client ??= createClient(url, key));
}
