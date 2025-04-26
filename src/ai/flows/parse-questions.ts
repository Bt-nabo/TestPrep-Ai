'use server';
/**
 * @fileOverview Parses questions and answers from uploaded text or PDF files,
 * detecting question type (MCQ or normal) and extracting options for MCQs.
 *
 * - parseQuestions - A function that handles parsing questions from uploaded files.
 * - ParseQuestionsInput - The input type for the parseQuestions function.
 * - ParseQuestionsOutput - The return type for the parseQuestions function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ParseQuestionsInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "The content of the uploaded .txt or .pdf file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  fileType: z.enum(['.txt', '.pdf']).describe('The type of the uploaded file.'),
});
export type ParseQuestionsInput = z.infer<typeof ParseQuestionsInputSchema>;

const ParsedQuestionSchema = z.object({
  question: z.string().describe('The text of the question.'),
  answer: z.string().describe('The correct answer to the question.'),
  isMultipleChoice: z.boolean().describe('Whether the question is multiple choice.'),
  options: z.array(z.string()).optional().describe('The multiple choice options, if applicable.'),
});

const ParseQuestionsOutputSchema = z.array(ParsedQuestionSchema).describe('An array of parsed questions and answers.');
export type ParseQuestionsOutput = z.infer<typeof ParseQuestionsOutputSchema>;

export async function parseQuestions(input: ParseQuestionsInput): Promise<ParseQuestionsOutput> {
  return parseQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseQuestionsPrompt',
  input: {
    schema: z.object({
      fileDataUri: z
        .string()
        .describe(
          "The content of the uploaded .txt or .pdf file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
      fileType: z.enum(['.txt', '.pdf']).describe('The type of the uploaded file.'),
    }),
  },
  output: {
    schema: z.array(z.object({
      question: z.string().describe('The text of the question.'),
      answer: z.string().describe('The correct answer to the question.'),
      isMultipleChoice: z.boolean().describe('Whether the question is multiple choice.'),
      options: z.array(z.string()).optional().describe('The multiple choice options, if applicable.'),
    })),
  },
  prompt: `You are an expert at extracting questions and answers from text files.

  Analyze the content of the uploaded file and extract all question and answer pairs.
  Determine if a question is a multiple-choice question (MCQ) based on the presence of options (e.g., A, B, C, D) listed after the question.
  If the question is an MCQ, extract the question, answer, and options. Otherwise, extract just the question and answer.

  Return the questions and answers as a JSON array of objects.  Each object should have a "question", an "answer", an "isMultipleChoice" (boolean), and optionally an "options" field (array of strings).

  Ensure that the "question" and "answer" fields are properly formatted and contain the extracted content.  The options field should only be present for MCQs.

  Here is the file content:
  {{media url=fileDataUri}}
  `,
});

const parseQuestionsFlow = ai.defineFlow<
  typeof ParseQuestionsInputSchema,
  typeof ParseQuestionsOutputSchema
>({
  name: 'parseQuestionsFlow',
  inputSchema: ParseQuestionsInputSchema,
  outputSchema: ParseQuestionsOutputSchema,
},
async input => {
  const {output} = await prompt(input);
  return output!;
});
