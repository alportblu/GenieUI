import axios from 'axios'

interface SearchResult {
  title: string
  link: string
  snippet: string
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
  try {
    // Using DuckDuckGo's HTML API
    const response = await axios.get('https://html.duckduckgo.com/html/', {
      params: {
        q: query,
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    // Parse the HTML response to extract search results
    const results: SearchResult[] = []
    const parser = new DOMParser()
    const doc = parser.parseFromString(response.data, 'text/html')
    const searchResults = doc.querySelectorAll('.result')

    searchResults.forEach((result) => {
      const title = result.querySelector('.result__title')?.textContent?.trim() || ''
      const link = result.querySelector('.result__url')?.getAttribute('href') || ''
      const snippet = result.querySelector('.result__snippet')?.textContent?.trim() || ''

      if (title && link) {
        results.push({ title, link, snippet })
      }
    })

    return results
  } catch (error) {
    console.error('Error searching web:', error)
    throw new Error('Failed to search web')
  }
} 