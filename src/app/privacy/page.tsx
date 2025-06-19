"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6 max-w-3xl">
      <header className="text-center mb-12">
        <ShieldCheck className="w-16 h-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">Privacy Policy</h1>
        <p className="mt-3 text-lg text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
      </header>

      <Card className="shadow-lg">
        <CardContent className="p-6 md:p-8 space-y-6 text-foreground leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">1. Introduction</h2>
            <p>Welcome to Local Hive (“we”, “our”, or “us”). Your privacy is important to us. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your information.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">2. What Information We Collect</h2>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li><strong>Login Information:</strong> When you sign up or log in, we collect your email address and, if you choose, your name and profile picture.</li>
              <li><strong>Session/Course Data:</strong> If you create or join sessions, we collect information about the sessions you participate in (such as course names, your participation, and related details).</li>
              <li><strong>Contact Information:</strong> If you contact us, we may collect your email address and any information you provide in your message.</li>
            </ul>
            <p className="mt-2">We do <strong>not</strong> collect payment information, location data (unless you provide it for a session), or any sensitive personal data.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>Create and manage your account.</li>
              <li>Allow you to join, create, and manage sessions/courses.</li>
              <li>Communicate with you about your account or sessions.</li>
              <li>Respond to your inquiries or support requests.</li>
            </ul>
            <p className="mt-2">We do <strong>not</strong> use your information for advertising, marketing, or analytics beyond what is necessary to operate the service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">4. How We Share Your Information</h2>
            <p>We do <strong>not</strong> sell, rent, or share your personal information with third parties for marketing or advertising purposes. Your information is only shared:</p>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>With other users as needed to facilitate sessions (e.g., showing your name to session participants).</li>
              <li>If required by law or to protect our rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">5. Data Security</h2>
            <p>We take reasonable measures to protect your information from unauthorized access, loss, or misuse.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">6. Data Retention</h2>
            <p>We retain your information only as long as your account is active or as needed to provide our services. You can request deletion of your account at any time.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">7. Your Rights</h2>
            <p>You may access, update, or delete your information at any time by logging into your account or contacting us.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">8. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any significant changes.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">9. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at your support email.</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
