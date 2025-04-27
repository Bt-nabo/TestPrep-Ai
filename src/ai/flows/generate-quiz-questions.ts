'use server';

/**
 * @fileOverview Generates quiz questions using a language model based on user-provided parameters.
 *
 * - generateQuizQuestions - A function that generates quiz questions.
 * - GenerateQuizQuestionsInput - The input type for the generateQuizQuestions function.
 * - GenerateQuizQuestionsOutput - The return type for the generateQuizQuestions function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateQuizQuestionsInputSchema = z.object({
  quizClass: z.string().describe('The class for which the quiz is being generated (e.g., Math 101).'),
  quizSubject: z.string().describe('The subject of the quiz (e.g., Algebra).'),
  quizTopic: z.string().describe('The specific topic or chapter for the quiz (e.g., Linear Equations).'),
  numQuestions: z.number().min(1).max(100).describe('The number of questions to generate for the quiz.'),
});
export type GenerateQuizQuestionsInput = z.infer<typeof GenerateQuizQuestionsInputSchema>;

const GeneratedQuestionSchema = z.object({
  question: z.string().describe('The text of the generated question.'),
  answer: z.string().describe('The correct answer to the question.'),
  isMultipleChoice: z.boolean().describe('Whether the question is multiple choice.'),
  options: z.array(z.string()).optional().describe('The multiple choice options, if applicable.'),
});

const GenerateQuizQuestionsOutputSchema = z.array(GeneratedQuestionSchema).describe('An array of generated questions and answers.');
export type GenerateQuizQuestionsOutput = z.infer<typeof GenerateQuizQuestionsOutputSchema>;

export async function generateQuizQuestions(input: GenerateQuizQuestionsInput): Promise<GenerateQuizQuestionsOutput> {
  return generateQuizQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizQuestionsPrompt',
  input: {
    schema: z.object({
      quizClass: z.string().describe('The class for which the quiz is being generated (e.g., Math 101).'),
      quizSubject: z.string().describe('The subject of the quiz (e.g., Algebra).'),
      quizTopic: z.string().describe('The specific topic or chapter for the quiz (e.g., Linear Equations).'),
      numQuestions: z.number().min(1).max(100).describe('The number of questions to generate for the quiz.'),
    }),
  },
  output: {
    schema: z.array(z.object({
      question: z.string().describe('The text of the generated question.'),
      answer: z.string().describe('The correct answer to the question.'),
      isMultipleChoice: z.boolean().describe('Whether the question is multiple choice.'),
      options: z.array(z.string()).optional().describe('The multiple choice options, if applicable.'),
    })),
  },
  prompt: `You are an expert quiz generator.  You will generate a list of multiple choice questions and answers, based on the provided class, subject, and topic.

Class: {{{quizClass}}}
Subject: {{{quizSubject}}}
Topic: {{{quizTopic}}}
Number of Questions: {{{numQuestions}}}

Generate {{{numQuestions}}} questions and answers. Determine if a question is a multiple-choice question (MCQ).
If the question is an MCQ, include the question, answer, and options. Otherwise, include just the question and answer.

Return the questions and answers as a JSON array of objects.  Each object should have a "question", an "answer", an "isMultipleChoice" (boolean), and optionally an "options" field (array of strings).
`,
});

const generateQuizQuestionsFlow = ai.defineFlow<
  typeof GenerateQuizQuestionsInputSchema,
  typeof GenerateQuizQuestionsOutputSchema
>({
  name: 'generateQuizQuestionsFlow',
  inputSchema: GenerateQuizQuestionsInputSchema,
  outputSchema: GenerateQuizQuestionsOutputSchema,
},
async input => {
  const {output} = await prompt(input);
  return output!;
});

