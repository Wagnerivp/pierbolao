const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

let supabaseUrl = process.env.VITE_SUPABASE_URL || "";
let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";
supabaseUrl = supabaseUrl.replace(/['"]/g, "").trim();
supabaseKey = supabaseKey.replace(/['"]/g, "").trim();
if (supabaseUrl.includes("/rest/v1")) supabaseUrl = supabaseUrl.split("/rest/v1")[0];
if (supabaseUrl.endsWith("/")) supabaseUrl = supabaseUrl.slice(0, -1);

const supabase = createClient(supabaseUrl, supabaseKey);
async function run() {
  const { error } = await supabase.rpc('calcular_pontos_partida', {
        p_match_id: 11352468,
        p_home_score: 0,
        p_away_score: 0,
        p_total_gols: 0,
        p_ambos_marcam: "Não",
        p_primeiro_gol_time: "Ninguém",
        p_cartoes_1t: "0",
        p_escanteios_1t: "0",
        p_cartoes_2t: "0",
        p_escanteios_2t: "0",
        p_vencedor_prorrogacao: "Ninguém",
        p_cartao_prorrogacao: "Ninguém",
        p_vencedor_penaltis: "Ninguém",
        p_jogadores_gols: {}
      });
  console.log("RPC Error:", error);
}
run();
