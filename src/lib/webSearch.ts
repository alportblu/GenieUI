export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source?: string;
  date?: string;
}

/**
 * Função para realizar buscas no DuckDuckGo
 */
async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  try {
    console.log("🦆 Iniciando busca no DuckDuckGo para:", query);
    
    // Usando o proxy para API porque o DuckDuckGo não fornece CORS headers
    const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`Error searching DuckDuckGo: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("🦆 Dados recebidos do DuckDuckGo:", data);
    
    // DuckDuckGo API returns results in a specific format
    let results: SearchResult[] = [];
    
    // Processar os tópicos relacionados
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      console.log("🦆 Processando tópicos relacionados:", data.RelatedTopics.length);
      
      // Processar tópicos relacionados
      results = data.RelatedTopics
        .filter((topic: any) => {
          // Filtrar apenas tópicos válidos (objetos não vazios e não arrays)
          const isValid = topic && typeof topic === 'object' && !Array.isArray(topic);
          if (!isValid) {
            console.log("🦆 Tópico inválido:", topic);
          }
          return isValid;
        })
        .map((topic: any) => {
          // Extrair informações úteis
          let title = '';
          let snippet = '';
          
          if (topic.Text) {
            const parts = topic.Text.split(' - ');
            title = parts[0] || topic.Text;
            snippet = parts.length > 1 ? parts.slice(1).join(' - ') : '';
          }
          
          return {
            title: title,
            link: topic.FirstURL || '',
            snippet: snippet || topic.Text || '',
            source: 'DuckDuckGo'
          };
        })
        .filter((result: SearchResult) => result.title && result.link);
      
      console.log("🦆 Resultados processados:", results.length);
    } else {
      console.log("🦆 Sem tópicos relacionados ou formato inesperado:", data);
    }
    
    return results;
  } catch (error) {
    console.error('Error searching DuckDuckGo:', error);
    return [];
  }
}

/**
 * Função para realizar buscas na Wikipedia (para informações mais detalhadas)
 */
async function searchWikipedia(query: string): Promise<SearchResult[]> {
  try {
    console.log("📚 Iniciando busca na Wikipedia para:", query);
    
    // Usar a API pública da Wikipedia com CORS habilitado
    const response = await fetch(
      `https://en.wikipedia.org/w/api.php?` +
      `action=query&format=json&origin=*&prop=extracts|info&exintro=1&explaintext=1&` +
      `inprop=url&generator=search&gsrlimit=3&gsrsearch=${encodeURIComponent(query)}`
    );
    
    if (!response.ok) {
      throw new Error(`Error searching Wikipedia: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("📚 Dados recebidos da Wikipedia:", data);
    
    const results: SearchResult[] = [];
    
    if (data && data.query && data.query.pages) {
      for (const pageId in data.query.pages) {
        const page = data.query.pages[pageId];
        results.push({
          title: page.title || '',
          link: page.canonicalurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title || '')}`,
          snippet: page.extract 
            ? page.extract.substring(0, 300) + (page.extract.length > 300 ? '...' : '')
            : '',
          source: 'Wikipedia'
        });
      }
      console.log("📚 Resultados da Wikipedia processados:", results.length);
    } else {
      console.log("📚 Sem resultados da Wikipedia ou formato inesperado");
    }
    
    return results;
  } catch (error) {
    console.error('Error searching Wikipedia:', error);
    return [];
  }
}

/**
 * Função principal para buscar em várias fontes e combinar resultados
 */
