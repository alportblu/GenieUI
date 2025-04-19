import axios from 'axios'

interface GroqResponse {
  choices: {
    message: {
      content: string
    }
  }[]
}

export async function generateGroqResponse(
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  try {
    const response = await axios.post<GroqResponse>(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )
    return response.data.choices[0].message.content
  } catch (error) {
    console.error('Error calling Groq API:', error)
    throw new Error('Failed to generate response from Groq')
  }
} 