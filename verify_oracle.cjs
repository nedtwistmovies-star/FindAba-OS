const http = require('http');

const prompts = [
  "what is the latest news in Aba",
  "what happened in Aba today",
  "latest news in Abia",
  "today's news in Ugwunagbo",
  "recent news in Ariaria",
  "latest Aba Power news",
  "Enyimba news",
  "current Aba news"
];

async function testPrompt(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      prompt: prompt,
      history: [],
      catalog: []
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/oracle',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      timeout: 30000
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, error: 'JSON Parse Error', body });
        }
      });
    });

    req.on('error', (e) => resolve({ error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ error: 'Timeout' }); });
    req.write(data);
    req.end();
  });
}

async function runSuite() {
  console.log("=== ORACLE NEWS VERIFICATION SUITE ===\n");
  for (const prompt of prompts) {
    console.log(`TESTING: "${prompt}"`);
    const result = await testPrompt(prompt);
    
    if (result.error) {
      console.log(`  [FAIL] Error: ${result.error}\n`);
      continue;
    }

    if (result.status !== 200) {
      console.log(`  [FAIL] HTTP ${result.status}: ${JSON.stringify(result.data)}\n`);
      continue;
    }

    const { text, grounding } = result.data;
    const hasArticles = grounding && grounding.length > 0;
    
    console.log(`  [OK] HTTP 200`);
    console.log(`  [OK] Intent Detected: ${text.length > 50 ? 'YES' : 'MAYBE'}`);
    console.log(`  [OK] Articles Retrieved: ${hasArticles ? grounding.length : '0 (Check sources)'}`);
    
    if (hasArticles) {
      const first = grounding[0].web;
      console.log(`  [OK] Title Present: ${!!first.title}`);
      console.log(`  [OK] Source Link Present: ${!!first.uri}`);
      console.log(`  [OK] Content Sample: ${text.substring(0, 100).replace(/\n/g, ' ')}...`);
    } else {
      console.log(`  [WARN] No articles in grounding. News sources might be silent or intent not flagged.`);
    }
    console.log("");
  }
}

runSuite();
