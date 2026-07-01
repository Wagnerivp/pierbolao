const fs = require('fs');

// Fix api/fetch-lineups.ts
let codeApi = fs.readFileSync('api/fetch-lineups.ts', 'utf8');

const regex1Api = /if \(homeTeam\.includes\("Inglaterra"\) \|\| homeTeam\.includes\("England"\)\) \{[\s\S]*?\] \}\);/m;
const repl1Api = `if (homeTeam.includes("Inglaterra") || homeTeam.includes("England")) {
      return res.json({ success: true, 
        homePlayers: ["J. Pickford", "E. Konsa", "M. Guéhi", "A. Wan-Bissaka", "D. Rice", "J. Bellingham", "H. Kane", "N. O'Reilly", "M. Rashford", "N. Madueke"],
        awayPlayers: ["L. Mpasi Nzau", "C. Mbemba", "A. Tuanzebe", "A. Masuaku", "S. Moutoussamy", "N. Mukau", "Y. Wissa", "N. Mbuku", "B. Cipenga", "N. Sadiki"],
        homeTeam: homeTeam,
        awayTeam: awayTeam
      });`;
codeApi = codeApi.replace(regex1Api, repl1Api);

const regex2Api = /const allPlayers = \[\.\.\.homePlayers, \.\.\.awayPlayers\];\s*return res\.json\(\{ success: true, players: allPlayers \}\);/m;
const repl2Api = `return res.json({ success: true, homePlayers, awayPlayers, homeTeam, awayTeam });`;
codeApi = codeApi.replace(regex2Api, repl2Api);

const regex3Api = /return res\.json\(\{ success: true, players: \[\`Jogador 1\`, \`Jogador 2\`, \`Jogador 3\`, \`Jogador 4\`\]\}\);/m;
const repl3Api = `return res.json({ success: true, homePlayers: ["Jogador 1", "Jogador 2"], awayPlayers: ["Jogador 1", "Jogador 2"], homeTeam: homeTeam || "Time Casa", awayTeam: awayTeam || "Time Visitante" });`;
codeApi = codeApi.replace(regex3Api, repl3Api);

fs.writeFileSync('api/fetch-lineups.ts', codeApi);

// Fix server.ts (if fetch-lineups exists there)
let codeServer = fs.readFileSync('server.ts', 'utf8');

const regex1Server = /if \(homeTeam\.includes\("Inglaterra"\) \|\| homeTeam\.includes\("England"\)\) \{[\s\S]*?\] \}\);/m;
codeServer = codeServer.replace(regex1Server, repl1Api);

const regex2Server = /const allPlayers = \[\.\.\.homePlayers, \.\.\.awayPlayers\];\s*res\.json\(\{ success: true, players: allPlayers \}\);/m;
const repl2Server = `res.json({ success: true, homePlayers, awayPlayers, homeTeam, awayTeam });`;
codeServer = codeServer.replace(regex2Server, repl2Server);

const regex3Server = /res\.json\(\{ success: true, players: \[\`Jogador 1 - \$\{homeTeam\}\`, \`Jogador 2 - \$\{homeTeam\}\`, \`Jogador 1 - \$\{awayTeam\}\`, \`Jogador 2 - \$\{awayTeam\}\`\]\}\);/m;
const repl3Server = `res.json({ success: true, homePlayers: [\`Jogador 1 - \${homeTeam}\`, \`Jogador 2 - \${homeTeam}\`], awayPlayers: [\`Jogador 1 - \${awayTeam}\`, \`Jogador 2 - \${awayTeam}\`], homeTeam, awayTeam });`;
codeServer = codeServer.replace(regex3Server, repl3Server);

fs.writeFileSync('server.ts', codeServer);
