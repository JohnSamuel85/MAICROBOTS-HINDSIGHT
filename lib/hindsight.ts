import { MemoryItem } from './types';

// Sample fallback memory data (3 entries corresponding to scenarios, strictly top 2 returned per query)
const DEFAULT_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-001',
    category: 'API timeout',
    issue: 'Payment API returned 504 errors during peak traffic.',
    rootCause: 'Database connection pool reached maximum limits during traffic spike.',
    resolution: 'Increased database connection pool size and optimized slow queries.',
    summary: 'Payment API returned 504 errors during peak traffic. Increasing DB connection pool and optimizing slow queries resolved the issue.',
    outcome: 'Resolved 504 latency spike.',
    timestamp: '2026-01-15T10:00:00Z'
  },
  {
    id: 'mem-002',
    category: 'Customer escalation',
    issue: 'Enterprise customer reported frequent 429 rate limit errors on API v2.',
    rootCause: 'High volume request concurrency exceeded single-token rate limits.',
    resolution: 'Implemented client-side request backoff and rate-limit headers handling.',
    summary: 'Enterprise customer received 429 errors on API v2. Adding rate-limit handling and request backoff resolved the escalation.',
    outcome: 'Resolved 429 rate limit escalation.',
    timestamp: '2026-02-10T14:30:00Z'
  },
  {
    id: 'mem-003',
    category: 'Repeated payment failure',
    issue: 'Subscription renewals failed due to Stripe webhook processing delays.',
    rootCause: 'Duplicate and delayed webhook events causing transaction state conflicts.',
    resolution: 'Added webhook retry handling and idempotency checks.',
    summary: 'Subscription renewals failed due to delayed Stripe webhooks. Adding webhook retry handling and idempotency checks fixed renewals.',
    outcome: 'Fixed subscription renewal drops.',
    timestamp: '2026-02-20T09:15:00Z'
  }
];

let localMemoryBank: MemoryItem[] = [...DEFAULT_MEMORIES];

function cleanHindsightText(text: string): string {
  if (!text) return '';
  return text.replace(/\s*\|\s*(Involving|When|Lesson learned|Context).*/gi, '').trim();
}

export async function searchOrganizationalMemory(query: string, category?: string): Promise<MemoryItem[]> {
  const apiKey = process.env.HINDSIGHT_API_KEY;
  const bankId = process.env.HINDSIGHT_BANK_ID || 'MAICROBOTS';
  const endpoint = process.env.HINDSIGHT_ENDPOINT || 'https://api.hindsight.vectorize.io';

  if (apiKey && apiKey.trim().length > 0) {
    const primaryUrl = `${endpoint}/v1/default/banks/${bankId}/memories/recall`;

    try {
      console.log(`[Hindsight Cloud API] Initiating live network recall request to bank '${bankId}'...`);
      const res = await fetch(primaryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          query,
          budget: 'mid',
          max_tokens: 4096
        })
      });

      console.log(`[Hindsight Cloud API] Response Status: ${res.status} ${res.statusText}`);

      if (res.ok) {
        const data = await res.json();
        const items = data.results || data.memories || data.documents || data.items || [];
        if (Array.isArray(items) && items.length > 0) {
          console.log(`[Hindsight Cloud API] Successfully retrieved ${items.length} live cloud memories.`);
          // Strictly cap retrieved memories to top 2 items
          const topItems = items.slice(0, 2);
          return topItems.map((r: any, idx: number) => {
            const rawText = cleanHindsightText(r.text || r.summary || r.content || r.issue || r.resolution || query);
            return {
              id: r.id || `cloud-hindsight-${idx + 1}`,
              category: r.category || category || 'General',
              issue: rawText,
              rootCause: r.rootCause || r.root_cause || r.what_happened || 'Incident recorded in Hindsight memory',
              resolution: r.resolution || r.solution || r.what_worked || rawText,
              summary: rawText,
              outcome: r.outcome || 'Resolved based on past organizational experience',
              timestamp: r.timestamp || r.mentioned_at || new Date().toISOString()
            };
          });
        }
      } else {
        const errorText = await res.text();
        console.warn(`[Hindsight Cloud API] Server returned ${res.status}: ${errorText}`);
      }
    } catch (e: any) {
      console.warn(`[Hindsight Cloud API] Network request error: ${e?.message || e}`);
    }
  } else {
    console.log('[Hindsight Memory] No HINDSIGHT_API_KEY supplied, performing local memory search.');
  }

  // Fallback to local memory scoring algorithm (strictly top 2)
  const queryLower = query.toLowerCase();
  const categoryLower = (category || '').toLowerCase();

  const scored = localMemoryBank.map(mem => {
    let score = 0;
    const memCat = mem.category.toLowerCase();
    const memIssue = mem.issue.toLowerCase();
    const memRoot = mem.rootCause.toLowerCase();
    const memRes = mem.resolution.toLowerCase();
    const memSum = mem.summary.toLowerCase();

    if (categoryLower && (memCat.includes(categoryLower) || categoryLower.includes(memCat))) {
      score += 4;
    }

    const terms = [
      '504', '429', 'timeout', 'traffic', 'peak', 'database', 'connection', 'pool', 'cpu',
      'saturated', 'workers', 'concurrency', 'escalation', 'enterprise', 'rate', 'limit',
      'backoff', 'payment', 'stripe', 'webhook', 'renewals', 'idempotency', 'retry'
    ];

    for (const term of terms) {
      if (queryLower.includes(term)) {
        if (memIssue.includes(term)) score += 3;
        if (memRoot.includes(term)) score += 2;
        if (memRes.includes(term)) score += 2;
        if (memSum.includes(term)) score += 2;
        if (memCat.includes(term)) score += 2;
      }
    }

    const words = queryLower.split(/\s+/).filter(w => w.length > 3);
    for (const w of words) {
      if (memIssue.includes(w)) score += 1;
      if (memSum.includes(w)) score += 1;
    }

    return { ...mem, relevanceScore: score };
  });

  scored.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  return scored.slice(0, 2);
}

export async function saveToOrganizationalMemory(item: Omit<MemoryItem, 'id' | 'timestamp'>): Promise<MemoryItem> {
  const newMemory: MemoryItem = {
    ...item,
    id: `mem-${Date.now().toString(36)}`,
    timestamp: new Date().toISOString()
  };

  const existingIdx = localMemoryBank.findIndex(m => m.id === newMemory.id || m.issue === newMemory.issue);
  if (existingIdx === -1) {
    localMemoryBank.unshift(newMemory);
  } else {
    localMemoryBank[existingIdx] = newMemory;
  }

  const apiKey = process.env.HINDSIGHT_API_KEY;
  const bankId = process.env.HINDSIGHT_BANK_ID || 'MAICROBOTS';
  const endpoint = process.env.HINDSIGHT_ENDPOINT || 'https://api.hindsight.vectorize.io';

  if (apiKey && apiKey.trim().length > 0) {
    try {
      await fetch(`${endpoint}/v1/default/banks/${bankId}/memories/retain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify(newMemory)
      });
    } catch (e) {
      console.warn('[Hindsight Cloud API] Save failed:', e);
    }
  }

  return newMemory;
}

export function getAllMemories(): MemoryItem[] {
  return [...localMemoryBank];
}
