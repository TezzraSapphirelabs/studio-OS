'use server';

import { GoogleGenAI } from '@google/genai';
import { Message } from '@/services/ai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateAIResponseAction(userMessage: string, history: Message[] = []): Promise<string> {
  try {
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: [
        ...formattedHistory,
        { role: 'user', parts: [{ text: userMessage }] }
      ]
    });

    if (response.text) {
      return response.text;
    } else {
      throw new Error('No response text returned from Gemini API.');
    }
  } catch (error: unknown) {
    console.error('Gemini API Error:', error);
    if (error instanceof Error) {
      throw new Error(`AI generation failed: ${error.message}`);
    }
    throw new Error('AI generation failed due to an unknown error.');
  }
}
