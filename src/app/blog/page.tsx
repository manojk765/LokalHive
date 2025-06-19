
"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rss, CalendarDays, UserCircle, ChevronRight } from "lucide-react";
import Image from "next/image";

// Mock data for blog posts
const mockPosts = [
  {
    slug: "power-of-local-learning",
    title: "The Power of Local Learning: How Communities Thrive on Shared Skills",
    date: "October 26, 2023",
    author: "Jane Doe",
    excerpt: "Discover how skill-sharing platforms like Local Hive are transforming neighborhoods by fostering connection, growth, and economic opportunity...",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "community learning"
  },
  {
    slug: "top-skills-to-learn-2024",
    title: "Top 5 In-Demand Skills to Learn in Your Community This Year",
    date: "November 5, 2023",
    author: "John Smith",
    excerpt: "Stay ahead of the curve! We explore the most sought-after skills you can learn locally to boost your career or personal development...",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "skills education"
  },
  {
    slug: "teaching-tips-for-beginners",
    title: "From Passion to Profession: Tips for First-Time Skill Sharers",
    date: "November 15, 2023",
    author: "Alice Green",
    excerpt: "Thinking of sharing your expertise? Here are some practical tips to help you start teaching and make a real impact...",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "teaching advice"
  },
];

export default function BlogPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <header className="text-center mb-16">
        <Rss className="w-16 h-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">Local Hive Blog</h1>
        <p className="mt-3 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Insights, stories, and tips on skill-sharing, community building, and lifelong learning.
        </p>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mockPosts.map((post) => (
          <Card key={post.slug} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
            {post.imageUrl && (
              <div className="relative h-48 w-full">
                <Image
                  src={post.imageUrl}
                  alt={post.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  data-ai-hint={post.dataAiHint}
                />
              </div>
            )}
            <CardHeader>
              <Link href={`/blog/${post.slug}`}>
                <CardTitle className="text-xl hover:text-primary transition-colors">{post.title}</CardTitle>
              </Link>
              <CardDescription className="text-xs text-muted-foreground">
                <div className="flex items-center gap-2 mt-1">
                    <CalendarDays className="w-3 h-3" /> {post.date}
                    <span className="mx-1">·</span>
                    <UserCircle className="w-3 h-3" /> {post.author}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
            </CardContent>
            <CardFooter>
              <Link href={`/blog/${post.slug}`} passHref legacyBehavior>
                <Button variant="outline" size="sm">
                  Read More <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
