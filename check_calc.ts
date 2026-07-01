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
    const { data: matchPalpites } = await supabase.from('palpites').select('*').eq('match_id', 9001);
    
    let homeScore = 3;
    let awayScore = 1;
    let total_gols = 4;
    let ambos_marcam = "Sim";
    let primeiro_gol_time = "Casa";

    for (const palpite of matchPalpites) {
          let p_gerais = 0;
          let p_1t = 0;
          let p_2t = 0;

          if (String(palpite.home) === String(homeScore) && String(palpite.away) === String(awayScore)) {
              p_gerais += 10;
          }

          if (String(palpite.total_gols) === String(total_gols)) p_gerais += 5;
          if (palpite.ambos_marcam === ambos_marcam) p_gerais += 4;
          if (palpite.primeiro_gol_time === primeiro_gol_time) p_gerais += 4;

          console.log("Calculated:", p_gerais);
    }
}
run();
