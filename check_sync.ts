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
import axios from 'axios';

async function run() {
    const { data: matches, error } = await supabase
      .from('partidas')
      .select('sofascore_match_id, time_casa, time_visitante, horario_inicio, status')
      .neq('status', 'finished');

    const now = new Date();

    for (const match of matches) {
      const matchStart = new Date(match.horario_inicio);
      if (now < matchStart) {
        console.log(match.sofascore_match_id, "Not started yet. Now:", now, "Start:", matchStart);
        continue;
      }

      const matchId = match.sofascore_match_id;
      let matchDetail;
      if (matchId >= 9000 && matchId <= 9999) {
          const mockElapsed = Math.floor((Date.now() - new Date(match.horario_inicio).getTime()) / 60000);
          console.log("Mock elapsed:", mockElapsed);
          matchDetail = {
              homeScore: { current: 3 },
              awayScore: { current: 1 },
              status: { type: mockElapsed > 100 ? 'finished' : 'inprogress', description: mockElapsed > 100 ? 'Encerrado' : 'Ao vivo' },
              time: { currentPeriodStartTimestamp: Math.floor(Date.now()/1000) - (mockElapsed * 60) },
              homeTeam: { id: 1 },
              awayTeam: { id: 2 }
          };
      }
      console.log("Detail for", matchId, matchDetail);
    }
}
run();
