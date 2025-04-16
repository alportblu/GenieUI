import axios from 'axios'

interface OpenAIResponse {
  choices: {
    message: {
      content: string
    }
  }[]
}

export async function generateOpenAIResponse(
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  try {
    const response = await axios.post<OpenAIResponse>(
      'https://api.openai.com/v1/chat/completions',
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
    console.error('Error calling OpenAI API:', error)
    throw new Error('Failed to generate response from OpenAI')
  }
} 