import { createClient } from "@supabase/supabase-js";

// Access variables dynamically from Vite's import.meta.env
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder_key";

// Sanitize URL (remove quotes, add https if missing, remove /rest/v1 path if pasted)
supabaseUrl = supabaseUrl.replace(/['"]/g, "").trim();
if (!supabaseUrl.startsWith("http")) {
  supabaseUrl = `https://${supabaseUrl}`;
}
if (supabaseUrl.includes("/rest/v1")) {
  supabaseUrl = supabaseUrl.split("/rest/v1")[0];
}
if (supabaseUrl.endsWith("/")) {
  supabaseUrl = supabaseUrl.slice(0, -1);
}

supabaseAnonKey = supabaseAnonKey.replace(/['"]/g, "").trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
  return !supabaseUrl.includes("placeholder") && !supabaseUrl.includes("YOUR_") && supabaseAnonKey !== "placeholder_key";
};
