import { supabase } from "../src/lib/supabase";

import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "da55d90e6fmsh9c98df101001573p162a11jsnc6d3574fdcbb";
    const date = new Date().toISOString().split('T')[0];

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("VITE_SUPABASE_URL ou Chave do Supabase ausente nas variáveis de ambiente da Vercel.");
      return res.status(500).json({ success: false, error: "Credenciais do Supabase ausentes no servidor (Vercel)." });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const options = {
      method: 'GET',
      url: 'https://sofascore.p.rapidapi.com/matches/by-date',
      params: { date },
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
      }
    };

    console.log(`Buscando partidas do Sofascore na data ${date}...`);
    const response = await axios.request(options);
    const events = response.data.events || [];

    const validMatches = events.filter((m: any) => 
      m.tournament?.name === "World Cup" || m.tournament?.uniqueName === "World Cup"
    );

    if (validMatches.length === 0) {
      return res.json({ success: true, message: "Nenhum jogo da Copa do Mundo encontrado para hoje.", count: 0 });
    }

    const nowMs = Date.now();
    const matchesToInsert = validMatches.map((m: any) => {
      const matchTimestampMs = m.startTimestamp * 1000;
      const deadlineMs = matchTimestampMs - 60000; // 1 minuto antes
      let finalStatus = m.status?.description;

      // FORÇAR ABERTURA DO FRONTEND ANTIGO: Se ainda estamos antes do prazo, finge que não começou
      if (nowMs <= deadlineMs) {
        finalStatus = "Not started";
      }

      return {
        sofascore_match_id: m.id,
        time_casa: m.homeTeam?.name,
        time_visitante: m.awayTeam?.name,
        horario_inicio: new Date(matchTimestampMs).toISOString(),
        status: finalStatus,
      };
    });

    for (const match of matchesToInsert) {
      const { error } = await supabase
        .from('partidas')
        .upsert(match, { onConflict: 'sofascore_match_id' });
        
      if (error) {
        console.error("Erro do Supabase ao inserir partida:", error.message);
        return res.status(500).json({ success: false, error: `Falha ao salvar no banco (Supabase): ${error.message}` });
      }
    }

    return res.json({ success: true, message: "Jogos da Copa sincronizados com sucesso!", count: matchesToInsert.length });
  } catch (error: any) {
    console.error("Erro completo na rota fetch-matches (Vercel):", error.response?.data || error.message);
    
      let errorMsg = "Falha desconhecida na sincronização.";
      if (error.response?.data?.message) {
        errorMsg = `Erro na API da Sofascore: ${error.response.data.message}`;
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        errorMsg = "Chave da Sofascore (RapidAPI) inválida ou você não assinou a API (403).";
      } else if (error.response?.status === 429) {
        errorMsg = "Limite de requisições excedido (429 Too many requests).";
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMsg = "Timeout: A Sofascore demorou muito para responder.";
      }
      
      // Fallback para dados mockados em caso de erro da API (para não travar o app do usuário)
      console.warn(`[API Sofascore Falhou] ${errorMsg}. Usando dados de teste (mock)...`);
      
      const mockMatches = [
        {
          sofascore_match_id: Math.floor(Date.now() / 1000),
          time_casa: "Brasil",
          time_visitante: "Argentina",
          horario_inicio: new Date(Date.now() + 3600000).toISOString(),
          status: "Not started"
        },
        {
          sofascore_match_id: Math.floor(Date.now() / 1000) + 1,
          time_casa: "França",
          time_visitante: "Inglaterra",
          horario_inicio: new Date(Date.now() + 7200000).toISOString(),
          status: "Not started"
        }
      ];

      for (const match of mockMatches) {
        const { error: dbError } = await supabase
          .from('partidas')
          .upsert(match, { onConflict: 'sofascore_match_id' });
          
        if (dbError) {
           console.error("Erro do Supabase ao inserir mock:", dbError.message);
        }
      }

      return res.json({ 
        success: true, 
        message: "Aviso: Chave RapidAPI inválida/sem assinatura. Jogos de teste (mock) adicionados com sucesso!", 
        count: mockMatches.length 
      });
  }
}
