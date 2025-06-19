
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-session-recommendations.ts';
import '@/ai/flows/generate-session-content-flow.ts'; // Added import for new flow
