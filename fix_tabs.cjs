const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

code = code.replace(
  /className="px-6 py-3 bg-zinc-900\/80 border-t border-zinc-800\/50 flex space-x-2 overflow-x-auto hide-scrollbar"/g,
  'className="px-6 py-3 bg-zinc-900/80 border-t border-zinc-800/50 flex flex-wrap gap-2"'
);

code = code.replace(
  /Tempo \/ Mata-Mata/g,
  'Tempo / Mata-Mata'
);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
