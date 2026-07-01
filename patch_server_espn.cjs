const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target1 = `// 1. Fetch match detail`;
const replacement1 = `const teamMap: Record<string, string> = {
    'Inglaterra': 'England',
    'RD Congo': 'Congo DR',
    'Bélgica': 'Belgium',
    'Senegal': 'Senegal',
    'Estados Unidos': 'United States',
    'Bósnia e Herzegovina': 'Bosnia and Herzegovina'
};
// 1. Fetch match detail from ESPN`;

code = code.replace(target1, replacement1);

const targetFetch = `      let matchDetail;
      if (matchId >= 9000 && matchId <= 9999) {
          // MOCK DATA for fake matches
          const mockElapsed = Math.floor((Date.now() - new Date(match.horario_inicio).getTime()) / 60000);
          matchDetail = {
              homeScore: { current: 0 },
              awayScore: { current: 1 },
              status: { type: mockElapsed > 100 ? 'finished' : 'inprogress', description: mockElapsed > 100 ? 'Encerrado' : 'Ao vivo' },
              time: { currentPeriodStartTimestamp: Math.floor(Date.now()/1000) - (mockElapsed * 60) },
              homeTeam: { id: 1 },
              awayTeam: { id: 2 }
          };
      } else {
        try {
          const resDetail = await axios.get('https://sofascore.p.rapidapi.com/matches/detail', {
            params: { matchId },
            headers: {
              'X-RapidAPI-Key': RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
            }
          });
          matchDetail = resDetail.data.event;
        } catch (e) {
          console.error("Error fetching detail for", matchId, e.response?.status);
          continue;
        }
      }

      if (!matchDetail) continue;

      const homeScore = matchDetail.homeScore?.current || 0;
      const awayScore = matchDetail.awayScore?.current || 0;
      const statusType = matchDetail.status?.type; // 'inprogress', 'finished'
      const liveTime = matchDetail.time?.currentPeriodStartTimestamp 
        ? Math.floor((Date.now() / 1000 - matchDetail.time.currentPeriodStartTimestamp) / 60)
        : matchDetail.status?.description || 'Ao vivo';`;

const replaceFetch = `      let matchDetail;
      let espnEvent;
      try {
          const res = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard');
          const events = res.data.events || [];
          espnEvent = events.find(e => {
              const home = e.competitions[0].competitors.find(c => c.homeAway === 'home');
              const away = e.competitions[0].competitors.find(c => c.homeAway === 'away');
              return (home?.team.name === teamMap[match.time_casa] || home?.team.displayName === teamMap[match.time_casa]) &&
                     (away?.team.name === teamMap[match.time_visitante] || away?.team.displayName === teamMap[match.time_visitante]);
          });
      } catch (e) {
          console.error("ESPN Scoreboard fetch failed");
      }
      
      if (!espnEvent) continue;
      
      const homeTeam = espnEvent.competitions[0].competitors.find(c => c.homeAway === 'home');
      const awayTeam = espnEvent.competitions[0].competitors.find(c => c.homeAway === 'away');
      const homeScore = parseInt(homeTeam?.score || '0');
      const awayScore = parseInt(awayTeam?.score || '0');
      const statusType = espnEvent.status.type.completed ? 'finished' : 'inprogress';
      const liveTime = espnEvent.status.displayClock || 'Ao vivo';
`;

code = code.replace(targetFetch, replaceFetch);

const targetStats = `      // 2. Fetch statistics to compute points
      let stats;
      if (matchId >= 9000 && matchId <= 9999) {
          stats = [
            { period: '1ST', groups: [{ statisticsItems: [{name: 'Corner kicks', homeValue: 2, awayValue: 3}, {name: 'Yellow cards', homeValue: 1, awayValue: 1}] }] },
            { period: '2ND', groups: [{ statisticsItems: [{name: 'Corner kicks', homeValue: 4, awayValue: 2}, {name: 'Yellow cards', homeValue: 2, awayValue: 0}] }] }
          ];
      } else {
        try {
          const resStats = await axios.get('https://sofascore.p.rapidapi.com/matches/get-statistics', {
            params: { matchId },
            headers: {
              'X-RapidAPI-Key': RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
            }
          });
          stats = resStats.data.statistics;
        } catch (e) {
          console.error("Error fetching stats for", matchId);
        }
      }

      let corners_1t = 0, corners_2t = 0;
      let cards_1t = 0, cards_2t = 0;
      
      if (stats && Array.isArray(stats)) {
        const firstHalf = stats.find(s => s.period === '1ST');
        const secondHalf = stats.find(s => s.period === '2ND');
        if (firstHalf) {
             firstHalf.groups.forEach(g => {
                 g.statisticsItems.forEach(item => {
                     if (item.name === 'Corner kicks') corners_1t = parseInt(item.homeValue || 0) + parseInt(item.awayValue || 0);
                     if (item.name === 'Yellow cards') cards_1t += parseInt(item.homeValue || 0) + parseInt(item.awayValue || 0);
                     if (item.name === 'Red cards') cards_1t += parseInt(item.homeValue || 0) + parseInt(item.awayValue || 0);
                 });
             });
        }
        if (secondHalf) {
             secondHalf.groups.forEach(g => {
                 g.statisticsItems.forEach(item => {
                     if (item.name === 'Corner kicks') corners_2t = parseInt(item.homeValue || 0) + parseInt(item.awayValue || 0);
                     if (item.name === 'Yellow cards') cards_2t += parseInt(item.homeValue || 0) + parseInt(item.awayValue || 0);
                     if (item.name === 'Red cards') cards_2t += parseInt(item.homeValue || 0) + parseInt(item.awayValue || 0);
                 });
             });
        }
      }`;

const replaceStats = `      // 2. Fetch statistics to compute points
      let corners_1t = 0, corners_2t = 0;
      let cards_1t = 0, cards_2t = 0;
      
      try {
          const resStats = await axios.get(\`https://site.api.espn.com/apis/site/v2/sports/soccer/all/summary?event=\${espnEvent.id}\`);
          const boxscore = resStats.data.boxscore;
          if (boxscore && boxscore.teams) {
              const hStats = boxscore.teams.find(t => t.team.id === homeTeam.team.id)?.statistics || [];
              const aStats = boxscore.teams.find(t => t.team.id === awayTeam.team.id)?.statistics || [];
              
              const hCorners = parseInt(hStats.find(s => s.name === 'wonCorners')?.displayValue || '0');
              const aCorners = parseInt(aStats.find(s => s.name === 'wonCorners')?.displayValue || '0');
              corners_2t = hCorners + aCorners; // ESPN only gives total, we assign to 2t for now or just general
              
              const hYellow = parseInt(hStats.find(s => s.name === 'yellowCards')?.displayValue || '0');
              const aYellow = parseInt(aStats.find(s => s.name === 'yellowCards')?.displayValue || '0');
              const hRed = parseInt(hStats.find(s => s.name === 'redCards')?.displayValue || '0');
              const aRed = parseInt(aStats.find(s => s.name === 'redCards')?.displayValue || '0');
              cards_2t = hYellow + aYellow + hRed + aRed;
          }
      } catch (e) {
          console.error("Error fetching stats for", espnEvent.id);
      }`;

code = code.replace(targetStats, replaceStats);

fs.writeFileSync('server.ts', code);
