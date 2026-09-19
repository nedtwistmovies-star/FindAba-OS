import axios from 'axios';

const queries = [
  "What is the latest news in Aba today?",
  "What is the latest news in Ugwunagbo?",
  "What is the latest news in Ukwa West?",
  "What is the latest news in Ukwa East?",
  "What happened in Abia today?",
  "Who is the governor of Abia?",
  "Find leather suppliers in Aba."
];

async function runTests() {
  for (const q of queries) {
    console.log(`\nTESTING: "${q}"`);
    try {
      const start = Date.now();
      const res = await axios.post('http://localhost:3000/api/oracle', { 
        prompt: q,
        history: []
      }, { timeout: 15000 });
      const duration = Date.now() - start;
      
      console.log(`- Status: PASS (${duration}ms)`);
      console.log(`- Excerpt: ${res.data.text.substring(0, 150)}...`);
      console.log(`- Grounding: ${res.data.grounding ? res.data.grounding.length : 0} sources`);
      if (res.data.grounding?.[0]?.web?.uri) {
        console.log(`- Sample URL: ${res.data.grounding[0].web.uri}`);
      }
    } catch (err: any) {
      console.log(`- Status: FAIL`);
      console.log(`- Error: ${err.message}`);
      if (err.response) console.log(`- Data: ${JSON.stringify(err.response.data)}`);
    }
  }
}

runTests();
