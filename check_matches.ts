import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

let supabaseUrl = process.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
let supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "placeholder";
supabaseUrl = supabaseUrl.replace(/['"]/g, "").trim();
if (!supabaseUrl.startsWith("http")) supabaseUrl = `https://${supabaseUrl}`;
if (supabaseUrl.includes("/rest/v1")) supabaseUrl = supabaseUrl.split("/rest/v1")[0];
if (supabaseUrl.endsWith("/")) supabaseUrl = supabaseUrl.slice(0, -1);
supabaseKey = supabaseKey.replace(/['"]/g, "").trim();

const supabase = createClient(supabaseUrl, supabaseKey);
async function run() {
  const { data, error } = await supabase.from('partidas').select('*');
  console.log("Error:", error);
  console.log("Data:", data);
}
run();
