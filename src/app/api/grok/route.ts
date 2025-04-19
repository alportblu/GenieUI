import { NextResponse } from 'next/server'
import { generateGrokResponse } from '@/lib/api/grok'

export async function POST(req: Request) {
  try {
    const { sessionToken, prompt } = await req.json();
    if (!sessionToken || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const result = await generateGrokResponse(sessionToken, prompt);
    return NextResponse.json({ response: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to call Grok' }, { status: 500 });
  }
} 