import axios from 'axios'

interface GoogleResponse {
  candidates: {
    content: {
      parts: {
        text: string
      }[]
    }
  }[]
}

export async function generateGoogleResponse(
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  try {
    const response = await axios.post<GoogleResponse>(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      },
      {
        params: {
          key: apiKey,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data.candidates[0].content.parts[0].text
  } catch (error) {
    console.error('Error calling Google API:', error)
    throw new Error('Failed to generate response from Google')
  }
} 