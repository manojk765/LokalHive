
'use server';
/**
 * @fileOverview AI flow to generate suggestions for session titles and descriptions.
 *
 * - generateSessionContentSuggestions - A function that generates content suggestions.
 * - SessionContentInput - The input type for the function.
 * - SessionContentOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Removed 'export' from the schema definitions
const SessionContentInputSchema = z.object({
  sessionTopic: z
    .string()
    .min(3, 'Session topic must be at least 3 characters.')
    .describe('The main topic or subject of the skill-sharing session.'),
  keywords: z
    .string()
    .optional()
    .describe('Comma-separated keywords related to the session (e.g., "beginner, web development, JavaScript").'),
  targetAudience: z
    .string()
    .optional()
    .describe('The intended audience for the session (e.g., "absolute beginners," "intermediate users," "kids").'),
  currentDraftTitle: z
    .string()
    .optional()
    .describe('An existing draft title the teacher might want to improve.'),
  currentDraftDescription: z
    .string()
    .optional()
    .describe('An existing draft description the teacher might want to improve or expand upon.'),
  desiredTone: z
    .enum(['friendly', 'professional', 'enthusiastic', 'technical', 'simple'])
    .optional()
    .describe('The desired tone for the generated content.'),
});
export type SessionContentInput = z.infer<typeof SessionContentInputSchema>;

// Removed 'export' from the schema definitions
const SessionContentOutputSchema = z.object({
  suggestedTitles: z
    .array(z.string())
    .describe('A list of 3-5 catchy and relevant title suggestions for the session.'),
  suggestedDescriptions: z
    .array(z.string())
    .describe('A list of 2-3 engaging and informative description suggestions for the session.'),
  tipsForEngagement: z
    .array(z.string())
    .optional()
    .describe('A few general tips for making the session content more engaging for learners.'),
});
export type SessionContentOutput = z.infer<typeof SessionContentOutputSchema>;

// Exported function that the client calls
export async function generateSessionContentSuggestions(input: SessionContentInput): Promise<SessionContentOutput> {
  return sessionContentFlow(input);
}

const sessionContentSuggestionPrompt = ai.definePrompt({
  name: 'sessionContentSuggestionPrompt',
  input: { schema: SessionContentInputSchema }, // Schema used internally
  output: { schema: SessionContentOutputSchema }, // Schema used internally
  prompt: `You are an expert creative copywriter specializing in educational content for skill-sharing platforms.
A teacher needs help crafting compelling titles and descriptions for their upcoming session.

Session Details Provided by Teacher:
- Topic: {{{sessionTopic}}}
{{#if keywords}}- Keywords: {{{keywords}}}{{/if}}
{{#if targetAudience}}- Target Audience: {{{targetAudience}}}{{/if}}
{{#if currentDraftTitle}}- Current Draft Title: {{{currentDraftTitle}}}{{/if}}
{{#if currentDraftDescription}}- Current Draft Description: {{{currentDraftDescription}}}{{/if}}
{{#if desiredTone}}- Desired Tone: {{{desiredTone}}}{{else}}- Desired Tone: Friendly and inviting{{/if}}

Your Task:
1.  Generate 3-5 unique, catchy, and informative titles for this session. Titles should be relatively short and grab attention.
2.  Generate 2-3 engaging descriptions for this session. Descriptions should clearly state what learners will gain, be easy to understand, and encourage sign-ups. Aim for descriptions of about 2-4 sentences each.
3.  Optionally, provide 1-2 general tips for the teacher on how to make their overall session content (title, description, materials) more engaging for learners.

Ensure the tone of your suggestions matches the 'Desired Tone' (or default to friendly and inviting).
If draft content is provided, try to improve upon it or offer alternatives rather than just repeating it.

Return the output in the specified JSON format.
{{jsonSchema outputSchema}}
`,
});

const sessionContentFlow = ai.defineFlow(
  {
    name: 'sessionContentFlow',
    inputSchema: SessionContentInputSchema, // Schema used internally
    outputSchema: SessionContentOutputSchema, // Schema used internally
  },
  async (input: SessionContentInput) => {
    console.log("AI Content Flow: Received input:", input);
    try {
      const {output} = await sessionContentSuggestionPrompt(input);
      if (!output) {
        console.error("AI Content Flow: Prompt output was null or undefined.");
        // Return a structured error or default empty suggestions
        return { suggestedTitles: [], suggestedDescriptions: [], tipsForEngagement: ["Could not generate suggestions at this time. Please try again."] };
      }
      console.log("AI Content Flow: Received output from AI:", output);
      return output;
    } catch (e: any) {
      console.error("AI Content Flow: Error during prompt execution:", e);
      return {
        suggestedTitles: [],
        suggestedDescriptions: [],
        tipsForEngagement: [`An error occurred: ${e.message || "Unknown error"}`],
      };
    }
  }
);
