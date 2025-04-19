import axios from 'axios'

// Grok (X/Twitter) - API não-oficial, requer session token do X
// Docs: https://github.com/acheong08/Grok.js

export async function generateGrokResponse(
  sessionToken: string, // Cookie 'auth_token' do X
  prompt: string
): Promise<string> {
  try {
    const response = await axios.post(
      'https://grok.x.com/api/conversation',
      {
        query: prompt,
        // Outros campos podem ser necessários dependendo do wrapper
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth_token=${sessionToken}`,
          'User-Agent': 'Mozilla/5.0',
        },
      }
    )
    // O campo de resposta pode variar
    return response.data?.result?.response || response.data?.response || 'No response from Grok';
  } catch (error) {
    console.error('Error calling Grok API:', error)
    throw new Error('Failed to generate response from Grok (X/Twitter)')
  }
} 