const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

code = code.replace(/if \(value === "" \|\| value === "0"\) \{/g, 'if (value === "") {');

fs.writeFileSync('src/pages/Dashboard.tsx', code);
