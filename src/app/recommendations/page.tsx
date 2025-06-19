 
"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/AppLayoutClient';
import { generateSessionRecommendations, type SessionRecommendationInput, type SessionRecommendationOutput } from '@/ai/flows/generate-session-recommendations';
import { Loader2, Sparkles, Wand2, Frown, ShieldAlert } from 'lucide-react';
import { SessionCard } from '@/components/sessions/SessionCard';
import type { Session } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const recommendationSchema = z.object({
  userProfileContext: z.string().min(10, "Please provide some context about your profile (skills, interests, goals)."),
  location: z.string().min(3, "Please enter your current or preferred location."),
  pastActivityContext: z.string().min(5,"Please provide some context about your past activity (e.g., 'attended cooking classes').").optional(),
  availability: z.string().min(3, "Please describe your availability (e.g., 'weekends', 'evenings')."),
});

type RecommendationFormValues = z.infer<typeof recommendationSchema>;

export default function RecommendationsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<SessionRecommendationOutput['recommendations'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RecommendationFormValues>({
    resolver: zodResolver(recommendationSchema),
    defaultValues: {
      userProfileContext: user ? `Role: ${user.role}. Skills: ${user.skills?.join(', ') || 'N/A'}. Interests: ${user.preferences || 'N/A'}. Goals: Seeking new learning opportunities.` : "",
      location: user?.location?.address || "",
      pastActivityContext: "No recent specific activity, interested in exploring.",
      availability: user?.availability || "",
    }
  });

  if (!isAuthenticated || !user) {
     if (typeof window !== "undefined") {
      router.push('/auth?redirect=/recommendations');
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4">Please log in to get session recommendations.</p>
        <Button onClick={() => router.push('/auth?redirect=/recommendations')}>Go to Login</Button>
      </div>
    );
  }

  const onSubmit: SubmitHandler<RecommendationFormValues> = async (data) => {
    setIsLoading(true);
    setRecommendations(null);
    console.log("RecommendationsPage: Submitting to AI flow with input:", data);
    try {
      const input: SessionRecommendationInput = {
        userProfile: data.userProfileContext,
        location: data.location,
        pastActivity: data.pastActivityContext || "None",
        availability: data.availability,
      };
      const result = await generateSessionRecommendations(input);
      console.log("RecommendationsPage: AI flow result:", result);

      if (result && result.recommendations && result.recommendations.length > 0) {
        setRecommendations(result.recommendations);
        toast({ title: "Recommendations Generated!", description: "Check out your personalized session suggestions below.", variant: "default" });
      } else {
        setRecommendations([]); // Set to empty array to trigger "No Specific Recommendations Found"
        toast({ title: "No Specific Recommendations", description: "We couldn't find specific recommendations based on your input. Try broadening your criteria!", variant: "default" });
      }
    } catch (error: any) {
      console.error("Error generating recommendations from AI flow:", error);
      toast({ 
        title: "AI Error", 
        description: `Could not generate recommendations: ${error.message || 'Unknown error'}. Please ensure the Genkit server is running (npm run genkit:dev), your GOOGLE_API_KEY is set correctly in .env, and check the Genkit server console for more details.`, 
        variant: "destructive",
        duration: 10000, // Longer duration for more complex message
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const adaptAISessionToSessionCard = (aiSession: SessionRecommendationOutput['recommendations'][0]): Session => ({
    id: aiSession.sessionId || `ai-${Math.random().toString(36).substring(2, 9)}`,
    title: aiSession.title || "AI Recommended Session",
    description: aiSession.description || "Details provided by AI.",
    category: aiSession.category || "AI Recommendation",
    teacherId: 'ai-teacher', 
    teacherName: aiSession.teacher || "AI Teacher",
    location: aiSession.location || "To be confirmed",
    dateTime: aiSession.dateTime || new Date().toISOString(), 
    price: typeof aiSession.price === 'number' ? aiSession.price : 0,
    status: 'confirmed', 
    coverImageUrl: `https://placehold.co/600x400.png?text=${encodeURIComponent(aiSession.title?.substring(0,15) || 'AI Skill')}`,
    dataAiHint: aiSession.category?.toLowerCase().split(' ')[0] || "education", // Use first word of category for hint
    createdAt: new Date(),
  });


  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8 text-center">
        <Wand2 className="w-16 h-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold tracking-tight text-primary">Personalized Session Recommendations</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Let our AI help you find the perfect learning experiences tailored to your profile.
        </p>
      </header>

      <Card className="w-full max-w-2xl mx-auto shadow-xl mb-12">
        <CardHeader>
          <CardTitle>Tell Us About Yourself</CardTitle>
          <CardDescription>Provide some details so we can find the best matches for you.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="userProfileContext">Your Profile Context (Skills, Interests, Goals)</Label>
              <Textarea id="userProfileContext" {...register("userProfileContext")} rows={3} placeholder="e.g., I'm a beginner interested in learning Javascript and web development. My goal is to build a personal website."/>
              {errors.userProfileContext && <p className="text-sm text-destructive">{errors.userProfileContext.message}</p>}
            </div>
            <div>
              <Label htmlFor="location">Your Current Location (City, State)</Label>
              <Input id="location" {...register("location")} placeholder="e.g., San Francisco, CA"/>
              {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
            </div>
             <div>
              <Label htmlFor="pastActivityContext">Past Activity (e.g., "attended cooking classes", "searched for yoga")</Label>
              <Textarea id="pastActivityContext" {...register("pastActivityContext")} rows={2} placeholder="e.g., Recently searched for pottery workshops and attended a graphic design webinar."/>
              {errors.pastActivityContext && <p className="text-sm text-destructive">{errors.pastActivityContext.message}</p>}
            </div>
            <div>
              <Label htmlFor="availability">Your Availability (e.g., "Weekends", "Weekdays after 5 PM")</Label>
              <Input id="availability" {...register("availability")} placeholder="e.g., Saturday mornings, or weekdays after 6 PM PST"/>
              {errors.availability && <p className="text-sm text-destructive">{errors.availability.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate Recommendations
            </Button>
          </CardFooter>
        </form>
      </Card>

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">Finding the best sessions for you...</p>
        </div>
      )}

      {recommendations && recommendations.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-center">Here are your AI-powered recommendations:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec, index) => (
              <SessionCard key={rec.sessionId || index} session={adaptAISessionToSessionCard(rec)} />
            ))}
          </div>
        </div>
      )}
      
      {recommendations && recommendations.length === 0 && !isLoading && (
         <Alert className="mt-8 bg-secondary/50">
          <Frown className="h-5 w-5 text-secondary-foreground" />
          <AlertTitle className="font-semibold text-secondary-foreground">No Specific Recommendations Found</AlertTitle>
          <AlertDescription className="text-secondary-foreground">
            Our AI couldn't find any specific matches based on your current criteria. You might want to try adjusting your preferences or check back later!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
