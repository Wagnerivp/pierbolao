import React, { useEffect, useState } from 'react';
import { Shield, Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Lineups() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [lineups, setLineups] = useState<any | null>(null);
  const [loadingLineups, setLoadingLineups] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const res = await fetch("/api/matches");
      const data = await res.json();
      if (data.success && data.events) {
        setMatches(data.events || []);
      } else {
        setMatches([]);
      }
    } catch (err: any) {
      console.error("Erro escalações:", err);
      toast.error(`Erro: ${err?.message || "ao carregar jogos"}`);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleSelectMatch = async (match: any) => {
    setSelectedMatch(match);
    setLineups(null);
    setLoadingLineups(true);
    try {
      const res = await fetch(`/api/lineups?matchId=${match.id}`);
      const data = await res.json();
      if (data.success && data.lineups) {
        setLineups(data.lineups);
      } else {
        toast.error("Escalações ainda não disponíveis para este jogo");
      }
    } catch (err) {
      toast.error("Erro ao carregar escalações");
    } finally {
      setLoadingLineups(false);
    }
  };

  const renderPlayer = (p: any, i: number) => (
    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400">
        {p.player.jerseyNumber || '-'}
      </div>
      <span className="text-sm text-zinc-300 font-medium">{p.player.name}</span>
    </div>
  );

  return (
    <div className="pb-24">
      <header className="px-6 py-8 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Escalações Ao Vivo</h1>
        <p className="text-sm text-zinc-400">
          As escalações oficiais costumam ser liberadas 1 hora antes do início da partida.
        </p>
      </header>

      <div className="px-6 space-y-6">
        {!selectedMatch ? (
          <div>
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">Selecione um Jogo</h2>
            {loadingMatches ? (
              <div className="flex justify-center p-8"><span className="animate-pulse text-zinc-500">Carregando...</span></div>
            ) : (
              <div className="space-y-4">
                {matches.map(m => (
                  <div key={m.id} onClick={() => handleSelectMatch(m)} className="bg-[#111113] border border-zinc-800/50 rounded-2xl p-4 cursor-pointer hover:border-emerald-500/30 transition-colors">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-zinc-500" /> {m.homeTeam.name}</div>
                      <span className="text-zinc-600">vs</span>
                      <div className="flex items-center gap-2">{m.awayTeam.name} <Shield className="w-4 h-4 text-zinc-500" /></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <button onClick={() => setSelectedMatch(null)} className="text-sm text-emerald-400 font-medium hover:text-emerald-300 transition-colors">
              &larr; Voltar aos jogos
            </button>
            
            <div className="bg-[#111113] border border-zinc-800/50 rounded-2xl p-4 text-center">
              <h2 className="text-lg font-bold text-white">{selectedMatch.homeTeam.name} vs {selectedMatch.awayTeam.name}</h2>
            </div>

            {loadingLineups ? (
               <div className="flex justify-center p-8"><span className="animate-pulse text-zinc-500">Buscando escalações...</span></div>
            ) : lineups ? (
              <div className="grid grid-cols-2 gap-4">
                {/* Home Team */}
                <div className="space-y-4">
                  <h3 className="font-bold text-emerald-400 flex items-center justify-center gap-2 border-b border-zinc-800 pb-2">
                    {selectedMatch.homeTeam.nameCode || selectedMatch.homeTeam.name}
                  </h3>
                  
                  <div>
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Titulares</h4>
                    <div className="space-y-2">
                      {lineups.home?.players?.filter((p: any) => !p.substitute).map(renderPlayer)}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 mt-4">Reservas</h4>
                    <div className="space-y-2">
                      {lineups.home?.players?.filter((p: any) => p.substitute).map(renderPlayer)}
                    </div>
                  </div>

                  {lineups.home?.manager && (
                    <div className="mt-4 p-3 bg-zinc-900/30 rounded-xl border border-zinc-800/50 text-center">
                      <span className="text-[10px] text-zinc-500 block uppercase mb-1">Técnico</span>
                      <span className="text-sm text-zinc-300 font-medium">{lineups.home.manager.name}</span>
                    </div>
                  )}
                </div>

                {/* Away Team */}
                <div className="space-y-4">
                  <h3 className="font-bold text-emerald-400 flex items-center justify-center gap-2 border-b border-zinc-800 pb-2">
                    {selectedMatch.awayTeam.nameCode || selectedMatch.awayTeam.name}
                  </h3>
                  
                  <div>
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Titulares</h4>
                    <div className="space-y-2">
                      {lineups.away?.players?.filter((p: any) => !p.substitute).map(renderPlayer)}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 mt-4">Reservas</h4>
                    <div className="space-y-2">
                      {lineups.away?.players?.filter((p: any) => p.substitute).map(renderPlayer)}
                    </div>
                  </div>

                  {lineups.away?.manager && (
                    <div className="mt-4 p-3 bg-zinc-900/30 rounded-xl border border-zinc-800/50 text-center">
                      <span className="text-[10px] text-zinc-500 block uppercase mb-1">Técnico</span>
                      <span className="text-sm text-zinc-300 font-medium">{lineups.away.manager.name}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-zinc-500">
                Escalações não disponíveis.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
