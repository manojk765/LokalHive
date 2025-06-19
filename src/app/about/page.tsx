"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Lightbulb, Handshake, Globe } from "lucide-react";
import Image from "next/image";

export default function AboutPage() {
  const teamMembers = [
    { name: "Manoj",  avatar: "https://placehold.co/100x100.png?text=DH", bio: "Passionate about community building and lifelong learning." },
    { name: "Karthikeya",  avatar: "https://placehold.co/100x100.png?text=AA", bio: "Expert in buzzing-edge tech solutions for social good." },
    { name: "Balaji",  avatar: "https://placehold.co/100x100.png?text=PP", bio: "Helping the community with his skills." },
    { name: "Sivaganga", avatar: "https://placehold.co/100x100.png?text=PP", bio: "Connects Local Hive with communities far and wide" }
  ];

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <header className="text-center mb-16">
        <Globe className="w-16 h-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">About Local Hive</h1>
        <p className="mt-3 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Connecting skills, empowering individuals, and fostering vibrant local communities through shared learning.
        </p>
      </header>

      <section className="mb-16">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Our Mission</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground text-lg">
            <p>
              Local Hive is dedicated to creating a world where everyone can easily share their knowledge and learn new skills from their neighbors. We believe in the power of local connections to foster personal growth, economic opportunity, and stronger, more resilient communities.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-semibold text-center mb-10 text-foreground">What We Do</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <Users className="w-12 h-12 text-accent mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-primary">Connect Learners & Teachers</h3>
            <p className="text-muted-foreground">We provide a platform for individuals to find local or online sessions for skills they want to learn, and for experts to share their passions.</p>
          </div>
          <div className="text-center p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <Lightbulb className="w-12 h-12 text-accent mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-primary">Promote Skill Diversity</h3>
            <p className="text-muted-foreground">From traditional crafts to modern tech, we celebrate and support a wide array of skills, ensuring there's something for everyone.</p>
          </div>
          <div className="text-center p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <Handshake className="w-12 h-12 text-accent mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-primary">Empower Local Economies</h3>
            <p className="text-muted-foreground">By enabling individuals to monetize their skills, we contribute to local economic development and financial inclusion.</p>
          </div>
        </div>
      </section>
    

      <section>
        <h2 className="text-3xl font-semibold text-center mb-10 text-foreground">Meet Our Team</h2>
        <div className="grid md:grid-cols-4 gap-8">
          {teamMembers.map(member => (
            <Card key={member.name} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Avatar className="w-24 h-24 mx-auto mb-4 border-2 border-primary">
                  <AvatarImage src={member.avatar} alt={member.name} data-ai-hint="person portrait" />
                  <AvatarFallback>{member.name.substring(0,2)}</AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold text-primary">{member.name}</h3>
                <p className="text-xs text-muted-foreground mt-2">{member.bio}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
