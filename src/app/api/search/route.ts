import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');

  console.log(`🔍 API Search request: query=${query}`);

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { 
      status: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  try {
    // Usar apenas DuckDuckGo para pesquisa
    const result = await searchDuckDuckGo(query);
    
    return NextResponse.json(result, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  } catch (error: any) {
    console.error(`Error in search API:`, error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while searching' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

async function searchDuckDuckGo(query: string) {
  try {
    console.log(`🦆 Buscando no DuckDuckGo: "${query}"`);
    
    // DuckDuckGo instant answer API
    const response = await axios.get(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&pretty=1&no_html=1&skip_disambig=1`,
      { timeout: 10000 } // Adicionando timeout de 10 segundos
    ).catch(error => {
      if (error.response) {
        // Se temos uma resposta com erro do servidor
        console.error(`🦆 DuckDuckGo search API error: ${error.response.status} - ${error.response.statusText}`);
        throw new Error(`DuckDuckGo search failed with status ${error.response.status}`);
      } else if (error.request) {
        // Se a requisição foi feita mas não houve resposta
        console.error('🦆 DuckDuckGo search API no response:', error.request);
        throw new Error('DuckDuckGo search request timed out or failed to receive a response');
      } else {
        // Erro ao configurar a requisição
        console.error('🦆 DuckDuckGo search API setup error:', error.message);
        throw new Error(`DuckDuckGo search setup error: ${error.message}`);
      }
    });

    console.log(`🦆 Resposta do DuckDuckGo recebida, tópicos: ${response.data?.RelatedTopics?.length || 0}`);
    
    return response.data;
  } catch (error: any) {
    console.error('DuckDuckGo search error:', error.message);
    throw new Error(`Failed to search with DuckDuckGo: ${error.message}`);
  }
} 