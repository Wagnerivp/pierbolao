const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

code = code.replace(/disabled=\{\!userStatus\.pago \|\| isLocked \|\| saving\}/g, "disabled={isLocked || saving}");
code = code.replace(/disabled=\{\!userStatus\.pago \|\| saving\}/g, "disabled={isLocked || saving}");
code = code.replace(/disabled=\{\s*\!userStatus\.pago \|\| saving \|\|/g, "disabled={\n                        isLocked || saving ||");

fs.writeFileSync('src/pages/Dashboard.tsx', code);
