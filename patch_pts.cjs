const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `
          // 1º Tempo
          if (palpite.cartoes_1t && palpite.cartoes_1t === String(cards_1t)) p_1t += 2;
          if (palpite.escanteios_1t && palpite.escanteios_1t === String(corners_1t)) p_1t += 2;

          // 2º Tempo
          if (palpite.cartoes_2t && palpite.cartoes_2t === String(cards_2t)) p_2t += 2;
          if (palpite.escanteios_2t && palpite.escanteios_2t === String(corners_2t)) p_2t += 2;
`;

const replacement = `
          // 1º Tempo
          let current_p_1t = 0;
          if (palpite.cartoes_1t && palpite.cartoes_1t === String(cards_1t)) current_p_1t += 2;
          if (palpite.escanteios_1t && palpite.escanteios_1t === String(corners_1t)) current_p_1t += 2;
          // Lock points if halftime or later, or just never decrease
          p_1t = Math.max(palpite.pontos_1t || 0, current_p_1t);

          // 2º Tempo
          let current_p_2t = 0;
          if (palpite.cartoes_2t && palpite.cartoes_2t === String(cards_2t)) current_p_2t += 2;
          if (palpite.escanteios_2t && palpite.escanteios_2t === String(corners_2t)) current_p_2t += 2;
          p_2t = Math.max(palpite.pontos_2t || 0, current_p_2t);
`;

code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
