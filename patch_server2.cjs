const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target1 = `          // Atualiza as colunas de evolução (Pode falhar se o usuário não rodou o SQL ainda, tratamos com fallback)
          const { error: updateErr } = await supabase.from('palpites').update({
              pontos_gerais: p_gerais,
              pontos_1t: p_1t,
              pontos_2t: p_2t,
              pontos_obtidos: pontos_obtidos
          }).eq('id', palpite.id);

          if (updateErr) {
              // Fallback se as colunas pontos_1t, pontos_2t, pontos_gerais ainda não existirem
              await supabase.from('palpites').update({
                  pontos_obtidos: pontos_obtidos
              }).eq('id', palpite.id);
          }`;

const replacement1 = `          // Atualiza as colunas de evolução
          await supabase.from('palpites').update({
              pontos_gerais: p_gerais,
              pontos_1t: p_1t,
              pontos_2t: p_2t
          }).eq('id', palpite.id);`;

code = code.replace(target1, replacement1);

const target2 = `        // Atualizar pontos_totais de todos os usuários
        const { data: allPalpites } = await supabase.from('palpites').select('user_id, pontos_obtidos');
        if (allPalpites) {
            const userPoints: Record<string, number> = {};
            for (const p of allPalpites) {
                userPoints[p.user_id] = (userPoints[p.user_id] || 0) + (p.pontos_obtidos || 0);
            }`;

const replacement2 = `        // Atualizar pontos_totais de todos os usuários
        const { data: allPalpites } = await supabase.from('palpites').select('user_id, pontos_gerais, pontos_1t, pontos_2t');
        if (allPalpites) {
            const userPoints: Record<string, number> = {};
            for (const p of allPalpites) {
                const soma = (p.pontos_gerais || 0) + (p.pontos_1t || 0) + (p.pontos_2t || 0);
                userPoints[p.user_id] = (userPoints[p.user_id] || 0) + soma;
            }`;

code = code.replace(target2, replacement2);

fs.writeFileSync('server.ts', code);
