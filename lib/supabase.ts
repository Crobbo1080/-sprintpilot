import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

declare global {
  var __sprintpilotSupabase: SupabaseClient | undefined;
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? globalThis.__sprintpilotSupabase ??
      (globalThis.__sprintpilotSupabase = createClient(supabaseUrl, supabaseAnonKey))
    : null;