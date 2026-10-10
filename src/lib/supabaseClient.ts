import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createMockSupabase } from "./mockSupabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

/** מצב דמו (VITE_DEMO=true): נתונים לדוגמה בזיכרון, בלי שרת */
export const isDemoMode = import.meta.env.VITE_DEMO === "true";

export const isSupabaseConfigured =
  isDemoMode || Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isDemoMode
  ? (createMockSupabase() as unknown as SupabaseClient)
  : isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;
