import axios from 'axios';
async function test() {
  const hosts = [
    'sofascore.p.rapidapi.com',
    'sofasport.p.rapidapi.com',
    'sportapi7.p.rapidapi.com',
    'api-football-v1.p.rapidapi.com'
  ];
  const url = '/matches/v1/events/schedule/date';
  
  for (const host of hosts) {
    try {
      const response = await axios.get(`https://${host}${url}`, {
        params: { date: '2024-06-20' },
        headers: {
          'X-RapidAPI-Key': 'da55d90e6fmsh9c98df101001573p162a11jsnc6d3574fdcbb',
          'X-RapidAPI-Host': host
        }
      });
      console.log(`SUCCESS on ${host}`);
    } catch (e) {
      console.error(`ERROR on ${host}`, e.response?.status, e.response?.data?.message || e.response?.data);
    }
  }
}
test();
