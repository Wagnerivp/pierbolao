const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

code = code.replace(/className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-\[350px\] overflow-y-auto pr-2 hide-scrollbar"/g, 'className="grid grid-cols-1 md:grid-cols-2 gap-6"');

fs.writeFileSync('src/pages/Dashboard.tsx', code);
