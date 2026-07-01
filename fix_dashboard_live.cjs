const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

code = code.replace(/import \{ Check, ShieldAlert \} from "lucide-react";/, 'import { Check, ShieldAlert, Activity, Clock } from "lucide-react";');

const liveState = `
  const [liveMatches, setLiveMatches] = useState<Record<number, any>>({});
  const [liveScore, setLiveScore] = useState<number | null>(null);

  useEffect(() => {
    // Poll for live match data
    const fetchLive = async () => {
      try {
        const res = await fetch('/api/live-matches');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.matches) {
            setLiveMatches(data.matches);
          }
        }
      } catch (e) {}
    };
    fetchLive();
    const interval = setInterval(fetchLive, 10000); // 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user || !isSupabaseConfigured()) return;
    // Set initial total score from auth context
    setLiveScore(user.pontos_totais);

    // Listen to real-time points update
    const channel = supabase.channel('public:usuarios')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'usuarios',
        filter: \`id=eq.\${user.id}\`
      }, (payload) => {
        if (payload.new && typeof payload.new.pontos_totais === 'number') {
          setLiveScore(payload.new.pontos_totais);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
`;

code = code.replace(/const \[showPixModal, setShowPixModal\] = useState\(false\);/, `const [showPixModal, setShowPixModal] = useState(false);\n${liveState}`);

const liveBarHtml = `
      {/* LIVE BAR */}
      {Object.keys(liveMatches).length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-zinc-900 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Activity className="w-16 h-16 text-emerald-500 animate-pulse" />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <h2 className="text-xs font-bold text-red-500 uppercase tracking-widest">Live Tracking</h2>
            {liveScore !== null && (
              <div className="ml-auto flex items-center gap-2 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                <span className="text-[10px] text-zinc-400">PONTUAÇÃO VOLÁTIL:</span>
                <span className={\`text-sm font-black \${liveScore >= 0 ? 'text-emerald-400' : 'text-red-400'}\`}>
                  {liveScore} pts
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            {Object.entries(liveMatches).map(([id, live]: any) => (
              <div key={id} className="flex items-center justify-between bg-zinc-950/50 p-2 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-2 flex-1">
                  {live.homeFlag && <img src={live.homeFlag} alt="Home" className="w-6 h-6 object-contain" />}
                  <span className="font-black text-white">{live.homeScore}</span>
                </div>
                
                <div className="flex flex-col items-center justify-center px-4">
                  <span className="text-[10px] text-zinc-500 font-bold mb-1">VS</span>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3" />
                    <span>{live.time}{typeof live.time === 'number' ? "'" : ""}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="font-black text-white">{live.awayScore}</span>
                  {live.awayFlag && <img src={live.awayFlag} alt="Away" className="w-6 h-6 object-contain" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
`;

code = code.replace(/<div className="flex items-center justify-between mb-8">/, `${liveBarHtml}\n      <div className="flex items-center justify-between mb-8">`);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
