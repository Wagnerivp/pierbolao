import express from "express";
import path from "path";
import axios from "axios";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

let supabaseUrl = process.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
let supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "placeholder";

supabaseUrl = supabaseUrl.replace(/['"]/g, "").trim();
if (!supabaseUrl.startsWith("http")) supabaseUrl = `https://${supabaseUrl}`;
if (supabaseUrl.includes("/rest/v1")) supabaseUrl = supabaseUrl.split("/rest/v1")[0];
if (supabaseUrl.endsWith("/")) supabaseUrl = supabaseUrl.slice(0, -1);
supabaseKey = supabaseKey.replace(/['"]/g, "").trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/fetch-matches", async (req, res) => {
    try {
      const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "da55d90e6fmsh9c98df101001573p162a11jsnc6d3574fdcbb";
      const date = new Date().toISOString().split('T')[0]; // Current date

      if (!process.env.VITE_SUPABASE_URL || !(process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY)) {
         console.error("VITE_SUPABASE_URL ou Chave do Supabase ausente nas variáveis de ambiente.");
         return res.status(500).json({ success: false, error: "Credenciais do Supabase ausentes no servidor." });
      }

      const options = {
        method: 'GET',
        url: 'https://sofascore.p.rapidapi.com/matches/by-date', // Solicitado pelo usuário
        params: { date },
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
        }
      };

      console.log(`Buscando partidas do Sofascore na data ${date}...`);
      const response = await axios.request(options);
      let events = response.data.events || [];

      // FILTRO OBRIGATÓRIO: APENAS Copa do Mundo (World Cup)
      const validMatches = events.filter((m: any) => 
        m.tournament?.name === "World Cup" || m.tournament?.uniqueName === "World Cup"
      );

      if (validMatches.length === 0) {
        return res.json({ success: true, message: "Nenhum jogo da Copa do Mundo encontrado para hoje.", count: 0 });
      }

      // Save to Supabase
      const nowMs = Date.now();
      const matchesToInsert = validMatches.map((m: any) => {
        const matchTimestampMs = m.startTimestamp * 1000;
        const deadlineMs = matchTimestampMs - 60000;
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

      res.json({ success: true, message: "Jogos da Copa sincronizados com sucesso!", count: matchesToInsert.length });
    } catch (error: any) {
      console.error("Erro completo na rota fetch-matches:", error.response?.data || error.message);
      
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

      res.json({ 
        success: true, 
        message: "Aviso: Chave RapidAPI inválida/sem assinatura. Jogos de teste (mock) adicionados com sucesso!", 
        count: mockMatches.length 
      });
    }
  });

  app.post("/api/admin/approve-user", async (req, res) => {
    try {
      const { user_id } = req.body;
      if (!user_id) {
        return res.status(400).json({ success: false, error: "ID do usuário não fornecido." });
      }

      if (!process.env.VITE_SUPABASE_URL || !(process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY)) {
         console.error("VITE_SUPABASE_URL ou Chave do Supabase ausente.");
         return res.status(500).json({ success: false, error: "Credenciais do Supabase ausentes no servidor." });
      }

      const { error } = await supabase
        .from('usuarios')
        .update({ is_approved: true, pago: true, comprovante_enviado: true })
        .eq('id', user_id);

      if (error) {
        console.error("Erro no Supabase ao aprovar usuário:", error.message);
        return res.status(500).json({ success: false, error: `Falha no banco de dados (Supabase): ${error.message}` });
      }

      res.json({ success: true, message: "Usuário liberado com sucesso!" });
    } catch (error: any) {
      console.error("Erro inesperado na rota approve-user:", error.message);
      res.status(500).json({ success: false, error: "Falha interna no servidor ao liberar usuário." });
    }
  });

  app.get("/api/fetch-lineups", async (req, res) => {
    let homeTeam = "";
    let awayTeam = "";
    try {
      const { match_id } = req.query;
      if (!match_id) return res.status(400).json({ success: false, error: "match_id required" });

      
      try {
        const { data: matchData } = await supabase
          .from('partidas')
          .select('time_casa, time_visitante')
          .eq('sofascore_match_id', match_id)
          .single();
          
        if (matchData) {
          homeTeam = matchData.time_casa;
          awayTeam = matchData.time_visitante;
        }
      } catch (e) {
        console.error("Erro ao buscar detalhes da partida no DB:", e);
      }

      

      const RAPIDAPI_KEY = "3dd5119643msh5fd4694fc97b882p17f897jsnd406196f787f";
      
      const options = {
        method: 'GET',
        url: 'https://sofascore.p.rapidapi.com/matches/get-lineups',
        params: { matchId: match_id },
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
        }
      };
      const response = await axios.request(options);
      const lineups = response.data;
      
      
      // Return a clean array of players from both teams (starters and subs)
      const extractPlayers = (team: any) => {
        if (!team || !team.players) return [];
        return team.players.map((p: any) => p.player?.name).filter(Boolean);
      };
      let homePlayers = extractPlayers(lineups?.home);
      let awayPlayers = extractPlayers(lineups?.away);
      
      

      res.json({ success: true, homePlayers, awayPlayers, homeTeam, awayTeam });

    } catch (error) {
      console.error("Sync lineups error:", error.message);
      
      if (homeTeam && awayTeam) {
         res.json({ success: true, homePlayers: [`Jogador 1 - ${homeTeam}`, `Jogador 2 - ${homeTeam}`], awayPlayers: [`Jogador 1 - ${awayTeam}`, `Jogador 2 - ${awayTeam}`], homeTeam, awayTeam });
      } else {
         res.status(500).json({ success: false, error: "Failed to fetch lineups" });
      }
    }
  });

  // Vite middleware for development
  app.get("/api/live-matches", async (req, res) => {
  const userId = req.query.user_id;
  let userBreakdown = { pontos_1t: 0, pontos_2t: 0, pontos_gerais: 0 };
  
  if (userId) {
    const { data: palpites } = await supabase.from('palpites').select('pontos_1t, pontos_2t, pontos_gerais').eq('user_id', userId);
    if (palpites) {
       for (const p of palpites) {
           userBreakdown.pontos_1t += (p.pontos_1t || 0);
           userBreakdown.pontos_2t += (p.pontos_2t || 0);
           userBreakdown.pontos_gerais += (p.pontos_gerais || 0);
       }
    }
  }

  res.json({ success: true, matches: liveMatchesCache, breakdown: userBreakdown });
});

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  
// ================= LIVE TRACKING SYNC =================
let liveMatchesCache = {}; // { matchId: { homeScore, awayScore, time, status, homeFlag, awayFlag } }

async function syncLiveData() {
  try {
    const { data: matches, error } = await supabase
      .from('partidas')
      .select('sofascore_match_id, time_casa, time_visitante, horario_inicio, status')
      .neq('status', 'finished');
    
    if (error || !matches) return;

    const RAPIDAPI_KEY = "3dd5119643msh5fd4694fc97b882p17f897jsnd406196f787f";
    const now = new Date();

    for (const match of matches) {
      const matchStart = new Date(match.horario_inicio);
      if (now < matchStart) continue; // Not started yet

      const matchId = match.sofascore_match_id;

      // 1. Fetch match detail
      let matchDetail;
      if (matchId >= 9000 && matchId <= 9999) {
          // MOCK DATA for fake matches
          const mockElapsed = Math.floor((Date.now() - new Date(match.horario_inicio).getTime()) / 60000);
          matchDetail = {
              homeScore: { current: 3 },
              awayScore: { current: 1 },
              status: { type: mockElapsed > 100 ? 'finished' : 'inprogress', description: mockElapsed > 100 ? 'Encerrado' : 'Ao vivo' },
              time: { currentPeriodStartTimestamp: Math.floor(Date.now()/1000) - (mockElapsed * 60) },
              homeTeam: { id: 1 },
              awayTeam: { id: 2 }
          };
      } else {
        try {
          const resDetail = await axios.get('https://sofascore.p.rapidapi.com/matches/detail', {
            params: { matchId },
            headers: {
              'X-RapidAPI-Key': RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
            }
          });
          matchDetail = resDetail.data.event;
        } catch (e) {
          console.error("Error fetching detail for", matchId, e.response?.status);
          continue;
        }
      }

      if (!matchDetail) continue;

      const homeScore = matchDetail.homeScore?.current || 0;
      const awayScore = matchDetail.awayScore?.current || 0;
      const statusType = matchDetail.status?.type; // 'inprogress', 'finished'
      const liveTime = matchDetail.time?.currentPeriodStartTimestamp 
        ? Math.floor((Date.now() / 1000 - matchDetail.time.currentPeriodStartTimestamp) / 60)
        : matchDetail.status?.description || 'Ao vivo';

      liveMatchesCache[matchId] = {
        homeScore,
        awayScore,
        time: liveTime,
        status: statusType,
        homeFlag: `https://api.sofascore.app/api/v1/team/${matchDetail.homeTeam?.id}/image`,
        awayFlag: `https://api.sofascore.app/api/v1/team/${matchDetail.awayTeam?.id}/image`
      };

      // If it finished, we update status in DB
      if (statusType === 'finished' && match.status !== 'finished') {
         await supabase.from('partidas').update({ status: 'finished' }).eq('sofascore_match_id', matchId);
      }

      // 2. Fetch statistics to compute points
      let stats;
      if (matchId >= 9000 && matchId <= 9999) {
          stats = [
            { period: '1ST', groups: [{ statisticsItems: [{name: 'Corner kicks', homeValue: 2, awayValue: 3}, {name: 'Yellow cards', homeValue: 1, awayValue: 1}] }] },
            { period: '2ND', groups: [{ statisticsItems: [{name: 'Corner kicks', homeValue: 4, awayValue: 2}, {name: 'Yellow cards', homeValue: 2, awayValue: 0}] }] }
          ];
      } else {
        try {
          const resStats = await axios.get('https://sofascore.p.rapidapi.com/matches/get-statistics', {
            params: { matchId },
            headers: {
              'X-RapidAPI-Key': RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
            }
          });
          stats = resStats.data.statistics;
        } catch (e) {
          console.error("Error fetching stats for", matchId);
        }
      }

      let corners_1t = 0, corners_2t = 0;
      let cards_1t = 0, cards_2t = 0;
      
      if (stats && Array.isArray(stats)) {
        const firstHalf = stats.find(s => s.period === '1ST');
        const secondHalf = stats.find(s => s.period === '2ND');
        if (firstHalf) {
             firstHalf.groups.forEach(g => {
                 g.statisticsItems.forEach(item => {
                     if (item.name === 'Corner kicks') corners_1t = parseInt(item.homeValue || 0) + parseInt(item.awayValue || 0);
                     if (item.name === 'Yellow cards') cards_1t += parseInt(item.homeValue || 0) + parseInt(item.awayValue || 0);
                     if (item.name === 'Red cards') cards_1t += parseInt(item.homeValue || 0) + parseInt(item.awayValue || 0);
                 });
             });
        }
        if (secondHalf) {
             secondHalf.groups.forEach(g => {
                 g.statisticsItems.forEach(item => {
                     if (item.name === 'Corner kicks') corners_2t = parseInt(item.homeValue || 0) + parseInt(item.awayValue || 0);
                     if (item.name === 'Yellow cards') cards_2t += parseInt(item.homeValue || 0) + parseInt(item.awayValue || 0);
                     if (item.name === 'Red cards') cards_2t += parseInt(item.homeValue || 0) + parseInt(item.awayValue || 0);
                 });
             });
        }
      }

      const total_gols = homeScore + awayScore;
      const ambos_marcam = (homeScore > 0 && awayScore > 0) ? 'Sim' : 'Não';
      const primeiro_gol_time = homeScore > 0 ? (awayScore === 0 ? match.time_casa : "Indefinido (Lógica Simplificada)") : (awayScore > 0 ? match.time_visitante : "Ninguém");
      
      // Calculate non-volatile accumulative points directly
      const { data: matchPalpites } = await supabase.from('palpites').select('*').eq('match_id', matchId);
      
      if (matchPalpites) {
        for (const palpite of matchPalpites) {
          let p_gerais = 0;
          let p_1t = 0;
          let p_2t = 0;

          // Placar Exato: 10 pontos
          if (String(palpite.home) === String(homeScore) && String(palpite.away) === String(awayScore)) {
              p_gerais += 10;
          } else if ((Number(palpite.home) > Number(palpite.away) && homeScore > awayScore) || 
                     (Number(palpite.home) < Number(palpite.away) && homeScore < awayScore) ||
                     (Number(palpite.home) === Number(palpite.away) && homeScore === awayScore && palpite.home !== null && palpite.home !== "")) {
              p_gerais += 5; // Acertou o Vencedor ou Empate
          }

          if (String(palpite.total_gols) === String(total_gols)) p_gerais += 5;
          if (palpite.ambos_marcam === ambos_marcam) p_gerais += 4;
          
          const primeiroGolCorreto = homeScore > 0 ? (awayScore === 0 ? "Casa" : "Casa") : (awayScore > 0 ? "Visitante" : "Ninguém");
          // in server.ts we currently use time_casa or time_visitante, but in DB the palpites usually save "Casa" or "Visitante"
          if (palpite.primeiro_gol_time === primeiroGolCorreto || palpite.primeiro_gol_time === match.time_casa || palpite.primeiro_gol_time === match.time_visitante) p_gerais += 4;

          const checkRange = (val, rangeStr) => {
              if (rangeStr === "0-2") return val >= 0 && val <= 2;
              if (rangeStr === "3-4") return val >= 3 && val <= 4;
              if (rangeStr === "5+") return val >= 5;
              if (rangeStr === "<5") return val < 5;
              if (rangeStr === "5-7") return val >= 5 && val <= 7;
              if (rangeStr === "8+") return val >= 8;
              return String(val) === String(rangeStr);
          };

          // 1º Tempo
          let current_p_1t = 0;
          if (palpite.cartoes_1t && checkRange(cards_1t, palpite.cartoes_1t)) current_p_1t += 2;
          if (palpite.escanteios_1t && checkRange(corners_1t, palpite.escanteios_1t)) current_p_1t += 2;
          p_1t = Math.max(palpite.pontos_1t || 0, current_p_1t);

          // 2º Tempo
          let current_p_2t = 0;
          if (palpite.cartoes_2t && checkRange(cards_2t, palpite.cartoes_2t)) current_p_2t += 2;
          if (palpite.escanteios_2t && checkRange(corners_2t, palpite.escanteios_2t)) current_p_2t += 2;
          p_2t = Math.max(palpite.pontos_2t || 0, current_p_2t);

          const pontos_obtidos = p_gerais + p_1t + p_2t;

          // Atualiza as colunas de evolução
          await supabase.from('palpites').update({
              pontos_gerais: p_gerais,
              pontos_1t: p_1t,
              pontos_2t: p_2t
          }).eq('id', palpite.id);
        }

        // Atualizar pontos_totais de todos os usuários
        const { data: allPalpites } = await supabase.from('palpites').select('user_id, pontos_gerais, pontos_1t, pontos_2t');
        if (allPalpites) {
            const userPoints: Record<string, number> = {};
            for (const p of allPalpites) {
                const soma = (p.pontos_gerais || 0) + (p.pontos_1t || 0) + (p.pontos_2t || 0);
                userPoints[p.user_id] = (userPoints[p.user_id] || 0) + soma;
            }
            for (const [userId, total] of Object.entries(userPoints)) {
                await supabase.from('usuarios').update({ pontos_totais: total }).eq('id', userId);
            }
        }
      }

    }
  } catch (e) {
    console.error("Live sync error", e);
  }
}

// Start the live sync interval (every 60 seconds)
if (process.env.NODE_ENV !== "production" || process.env.NODE_ENV === "production") {
  setInterval(syncLiveData, 60000);
  setTimeout(syncLiveData, 5000); // initial run
}

app.get("/api/live-matches", async (req, res) => {
  const userId = req.query.user_id as string;
  let userBreakdown = { pontos_1t: 0, pontos_2t: 0, pontos_gerais: 0 };
  
  if (userId) {
    const { data: palpites } = await supabase.from('palpites').select('pontos_1t, pontos_2t, pontos_gerais').eq('user_id', userId);
    if (palpites) {
       for (const p of palpites) {
           userBreakdown.pontos_1t += (p.pontos_1t || 0);
           userBreakdown.pontos_2t += (p.pontos_2t || 0);
           userBreakdown.pontos_gerais += (p.pontos_gerais || 0);
       }
    }
  }

  res.json({ success: true, matches: liveMatchesCache, breakdown: userBreakdown });
});

// ==============================================================

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
