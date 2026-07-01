import axios from 'axios';

async function test() {
  const url = 'https://api-football-v1.p.rapidapi.com/v3/fixtures';
  try {
    const response = await axios.get(url, {
      params: { date: '2024-06-20' },
      headers: {
        'X-RapidAPI-Key': 'da55d90e6fmsh9c98df101001573p162a11jsnc6d3574fdcbb',
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
      }
    });
    console.log("SUCCESS on api-football", response.data.results);
  } catch (e) {
    console.error("ERROR", e.response?.status, e.response?.data?.message || e.response?.data);
  }
}
test();
