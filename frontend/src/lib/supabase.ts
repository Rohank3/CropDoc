import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === "string" &&
    supabaseUrl.trim().length > 0 &&
    !supabaseUrl.includes("your-project") &&
    typeof supabaseAnonKey === "string" &&
    supabaseAnonKey.trim().length > 0 &&
    !supabaseAnonKey.includes("your-anon-key")
  );
};

// Singleton Supabase Client with graceful fallback
let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (typeof window === "undefined") {
    if (isSupabaseConfigured() && !clientInstance) {
      clientInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
          persistSession: false,
        },
      });
    }
    return clientInstance;
  }

  if (isSupabaseConfigured()) {
    if (!clientInstance) {
      clientInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    }
    return clientInstance;
  }

  return null;
};

export const supabase = getSupabaseClient();
