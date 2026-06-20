import { base44 } from '@/api/base44Client';

export async function getUserApiKey(userId) {
  const keys = await base44.entities.UserApiKey.filter({ user_id: userId });
  return keys[0] || null;
}

/**
 * Call OpenAI chat completions using the current user's stored API key.
 * @param {{ userId: string, messages: Array, model?: string, maxTokens?: number }} opts
 */
export async function callOpenAI({ userId, messages, model = 'gpt-4o-mini', maxTokens = 1000 }) {
  const record = await getUserApiKey(userId);
  if (!record?.openai_api_key) {
    throw new Error('No OpenAI API key configured. Please add your key in AI Settings.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${record.openai_api_key}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

export async function testApiKey(apiKey) {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
  return response.ok;
}
