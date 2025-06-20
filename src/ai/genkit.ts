import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

if (!process.env.GOOGLE_API_KEY && process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  process.env.GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
}

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
