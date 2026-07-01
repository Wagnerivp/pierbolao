const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ Hardcoded for user's test case of England vs Congo[\s\S]*?awayTeam: awayTeam\n\s*\}\);\n\s*\}/m;
code = code.replace(regex, '');

const fallbackRegex = /if \(homePlayers\.length === 0 && awayPlayers\.length === 0\) \{[\s\S]*?\}\n\s*\}/m;
code = code.replace(fallbackRegex, '');

fs.writeFileSync('server.ts', code);
