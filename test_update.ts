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
    const palpite = { id: '968aa162-cb7f-440d-9108-00ef74da57ea' };
    const { data, error } = await supabase.from('palpites').update({
        pontos_gerais: 23,
        pontos_1t: 0,
        pontos_2t: 0,
        pontos_obtidos: 23
    }).eq('id', palpite.id).select('*');
    
    console.log("Error:", error);
    console.log("Data:", data);
}
run();
