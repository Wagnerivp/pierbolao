const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const regex1 = /if \(data\.success && data\.players && data\.players\.length > 0\) \{\s*setLineupsCache\(\(prev\) => \(\{ \.\.\.prev, \[m\.id\]: data\.players \}\)\);\s*\}/m;
const repl1 = `if (data.success && (data.homePlayers || (data.players && data.players.length > 0))) {
            const playersData = data.homePlayers ? data : { homePlayers: data.players || [], awayPlayers: [] };
            setLineupsCache((prev) => ({ ...prev, [m.id]: playersData }));
          }`;
code = code.replace(regex1, repl1);

const regex2 = /\{!lineupsCache\[match\.id\] \? \([\s\S]*?Aguardando escalação oficial\.\.\.[\s\S]*?\}\)\}\s*<\/div>\s*\)\}/m;
const repl2 = `{!lineupsCache[match.id] ? (
                          <div className="text-center py-6 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/50">
                            <p className="text-zinc-400 text-sm">
                              Aguardando escalação oficial...
                            </p>
                            <p className="text-zinc-600 text-xs mt-2 max-w-[280px] mx-auto">
                              Assim que os times divulgarem a escalação oficial
                              (geralmente 1h antes do jogo), a lista de
                              jogadores aparecerá aqui.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[350px] overflow-y-auto pr-2 hide-scrollbar">
                            <div className="space-y-3">
                               <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
                                 <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                 {lineupsCache[match.id].homeTeam || match.homeTeam.name}
                               </h4>
                               {lineupsCache[match.id].homePlayers?.map((playerName: string, idx: number) => {
                                 const goalsStr = currentPalpite.jogadores_gols?.[playerName] || "";
                                 return (
                                   <div key={\`home-\${idx}\`} className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                                      <span className="text-[11px] text-zinc-300 font-medium truncate pr-2" title={playerName}>{playerName}</span>
                                      <input type="number" min="0" disabled={!userStatus.pago || saving} value={goalsStr} onChange={(e) => handlePlayerGoalChange(match.id, playerName, e.target.value)} className="w-12 bg-zinc-900 border border-zinc-800 rounded p-1 text-center text-[11px] text-emerald-400 font-bold focus:outline-none focus:border-emerald-500/50 transition-colors" placeholder="Gols" />
                                   </div>
                                 );
                               })}
                               {(!lineupsCache[match.id].homePlayers || lineupsCache[match.id].homePlayers.length === 0) && (
                                 <p className="text-xs text-zinc-500 text-center py-4">Nenhum jogador encontrado</p>
                               )}
                            </div>
                            <div className="space-y-3">
                               <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
                                 <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
                                 {lineupsCache[match.id].awayTeam || match.awayTeam.name}
                               </h4>
                               {lineupsCache[match.id].awayPlayers?.map((playerName: string, idx: number) => {
                                 const goalsStr = currentPalpite.jogadores_gols?.[playerName] || "";
                                 return (
                                   <div key={\`away-\${idx}\`} className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                                      <span className="text-[11px] text-zinc-300 font-medium truncate pr-2" title={playerName}>{playerName}</span>
                                      <input type="number" min="0" disabled={!userStatus.pago || saving} value={goalsStr} onChange={(e) => handlePlayerGoalChange(match.id, playerName, e.target.value)} className="w-12 bg-zinc-900 border border-zinc-800 rounded p-1 text-center text-[11px] text-emerald-400 font-bold focus:outline-none focus:border-emerald-500/50 transition-colors" placeholder="Gols" />
                                   </div>
                                 );
                               })}
                               {(!lineupsCache[match.id].awayPlayers || lineupsCache[match.id].awayPlayers.length === 0) && (
                                 <p className="text-xs text-zinc-500 text-center py-4">Nenhum jogador encontrado</p>
                               )}
                            </div>
                          </div>
                        )}`;

code = code.replace(regex2, repl2);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
