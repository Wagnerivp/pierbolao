const http = require('http');
http.get('http://localhost:3000/api/fetch-lineups?match_id=9002', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
});
