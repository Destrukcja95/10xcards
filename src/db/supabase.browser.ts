import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. " +
      "Please add PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_KEY to your .env file. " +
      "These should have the same values as SUPABASE_URL and SUPABASE_KEY."
  );
}

/**
 * Klient Supabase dla komponentów React w przeglądarce.
 * Używa createBrowserClient z @supabase/ssr dla prawidłowej synchronizacji
 * cookies między przeglądarką a serwerem SSR.
 */
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