export async function searchWeb(query: string): Promise<{
  results: SearchResult[];
  summary: string;
}> {
  try {
    console.log("🌐 Iniciando searchWeb para:", query);
    
    // Realizar buscas em paralelo para otimizar, com tratamento de erros para cada fonte
    const duckDuckGoPromise = searchDuckDuckGo(query).catch(error => {
      console.error("🌐 Erro na busca DuckDuckGo:", error);
      return [];
    });
    
    const wikipediaPromise = searchWikipedia(query).catch(error => {
      console.error("🌐 Erro na busca Wikipedia:", error);
      return [];
    });
    
    // Esperar todas as promessas, mesmo que algumas falhem
    const [duckDuckGoResults, wikipediaResults] = await Promise.all([
      duckDuckGoPromise, 
      wikipediaPromise
    ]);
    
    console.log("🌐 Resultados obtidos:", {
      duckDuckGo: duckDuckGoResults.length,
      wikipedia: wikipediaResults.length
    });
    
    // Combinar e ordenar resultados (priorizando fontes mais confiáveis)
    let combinedResults: SearchResult[] = [
      ...wikipediaResults,   // Prioridade para Wikipedia (informações mais detalhadas)
      ...duckDuckGoResults   // DuckDuckGo por último
    ];
    
    // Se não temos resultados de nenhuma fonte, tentar busca direta no DuckDuckGo
    if (combinedResults.length === 0) {
      console.log("🌐 Sem resultados de fontes principais, tentando busca direta...");
      
      try {
        // Usar uma abordagem diferente para DuckDuckGo que possa retornar mais resultados
        const directResults = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&pretty=1&no_html=1&skip_disambig=1`
        ).then(res => res.json());
        
        if (directResults && directResults.RelatedTopics) {
          combinedResults = directResults.RelatedTopics
            .filter((t: any) => t && t.FirstURL && t.Text)
            .map((t: any) => ({
              title: t.Text.split(' - ')[0] || t.Text,
              link: t.FirstURL,
              snippet: t.Text,
              source: 'DuckDuckGo Direct'
            }));
          
          console.log("🌐 Resultados diretos obtidos:", combinedResults.length);
        }
      } catch (directError) {
        console.error("🌐 Erro na busca direta:", directError);
      }
    }
    
    // Remover duplicatas por URL
    const uniqueUrls = new Set<string>();
    combinedResults = combinedResults.filter(result => {
      if (!result.link || uniqueUrls.has(result.link)) {
        return false;
      }
      uniqueUrls.add(result.link);
      return true;
    });
    
    console.log("🌐 Resultados após remoção de duplicatas:", combinedResults.length);
    
    // Limitar a quantidade de resultados para não sobrecarregar
    const limitedResults = combinedResults.slice(0, 10);
    
    // Garantir que temos pelo menos algum conteúdo
    if (limitedResults.length === 0) {
      console.log("🌐 Nenhum resultado encontrado após todos os processamentos");
      
      // Adicionar um resultado genérico informando sobre a falta de resultados
      limitedResults.push({
        title: `No results for "${query}"`,
        link: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        snippet: `No results found for "${query}". Try rephrasing your query or visit DuckDuckGo for manual search.`,
        source: 'Search System'
      });
    }
    
    // Gerar um resumo dos resultados encontrados para o AI
    const summary = createSearchSummary(query, limitedResults);
    
    return {
      results: limitedResults,
      summary
    };
  } catch (error) {
    console.error('Error in searchWeb:', error);
    return {
      results: [{
        title: 'Search Error',
        link: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        snippet: `There was an error searching for "${query}". Please try again or try a different search term.`,
        source: 'Error'
      }],
      summary: `Failed to search for information about "${query}". Please try again or try a different search term.`
    };
  }
}

/**
 * Função para criar um resumo formatado a partir dos resultados encontrados
 */
function createSearchSummary(query: string, results: SearchResult[]): string {
  if (results.length === 0) {
    return `No results found for "${query}".`;
  }
  
  const formattedDate = new Date().toISOString().split('T')[0]; // Data atual no formato YYYY-MM-DD
  
  let summary = `Search results for "${query}" as of ${formattedDate}:\n\n`;
  
  results.forEach((result, index) => {
    summary += `[${index + 1}] ${result.title}\n`;
    summary += `Source: ${result.source || 'Web'}\n`;
    summary += `URL: ${result.link}\n`;
    summary += `${result.snippet}\n\n`;
  });
  
  summary += `---\n`;
  summary += `These search results are provided to help answer the user's query about "${query}". `;
  summary += `Please use this information to form a comprehensive response. `;
  summary += `If the information is insufficient, you may acknowledge the limitations in the search results.`;
  
  return summary;
} 