import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function handleGeminiGenerate(prompt: string, systemInstruction?: string) {
  if (!aiClient || !process.env.GEMINI_API_KEY) {
    return {
      text: null,
      error: 'GEMINI_API_KEY not configured in environment. Using simulated gateway fallback.',
    };
  }

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || 'You are OmniFlow Control Assistant.',
      },
    });

    return {
      text: response.text ?? '',
      model: 'gemini-3.8-flash',
      error: null,
    };
  } catch (err: any) {
    return {
      text: null,
      error: err.message || 'Gemini generation error',
    };
  }
}
