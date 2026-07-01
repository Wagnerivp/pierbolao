const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const routeCode = `app.get("/api/live-matches", async (req, res) => {
  const userId = req.query.user_id;
  let userBreakdown = { pontos_1t: 0, pontos_2t: 0, pontos_gerais: 0 };
  
  if (userId) {
    const { data: palpites } = await supabase.from('palpites').select('pontos_1t, pontos_2t, pontos_gerais').eq('user_id', userId);
    if (palpites) {
       for (const p of palpites) {
           userBreakdown.pontos_1t += (p.pontos_1t || 0);
           userBreakdown.pontos_2t += (p.pontos_2t || 0);
           userBreakdown.pontos_gerais += (p.pontos_gerais || 0);
       }
    }
  }

  res.json({ success: true, matches: liveMatchesCache, breakdown: userBreakdown });
});`;

// remove it from where it is
code = code.replace(routeCode, '');

// insert it before `if (process.env.NODE_ENV !== "production") {`
const insertionPoint = `if (process.env.NODE_ENV !== "production") {`;
code = code.replace(insertionPoint, routeCode + '\n\n  ' + insertionPoint);

fs.writeFileSync('server.ts', code);
