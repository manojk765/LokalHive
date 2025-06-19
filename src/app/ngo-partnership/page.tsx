
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Handshake, Users, Target, CheckCircle, Send } from "lucide-react";
import Image from "next/image";

export default function NgoPartnershipPage() {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Handle form submission logic here
    alert("Partnership interest form submitted (placeholder).");
  };

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <header className="text-center mb-16">
        <Handshake className="w-16 h-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">Partner with Local Hive</h1>
        <p className="mt-3 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Join us in empowering communities through skill-sharing. We collaborate with NGOs, community organizations, and leaders to amplify impact.
        </p>
      </header>

      <section className="mb-16">
        <h2 className="text-3xl font-semibold text-center mb-10 text-foreground">Why Partner With Us?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <Users className="w-12 h-12 text-accent mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-primary">Expand Your Reach</h3>
            <p className="text-muted-foreground">Connect with a wider audience of learners and skilled individuals within your community and beyond.</p>
          </Card>
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <Target className="w-12 h-12 text-accent mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-primary">Achieve Shared Goals</h3>
            <p className="text-muted-foreground">Align your organization's mission with our platform to drive meaningful change in education and economic empowerment.</p>
          </Card>
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CheckCircle className="w-12 h-12 text-accent mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-primary">Access Resources</h3>
            <p className="text-muted-foreground">Leverage our technology and network to enhance your programs and initiatives.</p>
          </Card>
        </div>
      </section>

      <section className="mb-16 grid md:grid-cols-2 gap-8 items-center">
        <div>
            <Image 
                src="https://media.istockphoto.com/id/2094337676/photo/diverse-team-working-together-in-modern-co-working-space.jpg?s=612x612&w=0&k=20&c=EvWROZsfro1ghOVViXVj-tKS364-NeabwNNYkyvhxoY=" 
                alt="Diverse group collaborating on a project" 
                width={600} 
                height={400} 
                className="rounded-lg shadow-lg w-full object-cover"
                data-ai-hint="team collaboration"
            />
        </div>
        <div>
            <h2 className="text-3xl font-semibold mb-6 text-foreground">Our Commitment to SDGs</h2>
            <p className="text-muted-foreground mb-4">
            Local Hive is deeply committed to supporting the United Nations' Sustainable Development Goals (SDGs). Our platform directly contributes to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
            <li><strong className="text-primary">SDG 4: Quality Education</strong> - Ensuring inclusive and equitable quality education and promoting lifelong learning opportunities for all.</li>
            <li><strong className="text-primary">SDG 5: Gender Equality</strong> - Achieving gender equality and empowering all women and girls, particularly through economic opportunities.</li>
            <li><strong className="text-primary">SDG 8: Decent Work and Economic Growth</strong> - Promoting sustained, inclusive, and sustainable economic growth, full and productive employment, and decent work for all.</li>
            </ul>
            <p className="text-muted-foreground">
            We believe that by working together, we can make significant strides towards these global goals at a local level.
            </p>
        </div>
      </section>


      <section>
        <Card className="shadow-xl max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Express Your Interest</CardTitle>
            <CardDescription className="text-center">
              Tell us a bit about your organization and how you envision a partnership with Local Hive.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input id="orgName" placeholder="Your Organization's Name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input id="contactPerson" placeholder="Your Name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Contact Email</Label>
                <Input id="email" type="email" placeholder="you@organization.org" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Organization Website (Optional)</Label>
                <Input id="website" type="url" placeholder="https://organization.org" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partnershipInterest">Area of Interest / How We Can Collaborate</Label>
                <Textarea id="partnershipInterest" placeholder="Briefly describe your ideas for partnership..." rows={5} required />
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                <Send className="mr-2 h-4 w-4" /> Submit Interest
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
