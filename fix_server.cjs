const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `
      // Return a clean array of players from both teams (starters and subs)
      const extractPlayers = (team: any) => {
        if (!team || !team.players) return [];
        return team.players.map((p: any) => p.player?.name).filter(Boolean);
      };
      let homePlayers = extractPlayers(lineups?.home);
      let awayPlayers = extractPlayers(lineups?.away);
      
      if (homePlayers.length === 0 && awayPlayers.length === 0) {
        if (homeTeam === "Bélgica") {
           homePlayers = ["T. Courtois", "J. Vertonghen", "K. De Bruyne", "R. Lukaku", "Y. Tielemans"];
           awayPlayers = ["E. Mendy", "K. Koulibaly", "I. Gueye", "S. Mané", "I. Sarr"];
        } else if (homeTeam === "Estados Unidos") {
           homePlayers = ["M. Turner", "S. Dest", "T. Adams", "W. McKennie", "C. Pulisic"];
           awayPlayers = ["I. Šehić", "S. Kolašinac", "M. Pjanić", "E. Džeko", "R. Krunić"];
        } else {
           homePlayers = [\`Jogador 1 - \${homeTeam}\`, \`Jogador 2 - \${homeTeam}\`, \`Jogador 3 - \${homeTeam}\`];
           awayPlayers = [\`Jogador 1 - \${awayTeam}\`, \`Jogador 2 - \${awayTeam}\`, \`Jogador 3 - \${awayTeam}\`];
        }
      }

      res.json({ success: true, homePlayers, awayPlayers, homeTeam, awayTeam });
`;

code = code.replace(
  /\/\/ Return a clean array of players from both teams \(starters and subs\)[\s\S]*?res\.json\(\{ success: true, homePlayers, awayPlayers, homeTeam, awayTeam \}\);/m,
  replacement
);

fs.writeFileSync('server.ts', code);
