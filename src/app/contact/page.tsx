"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import Image from "next/image";

export default function ContactPage() {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Handle form submission logic here (e.g., send to an API endpoint)
    alert("Form submitted (placeholder - no actual submission).");
  };

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <header className="text-center mb-16">
        <Mail className="w-16 h-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">Contact Us</h1>
        <p className="mt-3 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          We'd love to hear from you! Whether you have a question, feedback, or a partnership inquiry, please get in touch.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        <section>
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Send Us a Message</CardTitle>
              <CardDescription>Fill out the form below and we'll get back to you as soon as possible.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Your Name" required />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="you@example.com" required />
                    </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="What is your message about?" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Write your message here..." rows={5} required />
                </div>
                <Button type="submit" className="w-full sm:w-auto">
                  <Send className="mr-2 h-4 w-4" /> Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Our Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div className="flex items-start">
                <Mail className="w-5 h-5 mr-3 mt-1 text-primary" />
                <div>
                  <h4 className="font-semibold text-foreground">Email</h4>
                  <a href="mailto:am.en.u4cse22305@am.students.amrita.edu" className="hover:text-primary">am.en.u4cse22305@am.students.amrita.edu</a><br />
                  <a href="mailto:am.en.u4cse22329@am.students.amrita.edu" className="hover:text-primary">am.en.u4cse22329@am.students.amrita.edu</a><br />
                  <a href="mailto:am.en.u4cse22334@am.students.amrita.edu" className="hover:text-primary">am.en.u4cse22334@am.students.amrita.edu</a><br />
                  <a href="mailto:am.en.u4cse22352@am.students.amrita.edu" className="hover:text-primary">am.en.u4cse22352@am.students.amrita.edu</a><br />
                </div>
              </div>
              <div className="flex items-start">
                <Phone className="w-5 h-5 mr-3 mt-1 text-primary" />
                <div>
                  <h4 className="font-semibold text-foreground">Phone</h4>
                  <p>+91 98450 00000</p>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="w-5 h-5 mr-3 mt-1 text-primary" />
                <div>
                  <h4 className="font-semibold text-foreground">Address</h4>
                  <p>Amrita University, Amritapuri, Kerala, India</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
        </section>
      </div>
    </div>
  );
}
