import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Activity, Target } from "lucide-react";

export default function MeusPalpites() {
  const { user } = useAuth();
  const [palpites, setPalpites] = useState<any[]>([]);
  const [liveMatches, setLiveMatches] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await fetch(`/api/live-matches?user_id=${user?.id || ""}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.matches) {
            setLiveMatches(data.matches);
          }
        }
      } catch (e) {}
    };
    fetchLive();
    const interval = setInterval(fetchLive, 10000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const fetchPalpites = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("palpites")
          .select("*, partidas(*)")
          .eq("user_id", user.id);
        
        if (data) {
          setPalpites(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPalpites();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-5 h-5 text-emerald-400" />
        <h2 className="text-xl font-bold text-white uppercase tracking-widest">
          Acompanhe Seu Palpite
        </h2>
      </div>

      {palpites.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
          <p className="text-zinc-400">Você ainda não fez nenhum palpite.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {palpites.map((palpite) => {
            const partida = palpite.partidas;
            const liveData = liveMatches[partida?.sofascore_match_id];
            const isLive = !!liveData;
            
            return (
              <div key={palpite.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-lg overflow-hidden relative">
                {isLive && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500 animate-pulse"></div>
                )}
                
                <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      {isLive && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        {isLive ? 'Ao Vivo' : (partida?.status === 'finished' ? 'Encerrado' : 'Aguardando')}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white uppercase">{partida?.time_casa} x {partida?.time_visitante}</h3>
                  </div>
                  <div className="text-xs font-bold bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/20">
                    {palpite.pontos_obtidos || 0} pts ganhos
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-center">
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Seu Palpite (Placar)</p>
                    <div className="flex items-center justify-center gap-2 bg-zinc-950 p-2 rounded-lg border border-zinc-800/50">
                       <span className="text-lg font-black text-white">{palpite.home || '0'}</span>
                       <span className="text-[10px] text-zinc-500">X</span>
                       <span className="text-lg font-black text-white">{palpite.away || '0'}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Placar Real</p>
                    <div className="flex items-center justify-center gap-2 bg-zinc-950 p-2 rounded-lg border border-zinc-800/50">
                       <span className={`text-lg font-black ${isLive ? 'text-emerald-400' : 'text-white'}`}>{liveData?.homeScore ?? '-'}</span>
                       <span className="text-[10px] text-zinc-500">X</span>
                       <span className={`text-lg font-black ${isLive ? 'text-emerald-400' : 'text-white'}`}>{liveData?.awayScore ?? '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                   <div className="bg-zinc-950/50 p-2 rounded border border-zinc-800/50">
                     <p className="text-[9px] text-zinc-500 mb-1 uppercase font-bold">Total Gols</p>
                     <div className="flex justify-between">
                       <span className="text-zinc-300">Palpite: {palpite.total_gols || '-'}</span>
                       <span className="text-emerald-400 font-bold">{isLive && liveData ? liveData.homeScore + liveData.awayScore : '-'}</span>
                     </div>
                   </div>
                   <div className="bg-zinc-950/50 p-2 rounded border border-zinc-800/50">
                     <p className="text-[9px] text-zinc-500 mb-1 uppercase font-bold">Ambos Marcam</p>
                     <div className="flex justify-between">
                       <span className="text-zinc-300">Palpite: {palpite.ambos_marcam || '-'}</span>
                       <span className="text-emerald-400 font-bold">{isLive && liveData ? (liveData.homeScore > 0 && liveData.awayScore > 0 ? "Sim" : "Não") : '-'}</span>
                     </div>
                   </div>
                   <div className="bg-zinc-950/50 p-2 rounded border border-zinc-800/50 col-span-2">
                     <p className="text-[9px] text-zinc-500 mb-1 uppercase font-bold">1º Gol</p>
                     <div className="flex justify-between">
                       <span className="text-zinc-300">Palpite: {palpite.primeiro_gol_time || '-'}</span>
                     </div>
                   </div>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                   <div className="bg-zinc-950/50 p-2 rounded border border-zinc-800/50">
                     <p className="text-[9px] text-zinc-500 mb-1 uppercase font-bold">Cartões 1T</p>
                     <div className="flex justify-between">
                       <span className="text-zinc-300">Palpite: {palpite.cartoes_1t || '-'}</span>
                       <span className="text-amber-400 font-bold">{isLive && liveData?.stats ? liveData.stats.cards_1t : '-'}</span>
                     </div>
                   </div>
                   <div className="bg-zinc-950/50 p-2 rounded border border-zinc-800/50">
                     <p className="text-[9px] text-zinc-500 mb-1 uppercase font-bold">Escanteios 1T</p>
                     <div className="flex justify-between">
                       <span className="text-zinc-300">Palpite: {palpite.escanteios_1t || '-'}</span>
                       <span className="text-emerald-400 font-bold">{isLive && liveData?.stats ? liveData.stats.corners_1t : '-'}</span>
                     </div>
                   </div>
                   <div className="bg-zinc-950/50 p-2 rounded border border-zinc-800/50">
                     <p className="text-[9px] text-zinc-500 mb-1 uppercase font-bold">Cartões 2T</p>
                     <div className="flex justify-between">
                       <span className="text-zinc-300">Palpite: {palpite.cartoes_2t || '-'}</span>
                       <span className="text-amber-400 font-bold">{isLive && liveData?.stats ? liveData.stats.cards_2t : '-'}</span>
                     </div>
                   </div>
                   <div className="bg-zinc-950/50 p-2 rounded border border-zinc-800/50">
                     <p className="text-[9px] text-zinc-500 mb-1 uppercase font-bold">Escanteios 2T</p>
                     <div className="flex justify-between">
                       <span className="text-zinc-300">Palpite: {palpite.escanteios_2t || '-'}</span>
                       <span className="text-emerald-400 font-bold">{isLive && liveData?.stats ? liveData.stats.corners_2t : '-'}</span>
                     </div>
                   </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
