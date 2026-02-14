import OpenAI from 'openai';
import { config } from '../config';

const openai = config.openai.apiKey
  ? new OpenAI({ apiKey: config.openai.apiKey })
  : null;

export type DraftType = 'policy' | 'email';

export async function generateDraft(
  type: DraftType,
  prompt: string
): Promise<{ content: string; error?: string }> {
  if (!openai) {
    return {
      content: '',
      error: 'OpenAI API key not configured. Add OPENAI_API_KEY to backend/.env',
    };
  }

  const systemPrompt =
    type === 'policy'
      ? `You are a professional HR policy writer for a recruitment governance platform. Draft clear, concise policies that enforce structured processes. Output only the policy text, no preamble.`
      : `You are a professional recruiter writing emails. Draft professional, concise emails for recruitment communication. Output only the email body, no subject unless requested. Use a professional tone.`;

  const userPrompt =
    type === 'policy'
      ? `Draft a recruitment-related policy based on: ${prompt}`
      : `Draft an email based on: ${prompt}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1024,
    });

    const content = completion.choices[0]?.message?.content?.trim() ?? '';
    return { content };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to generate draft';
    return { content: '', error: message };
  }
}
