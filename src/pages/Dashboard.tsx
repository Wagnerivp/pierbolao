import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "react-hot-toast";
import { Check, ShieldAlert } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

interface Match {
  id: number;
  homeTeam: { name: string; nameCode: string };
  awayTeam: { name: string; nameCode: string };
  startTimestamp: number;
  status: { description: string };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Store palpite: { matchId: { home: number, away: number } }
  const [palpites, setPalpites] = useState<
    Record<number, { home: string; away: string; primeiro_gol_autor?: string; primeiro_cartao_vermelho?: string }>
  >({});
  const [savedStatus, setSavedStatus] = useState<Record<number, boolean>>({});
  const [lineupsCache, setLineupsCache] = useState<Record<number, any>>({});
  const [activeTabs, setActiveTabs] = useState<Record<number, 'geral' | 'tempo'>>({});

  useEffect(() => {
    fetchMatches();
    if (user) {
      fetchUserPalpites();
    }
  }, [user]);

  const fetchMatches = async () => {
    try {
      if (!isSupabaseConfigured()) {
        applyFallbackMatches();
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('partidas')
        .select('*')
        .order('horario_inicio', { ascending: true });
        
      if (error) {
        console.warn("Supabase fetch error, using fallback matches:", error);
        applyFallbackMatches();
        setLoading(false);
        return;
      }
      
      const formattedMatches = (data || []).map(p => ({
        id: p.sofascore_match_id,
        homeTeam: { name: p.time_casa, nameCode: p.time_casa.substring(0, 3).toUpperCase() },
        awayTeam: { name: p.time_visitante, nameCode: p.time_visitante.substring(0, 3).toUpperCase() },
        startTimestamp: Math.floor(new Date(p.horario_inicio).getTime() / 1000),
        status: { description: p.status || "Not started" }
      }));
      
      if (formattedMatches.length === 0) {
        applyFallbackMatches();
      } else {
        setMatches(formattedMatches);
        fetchLineupsSequentially(formattedMatches);
      }

    } catch (error: any) {
      console.error("Erro ao buscar partidas:", error);
      toast.error(`Erro ao carregar jogos: ${error?.message || "Falha de conexão"}. Usando mock...`);
      applyFallbackMatches();
    } finally {
      setLoading(false);
    }
  };

  const applyFallbackMatches = () => {
    const today = new Date();
    const fallback = [
      {
        id: 1001,
        homeTeam: { name: "Inglaterra", nameCode: "ING" },
        awayTeam: { name: "RD Congo", nameCode: "RDC" },
        startTimestamp: Math.floor(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 20, 0, 0).getTime() / 1000),
        status: { description: "Not started" }
      },
      {
        id: 1002,
        homeTeam: { name: "Bélgica", nameCode: "BEL" },
        awayTeam: { name: "Senegal", nameCode: "SEN" },
        startTimestamp: Math.floor(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 22, 0, 0).getTime() / 1000),
        status: { description: "Not started" }
      }
    ];
    setMatches(fallback);
    fetchLineupsSequentially(fallback);
  };

  const fetchLineupsSequentially = async (matchList: any[]) => {
    for (const m of matchList) {
      try {
        const res = await fetch(`/api/fetch-lineups?match_id=${m.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.players && data.players.length > 0) {
            setLineupsCache((prev) => ({ ...prev, [m.id]: data.players }));
          }
        }
      } catch (e) {
        console.error("Lineup error:", e);
      }
    }
  };

  const fetchUserPalpites = async () => {
    if (!isSupabaseConfigured()) {
      return;
    }
    try {
      const { data, error } = await supabase
        .from("palpites")
        .select("match_id, home, away, total_gols, ambos_marcam, primeiro_gol_time, cartoes_1t, escanteios_1t, cartoes_2t, escanteios_2t, vencedor_prorrogacao, cartao_prorrogacao, vencedor_penaltis, artilheiro_nome, artilheiro_gols")
        .eq("user_id", user?.id);

      if (data) {
        const loaded: Record<number, any> = {};
        const statuses: Record<number, boolean> = {};
        data.forEach((p) => {
          loaded[p.match_id] = {
            home: String(p.home),
            away: String(p.away),
            total_gols: p.total_gols !== null ? String(p.total_gols) : "",
            ambos_marcam: p.ambos_marcam,
            primeiro_gol_time: p.primeiro_gol_time,
            cartoes_1t: p.cartoes_1t,
            escanteios_1t: p.escanteios_1t,
            cartoes_2t: p.cartoes_2t,
            escanteios_2t: p.escanteios_2t,
            vencedor_prorrogacao: p.vencedor_prorrogacao,
            cartao_prorrogacao: p.cartao_prorrogacao,
            vencedor_penaltis: p.vencedor_penaltis,
            artilheiro_nome: p.artilheiro_nome,
            artilheiro_gols: p.artilheiro_gols !== null ? String(p.artilheiro_gols) : ""
          };
          statuses[p.match_id] = true;
        });
        setPalpites(loaded);
        setSavedStatus(statuses);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handlePalpiteChange = (
    matchId: number,
    field: string,
    value: string,
  ) => {
    // Only allow numbers for score fields
    if ((field === "home" || field === "away") && value !== "" && !/^\d+$/.test(value)) return;

    setPalpites((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value,
      },
    }));
    setSavedStatus((prev) => ({ ...prev, [matchId]: false }));
  };

  const savePalpite = async (matchId: number) => {
    if (!user) return;

    const match = matches.find(m => m.id === matchId);
    if (match) {
      const matchDate = new Date(match.startTimestamp * 1000);
      const deadline = new Date(matchDate.getTime() - 60000);
      const now = new Date();
      if (now > deadline) {
        return toast.error("Tempo esgotado para salvar palpites nesta partida.");
      }
    }

    const palpite = palpites[matchId];
    if (
      !palpite ||
      palpite.home === undefined ||
      palpite.away === undefined ||
      palpite.home === "" ||
      palpite.away === ""
    ) {
      return toast.error("Preencha os dois placares.");
    }

    setSaving(true);
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_URL.startsWith('http') || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
        setTimeout(() => {
            setSaving(false);
            setSavedStatus(prev => ({ ...prev, [matchId]: true }));
            toast.success('Palpite salvo! (Modo de Teste)');
        }, 500);
        return;
    }
    try {
      // Upsert palpite
      const { data: existing } = await supabase
        .from("palpites")
        .select("id")
        .eq("user_id", user.id)
        .eq("match_id", matchId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("palpites")
          .update({
            home: parseInt(palpite.home, 10),
            away: parseInt(palpite.away, 10),
            total_gols: palpite.total_gols ? parseInt(palpite.total_gols, 10) : null,
            ambos_marcam: palpite.ambos_marcam || null,
            primeiro_gol_time: palpite.primeiro_gol_time || null,
            cartoes_1t: palpite.cartoes_1t || null,
            escanteios_1t: palpite.escanteios_1t || null,
            cartoes_2t: palpite.cartoes_2t || null,
            escanteios_2t: palpite.escanteios_2t || null,
            vencedor_prorrogacao: palpite.vencedor_prorrogacao || null,
            cartao_prorrogacao: palpite.cartao_prorrogacao || null,
            vencedor_penaltis: palpite.vencedor_penaltis || null,
            artilheiro_nome: palpite.artilheiro_nome || null,
            artilheiro_gols: palpite.artilheiro_gols ? parseInt(palpite.artilheiro_gols, 10) : null,
            updated_at: new Date().toISOString()
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("palpites")
          .insert({
            user_id: user.id,
            match_id: matchId,
            home: parseInt(palpite.home, 10),
            away: parseInt(palpite.away, 10),
            total_gols: palpite.total_gols ? parseInt(palpite.total_gols, 10) : null,
            ambos_marcam: palpite.ambos_marcam || null,
            primeiro_gol_time: palpite.primeiro_gol_time || null,
            cartoes_1t: palpite.cartoes_1t || null,
            escanteios_1t: palpite.escanteios_1t || null,
            cartoes_2t: palpite.cartoes_2t || null,
            escanteios_2t: palpite.escanteios_2t || null,
            vencedor_prorrogacao: palpite.vencedor_prorrogacao || null,
            cartao_prorrogacao: palpite.cartao_prorrogacao || null,
            vencedor_penaltis: palpite.vencedor_penaltis || null,
            artilheiro_nome: palpite.artilheiro_nome || null,
            artilheiro_gols: palpite.artilheiro_gols ? parseInt(palpite.artilheiro_gols, 10) : null
          });
        if (error) throw error;
      }

      setSavedStatus((prev) => ({ ...prev, [matchId]: true }));
      toast.success("Palpite salvo com sucesso! Você está concorrendo a até 77 pontos neste jogo.");
    } catch (error: any) {
      toast.error("Erro ao salvar palpite.");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-neutral-400 font-medium">
          Buscando jogos oficiais...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-white">Regras do Bolão</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Acerto exato: 10 pontos. Acerto do vencedor: 5 pontos. Salve seus
            palpites antes do início da partida.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {matches.map((match) => {
          const matchDate = new Date(match.startTimestamp * 1000);
          const deadline = new Date(matchDate.getTime() - 60000);
          const now = new Date();
          const isLocked = now > deadline;
          const currentPalpite = palpites[match.id] || { home: "", away: "" };
          const isSaved = savedStatus[match.id];

          return (
            <div
              key={match.id}
              className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div className="px-6 py-4 flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  {format(matchDate, "dd 'de' MMM 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${isLocked ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"}`}
                >
                  {isLocked ? "Bloqueado" : "Aberto"}
                </span>
              </div>

              <div className="px-6 py-2 flex items-center justify-between gap-4">
                {/* Home Team */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-inner border border-zinc-700/50">
                    {match.homeTeam.nameCode ||
                      match.homeTeam.name.substring(0, 3).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-center text-zinc-300 leading-tight">
                    {match.homeTeam.name}
                  </span>
                </div>

                {/* Score Input */}
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    disabled={isLocked || saving}
                    value={currentPalpite.home}
                    placeholder="0"
                    onChange={(e) =>
                      handlePalpiteChange(match.id, "home", e.target.value)
                    }
                    className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-lg text-center text-xl font-bold text-emerald-400 focus:outline-none focus:border-emerald-500/50 transition-colors disabled:opacity-50"
                  />
                  <span className="text-zinc-600 font-bold font-mono tracking-widest">:</span>
                  <input
                    type="number"
                    disabled={isLocked || saving}
                    value={currentPalpite.away}
                    placeholder="0"
                    onChange={(e) =>
                      handlePalpiteChange(match.id, "away", e.target.value)
                    }
                    className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-lg text-center text-xl font-bold text-emerald-400 focus:outline-none focus:border-emerald-500/50 transition-colors disabled:opacity-50"
                  />
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-inner border border-zinc-700/50">
                    {match.awayTeam.nameCode ||
                      match.awayTeam.name.substring(0, 3).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-center text-zinc-300 leading-tight">
                    {match.awayTeam.name}
                  </span>
                </div>
              </div>

              {!isLocked ? (
                <>
                  <div className="px-6 py-3 bg-zinc-900/80 border-t border-zinc-800/50 flex space-x-2 overflow-x-auto hide-scrollbar">
                    <button
                      onClick={() => setActiveTabs((prev) => ({ ...prev, [match.id]: 'geral' }))}
                      className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg whitespace-nowrap transition-colors ${activeTabs[match.id] !== 'tempo' ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                    >
                      Palpites Gerais
                    </button>
                    <button
                      onClick={() => setActiveTabs((prev) => ({ ...prev, [match.id]: 'tempo' }))}
                      className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg whitespace-nowrap transition-colors ${activeTabs[match.id] === 'tempo' ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                    >
                      Estatísticas de Tempo
                    </button>
                  </div>

                  <div className="px-6 py-4 border-t border-zinc-800/50 bg-zinc-900/30 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeTabs[match.id] !== 'tempo' ? (
                      <>
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                            Total de Gols (5 pts)
                          </label>
                          <input
                            type="number"
                            min="0"
                            disabled={saving}
                            value={currentPalpite.total_gols || ""}
                            onChange={(e) => handlePalpiteChange(match.id, "total_gols", e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
                            placeholder="Ex: 3"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                            Ambos Marcam (4 pts)
                          </label>
                          <select
                            disabled={saving}
                            value={currentPalpite.ambos_marcam || ""}
                            onChange={(e) => handlePalpiteChange(match.id, "ambos_marcam", e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
                          >
                            <option value="">Selecione...</option>
                            <option value="Sim">Sim</option>
                            <option value="Não">Não</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                            Quem faz o 1º Gol (4 pts)
                          </label>
                          <select
                            disabled={saving}
                            value={currentPalpite.primeiro_gol_time || ""}
                            onChange={(e) => handlePalpiteChange(match.id, "primeiro_gol_time", e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
                          >
                            <option value="">Selecione...</option>
                            <option value="Casa">{match.homeTeam.name}</option>
                            <option value="Visitante">{match.awayTeam.name}</option>
                            <option value="Ninguém">Ninguém</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                            Artilheiro (Multi-Gols)
                          </label>
                          <select
                            disabled={saving || !lineupsCache[match.id]}
                            value={currentPalpite.artilheiro_nome || ""}
                            onChange={(e) => handlePalpiteChange(match.id, "artilheiro_nome", e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
                          >
                            <option value="">{!lineupsCache[match.id] ? "Aguardando escalação..." : "Selecione o jogador..."}</option>
                            {lineupsCache[match.id] && lineupsCache[match.id].map((playerName: string, idx: number) => (
                              <option key={`art-${idx}`} value={playerName}>
                                {playerName}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                            Qtd Gols do Artilheiro
                          </label>
                          <input
                            type="number"
                            min="1"
                            disabled={saving || !currentPalpite.artilheiro_nome}
                            value={currentPalpite.artilheiro_gols || ""}
                            onChange={(e) => handlePalpiteChange(match.id, "artilheiro_gols", e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors disabled:opacity-50"
                            placeholder="Ex: 2"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="md:col-span-2 text-[11px] font-bold text-emerald-500 uppercase tracking-widest mt-2">1º Tempo</div>
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                            Cartões (2 pts)
                          </label>
                          <select
                            disabled={saving}
                            value={currentPalpite.cartoes_1t || ""}
                            onChange={(e) => handlePalpiteChange(match.id, "cartoes_1t", e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
                          >
                            <option value="">Selecione...</option>
                            <option value="0-2">0 a 2</option>
                            <option value="3-4">3 a 4</option>
                            <option value="5+">5 ou mais</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                            Escanteios (2 pts)
                          </label>
                          <select
                            disabled={saving}
                            value={currentPalpite.escanteios_1t || ""}
                            onChange={(e) => handlePalpiteChange(match.id, "escanteios_1t", e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
                          >
                            <option value="">Selecione...</option>
                            <option value="<5">Menos de 5</option>
                            <option value="5-7">Entre 5 e 7</option>
                            <option value=">7">Mais de 7</option>
                          </select>
                        </div>
                        <div className="md:col-span-2 text-[11px] font-bold text-emerald-500 uppercase tracking-widest mt-4">2º Tempo</div>
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                            Cartões (2 pts)
                          </label>
                          <select
                            disabled={saving}
                            value={currentPalpite.cartoes_2t || ""}
                            onChange={(e) => handlePalpiteChange(match.id, "cartoes_2t", e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
                          >
                            <option value="">Selecione...</option>
                            <option value="0-2">0 a 2</option>
                            <option value="3-4">3 a 4</option>
                            <option value="5+">5 ou mais</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                            Escanteios (2 pts)
                          </label>
                          <select
                            disabled={saving}
                            value={currentPalpite.escanteios_2t || ""}
                            onChange={(e) => handlePalpiteChange(match.id, "escanteios_2t", e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
                          >
                            <option value="">Selecione...</option>
                            <option value="<5">Menos de 5</option>
                            <option value="5-7">Entre 5 e 7</option>
                            <option value=">7">Mais de 7</option>
                          </select>
                        </div>
                        <div className="md:col-span-2 text-[11px] font-bold text-emerald-500 uppercase tracking-widest mt-4">Mata-Mata (Prorrogação/Pênaltis)</div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                            Vencedor na Prorrogação (8 pts)
                          </label>
                          <select
                            disabled={saving}
                            value={currentPalpite.vencedor_prorrogacao || ""}
                            onChange={(e) => handlePalpiteChange(match.id, "vencedor_prorrogacao", e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
                          >
                            <option value="">Selecione...</option>
                            <option value="Casa">{match.homeTeam.name}</option>
                            <option value="Visitante">{match.awayTeam.name}</option>
                            <option value="Ninguém">Não vai para prorrogação/Empate</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                            Cartão Prorrogação (5 pts)
                          </label>
                          <select
                            disabled={saving}
                            value={currentPalpite.cartao_prorrogacao || ""}
                            onChange={(e) => handlePalpiteChange(match.id, "cartao_prorrogacao", e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
                          >
                            <option value="">Selecione...</option>
                            <option value="Sim">Sim</option>
                            <option value="Não">Não</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                            Vencedor Pênaltis (8 pts)
                          </label>
                          <select
                            disabled={saving}
                            value={currentPalpite.vencedor_penaltis || ""}
                            onChange={(e) => handlePalpiteChange(match.id, "vencedor_penaltis", e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
                          >
                            <option value="">Selecione...</option>
                            <option value="Casa">{match.homeTeam.name}</option>
                            <option value="Visitante">{match.awayTeam.name}</option>
                            <option value="Ninguém">Não vai para pênaltis</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="px-6 pb-6 pt-2 border-t border-zinc-800/50 bg-zinc-900/30 sticky bottom-0 z-10 rounded-b-2xl">
                    <button
                      onClick={() => savePalpite(match.id)}
                      disabled={
                        saving ||
                        currentPalpite.home === "" ||
                        currentPalpite.away === ""
                      }
                      className={`w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors
                        ${
                          isSaved
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500"
                        }`}
                    >
                      {isSaved ? (
                        <>
                          <Check className="w-5 h-5" /> Palpite Salvo
                        </>
                      ) : (
                        "Salvar Combo Pier Bet"
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="px-6 py-6 border-t border-zinc-800/50 bg-zinc-900/30 flex flex-col items-center justify-center space-y-2 rounded-b-2xl">
                  <span className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-widest rounded-lg border border-zinc-700 shadow-inner">
                    PALPITES ENCERRADOS - ACOMPANHE O PLACAR
                  </span>
                  <p className="text-zinc-500 text-[11px] text-center max-w-[250px]">
                    Os palpites para este jogo foram bloqueados 1 minuto antes do início da partida.
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {matches.length === 0 && (
          <div className="text-center py-10 bg-zinc-900/50 rounded-2xl border border-zinc-800 mt-4">
            <p className="text-zinc-500 text-sm">
              Nenhuma partida disponível no momento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
