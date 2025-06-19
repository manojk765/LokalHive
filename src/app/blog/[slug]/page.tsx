
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarDays, UserCircle, MessageSquare } from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Mock data for blog posts - in a real app, fetch this based on slug
const mockPostsData: Record<string, any> = {
  "power-of-local-learning": {
    slug: "power-of-local-learning",
    title: "The Power of Local Learning: How Communities Thrive on Shared Skills",
    date: "October 26, 2023",
    author: "Jane Doe",
    imageUrl: "https://placehold.co/1200x600.png",
    dataAiHint: "community discussion",
    content: `
      <p class="mb-4 text-lg leading-relaxed">Local Hive and similar skill-sharing platforms are revolutionizing how we approach personal and professional development. By connecting individuals within their own neighborhoods, these platforms do more than just teach new skills—they weave a stronger social fabric, foster a sense of belonging, and create tangible economic opportunities right at the grassroots level.</p>
      <h2 class="text-2xl font-semibold mt-6 mb-3 text-primary">The Ripple Effect of Shared Knowledge</h2>
      <p class="mb-4">When someone learns a new skill, from coding to pottery, from a neighbor, the benefits extend far beyond the individual. The learner gains confidence and new abilities, while the teacher hones their craft and communication skills. This exchange often sparks new ideas, collaborations, and even small businesses within the community.</p>
      <figure class="my-6">
        <img src="https://placehold.co/800x400.png" alt="People working together in a workshop" class="rounded-lg shadow-md mx-auto" data-ai-hint="workshop collaboration"/>
        <figcaption class="text-center text-sm text-muted-foreground mt-2">Skill sharing in action: a local pottery workshop.</figcaption>
      </figure>
      <h3 class="text-xl font-semibold mt-6 mb-3">Economic Empowerment</h3>
      <p class="mb-4">For many, skill-sharing offers a direct path to supplementary income or even a new career. It democratizes entrepreneurship, allowing individuals to monetize their passions without significant upfront investment. This is particularly impactful for underrepresented groups, providing accessible avenues for economic participation.</p>
      <h3 class="text-xl font-semibold mt-6 mb-3">Building Social Capital</h3>
      <p>Beyond economics, local learning strengthens community bonds. It breaks down social silos, connecting people from different backgrounds and age groups over shared interests. These interactions build trust, empathy, and a collective sense of identity—the very essence of a thriving community.</p>
      <p class="mt-6 font-semibold">Join the movement and see how sharing your skills or learning something new can enrich your life and your community. Explore Local Hive today!</p>
    `,
  },
  "top-skills-to-learn-2024": {
    slug: "top-skills-to-learn-2024",
    title: "Top 5 In-Demand Skills to Learn in Your Community This Year",
    date: "November 5, 2023",
    author: "John Smith",
    imageUrl: "https://placehold.co/1200x600.png",
    dataAiHint: "learning future",
    content: "<p>Content for Top 5 In-Demand Skills...</p><p>This includes digital literacy, sustainable practices, data analysis, creative arts, and wellness techniques.</p>",
  },
  "teaching-tips-for-beginners": {
    slug: "teaching-tips-for-beginners",
    title: "From Passion to Profession: Tips for First-Time Skill Sharers",
    date: "November 15, 2023",
    author: "Alice Green",
    imageUrl: "https://placehold.co/1200x600.png",
    dataAiHint: "teacher giving lesson",
    content: "<p>Content for Teaching Tips for Beginners...</p><p>Focus on clear communication, structuring your sessions, creating a welcoming environment, and asking for feedback.</p>",
  },
};

export default function BlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      // Simulate fetching post data
      setIsLoading(true);
      setTimeout(() => {
        const foundPost = mockPostsData[slug];
        setPost(foundPost);
        setIsLoading(false);
      }, 300);
    }
  }, [slug]);

  if (isLoading) {
    return <div className="container mx-auto py-12 px-4 text-center">Loading post...</div>;
  }

  if (!post) {
    return <div className="container mx-auto py-12 px-4 text-center">Post not found.</div>;
  }
  
  const handleCommentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    alert("Comment submitted (placeholder).");
    (event.target as HTMLFormElement).reset();
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button onClick={() => router.back()} variant="outline" className="mb-8">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
      </Button>

      <article>
        {post.imageUrl && (
          <Image
            src={post.imageUrl}
            alt={post.title}
            width={1200}
            height={600}
            className="w-full h-auto max-h-[400px] object-cover rounded-lg mb-8 shadow-lg"
            data-ai-hint={post.dataAiHint}
            priority
          />
        )}
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary mb-3">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              <span>{post.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <UserCircle className="w-4 h-4" />
              <span>By {post.author}</span>
            </div>
          </div>
        </header>
        
        <Separator className="my-6"/>

        <div
          className="prose prose-lg dark:prose-invert max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
      
      <Separator className="my-10"/>

      {/* Comments Section Placeholder */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-6 text-foreground flex items-center">
            <MessageSquare className="mr-3 w-6 h-6 text-primary"/> Comments (Placeholder)
        </h2>
        <Card>
            <CardHeader>
                <CardTitle>Leave a Comment</CardTitle>
                <CardDescription>Share your thoughts on this post.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleCommentSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="commentName">Name</Label>
                        <Input id="commentName" placeholder="Your Name" required/>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="commentEmail">Email (won't be published)</Label>
                        <Input id="commentEmail" type="email" placeholder="you@example.com" required/>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="commentText">Comment</Label>
                        <Textarea id="commentText" placeholder="Write your comment..." rows={4} required/>
                    </div>
                    <Button type="submit">Post Comment</Button>
                </form>
            </CardContent>
        </Card>
        {/* Placeholder for displaying comments */}
        <div className="mt-8 space-y-6">
            <Card className="bg-muted/50">
                <CardContent className="p-4">
                    <p className="font-semibold text-sm">Commenter One</p>
                    <p className="text-xs text-muted-foreground mb-1">2 days ago</p>
                    <p className="text-sm">This is a great article! Very insightful.</p>
                </CardContent>
            </Card>
             <Card className="bg-muted/50">
                <CardContent className="p-4">
                    <p className="font-semibold text-sm">Commenter Two</p>
                    <p className="text-xs text-muted-foreground mb-1">1 day ago</p>
                    <p className="text-sm">Thanks for sharing these tips!</p>
                </CardContent>
            </Card>
        </div>
      </section>
    </div>
  );
}
