import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  console.log('[API /openai] Received request');
  try {
    const { apiKey, model, messages, stream, max_tokens } = await req.json();
    console.log(`[API /openai] Model: ${model}, Stream: ${stream}, Tokens: ${max_tokens}`);
    if (!apiKey || !model || !messages) {
      console.error('[API /openai] Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Montar request para OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: !!stream,
        max_tokens: max_tokens || undefined,
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }
    // Se for streaming, repassar o stream
    if (stream) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }
    // Se não for streaming, repassar o JSON
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API /openai] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to call OpenAI' }, { status: 500 });
  }
} 