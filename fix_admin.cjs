const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const regex1 = /\.eq\("comprovante_enviado", true\)\s*\.eq\("pago", false\);/;
code = code.replace(regex1, '.order("created_at", { ascending: false });');

const regex2 = /<h3 className="font-bold text-lg text-white mb-4">Aprovação de Pagamentos<\/h3>[\s\S]*?(?=<div className="space-y-3">)/;
const replacement2 = `<h3 className="font-bold text-lg text-white mb-4">Todos os Usuários</h3>\n        `;
code = code.replace(regex2, replacement2);

const regex3 = /usersToApprove\.map\(\(u\) => \([\s\S]*?Liberar\s*<\/button>\s*<\/div>\s*\)\)/;
const replacement3 = `usersToApprove.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-lg"
              >
                <div>
                  <p className="font-bold text-white flex items-center gap-2">
                    {u.nome}
                    {u.pago && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-widest">Liberado</span>}
                    {!u.pago && u.comprovante_enviado && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-widest">Avaliando</span>}
                  </p>
                  <p className="text-xs text-zinc-500">{u.telefone}</p>
                </div>
                {!u.pago && (
                  <button
                    onClick={() => approveUser(u.id)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-bold hover:bg-emerald-500/30 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Liberar
                  </button>
                )}
              </div>
            ))`;
code = code.replace(regex3, replacement3);

const regex4 = /Nenhum usuário aguardando aprovação\./;
code = code.replace(regex4, 'Nenhum usuário cadastrado ainda.');

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
