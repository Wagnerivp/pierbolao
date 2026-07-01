const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const regex1 = /window\.open\("https:\/\/wa\.me\/552975151937\?text=Olá, acabei de pagar o bolão \(R\$ 10,00\)\. Segue o comprovante\.", "_blank"\);/;
code = code.replace(regex1, 'window.open("https://wa.me/5521975151937?text=Olá, acabei de pagar o bolão (R$ 10,00). Segue o comprovante.", "_blank");');

const regex2 = /<div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-center space-y-2">\s*<p className="text-xs text-zinc-500 uppercase tracking-widest">Chave PIX \(Celular\)<\/p>\s*<p className="text-lg font-bold text-white">\(29\) 7515-1937<\/p>\s*<\/div>/m;

const replacement2 = `<div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-center space-y-3">
              <p className="text-xs text-zinc-500 uppercase tracking-widest">Chave PIX (Celular)</p>
              <p className="text-lg font-bold text-white">(21) 97515-1937</p>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText("21975151937");
                  toast.success("Chave PIX copiada!");
                }}
                className="mx-auto flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Copiar Chave PIX
              </button>
            </div>`;

code = code.replace(regex2, replacement2);
fs.writeFileSync('src/pages/Dashboard.tsx', code);
