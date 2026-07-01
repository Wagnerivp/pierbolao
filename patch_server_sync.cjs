const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace the calculate points RPC call with Node.js logic
const rpcLogic = `// Calculate volatile points using the RPC
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
      });`;

const nodeLogic = `// Calculate non-volatile accumulative points directly
      const { data: matchPalpites } = await supabase.from('palpites').select('*').eq('match_id', match.id);
      
      if (matchPalpites) {
        for (const palpite of matchPalpites) {
          let p_gerais = 0;
          let p_1t = 0;
          let p_2t = 0;

          // Placar Exato: 10 pontos
          if (palpite.home === homeScore && palpite.away === awayScore) {
              p_gerais += 10;
          } else if ((palpite.home > palpite.away && homeScore > awayScore) || 
                     (palpite.home < palpite.away && homeScore < awayScore) ||
                     (palpite.home === palpite.away && homeScore === awayScore)) {
              p_gerais += 5; // Acertou o Vencedor ou Empate
          }

          if (palpite.total_gols !== null && palpite.total_gols === total_gols) p_gerais += 5;
          if (palpite.ambos_marcam && palpite.ambos_marcam === ambos_marcam) p_gerais += 4;
          if (palpite.primeiro_gol_time && palpite.primeiro_gol_time === primeiro_gol_time) p_gerais += 4;

          // 1º Tempo
          if (palpite.cartoes_1t && palpite.cartoes_1t === String(cards_1t)) p_1t += 2;
          if (palpite.escanteios_1t && palpite.escanteios_1t === String(corners_1t)) p_1t += 2;

          // 2º Tempo
          if (palpite.cartoes_2t && palpite.cartoes_2t === String(cards_2t)) p_2t += 2;
          if (palpite.escanteios_2t && palpite.escanteios_2t === String(corners_2t)) p_2t += 2;

          const pontos_obtidos = p_gerais + p_1t + p_2t;

          // Atualiza as colunas de evolução (Pode falhar se o usuário não rodou o SQL ainda, tratamos com fallback)
          const { error: updateErr } = await supabase.from('palpites').update({
              pontos_gerais: p_gerais,
              pontos_1t: p_1t,
              pontos_2t: p_2t,
              pontos_obtidos: pontos_obtidos
          }).eq('id', palpite.id);

          if (updateErr) {
              // Fallback se as colunas pontos_1t, pontos_2t, pontos_gerais ainda não existirem
              await supabase.from('palpites').update({
                  pontos_obtidos: pontos_obtidos
              }).eq('id', palpite.id);
          }
        }

        // Atualizar pontos_totais de todos os usuários
        const { data: allPalpites } = await supabase.from('palpites').select('user_id, pontos_obtidos');
        if (allPalpites) {
            const userPoints = {};
            for (const p of allPalpites) {
                userPoints[p.user_id] = (userPoints[p.user_id] || 0) + (p.pontos_obtidos || 0);
            }
            for (const [userId, total] of Object.entries(userPoints)) {
                await supabase.from('usuarios').update({ pontos_totais: total }).eq('id', userId);
            }
        }
      }`;

code = code.replace(rpcLogic, nodeLogic);

const oldEndpoint = `app.get("/api/live-matches", (req, res) => {
  res.json({ success: true, matches: liveMatchesCache });
});`;

const newEndpoint = `app.get("/api/live-matches", async (req, res) => {
  const userId = req.query.user_id;
  let userBreakdown = { pontos_1t: 0, pontos_2t: 0, pontos_gerais: 0 };
  
  if (userId) {
    const { data: palpites } = await supabase.from('palpites').select('pontos_1t, pontos_2t, pontos_gerais').eq('user_id', userId);
    if (palpites && !palpites.error) {
       for (const p of palpites) {
           userBreakdown.pontos_1t += (p.pontos_1t || 0);
           userBreakdown.pontos_2t += (p.pontos_2t || 0);
           userBreakdown.pontos_gerais += (p.pontos_gerais || 0);
       }
    }
  }

  res.json({ success: true, matches: liveMatchesCache, breakdown: userBreakdown });
});`;

code = code.replace(oldEndpoint, newEndpoint);

fs.writeFileSync('server.ts', code);
