require('dotenv').config();
console.log(process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? "YES" : "NO");
