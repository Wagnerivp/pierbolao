const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

code = code.replace('from "../contexts/AuthContext";\n from "../contexts/AuthContext";', 'from "../contexts/AuthContext";');

fs.writeFileSync('src/components/Layout.tsx', code);
