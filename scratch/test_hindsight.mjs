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

console.log('Testing Hindsight Cloud API recall for bank:', bankId);

async function testRecall() {
  try {
    const res = await fetch(`${endpoint}/v1/default/banks/${bankId}/memories/recall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        query: 'Payment API returned 504 errors during peak traffic',
        budget: 'mid'
      })
    });
    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Body:', text);
  } catch (err) {
    console.error('Error:', err);
  }
}

testRecall();
