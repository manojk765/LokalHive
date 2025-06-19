"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DiscoverSessionsSection } from '@/components/sessions/DiscoverSessionsSection';
import { Award, BarChart3, BookUser, ChevronRight, Facebook, Handshake, Instagram, Linkedin, Lightbulb, MapPin, Rss, Users, Twitter, TrendingUp, Globe, MessageCircle } from 'lucide-react';

const FeatureCard = ({ icon, title, description }: { icon: React.ElementType; title: string; description: string }) => {
  const IconComponent = icon;
  return (
    <Card className="bg-card/70 hover:shadow-lg transition-shadow text-center p-6 rounded-xl">
      <div className="mb-4 flex justify-center">
        <div className="bg-primary/10 p-4 rounded-full inline-block">
          <IconComponent className="w-8 h-8 text-primary" />
        </div>
      </div>
      <CardTitle className="text-xl font-semibold mb-2">{title}</CardTitle>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Card>
  );
};

const HowItWorksCard = ({ step, title, description, className }: { step: string; title: string; description: string; className?: string }) => {
  return (
    <Card className={`bg-card/70 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow ${className || ''}`}>
      <div className="flex items-center mb-3">
        <div className="bg-accent text-accent-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">{step}</div>
        <h3 className="text-lg font-semibold text-primary">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Card>
  );
};

