const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `      liveMatchesCache[matchId] = {
        homeScore,
        awayScore,
        time: liveTime,
        status: statusType,
        homeFlag: \`https://api.sofascore.app/api/v1/team/\${matchDetail.homeTeam?.id}/image\`,
        awayFlag: \`https://api.sofascore.app/api/v1/team/\${matchDetail.awayTeam?.id}/image\`
      };`;

const targetInsert = `      if (stats && Array.isArray(stats)) {`;

const insertAfterStats = `        if (secondHalf) {
             secondHalf.groups.forEach(g => {
                 g.statisticsItems.forEach(item => {
                     if (item.name === 'Corner kicks') corners_2t = parseInt(item.homeValue || 0) + parseInt(item.awayValue || 0);
                     if (item.name === 'Yellow cards') cards_2t += parseInt(item.homeValue || 0) + parseInt(item.awayValue || 0);
                     if (item.name === 'Red cards') cards_2t += parseInt(item.homeValue || 0) + parseInt(item.awayValue || 0);
                 });
             });
        }
      }

      // NOVO: Update liveMatchesCache with stats
      if (liveMatchesCache[matchId]) {
          liveMatchesCache[matchId].stats = {
              corners_1t, corners_2t, cards_1t, cards_2t,
              total_gols: homeScore + awayScore
          };
      }`;

code = code.replace(`        if (secondHalf) {
             secondHalf.groups.forEach(g => {
                 g.statisticsItems.forEach(item => {
                     if (item.name === 'Corner kicks') corners_2t = parseInt(item.homeValue || 0) + parseInt(item.awayValue || 0);
                     if (item.name === 'Yellow cards') cards_2t += parseInt(item.homeValue || 0) + parseInt(item.awayValue || 0);
                     if (item.name === 'Red cards') cards_2t += parseInt(item.homeValue || 0) + parseInt(item.awayValue || 0);
                 });
             });
        }
      }`, insertAfterStats);

fs.writeFileSync('server.ts', code);
