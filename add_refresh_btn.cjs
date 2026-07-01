const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const targetHeader = \`<span>Lista de Jogadores</span>
                          <span className="text-zinc-500 text-[9px]">
                            +10 pts acerto | -5 pts erro
                          </span>\`;

const newHeader = \`<div className="flex items-center gap-2">
                            <span>Lista de Jogadores</span>
                            <button
                              onClick={() => refreshLineup(match.id)}
                              disabled={refreshingLineup[match.id]}
                              className="bg-zinc-800 text-zinc-400 p-1 rounded hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                              title="Atualizar Escalação Ao Vivo"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={\`\${refreshingLineup[match.id] ? 'animate-spin' : ''}\`}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
                            </button>
                          </div>
                          <span className="text-zinc-500 text-[9px]">
                            +10 pts acerto | -5 pts erro
                          </span>\`;

code = code.replace(targetHeader, newHeader);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
