import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

let supabaseUrl = process.env.VITE_SUPABASE_URL || "";
let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";
supabaseUrl = supabaseUrl.replace(/['"]/g, "").trim();
supabaseKey = supabaseKey.replace(/['"]/g, "").trim();
if (supabaseUrl.includes("/rest/v1")) supabaseUrl = supabaseUrl.split("/rest/v1")[0];
if (supabaseUrl.endsWith("/")) supabaseUrl = supabaseUrl.slice(0, -1);

const supabase = createClient(supabaseUrl, supabaseKey);
async function run() {
  const { data: p } = await supabase.from('partidas').select('*').limit(1);
  console.log("Partidas:", p && p.length > 0 ? Object.keys(p[0]) : p);
  const { data: b } = await supabase.from('palpites').select('*').limit(1);
  console.log("Palpites:", b && b.length > 0 ? Object.keys(b[0]) : b);
}
run();
