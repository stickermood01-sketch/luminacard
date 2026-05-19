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
});
export type GenerateFlashcardsFromPdfInput = z.infer<typeof GenerateFlashcardsFromPdfInputSchema>;

// Output Schema
const FlashcardSchema = z.object({
  front: z.string().describe('The question or term on the front of the flashcard.'),
  back: z.string().describe('The answer or definition on the back of the flashcard.'),
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
  prompt: `You are an expert educator tasked with creating high-quality flashcards from study material.\nYour goal is to extract key concepts, definitions, and questions from the provided 'pdfTextContent' and turn them into concise flashcards.\n\nInstructions:\n1. Read the provided 'pdfTextContent' carefully.\n2. Identify the most important concepts, terms, and facts.\n3. For each key concept, create one flashcard with a 'front' (question/term) and a 'back' (answer/definition).\n4. If a 'topic' is provided, prioritize flashcards relevant to that topic.\n5. Generate approximately {{{numberOfFlashcards}}} flashcards, focusing on the most important information.\n6. Ensure the 'front' is a clear question or term and the 'back' is a concise and accurate answer or definition.\n\nPDF Text Content:\n{{{pdfTextContent}}}\n\n{{#if topic}}\nTopic: {{{topic}}}\n{{/if}}\n\nOutput the flashcards as a JSON array of objects, where each object has a 'front' and 'back' field.`,
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
