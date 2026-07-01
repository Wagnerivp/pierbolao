import {
  Trophy,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Goal,
  Users,
  Clock,
} from "lucide-react";

export default function Rules() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-emerald-400 uppercase">
          Regras do Jogo
        </h2>
        <p className="text-sm text-zinc-400">
          Entenda como funciona a pontuação
        </p>
      </div>

      <div className="space-y-4">
        {/* Placar Exato */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-3">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h3 className="font-bold text-zinc-100 uppercase tracking-wide">
              Placar Exato
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-300">
                Acertar o placar exato do jogo
              </span>
              <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                +25 pts
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-300">
                Acertar o vencedor da partida
              </span>
              <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                +10 pts
              </span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-zinc-800/50 pt-3">
              <span className="text-zinc-500 text-xs italic">
                Total de Gols é preenchido automaticamente ao colocar o placar.
              </span>
            </div>
            <div className="flex justify-between items-center text-sm pt-1">
              <span className="text-zinc-300">Acertar o total de gols</span>
              <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                +5 pts
              </span>
            </div>
          </div>
        </div>

        {/* Estatísticas do Jogo */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-3">
            <Goal className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-zinc-100 uppercase tracking-wide">
              Estatísticas (Geral)
            </h3>
          </div>
          <div className="p-4 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-zinc-300">
                Ambos os times marcam? (Sim/Não)
              </span>
              <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                +2 pts
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-300">
                Qual time fará o primeiro gol?
              </span>
              <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                +2 pts
              </span>
            </div>
          </div>
        </div>

        {/* Estatísticas de Tempo */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-zinc-100 uppercase tracking-wide">
              Por Tempo
            </h3>
          </div>
          <div className="p-4 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-zinc-300">
                Time com + cartões (1º e 2º Tempo)
              </span>
              <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                +2 pts
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-300">
                Time com + escanteios (1º e 2º Tempo)
              </span>
              <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                +2 pts
              </span>
            </div>
          </div>
        </div>

        {/* Mata-Mata */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="font-bold text-zinc-100 uppercase tracking-wide">
              Mata-Mata
            </h3>
          </div>
          <div className="p-4 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-zinc-300">Vencedor na prorrogação</span>
              <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                +8 pts
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-300">
                Time com + cartões prorrogação
              </span>
              <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                +5 pts
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-300">Vencedor nos pênaltis</span>
              <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                +8 pts
              </span>
            </div>
          </div>
        </div>

        {/* Jogadores (Artilheiro) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-3">
            <Users className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-zinc-100 uppercase tracking-wide">
              Jogadores
            </h3>
          </div>
          <div className="p-4 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-zinc-300">Acertar os gols do jogador</span>
              <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                +10 pts
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-300">
                Errar (tentar chutar e o jogador não fizer essa qtd)
              </span>
              <span className="font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded">
                -5 pts
              </span>
            </div>
            <p className="text-xs text-zinc-500 italic mt-2">
              Dica: Não coloque que todos os jogadores farão gols, pois os erros
              descontam pontos!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
