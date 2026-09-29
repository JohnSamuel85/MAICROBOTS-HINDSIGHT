import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf8');
const env = {};
envText.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
  if (match) {
    env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});

const apiKey = env['HINDSIGHT_API_KEY'];
const bankId = env['HINDSIGHT_BANK_ID'] || 'MAICROBOTS';
const endpoint = env['HINDSIGHT_ENDPOINT'] || 'https://api.hindsight.vectorize.io';

const queries = [
  { category: 'API timeout', query: 'Payment gateway API is returning 504 errors during peak traffic. CPU is normal but database connections are almost full.' },
  { category: 'Customer escalation', query: 'An enterprise customer is suddenly receiving many 429 errors while using API v2.' },
  { category: 'Repeated payment failure', query: 'Several customer subscription renewals are failing because Stripe webhook events are not being processed correctly.' }
];

async function testAll() {
  for (const q of queries) {
    console.log('\n--- TESTING QUERY FOR:', q.category, '---');
    const res = await fetch(`${endpoint}/v1/default/banks/${bankId}/memories/recall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        query: q.query,
        budget: 'mid'
      })
    });
    const data = await res.json();
    const items = data.results || data.memories || data.documents || data.items || [];
    console.log(`Retrieved ${items.length} items from Hindsight Cloud API.`);
    const top2 = items.slice(0, 2);
    top2.forEach((item, idx) => {
      console.log(`Item #${idx + 1}:`, item.text || item.summary || item.content);
    });
  }
}

testAll();
