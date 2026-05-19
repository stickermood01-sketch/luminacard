'use server';
/**
 * @fileOverview A Genkit flow for generating flashcards from provided PDF text content using AI.
 *
 * - generateFlashcardsFromPdf - A function that handles the flashcard generation process.
 * - GenerateFlashcardsFromPdfInput - The input type for the generateFlashcardsFromPdf function.
 * - GenerateFlashcardsFromPdfOutput - The return type for the generateFlashcardsFromPdf function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema
const GenerateFlashcardsFromPdfInputSchema = z.object({
  pdfTextContent: z.string().describe('The extracted text content from the PDF document.'),
  topic: z.string().optional().describe('An optional topic or context for the PDF content, to guide flashcard generation.'),
  numberOfFlashcards: z.number().int().min(1).optional().describe('The desired number of flashcards to generate.').default(10),
  existingQuestions: z.array(z.string()).optional().describe('A list of already existing questions to avoid duplicates.'),
});
export type GenerateFlashcardsFromPdfInput = z.infer<typeof GenerateFlashcardsFromPdfInputSchema>;

// Output Schema
const FlashcardSchema = z.object({
  front: z.string().describe('The question or term on the front of the flashcard.'),
  back: z.string().describe('The answer or definition on the back of the flashcard.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().describe('The difficulty level of the card.'),
});

const GenerateFlashcardsFromPdfOutputSchema = z.object({
  flashcards: z.array(FlashcardSchema).describe('An array of generated flashcards.'),
});
export type GenerateFlashcardsFromPdfOutput = z.infer<typeof GenerateFlashcardsFromPdfOutputSchema>;

// Wrapper function for the flow
export async function generateFlashcardsFromPdf(
  input: GenerateFlashcardsFromPdfInput
): Promise<GenerateFlashcardsFromPdfOutput> {
  return generateFlashcardsFromPdfFlow(input);
}

// Prompt definition
const generateFlashcardsPrompt = ai.definePrompt({
  name: 'generateFlashcardsFromPdfPrompt',
  input: { schema: GenerateFlashcardsFromPdfInputSchema },
  output: { schema: GenerateFlashcardsFromPdfOutputSchema },
  config: {
    temperature: 1.0,
  },
  prompt: `You are an expert educator tasked with creating high-quality, unique flashcards from study material.
Your goal is to extract key concepts, definitions, and questions from the provided 'pdfTextContent' and turn them into concise flashcards.

Instructions:
1. Read the provided 'pdfTextContent' carefully.
2. Identify the most important concepts, terms, and facts.
3. For each key concept, create one flashcard with a 'front' (question/term) and a 'back' (answer/definition).
4. If a 'topic' is provided, prioritize flashcards relevant to that topic.
5. Generate approximately {{{numberOfFlashcards}}} flashcards.
6. **UNQUENESS IS CRITICAL**: Review the 'existingQuestions' list below. DO NOT repeat any of these questions or create very similar ones. Every card generated now must be NEW and provide fresh value.
7. **DIFFICULTY MIX**: Ensure a balanced mix of difficulty levels:
   - 30% Easy (basic definitions and simple facts)
   - 40% Medium (conceptual understanding and relationship between ideas)
   - 30% Hard (application of knowledge, analysis, or complex problem-solving)
8. Ensure the 'front' is a clear question or term and the 'back' is a concise and accurate answer or definition.

PDF Text Content:
{{{pdfTextContent}}}

{{#if existingQuestions}}
Existing Questions (DO NOT REPEAT):
{{#each existingQuestions}}
- {{{this}}}
{{/each}}
{{/if}}

{{#if topic}}
Topic: {{{topic}}}
{{/if}}

Output the flashcards as a JSON array of objects, where each object has a 'front' and 'back' field.`,
});

// Flow definition
const generateFlashcardsFromPdfFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFromPdfFlow',
    inputSchema: GenerateFlashcardsFromPdfInputSchema,
    outputSchema: GenerateFlashcardsFromPdfOutputSchema,
  },
  async (input) => {
    const { output } = await generateFlashcardsPrompt(input);
    if (!output) {
      throw new Error('Failed to generate flashcards.');
    }
    return output;
  }
);
