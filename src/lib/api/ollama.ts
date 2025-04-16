import { useModelStore } from '@/store/modelStore'

export interface OllamaModel {
  name: string
  modified_at: string
  size: number
  digest: string
  details?: {
    parameter_size?: string
    quantization_level?: string
    format?: string
    family?: string
    families?: string[]
  }
}

export interface OllamaResponse {
  models: OllamaModel[]
}

export async function listOllamaModels(): Promise<OllamaModel[]> {
  const { ollamaEndpoint } = useModelStore.getState()
  try {
    const response = await fetch(`/api/ollama?endpoint=${encodeURIComponent(`${ollamaEndpoint}/api/tags`)}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Ollama API error:', errorText)
      throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`)
    }
    
    const data: OllamaResponse = await response.json()
    console.log('Ollama models:', data.models) // Debug log
    return data.models
  } catch (error) {
    console.error('Error fetching models:', error)
    throw error
  }
}

export async function generateOllamaResponse(
  endpoint: string,
  model: string,
  prompt: string
): Promise<string> {
  try {
    const response = await fetch(`/api/ollama?endpoint=${encodeURIComponent(`${endpoint}/api/generate`)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Ollama API error:', errorText)
      throw new Error(`Failed to generate response: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.response
  } catch (error) {
    console.error('Error calling Ollama API:', error)
    throw error
  }
} 