import axios from 'axios';

async function run() {
    try {
        const res = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard');
        console.log("ESPN:", res.data.events.slice(0, 2).map((e: any) => e.name));
    } catch(e) { console.log("ESPN failed"); }
}
run();
