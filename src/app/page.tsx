
"use client";

import { useAuth } from '@/components/AppLayoutClient';
import { LandingPageContent } from '@/components/landing/LandingPageContent';
import { DiscoverSessionsSection } from '@/components/sessions/DiscoverSessionsSection';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPageContent />;
  }

  // Authenticated users see the session discovery directly
  return (
    <div className="w-full py-8 px-4 md:px-6">
      <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary mb-4">
            Discover Skill Sessions
          </h1>
          <p className="mt-2 text-lg md:text-xl text-muted-foreground mx-auto">
            Explore unique learning opportunities shared by experts in your community and online.
          </p>
        </header>
      <DiscoverSessionsSection />
    </div>
  );
}
