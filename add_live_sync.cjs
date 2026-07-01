const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `
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
        homeFlag: \`https://api.sofascore.app/api/v1/team/\${matchDetail.homeTeam?.id}/image\`,
        awayFlag: \`https://api.sofascore.app/api/v1/team/\${matchDetail.awayTeam?.id}/image\`
      };

      // If it finished, we update status in DB
      if (statusType === 'finished' && match.status !== 'finished') {
         await supabase.from('partidas').update({ status: 'finished' }).eq('sofascore_match_id', matchId);
      }

      // 2. Fetch statistics to compute points
      let stats;
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
      
      // Calculate volatile points using the RPC
      await supabase.rpc('calcular_pontos_partida', {
        p_match_id: matchId,
        p_home_score: homeScore,
        p_away_score: awayScore,
        p_total_gols: total_gols,
        p_ambos_marcam: ambos_marcam,
        p_primeiro_gol_time: primeiro_gol_time,
        p_cartoes_1t: cards_1t > 0 ? String(cards_1t) : "0",
        p_escanteios_1t: corners_1t > 0 ? String(corners_1t) : "0",
        p_cartoes_2t: cards_2t > 0 ? String(cards_2t) : "0",
        p_escanteios_2t: corners_2t > 0 ? String(corners_2t) : "0",
        p_vencedor_prorrogacao: "Ninguém",
        p_cartao_prorrogacao: "Ninguém",
        p_vencedor_penaltis: "Ninguém",
        p_jogadores_gols: {} // This would need incidents api to track exact goal scorers, simplifying for now
      });

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

app.get("/api/live-matches", (req, res) => {
  res.json({ success: true, matches: liveMatchesCache });
});

// ==============================================================

  app.listen(PORT, "0.0.0.0", () => {`;

code = code.replace(/app\.listen\(PORT, "0\.0\.0\.0", \(\) => \{/, replacement);

fs.writeFileSync('server.ts', code);
