const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

if (!code.includes('import { useState, useEffect }')) {
  code = code.replace('import { Outlet', 'import { useState, useEffect } from "react";\nimport { Outlet');
}

if (!code.includes('import { supabase, isSupabaseConfigured }')) {
  code = code.replace('import { useAuth }', 'import { useAuth } from "../contexts/AuthContext";\nimport { supabase, isSupabaseConfigured } from "../lib/supabase";\n');
}

if (!code.includes('const [userRank, setUserRank] = useState')) {
  code = code.replace('const { logout, user } = useAuth();', `const { logout, user } = useAuth();
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    const fetchRank = async () => {
      if (!user || !isSupabaseConfigured()) return;
      try {
        const { data, error } = await supabase
          .from("usuarios")
          .select("id")
          .order("pontos_totais", { ascending: false })
          .order("acertos_placar_exato", { ascending: false });
        
        if (!error && data) {
          const rank = data.findIndex((u) => u.id === user.id) + 1;
          setUserRank(rank);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchRank();
  }, [user]);`);
}

code = code.replace(
  '<span className="text-sm font-bold">{user?.nome}</span>',
  '<span className="text-lg font-black text-white capitalize">{user?.nome}</span>'
);

code = code.replace(
  '<span className="text-xs text-zinc-500 font-medium">\n              {user?.pontos_totais} pts\n            </span>',
  `<div className="flex items-center gap-2 mt-1">
              {userRank !== null && (
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20">
                  {userRank}º LUGAR
                </span>
              )}
              <span className="text-xs text-emerald-400 font-bold">
                {user?.pontos_totais} pts
              </span>
            </div>`
);

fs.writeFileSync('src/components/Layout.tsx', code);
