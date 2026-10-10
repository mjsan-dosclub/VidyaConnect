export const runtime = 'nodejs';
export const maxDuration = 60;
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { handle } from '@/lib/server';
import { TRANSCRIPTION_PROMPT, transcribeWithFallback } from '@/lib/transcription';
const payload = z.object({
  audio: z
    .string()
    .min(4)
    .max(2800000)
    .regex(/^[A-Za-z0-9+/]+={0,2}$/),
  mime: z.enum(['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav']),
  // Accepted for older clients only; interface language must never constrain speech.
  language: z.enum(['en', 'ta']).optional(),
});
const output = z.object({ transcript: z.string().max(8000) });
export const POST = handle(
  async (req) => {
    const p = payload.parse(await req.json());
    if (!process.env.GEMINI_API_KEY)
      throw new Error(
        'AI service is not configured. Please contact the booth team.',
      );
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const result = await transcribeWithFallback((model, timeout) =>
      ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: p.audio,
                  mimeType: p.mime === 'audio/mp4' ? 'audio/m4a' : p.mime,
                },
              },
              {
                text: TRANSCRIPTION_PROMPT,
              },
            ],
          },
        ],
        config: {
          httpOptions: { timeout, retryOptions: { attempts: 1 } },
          responseMimeType: 'application/json',
          responseJsonSchema: z.toJSONSchema(output),
        },
      }),
      process.env.GEMINI_TRANSCRIPTION_MODEL,
    );
    return output.parse(JSON.parse(result.text ?? '{}'));
  },
  true,
  2900000,
);
