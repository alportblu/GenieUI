import axios from 'axios'

interface AnthropicResponse {
  content: {
    text: string
  }[]
}

export async function generateAnthropicResponse(
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  try {
    const response = await axios.post<AnthropicResponse>(
      'https://api.anthropic.com/v1/messages',
      {
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data.content[0].text
  } catch (error) {
    console.error('Error calling Anthropic API:', error)
    throw new Error('Failed to generate response from Anthropic')
  }
} 