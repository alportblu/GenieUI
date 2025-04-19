import { NextResponse } from 'next/server'
import { generateGroqResponse } from '@/lib/api/groq'

export async function POST(req: Request) {
  try {
    const { apiKey, model, prompt } = await req.json();
    if (!apiKey || !model || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const result = await generateGroqResponse(apiKey, model, prompt);
    return NextResponse.json({ response: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to call Groq' }, { status: 500 });
  }
} 