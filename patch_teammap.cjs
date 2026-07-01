const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `const teamMap: Record<string, string> = {
    'Inglaterra': 'England',
    'RD Congo': 'Congo DR',
    'Bélgica': 'Belgium',
    'Senegal': 'Senegal',
    'Estados Unidos': 'United States',
    'Bósnia e Herzegovina': 'Bosnia and Herzegovina'
};
// 1. Fetch match detail from ESPN`;

code = code.replace(replacement, '// 1. Fetch match detail from ESPN');

const beforeLoop = `    const now = new Date();`;
const newBeforeLoop = `    const now = new Date();
    const teamMap: Record<string, string> = {
        'Inglaterra': 'England',
        'RD Congo': 'Congo DR',
        'Bélgica': 'Belgium',
        'Senegal': 'Senegal',
        'Estados Unidos': 'United States',
        'Bósnia e Herzegovina': 'Bosnia and Herzegovina'
    };`;

code = code.replace(beforeLoop, newBeforeLoop);
fs.writeFileSync('server.ts', code);
