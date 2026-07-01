const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const targetStr = \`                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                               <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-3 border-b border-zinc-800 pb-2 flex items-center gap-2">
                                 {lineupsCache[match.id].homeTeam || match.time_casa}
                               </h4>
                               {lineupsCache[match.id].homePlayers?.map((playerName: string, idx: number) => {
                                 const goalsStr = currentPalpite.jogadores_gols?.[playerName] || "";
                                 return (
                                   <div key={\`home-\${idx}\`} className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                                      <span className="text-[11px] text-zinc-300 font-medium truncate pr-2" title={playerName}>{playerName}</span>
                                      <input type="text" inputMode="numeric" pattern="[0-9]*" disabled={isLocked || saving} value={goalsStr} onChange={(e) => handlePlayerGoalChange(match.id, playerName, e.target.value)} className="w-14 bg-zinc-900 border border-zinc-800 rounded p-1 text-center text-[11px] text-emerald-400 font-bold focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-zinc-700" placeholder="Gols" />
                                   </div>
                                 );
                               })}
                               {(!lineupsCache[match.id].homePlayers || lineupsCache[match.id].homePlayers.length === 0) && (
                                 <p className="text-xs text-zinc-500 text-center py-4">Nenhum jogador encontrado</p>
                               )}
                            </div>
                            <div className="space-y-3">
                               <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-3 border-b border-zinc-800 pb-2 flex items-center gap-2">
                                 {lineupsCache[match.id].awayTeam || match.time_visitante}
                               </h4>
                               {lineupsCache[match.id].awayPlayers?.map((playerName: string, idx: number) => {
                                 const goalsStr = currentPalpite.jogadores_gols?.[playerName] || "";
                                 return (
                                   <div key={\`away-\${idx}\`} className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                                      <span className="text-[11px] text-zinc-300 font-medium truncate pr-2" title={playerName}>{playerName}</span>
                                      <input type="text" inputMode="numeric" pattern="[0-9]*" disabled={isLocked || saving} value={goalsStr} onChange={(e) => handlePlayerGoalChange(match.id, playerName, e.target.value)} className="w-14 bg-zinc-900 border border-zinc-800 rounded p-1 text-center text-[11px] text-emerald-400 font-bold focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-zinc-700" placeholder="Gols" />
                                   </div>
                                 );
                               })}
                               {(!lineupsCache[match.id].awayPlayers || lineupsCache[match.id].awayPlayers.length === 0) && (
                                 <p className="text-xs text-zinc-500 text-center py-4">Nenhum jogador encontrado</p>
                               )}
                            </div>
                          </div>\`;

const newCode = \`                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                               <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest border-b border-zinc-800 pb-2 flex items-center gap-2">
                                 {lineupsCache[match.id].homeTeam || match.time_casa}
                               </h4>
                               
                               <div className="relative">
                                 <select
                                   disabled={isLocked || saving}
                                   className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-[11px] text-zinc-300 focus:outline-none focus:border-emerald-500/50 appearance-none"
                                   onChange={(e) => {
                                     if (e.target.value) {
                                       handlePlayerGoalChange(match.id, e.target.value, "1");
                                       e.target.value = "";
                                     }
                                   }}
                                 >
                                   <option value="">Selecione um jogador para adicionar...</option>
                                   {lineupsCache[match.id].homePlayers?.filter((p: string) => !currentPalpite.jogadores_gols?.[p]).map((playerName: string, idx: number) => (
                                     <option key={\`opt-home-\${idx}\`} value={playerName}>{playerName}</option>
                                   ))}
                                 </select>
                               </div>

                               <div className="space-y-2">
                                 {Object.entries(currentPalpite.jogadores_gols || {}).filter(([p]) => lineupsCache[match.id].homePlayers?.includes(p)).map(([playerName, goalsStr]) => (
                                   <div key={playerName} className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-lg border border-emerald-500/30">
                                      <span className="text-[11px] text-emerald-400 font-medium truncate pr-2" title={playerName}>{playerName}</span>
                                      <div className="flex items-center gap-2">
                                        <input type="text" inputMode="numeric" pattern="[0-9]*" disabled={isLocked || saving} value={goalsStr} onChange={(e) => handlePlayerGoalChange(match.id, playerName, e.target.value)} className="w-12 bg-zinc-900 border border-zinc-800 rounded p-1 text-center text-[11px] text-emerald-400 font-bold focus:outline-none focus:border-emerald-500/50 transition-colors" placeholder="Gols" />
                                        <button disabled={isLocked || saving} onClick={() => handlePlayerGoalChange(match.id, playerName, "")} className="text-zinc-500 hover:text-red-400 p-1">✕</button>
                                      </div>
                                   </div>
                                 ))}
                               </div>
                               
                               {(!lineupsCache[match.id].homePlayers || lineupsCache[match.id].homePlayers.length === 0) && (
                                 <p className="text-xs text-zinc-500 text-center py-4">Nenhum jogador encontrado</p>
                               )}
                            </div>
                            
                            <div className="space-y-4">
                               <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest border-b border-zinc-800 pb-2 flex items-center gap-2">
                                 {lineupsCache[match.id].awayTeam || match.time_visitante}
                               </h4>
                               
                               <div className="relative">
                                 <select
                                   disabled={isLocked || saving}
                                   className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-[11px] text-zinc-300 focus:outline-none focus:border-emerald-500/50 appearance-none"
                                   onChange={(e) => {
                                     if (e.target.value) {
                                       handlePlayerGoalChange(match.id, e.target.value, "1");
                                       e.target.value = "";
                                     }
                                   }}
                                 >
                                   <option value="">Selecione um jogador para adicionar...</option>
                                   {lineupsCache[match.id].awayPlayers?.filter((p: string) => !currentPalpite.jogadores_gols?.[p]).map((playerName: string, idx: number) => (
                                     <option key={\`opt-away-\${idx}\`} value={playerName}>{playerName}</option>
                                   ))}
                                 </select>
                               </div>

                               <div className="space-y-2">
                                 {Object.entries(currentPalpite.jogadores_gols || {}).filter(([p]) => lineupsCache[match.id].awayPlayers?.includes(p)).map(([playerName, goalsStr]) => (
                                   <div key={playerName} className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-lg border border-emerald-500/30">
                                      <span className="text-[11px] text-emerald-400 font-medium truncate pr-2" title={playerName}>{playerName}</span>
                                      <div className="flex items-center gap-2">
                                        <input type="text" inputMode="numeric" pattern="[0-9]*" disabled={isLocked || saving} value={goalsStr} onChange={(e) => handlePlayerGoalChange(match.id, playerName, e.target.value)} className="w-12 bg-zinc-900 border border-zinc-800 rounded p-1 text-center text-[11px] text-emerald-400 font-bold focus:outline-none focus:border-emerald-500/50 transition-colors" placeholder="Gols" />
                                        <button disabled={isLocked || saving} onClick={() => handlePlayerGoalChange(match.id, playerName, "")} className="text-zinc-500 hover:text-red-400 p-1">✕</button>
                                      </div>
                                   </div>
                                 ))}
                               </div>
                               
                               {(!lineupsCache[match.id].awayPlayers || lineupsCache[match.id].awayPlayers.length === 0) && (
                                 <p className="text-xs text-zinc-500 text-center py-4">Nenhum jogador encontrado</p>
                               )}
                            </div>
                          </div>\`;

code = code.replace(targetStr, newCode);
fs.writeFileSync('src/pages/Dashboard.tsx', code);
