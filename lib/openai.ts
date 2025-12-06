import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set');
}

export const gemini = new GoogleGenerativeAI(GEMINI_API_KEY);

