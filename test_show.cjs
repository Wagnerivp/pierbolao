const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
const start = code.indexOf('const handlePlayerGoalChange =');
console.log(code.slice(start, start + 600));
