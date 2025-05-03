import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint')
  
  if (!endpoint) {
    return NextResponse.json({ error: 'No endpoint provided' }, { status: 400 })
  }

  try {
    const response = await fetch(endpoint)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from Ollama' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  console.log('[API /ollama] Received request');
  const { searchParams } = new URL(req.url)
  const endpoint = searchParams.get('endpoint')
  
  if (!endpoint) {
    return NextResponse.json({ error: 'No endpoint provided' }, { status: 400 })
  }

  try {
    // Read the body ONCE
    const body = await req.json(); 
    console.log(`[API /ollama] Model: ${body.model}, Stream: ${body.stream}, Context: ${body.context_length}`);
    
    // Check properties from the body variable
    if (!body.model || !body.prompt) {
      console.error('[API /ollama] Missing required fields');
      return NextResponse.json({ error: 'Missing required fields: model and prompt' }, { status: 400 });
    }
    
    const ollamaResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!ollamaResponse.ok) {
      throw new Error('Failed to fetch from Ollama')
    }

    // If streaming is requested, stream the response
    if (body.stream) {
      const encoder = new TextEncoder()
      const decoder = new TextDecoder()

      const stream = new ReadableStream({
        async start(controller) {
          try {
            const reader = ollamaResponse.body?.getReader()
            if (!reader) throw new Error('No reader available')

            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value)
              controller.enqueue(encoder.encode(chunk))
            }
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // If not streaming, return the full response
    const data = await ollamaResponse.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[API /ollama] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to call Ollama' }, { status: 500 });
  }
} 