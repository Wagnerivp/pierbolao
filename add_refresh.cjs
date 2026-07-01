const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const refreshFunction = `
  const [refreshingLineup, setRefreshingLineup] = useState<Record<number, boolean>>({});

  const refreshLineup = async (matchId: number) => {
    setRefreshingLineup((prev) => ({ ...prev, [matchId]: true }));
    try {
      const res = await fetch(\`/api/fetch-lineups?match_id=\${matchId}\`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && (data.homePlayers || (data.players && data.players.length > 0))) {
          const playersData = data.homePlayers ? data : { homePlayers: data.players || [], awayPlayers: [] };
          setLineupsCache((prev) => ({ ...prev, [matchId]: playersData }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshingLineup((prev) => ({ ...prev, [matchId]: false }));
    }
  };

  const fetchLineupsSequentially = async (matchList: any[]) => {`;

code = code.replace(
  /const fetchLineupsSequentially = async \(matchList: any\[\]\) => \{/,
  refreshFunction
);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
