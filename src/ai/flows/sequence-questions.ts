// src/ai/flows/sequence-questions.ts
'use server';

/**
 * @fileOverview Sequences questions based on difficulty and user performance for adaptive testing.
 *
 * - sequenceQuestions - A function to sequence questions for adaptive testing.
 * - SequenceQuestionsInput - The input type for the sequenceQuestions function.
 * - SequenceQuestionsOutput - The output type for the sequenceQuestions function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

const SequenceQuestionsInputSchema = z.object({
  questions: z.array(z.string()).describe('Array of questions to be sequenced.'),
  userPerformance: z.array(z.object({
    question: z.string(),
    correct: z.boolean(),
  })).optional().describe('Array of user performance data on previous questions.'),
});
export type SequenceQuestionsInput = z.infer<typeof SequenceQuestionsInputSchema>;

const SequenceQuestionsOutputSchema = z.object({
  orderedQuestions: z.array(z.string()).describe('Array of questions ordered for adaptive testing.'),
});
export type SequenceQuestionsOutput = z.infer<typeof SequenceQuestionsOutputSchema>;

export async function sequenceQuestions(input: SequenceQuestionsInput): Promise<SequenceQuestionsOutput> {
  return sequenceQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'sequenceQuestionsPrompt',
  input: {
    schema: z.object({
      questions: z.array(z.string()).describe('Array of questions to be sequenced.'),
      userPerformance: z.array(z.object({
        question: z.string(),
        correct: z.boolean(),
      })).optional().describe('Array of user performance data on previous questions.'),
    }),
  },
  output: {
    schema: z.object({
      orderedQuestions: z.array(z.string()).describe('Array of questions ordered for adaptive testing.'),
    }),
  },
  prompt: `You are an expert in creating adaptive tests. Given the following list of questions, and the user's performance on previous questions, determine the optimal sequence for presenting the questions to the user.

Questions:
{{#each questions}}
- {{{this}}}
{{/each}}

{{#if userPerformance}}
User Performance:
{{#each userPerformance}}
- Question: {{{this.question}}}, Correct: {{{this.correct}}}
{{/each}}
{{/if}}

Return the questions in the optimal order for adaptive testing. Consider the user's past performance to tailor the quiz to their needs. Output only the ordered list of questions.
`,
});

const sequenceQuestionsFlow = ai.defineFlow<
  typeof SequenceQuestionsInputSchema,
  typeof SequenceQuestionsOutputSchema
>({
  name: 'sequenceQuestionsFlow',
  inputSchema: SequenceQuestionsInputSchema,
  outputSchema: SequenceQuestionsOutputSchema,
}, async input => {
  const { output } = await prompt(input);
  return output!;
});
