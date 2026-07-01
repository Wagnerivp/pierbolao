const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

code = code.replace(/type="number" min="0"/g, 'type="text" inputMode="numeric" pattern="[0-9]*"');

fs.writeFileSync('src/pages/Dashboard.tsx', code);
