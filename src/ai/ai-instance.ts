import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: 'AIzaSyDf6LkyprfPO2jVqeeU1t4Ptus-Sccd2t8',
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
