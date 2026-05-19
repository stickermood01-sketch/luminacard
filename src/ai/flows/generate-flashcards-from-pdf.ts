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

// Prompt definition for Gemini
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
6. **UNIQUENESS IS CRITICAL**: Review the 'existingQuestions' list below. DO NOT repeat any of these questions or create very similar ones. Every card generated now must be NEW and provide fresh value.
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

/**
 * Fallback function to call DeepSeek API if Gemini fails.
 */
async function callDeepSeekFallback(input: GenerateFlashcardsFromPdfInput): Promise<GenerateFlashcardsFromPdfOutput> {
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

  if (!DEEPSEEK_API_KEY) {
    console.error('DeepSeek Fallback requested but DEEPSEEK_API_KEY is missing.');
    throw new Error('Fallback provider (DeepSeek) is not configured. Check your environment variables.');
  }

  const existingQuestionsText = input.existingQuestions?.length 
    ? `\nExisting Questions (DO NOT REPEAT ANY OF THESE):\n${input.existingQuestions.map(q => `- ${q}`).join('\n')}` 
    : '';

  const topicText = input.topic ? `\nFocus Topic: ${input.topic}` : '';

  const systemPrompt = `You are an expert educator. Extract key concepts from study material to create unique flashcards.
Output MUST be a JSON object with a "flashcards" property containing an array of objects with "front", "back", and "difficulty" fields.
Ensure 30% Easy, 40% Medium, 30% Hard questions.
CRITICAL: Do NOT repeat any questions provided in the 'Existing Questions' list.`;

  const userPrompt = `Generate ${input.numberOfFlashcards || 10} unique flashcards from this content:

${input.pdfTextContent}
${topicText}
${existingQuestionsText}

Return JSON format only: {"flashcards": [{"front": "...", "back": "...", "difficulty": "easy"}]}`;

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 1.0,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`DeepSeek API error (${response.status}): ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    let content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('DeepSeek returned an empty response.');
    }

    // Clean Markdown blocks if present
    if (content.includes('```json')) {
      content = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
      content = content.split('```')[1].split('```')[0].trim();
    }

    const parsed = JSON.parse(content);
    if (!parsed.flashcards) {
      throw new Error('DeepSeek JSON is missing "flashcards" property.');
    }

    return parsed as GenerateFlashcardsFromPdfOutput;
  } catch (error: any) {
    console.error('DeepSeek Fallback failed definitively:', error.message);
    throw error;
  }
}

// Flow definition
const generateFlashcardsFromPdfFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFromPdfFlow',
    inputSchema: GenerateFlashcardsFromPdfInputSchema,
    outputSchema: GenerateFlashcardsFromPdfOutputSchema,
  },
  async (input) => {
    console.log(`[AI Flow] Starting generation for: ${input.topic || 'General'}`);
    
    // TIER 1: GOOGLE GEMINI
    try {
      console.log('[AI Flow] Attempting primary provider: Gemini...');
      const { output } = await generateFlashcardsPrompt(input);
      
      if (!output || !output.flashcards || output.flashcards.length === 0) {
        throw new Error('Gemini returned empty flashcards.');
      }
      
      console.log('[AI Flow] Success: Gemini generated', output.flashcards.length, 'cards.');
      return output;
    } catch (geminiError: any) {
      // Log the error but DO NOT throw. Switch to fallback immediately.
      const errorMsg = geminiError.message || 'Unknown Gemini error';
      console.warn(`[AI Flow] Gemini failed (${errorMsg}). Switching to DeepSeek fallback SILENTLY...`);

      // TIER 2: DEEPSEEK FALLBACK
      try {
        const result = await callDeepSeekFallback(input);
        console.log('[AI Flow] Success: DeepSeek fallback generated', result.flashcards.length, 'cards.');
        return result;
      } catch (deepseekError: any) {
        // Only if both fail do we throw an error to the UI
        console.error('[AI Flow] Critical: Both Gemini and DeepSeek failed.');
        throw new Error('Unable to generate flashcards: Both AI providers are currently unavailable. Please check quotas.');
      }
    }
  }
);
