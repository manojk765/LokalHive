
"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/AppLayoutClient';
// Corrected import: SessionContentInputSchema is no longer imported
import { generateSessionContentSuggestions, type SessionContentInput, type SessionContentOutput } from '@/ai/flows/generate-session-content-flow';
import { Loader2, Sparkles, Bot, ShieldAlert, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const desiredTones = ['friendly', 'professional', 'enthusiastic', 'technical', 'simple'] as const;

// Zod schema for the form, defined locally
const FormSchema = z.object({
  sessionTopic: z
    .string()
    .min(3, 'Session topic must be at least 3 characters.'),
  keywords: z
    .string()
    .optional(),
  targetAudience: z
    .string()
    .optional(),
  currentDraftTitle: z
    .string()
    .optional(),
  currentDraftDescription: z
    .string()
    .optional(),
  desiredTone: z.enum(desiredTones).optional(),
});

type SessionContentFormValues = z.infer<typeof FormSchema>;


export default function AiAssistantPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<SessionContentOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm<SessionContentFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      sessionTopic: "",
      keywords: "",
      targetAudience: "",
      currentDraftTitle: "",
      currentDraftDescription: "",
      desiredTone: "friendly",
    }
  });

  if (!isAuthenticated || user?.role !== 'teacher') {
     if (typeof window !== "undefined") {
      router.push(isAuthenticated && user?.role === 'learner' ? '/' : '/auth?redirect=/teaching/ai-assistant');
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4">This tool is for teachers only. Please log in as a teacher.</p>
        <Button onClick={() => router.push('/auth?redirect=/teaching/ai-assistant')}>Go to Login</Button>
      </div>
    );
  }

  const onSubmit: SubmitHandler<SessionContentFormValues> = async (data) => {
    setIsLoading(true);
    setSuggestions(null);
    console.log("AiAssistantPage: Submitting to AI content flow with input:", data);
    try {
      const inputForFlow: SessionContentInput = {
        sessionTopic: data.sessionTopic,
        keywords: data.keywords || undefined,
        targetAudience: data.targetAudience || undefined,
        currentDraftTitle: data.currentDraftTitle || undefined,
        currentDraftDescription: data.currentDraftDescription || undefined,
        desiredTone: data.desiredTone || undefined,
      };

      const result = await generateSessionContentSuggestions(inputForFlow);
      console.log("AiAssistantPage: AI content flow result:", result);

      if (result && (result.suggestedTitles.length > 0 || result.suggestedDescriptions.length > 0)) {
        setSuggestions(result);
        toast({ title: "Suggestions Generated!", description: "Check out the AI-powered content ideas below.", variant: "default" });
      } else {
        setSuggestions(result); 
        toast({ title: "No Specific Suggestions", description: result.tipsForEngagement?.join(' ') || "The AI couldn't generate specific suggestions. Try refining your input!", variant: "default" });
      }
    } catch (error: any) {
      console.error("Error generating content suggestions from AI flow:", error);
      toast({
        title: "AI Error",
        description: `Could not generate suggestions: ${error.message || 'Unknown error'}. Please ensure the Genkit server is running (npm run genkit:dev), your GOOGLE_API_KEY is set correctly in .env, and check the Genkit server console for more details.`,
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (textToCopy: string, type: string) => {
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        toast({ title: `${type} Copied!`, description: `The ${type.toLowerCase()} has been copied to your clipboard.` });
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        toast({ title: `Copy Failed`, description: `Could not copy the ${type.toLowerCase()}.`, variant: 'destructive' });
      });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8 text-center">
        <Bot className="w-16 h-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold tracking-tight text-primary">AI Session Content Helper</h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
          Get help crafting catchy titles and engaging descriptions for your skill sessions.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Describe Your Session Idea</CardTitle>
            <CardDescription>Provide details about your session to get tailored suggestions.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sessionTopic">Session Topic <span className="text-destructive">*</span></Label>
                <Input id="sessionTopic" {...register("sessionTopic")} placeholder="e.g., Introduction to Python Programming" />
                {errors.sessionTopic && <p className="text-sm text-destructive">{errors.sessionTopic.message}</p>}
              </div>
              <div>
                <Label htmlFor="keywords">Keywords (Optional, comma-separated)</Label>
                <Input id="keywords" {...register("keywords")} placeholder="e.g., beginner, data science, web scraping" />
              </div>
              <div>
                <Label htmlFor="targetAudience">Target Audience (Optional)</Label>
                <Input id="targetAudience" {...register("targetAudience")} placeholder="e.g., Absolute beginners, high school students" />
              </div>
               <div>
                <Label htmlFor="desiredTone">Desired Tone (Optional)</Label>
                <Controller
                    name="desiredTone"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} defaultValue="friendly">
                            <SelectTrigger id="desiredTone">
                            <SelectValue placeholder="Select a tone" />
                            </SelectTrigger>
                            <SelectContent>
                            {desiredTones.map((tone) => (
                                <SelectItem key={tone} value={tone} className="capitalize">{tone}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                    )}
                />
              </div>
              <div>
                <Label htmlFor="currentDraftTitle">Current Draft Title (Optional)</Label>
                <Input id="currentDraftTitle" {...register("currentDraftTitle")} placeholder="Your current idea for a title" />
              </div>
              <div>
                <Label htmlFor="currentDraftDescription">Current Draft Description (Optional)</Label>
                <Textarea id="currentDraftDescription" {...register("currentDraftDescription")} rows={3} placeholder="Your current thoughts for the description" />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Suggestions
              </Button>
            </CardFooter>
          </form>
        </Card>

        {isLoading && (
          <div className="flex flex-col justify-center items-center py-10 md:py-0">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground mt-2">AI is thinking...</p>
          </div>
        )}

        {suggestions && !isLoading && (
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>AI Suggestions</CardTitle>
              <CardDescription>Here are some ideas to get you started. Copy your favorites!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {suggestions.suggestedTitles && suggestions.suggestedTitles.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-primary">Suggested Titles:</h3>
                  <ul className="list-disc space-y-2 pl-5">
                    {suggestions.suggestedTitles.map((title, index) => (
                      <li key={`title-${index}`} className="text-sm group">
                        <span>{title}</span>
                        <Button variant="ghost" size="sm" onClick={() => handleCopy(title, "Title")} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Copy className="h-3 w-3"/>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {suggestions.suggestedDescriptions && suggestions.suggestedDescriptions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-primary">Suggested Descriptions:</h3>
                  <div className="space-y-3">
                    {suggestions.suggestedDescriptions.map((desc, index) => (
                      <div key={`desc-${index}`} className="text-sm p-3 border rounded-md bg-muted/30 group">
                        <p className="whitespace-pre-wrap">{desc}</p>
                        <Button variant="ghost" size="sm" onClick={() => handleCopy(desc, "Description")} className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Copy className="h-3 w-3"/> Copy Description
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {suggestions.tipsForEngagement && suggestions.tipsForEngagement.length > 0 && (
                 <div>
                  <h3 className="text-lg font-semibold mb-2 text-primary">Tips for Engagement:</h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {suggestions.tipsForEngagement.map((tip, index) => (
                      <li key={`tip-${index}`}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(!suggestions.suggestedTitles || suggestions.suggestedTitles.length === 0) && 
               (!suggestions.suggestedDescriptions || suggestions.suggestedDescriptions.length === 0) && 
               (!suggestions.tipsForEngagement || suggestions.tipsForEngagement.length === 0) && (
                <Alert variant="default">
                  <Sparkles className="h-4 w-4" />
                  <AlertTitle>No specific suggestions generated.</AlertTitle>
                  <AlertDescription>
                    Try providing more details or rephrasing your session topic and keywords.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

    