const ImpactStatCard = ({ value, label, icon, className }: { value: string; label: string; icon: React.ElementType; className?: string }) => {
  const IconComponent = icon;
  return (
    <div className={`bg-secondary/20 p-6 rounded-xl text-center shadow-sm hover:shadow-md transition-shadow ${className || ''}`}>
      <IconComponent className="w-10 h-10 text-secondary-foreground mx-auto mb-3" />
      <div className="text-4xl font-bold text-primary">{value}</div>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
};

const TestimonialCard = ({ quote, name, role, avatarUrl, className }: { quote: string; name: string; role: string; avatarUrl: string; className?: string }) => {
  return (
    <Card className={`bg-card/70 p-6 rounded-xl shadow-sm h-full flex flex-col justify-between ${className || ''}`}>
      <div>
        <MessageCircle className="w-8 h-8 text-accent mb-4" />
        <p className="text-muted-foreground italic mb-4">"{quote}"</p>
      </div>
      <div className="flex items-center">
        <Image src={avatarUrl} alt={name} width={40} height={40} className="rounded-full mr-3" data-ai-hint="person portrait"/>
        <div>
          <p className="font-semibold text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </div>
    </Card>
  );
};

export function LandingPageContent() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-background via-secondary/10 to-background text-center relative overflow-hidden dark:from-[#18181b] dark:via-[#23232a]/60 dark:to-[#18181b]">
        {/* CSS-based animated background */}
        <div className="absolute inset-0 opacity-40 dark:opacity-60 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-[#23232a] dark:via-[#18181b] dark:to-[#23232a]"></div>
          {/* Floating circles representing community connections */}
          <div className="absolute top-10 left-10 w-16 h-16 bg-blue-200 rounded-full opacity-70 animate-pulse dark:bg-blue-500/40 dark:opacity-80"></div>
          <div className="absolute top-32 right-20 w-12 h-12 bg-purple-200 rounded-full opacity-60 animate-bounce dark:bg-purple-500/40 dark:opacity-80" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-40 left-16 w-20 h-20 bg-pink-200 rounded-full opacity-50 animate-pulse dark:bg-pink-500/40 dark:opacity-80" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 right-32 w-14 h-14 bg-green-200 rounded-full opacity-60 animate-bounce dark:bg-green-500/40 dark:opacity-80" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute top-60 left-1/3 w-10 h-10 bg-yellow-200 rounded-full opacity-70 animate-pulse dark:bg-yellow-400/40 dark:opacity-80" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute top-80 right-1/4 w-18 h-18 bg-indigo-200 rounded-full opacity-50 animate-bounce dark:bg-indigo-500/40 dark:opacity-80" style={{animationDelay: '2.5s'}}></div>
          {/* Connecting lines animation */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5"/>
                <stop offset="100%" stopColor="#a21caf" stopOpacity="0.2"/>
              </linearGradient>
              <linearGradient id="lineGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.7"/>
                <stop offset="100%" stopColor="#f472b6" stopOpacity="0.4"/>
              </linearGradient>
            </defs>
            {/* Animated connecting lines */}
            <line x1="10%" y1="20%" x2="80%" y2="30%" stroke="url(#lineGradient)" strokeWidth="2.5" opacity="0.5" className="dark:hidden"/>
            <line x1="10%" y1="20%" x2="80%" y2="30%" stroke="url(#lineGradientDark)" strokeWidth="2.5" opacity="0.7" className="hidden dark:inline"/>
            <line x1="20%" y1="60%" x2="70%" y2="25%" stroke="url(#lineGradient)" strokeWidth="2.5" opacity="0.4" className="dark:hidden"/>
            <line x1="20%" y1="60%" x2="70%" y2="25%" stroke="url(#lineGradientDark)" strokeWidth="2.5" opacity="0.7" className="hidden dark:inline"/>
            <line x1="15%" y1="80%" x2="85%" y2="70%" stroke="url(#lineGradient)" strokeWidth="2.5" opacity="0.6" className="dark:hidden"/>
            <line x1="15%" y1="80%" x2="85%" y2="70%" stroke="url(#lineGradientDark)" strokeWidth="2.5" opacity="0.8" className="hidden dark:inline"/>
            <line x1="60%" y1="15%" x2="25%" y2="85%" stroke="url(#lineGradient)" strokeWidth="2.5" opacity="0.4" className="dark:hidden"/>
            <line x1="60%" y1="15%" x2="25%" y2="85%" stroke="url(#lineGradientDark)" strokeWidth="2.5" opacity="0.7" className="hidden dark:inline"/>
          </svg>
          {/* Skill icons floating animation */}
          <div className="absolute top-24 left-1/4 text-blue-400 opacity-80 animate-float dark:text-blue-300">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center transform rotate-12 dark:bg-blue-800/80">
              <span className="text-xs">📚</span>
            </div>
          </div>
          <div className="absolute top-48 right-1/3 text-purple-400 opacity-70 animate-float dark:text-purple-300" style={{animationDelay: '2s'}}>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center transform -rotate-12 dark:bg-purple-800/80">
              <span className="text-xs">🎨</span>
            </div>
          </div>
          <div className="absolute bottom-60 left-1/2 text-green-400 opacity-70 animate-float dark:text-green-300" style={{animationDelay: '1s'}}>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center transform rotate-6 dark:bg-green-800/80">
              <span className="text-xs">💻</span>
            </div>
          </div>
          <div className="absolute bottom-32 right-1/4 text-pink-400 opacity-70 animate-float dark:text-pink-300" style={{animationDelay: '3s'}}>
            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center transform -rotate-6 dark:bg-pink-800/80">
              <span className="text-xs">🎵</span>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-primary mb-6 dark:text-white text-shadow-lg animate-fade-in-up">
            Empowering Communities Through Skill Sharing
          </h1>
          <p className="mt-2 text-lg md:text-xl text-foreground max-w-3xl mx-auto mb-10 dark:text-gray-200 text-shadow animate-fade-in-up delay-100">
            Connect, learn, and grow with people around you. Local Hive bridges skills and opportunity—right where you are.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 animate-fade-in-up delay-200">
            <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105 dark:bg-primary dark:text-white dark:hover:bg-primary/80">
              <Link href="#discover-sessions">
                Find a Skill Near You <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="shadow-lg hover:shadow-xl transition-shadow transform hover:scale-105 dark:border-primary dark:text-white dark:bg-background dark:hover:bg-primary/10">
              <Link href="/auth?type=signup&role=teacher">
                Start Teaching Today <Lightbulb className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          .text-shadow-lg {
            text-shadow: 0 2px 16px rgba(0,0,0,0.18), 0 1.5px 4px rgba(0,0,0,0.12);
          }
          .text-shadow {
            text-shadow: 0 1px 6px rgba(0,0,0,0.12);
          }
          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(40px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.9s cubic-bezier(0.23, 1, 0.32, 1) both;
          }
          .delay-100 { animation-delay: 0.1s; }
          .delay-200 { animation-delay: 0.2s; }
        `}</style>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center mb-12 text-primary animate-fade-in-up">How Local Hive Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <HowItWorksCard 
              step="1"
              title="Share Your Skill" 
              description="Offer your expertise to your local community. From arts and crafts to tech and business, your skills are valuable."
              className="animate-fade-in-up delay-100"
            />
            <HowItWorksCard 
              step="2"
              title="Set Your Availability" 
              description="Easily manage your schedule and session details. Connect with learners at times that work for you."
              className="animate-fade-in-up delay-200"
            />
            <HowItWorksCard 
              step="3"
              title="Earn & Grow" 
              description="Monetize your talents, empower others, and contribute to a vibrant local learning ecosystem."
              className="animate-fade-in-up delay-300"
            />
          </div>
        </div>
      </section>

      {/* Impact Metrics Section */}
      <section className="py-16 bg-secondary/20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center mb-12 text-primary animate-fade-in-up">Our Impact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <ImpactStatCard value="1,200+" label="Skills Shared" icon={Award} className="animate-fade-in-up delay-100 hover:scale-105 hover:shadow-xl transition-transform duration-300" />
            <ImpactStatCard value="85+" label="Communities Empowered" icon={Globe} className="animate-fade-in-up delay-200 hover:scale-105 hover:shadow-xl transition-transform duration-300" />
            <ImpactStatCard value="300+" label="Women Entrepreneurs Onboarded" icon={TrendingUp} className="animate-fade-in-up delay-300 hover:scale-105 hover:shadow-xl transition-transform duration-300" />
          </div>
        </div>
      </section>
      
      {/* Discover Sessions Section (re-integrated for landing page) */}
      <section id="discover-sessions" className="py-16 bg-background animate-fade-in-up delay-100">
         <div className="container mx-auto px-4">
           <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center mb-2 text-primary">Discover Sessions</h2>
           <p className="text-lg text-muted-foreground text-center mb-10">Explore diverse learning opportunities in your neighborhood or online.</p>
           <DiscoverSessionsSection />
         </div>
      </section>

      {/* Testimonial Carousel Section */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center mb-12 text-primary animate-fade-in-up">Voices from Our Community</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard 
              quote="Local Hive helped me turn my baking hobby into a small business. I'm now teaching others and earning!"
              name="Aisha Khan"
              role="Home Baker & Teacher"
              avatarUrl="https://placehold.co/100x100.png?text=AK"
              className="animate-fade-in-up delay-100 hover:scale-105 hover:shadow-xl transition-transform duration-300"
            />
            <TestimonialCard 
              quote="I learned coding basics from a neighbor through Local Hive. It opened up new career possibilities for me."
              name="Ravi Kumar"
              role="Aspiring Developer"
              avatarUrl="https://placehold.co/100x100.png?text=RK"
              className="animate-fade-in-up delay-200 hover:scale-105 hover:shadow-xl transition-transform duration-300"
            />
            <TestimonialCard 
              quote="As an elderly person, sharing my gardening skills has given me a new sense of purpose and connection."
              name="Maria Silva"
              role="Gardening Enthusiast & Mentor"
              avatarUrl="https://placehold.co/100x100.png?text=MS"
              className="animate-fade-in-up delay-300 hover:scale-105 hover:shadow-xl transition-transform duration-300"
            />
          </div>
        </div>
      </section>

      {/* Join the Movement Banner */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <Globe className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6">Join the Movement</h2>
          <p className="text-lg max-w-2xl mx-auto mb-8 opacity-90">
            Local Hive is committed to fostering inclusive learning and economic empowerment, aligning with the UN's Sustainable Development Goals (SDGs) for quality education, gender equality, and decent work.
          </p>
          <div className="flex justify-center space-x-4 mb-4">
            {/* Placeholder for SDG logos/icons */}
            <span className="text-sm border rounded-full px-3 py-1">SDG 4: Quality Education</span>
            <span className="text-sm border rounded-full px-3 py-1">SDG 5: Gender Equality</span>
            <span className="text-sm border rounded-full px-3 py-1">SDG 8: Decent Work</span>
          </div>
          <Button size="lg" variant="secondary" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg hover:shadow-xl transition-shadow">
            <Link href="/auth?type=signup">Get Started with Local Hive</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}