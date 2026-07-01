const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

let supabaseUrl = process.env.VITE_SUPABASE_URL || "";
let supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
supabaseUrl = supabaseUrl.replace(/['"]/g, "").trim();
supabaseKey = supabaseKey.replace(/['"]/g, "").trim();

const supabase = createClient(supabaseUrl, supabaseKey);
async function run() {
  const { error } = await supabase.rpc('execute_sql', { query: 'ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS pontos_temporarios INTEGER DEFAULT 0;' });
  console.log("Error:", error);
}
run();
