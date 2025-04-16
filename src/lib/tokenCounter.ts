/**
 * Estimativa simples de contagem de tokens para LLMs
 * Esta é uma aproximação baseada em regras simples e não é precisa como
 * os tokenizadores reais usados pelos modelos
 */

/**
 * Estima o número de tokens em um texto
 * Esta é uma aproximação geral, não uma contagem exata
 * Os modelos reais usam tokenizadores mais complexos
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  
  // Aproximação simples baseada em palavras e pontuação
  // Em média, 100 tokens são aproximadamente 75 palavras em inglês
  
  // Remover espaços extras
  const cleanedText = text.trim().replace(/\s+/g, ' ');
  
  // Contar palavras (sequências de caracteres separadas por espaços)
  const words = cleanedText.split(/\s+/).length;
  
  // Contar caracteres especiais que geralmente são tokenizados separadamente
  const specialChars = (cleanedText.match(/[.,!?;:()\[\]{}'"]/g) || []).length;
  
  // Caracteres não-ASCII (unicode) geralmente usam mais tokens
  const nonAsciiChars = (cleanedText.match(/[^\x00-\x7F]/g) || []).length;
  
  // Contar números, que geralmente são tokenizados digit-by-digit
  const numbers = (cleanedText.match(/\d+/g) || [])
    .reduce((count, num) => count + (num.length > 1 ? num.length : 1), 0);
  
  // Fórmula aproximada
  const tokenEstimate = Math.ceil(
    words * 1.33 + // palavras (em média, 1.33 tokens por palavra)
    specialChars * 0.7 + // caracteres especiais (nem todos consomem um token completo)
    nonAsciiChars * 1.5 + // caracteres não-ASCII (geralmente usam mais tokens)
    numbers * 0.5 // dígitos numéricos
  );
  
  return tokenEstimate;
}

/**
 * Estima o tamanho em tokens de um objeto JSON
 */
export function estimateJsonTokenCount(obj: any): number {
  if (!obj) return 0;
  
  // Converter o objeto para string JSON
  const jsonString = JSON.stringify(obj);
  
  // Estimar tokens a partir da string
  return estimateTokenCount(jsonString);
}

/**
 * Fornece uma representação amigável do tamanho do contexto
 */
export function formatContextSize(tokens: number): string {
  if (tokens < 1000) {
    return `${tokens} tokens`;
  } else if (tokens < 10000) {
    return `${(tokens / 1000).toFixed(1)}K tokens`;
  } else {
    return `${Math.round(tokens / 1000)}K tokens`;
  }
}

/**
 * Calcula a porcentagem de uso do contexto
 */
export function calculateContextUsage(tokens: number, maxContext: number): number {
  return Math.min(100, Math.round((tokens / maxContext) * 100));
} 