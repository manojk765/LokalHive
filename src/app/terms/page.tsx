"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6 max-w-3xl">
      <header className="text-center mb-12">
        <FileText className="w-16 h-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">Terms of Service</h1>
        <p className="mt-3 text-lg text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
      </header>

      <Card className="shadow-lg">
        <CardContent className="p-6 md:p-8 space-y-6 text-foreground leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">1. Acceptance of Terms</h2>
            <p>By using Local Hive (“we”, “our”, or “us”), you agree to these Terms of Service. If you do not agree, do not use our services. We may update these terms from time to time; continued use means you accept any changes.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">2. Description of Service</h2>
            <p>Local Hive is a platform for connecting people who want to learn or teach skills. Users can create accounts, join or offer sessions, and communicate with each other. We do not guarantee the accuracy, quality, or legality of any session or user content.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">3. User Accounts</h2>
            <p>You must provide accurate information when creating an account. You are responsible for your account’s security and all activity under your account. Notify us immediately if you suspect unauthorized use.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">4. User Conduct</h2>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Do not violate any law or regulation.</li>
              <li>Do not post harmful, offensive, or misleading content.</li>
              <li>Do not impersonate others or misrepresent yourself.</li>
              <li>Do not disrupt or interfere with the platform or other users.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">5. Teacher Responsibilities</h2>
            <p>If you offer sessions, you are responsible for the content, accuracy, and safety of your sessions. You must treat all participants respectfully and comply with all applicable laws.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">6. Privacy</h2>
            <p>We only collect the minimum information needed to provide our service (login info, email, and session/course data). We do not sell or use your data for advertising. See our Privacy Policy for details.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">7. Disclaimers</h2>
            <p>Local Hive is provided “as is” without warranties of any kind. We do not guarantee uninterrupted or error-free service, or the quality or safety of any session.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">8. Limitation of Liability</h2>
            <p>To the fullest extent allowed by law, Local Hive is not liable for any indirect, incidental, or consequential damages, or for any loss of data or profits, arising from your use of the service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">9. Termination</h2>
            <p>We may suspend or terminate your account at any time for violation of these terms or for any other reason.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-primary">10. Contact</h2>
            <p>For questions about these terms, contact us at your support/legal email.</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
