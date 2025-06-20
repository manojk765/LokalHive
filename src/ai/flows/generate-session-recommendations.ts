'use server';

/**
 * @fileOverview AI flow to generate personalized session recommendations for learners
 * based on actual sessions available in Firestore.
 *
 * - generateSessionRecommendations - A function that generates session recommendations.
 * - SessionRecommendationInput - The input type for the generateSessionRecommendations function.
 * - SessionRecommendationOutput - The return type for the generateSessionRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, limit, orderBy } from 'firebase/firestore';
import type { Session, SessionDocument } from '@/lib/types';

// This is the input schema expected from the client (e.g., RecommendationsPage)
const SessionRecommendationInputSchema = z.object({
  userProfile: z
    .string()
    .describe('Learner profile including skills, interests, and learning goals.'),
  location: z.string().describe('Learner current location (city, state).'),
  pastActivity: z
    .string()
    .describe('Learner past activity data including attended sessions and search history.'),
  availability: z.string().describe('The learners availability'),
});
export type SessionRecommendationInput = z.infer<typeof SessionRecommendationInputSchema>;

// This is the internal schema for the data we'll actually pass to the AI prompt
const PromptInputSchema = SessionRecommendationInputSchema.extend({
  availableSessions: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      category: z.string(),
      location: z.string(),
      dateTime: z.string(), // Pass as string for simplicity in prompt
      price: z.number(),
    })
  ).describe('A list of currently available confirmed sessions for the AI to choose from.'),
});
type PromptInput = z.infer<typeof PromptInputSchema>;


const SessionRecommendationOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      sessionId: z.string().describe("Unique identifier for the session (MUST come from the 'id' of a session in the provided 'Available Sessions List')."),
      title: z.string().describe('Title of the session.'),
      description: z.string().describe('Brief description of the session.'),
      category: z.string().describe('Category of the session.'),
      teacher: z.string().describe('Name of the teacher (can be inferred or use placeholder if not in provided session data).'),
      location: z.string().describe('Location of the session.'),
      dateTime: z.string().describe('Date and time of the session.'),
      price: z.number().describe('Price of the session.'),
    })
  ).describe('A list of personalized session recommendations selected from the available sessions list.'),
  reasoning: z.string().optional().describe('A brief explanation of why these sessions were recommended, or a message if no suitable sessions were found from the list.')
});
export type SessionRecommendationOutput = z.infer<typeof SessionRecommendationOutputSchema>;


// Exported function that the client calls
export async function generateSessionRecommendations(input: SessionRecommendationInput): Promise<SessionRecommendationOutput> {
  return generateSessionRecommendationsFlow(input);
}

// Helper function to fetch sessions from Firestore
async function fetchActiveSessionsFromFirestore(): Promise<PromptInput['availableSessions']> {
  if (!db) {
    throw new Error("Firestore DB instance is not initialized.");
  }
  try {
    const sessionsQuery = query(
      collection(db, "sessions"),
      where("status", "==", "confirmed"),
      orderBy("createdAt", "desc"), // Get most recent confirmed sessions
      limit(20) // Limit to a manageable number for the prompt context
    );
    const querySnapshot = await getDocs(sessionsQuery);
    const sessions: PromptInput['availableSessions'] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as SessionDocument;
      const sessionDateTime = data.dateTime instanceof Timestamp ? data.dateTime.toDate() : new Date(data.dateTime as any || Date.now());
      
      sessions.push({
        id: doc.id,
        title: data.title || "N/A",
        description: data.description || "N/A",
        category: data.category || "N/A",
        location: data.location || "N/A",
        dateTime: !isNaN(sessionDateTime.getTime()) ? sessionDateTime.toISOString() : "Date TBD",
        price: typeof data.price === 'number' ? data.price : 0,
        // teacherName is not directly included here to keep context small, AI can use placeholder
      });
    });
    console.log(`Fetched ${sessions.length} active sessions from Firestore for AI recommendations.`);
    return sessions;
  } catch (error) {
    console.error("Error fetching active sessions from Firestore for AI:", error);
    return []; // Return empty array on error
  }
}


const sessionRecommendationPrompt = ai.definePrompt({
  name: 'sessionRecommendationPrompt',
  input: { schema: PromptInputSchema }, // Uses the internal schema with availableSessions
  output: { schema: SessionRecommendationOutputSchema },
  prompt: `You are an AI assistant designed to provide personalized session recommendations to learners.
You MUST choose sessions ONLY from the "Available Sessions List" provided below.
For each recommended session, you MUST use the 'id' from the "Available Sessions List" as the 'sessionId' in your output.
The 'teacher' field in your output can be a placeholder like "Provided by Teacher" if not directly available in the session list item.

User Profile: {{{userProfile}}}
Location: {{{location}}}
Past Activity: {{{pastActivity}}}
Availability: {{{availability}}}

Available Sessions List:
{{#if availableSessions.length}}
  {{#each availableSessions}}
    - ID: {{this.id}}
      Title: {{this.title}}
      Category: {{this.category}}
      Description: {{this.description}}
      Location: {{this.location}}
      Date/Time: {{this.dateTime}}
      Price: {{this.price}}
  {{/each}}
{{else}}
  - No specific learning sessions are currently available in our system to recommend from.
{{/if}}

Based on the learner's profile and the "Available Sessions List", provide a list of up to 3-5 relevant and interesting learning opportunities.
Prioritize sessions from the list that best match the user's interests, location, and availability.
If no sessions from the list are a good match, or if the list is empty, state this in the 'reasoning' field and return an empty 'recommendations' array.
Do not invent sessions or session IDs.

Return the recommendations in the following JSON format:
{
  "recommendations": [
    {
      "sessionId": "string",
      "title": "string",
      "description": "string",
      "category": "string",
      "teacher": "string",
      "location": "string",
      "dateTime": "string",
      "price": number
    }
  ],
  "reasoning": "string (optional)"
}
  `,
});

const generateSessionRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateSessionRecommendationsFlow',
    inputSchema: SessionRecommendationInputSchema, // Client uses this schema
    outputSchema: SessionRecommendationOutputSchema,
  },
  async (userInput: SessionRecommendationInput) => {
    console.log("AI Flow: Received user input:", userInput);
    const availableSessions = await fetchActiveSessionsFromFirestore();

    if (availableSessions.length === 0) {
        console.log("AI Flow: No active sessions found in Firestore. Returning empty recommendations.");
        return {
            recommendations: [],
            reasoning: "Currently, there are no specific learning sessions available that match your criteria or are active in our system. Please check back later or broaden your search!"
        };
    }

    const promptInput: PromptInput = {
      ...userInput,
      availableSessions: availableSessions,
    };
    
    console.log("AI Flow: Calling AI prompt with input:", JSON.stringify(promptInput, null, 2).substring(0, 1000) + "..."); // Log truncated input

    try {
        const {output} = await sessionRecommendationPrompt(promptInput);
        if (!output) {
            console.error("AI Flow: Prompt output was null or undefined.");
            return { recommendations: [], reasoning: "An error occurred while generating recommendations. The AI did not provide a valid response." };
        }
        console.log("AI Flow: Received output from AI:", output);
        
        // Basic validation: ensure sessionIds in recommendations actually exist in the provided availableSessions
        const validRecommendations = output.recommendations.filter(rec => 
            availableSessions.some(as => as.id === rec.sessionId)
        );

        if (validRecommendations.length !== output.recommendations.length) {
            console.warn("AI Flow: AI recommended sessions with IDs not present in the provided availableSessions list. Filtering them out.");
        }
        
        return {
            recommendations: validRecommendations,
            reasoning: output.reasoning || (validRecommendations.length > 0 ? "Here are some sessions you might like." : "We couldn't find a specific match from the available sessions based on your preferences.")
        };

    } catch (e: any) {
        console.error("AI Flow: Error during prompt execution:", e);
        return { recommendations: [], reasoning: `An error occurred: ${e.message}` };
    }
  }
);

