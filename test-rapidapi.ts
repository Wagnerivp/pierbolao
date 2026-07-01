import axios from 'axios';
async function test() {
  const endpoints = [
    'https://sofascore.p.rapidapi.com/matches/by-date',
    'https://sofascore.p.rapidapi.com/matches/v1/by-date',
    'https://sofascore.p.rapidapi.com/matches/v1/events/schedule/date',
    'https://sofascore.p.rapidapi.com/tournaments/get-schedule'
  ];
  for (const url of endpoints) {
    try {
      console.log('Trying', url);
      const response = await axios.get(url, {
        params: { date: '2024-06-20' },
        headers: {
          'X-RapidAPI-Key': 'da55d90e6fmsh9c98df101001573p162a11jsnc6d3574fdcbb',
          'X-RapidAPI-Host': 'sofascore.p.rapidapi.com'
        }
      });
      console.log("SUCCESS on", url);
      return;
    } catch (e) {
      console.error("ERROR on", url, e.response?.status, e.response?.data?.message || e.response?.data);
    }
  }
}
test();
