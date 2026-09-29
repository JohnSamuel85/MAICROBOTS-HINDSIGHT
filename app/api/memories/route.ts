import { NextResponse } from 'next/server';
import { getAllMemories } from '@/lib/hindsight';

export const dynamic = 'force-dynamic';

export async function GET() {
  const memories = getAllMemories();
  return NextResponse.json({ memories, total: memories.length });
}
