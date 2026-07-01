const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

let supabaseUrl = process.env.VITE_SUPABASE_URL || "https://buhssnvylyqoxqfegohb.supabase.co";
let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhb...bla";

const supabase = createClient(supabaseUrl, supabaseKey);
async function run() {
  const { data, error } = await supabase.from('usuarios').select('*').limit(1);
  console.log("Cols:", data ? Object.keys(data[0] || {}) : error);
}
run();
