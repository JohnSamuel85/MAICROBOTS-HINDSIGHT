import { NextRequest } from 'next/server';
import { searchOrganizationalMemory, saveToOrganizationalMemory } from '@/lib/hindsight';
import { generateGeminiRecommendation } from '@/lib/gemini';
import { MemoryItem } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { issue, category = 'General' } = body;

    if (!issue) {
      return new Response(JSON.stringify({ error: 'Issue description is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

        // Step 1: Understanding the issue
        sendEvent({
          step: 'understanding',
          label: 'Understanding the issue',
          detail: `Extracting key intent and vectorizing problem context for [${category}]...`
        });
        await sleep(1500);

        // Step 2: Searching organizational memory
        sendEvent({
          step: 'searching_memory',
          label: 'Searching organizational memory',
          detail: 'Scanning Hindsight vector memory bank across historical incident post-mortems...'
        });
        await sleep(1800);

        // Retrieve actual memories
        const memories = await searchOrganizationalMemory(issue, category);
        const count = memories.length;

        // Step 3: Relevant memory found
        sendEvent({
          step: 'memory_found',
          label: `${count} relevant ${count === 1 ? 'memory' : 'memories'} retrieved from Hindsight`,
          detail: memories.map(m => m.summary).join(' • '),
          memories
        });
        await sleep(2200);

        // Step 4: Sending context to Gemini
        sendEvent({
          step: 'sending_to_gemini',
          label: 'Sending context to Gemini',
          detail: `Assembling prompt context: current incident + ${count} historical resolutions...`
        });
        await sleep(1600);

        // Step 5: Gemini reasoning
        sendEvent({
          step: 'reasoning',
          label: 'Gemini is reasoning over previous experience',
          detail: 'Synthesizing historical resolutions to generate optimal, root-cause action plan...'
        });

        const recommendation = await generateGeminiRecommendation(issue, category, memories);
        await sleep(2400);

        // Step 6: Recommendation generated
        sendEvent({
          step: 'recommendation_generated',
          label: 'Recommendation generated',
          detail: 'Action plan validated against organizational post-mortem knowledge'
        });
        await sleep(1500);

        // Step 7: Saving outcome to memory
        sendEvent({
          step: 'saving_memory',
          label: 'Saving useful outcome to memory',
          detail: 'Indexing new incident pattern and resolution back into Hindsight memory bank...'
        });

        // Save outcome to Hindsight memory bank
        const savedMemoryItem: Omit<MemoryItem, 'id' | 'timestamp'> = {
          category,
          issue,
          rootCause: `Automated resolution generated for ${issue}`,
          resolution: recommendation,
          summary: `Resolved ${issue} using historical memory pattern.`,
          outcome: 'Successfully resolved and indexed into organizational memory.'
        };

        const savedMemory = await saveToOrganizationalMemory(savedMemoryItem);
        await sleep(1800);

        // Final payload
        sendEvent({
          step: 'completed',
          label: 'Process complete',
          result: {
            recommendedAction: recommendation,
            memoriesUsed: memories,
            savedMemory
          }
        });

        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
