"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import LegalPageLayout, { LegalSection } from "@/components/legal-page-layout";

const sections: LegalSection[] = [
  {
    id: "info-collected",
    title: "Information We Collect",
    content: (
      <>
        <p>We collect the following categories of information when you use TeamDynamics:</p>
        <p><strong>Account Information</strong></p>
        <ul>
          <li>Name, email address, and password (hashed with bcrypt)</li>
          <li>Google profile data (name, email, avatar) if you sign in via Google OAuth 2.0</li>
          <li>Account role and simulation credit balance</li>
        </ul>
        <p><strong>Simulation Data</strong></p>
        <ul>
          <li>Company profiles and crisis scenarios you configure</li>
          <li>Custom agent configurations (names, roles, personality traits)</li>
          <li>Simulation messages, agent responses, and state data</li>
          <li>AI-generated reports and analysis outputs</li>
        </ul>
        <p><strong>Uploaded Documents</strong></p>
        <ul>
          <li>Files uploaded for AI document analysis (PDF, DOCX, TXT, CSV, XLSX)</li>
          <li>Extracted text content used solely for analysis purposes</li>
        </ul>
        <p><strong>Usage Data</strong></p>
        <ul>
          <li>Browser type, operating system, and device information</li>
          <li>Pages visited, features used, and interaction patterns</li>
          <li>Error logs and performance data (via Sentry)</li>
        </ul>
        <p><strong>Payment Information</strong></p>
        <ul>
          <li>Payment processing is handled entirely by Stripe. We do not store credit card numbers, CVVs, or full card details on our servers</li>
          <li>We receive transaction confirmations and credit package identifiers from Stripe</li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "How We Use Your Information",
    content: (
      <>
        <p>We use the information we collect to:</p>
        <ul>
          <li><strong>Provide the Service</strong> — Create and manage your account, run simulations, generate reports</li>
          <li><strong>Process Payments</strong> — Manage credit purchases and transaction records</li>
          <li><strong>Improve the Service</strong> — Analyze usage patterns to enhance features and fix bugs</li>
          <li><strong>Communicate</strong> — Send service updates, onboarding emails, and respond to support inquiries</li>
          <li><strong>Ensure Security</strong> — Detect and prevent fraud, abuse, and unauthorized access</li>
          <li><strong>Legal Compliance</strong> — Meet applicable legal and regulatory obligations</li>
        </ul>
      </>
    ),
  },
  {
    id: "ai-data",
    title: "AI & LLM Data Processing",
    content: (
      <>
        <p>
          TeamDynamics uses third-party Large Language Model (LLM) providers to power agent
          simulations and report generation. Here is how your data is handled:
        </p>
        <ul>
          <li>
            <strong>Data sent to LLM providers:</strong> Simulation prompts include company profiles,
            crisis scenarios, agent personality configurations, and conversation history.
            We do not include your personal account information (email, password, payment data) in
            LLM prompts
          </li>
          <li>
            <strong>Providers used:</strong> OpenAI, Google Gemini, and OpenRouter (which may route
            to various model providers). Each provider has its own data handling policies
          </li>
          <li>
            We do not use your simulation data to train or fine-tune any AI models
          </li>
          <li>
            LLM responses are generated in real-time and stored as simulation messages in our database
            for your continued access
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "data-sharing",
    title: "Data Sharing & Third Parties",
    content: (
      <>
        <p>We share data with the following third-party services, strictly as required to operate the platform:</p>
        <ul>
          <li>
            <strong>Stripe</strong> — Payment processing. Stripe receives your payment details directly
            and is subject to the{" "}
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
              Stripe Privacy Policy
            </a>
          </li>
          <li>
            <strong>Google</strong> — OAuth authentication. If you sign in with Google, we receive
            basic profile data per{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Google&apos;s Privacy Policy
            </a>
          </li>
          <li>
            <strong>LLM Providers</strong> (OpenAI, Google Gemini, OpenRouter) — Simulation prompt
            data as described in the AI & LLM Data Processing section above
          </li>
          <li>
            <strong>Sentry</strong> — Error tracking and performance monitoring. May receive
            anonymized error data and user identifiers for debugging purposes
          </li>
          <li>
            <strong>Resend</strong> — Transactional email delivery for onboarding and notifications
          </li>
        </ul>
        <p>
          We do <strong>not</strong> sell, rent, or trade your personal information to any third
          party for marketing or advertising purposes.
        </p>
      </>
    ),
  },
  {
    id: "data-security",
    title: "Data Storage & Security",
    content: (
      <>
        <p>
          We implement industry-standard security measures to protect your data:
        </p>
        <ul>
          <li><strong>Authentication:</strong> JWT-based token authentication with 7-day expiry</li>
          <li><strong>Password Security:</strong> All passwords are hashed using bcrypt with automatic salting — we never store plaintext passwords</li>
          <li><strong>Transport Encryption:</strong> All data in transit is encrypted via HTTPS/TLS</li>
          <li><strong>Access Control:</strong> CORS restrictions, rate limiting, and role-based access controls</li>
          <li><strong>File Uploads:</strong> Size limits (10MB) and extension whitelisting to prevent malicious uploads</li>
        </ul>
        <p>
          While we strive to protect your data, no method of electronic storage or transmission is
          100% secure. We cannot guarantee absolute security.
        </p>
      </>
    ),
  },
  {
    id: "data-retention",
    title: "Data Retention",
    content: (
      <>
        <p>We retain your data as follows:</p>
        <ul>
          <li><strong>Account Data:</strong> Retained for as long as your account is active. Deleted upon account deletion request</li>
          <li><strong>Simulation Data:</strong> Retained for your continued access to simulation history, reports, and replays. Deleted upon account deletion request</li>
          <li><strong>Uploaded Documents:</strong> Processed in-memory for analysis and not permanently stored after processing</li>
          <li><strong>Payment Records:</strong> Retained as required by financial regulations and Stripe&apos;s data retention policies</li>
          <li><strong>Error Logs:</strong> Retained in Sentry for up to 90 days for debugging purposes</li>
        </ul>
      </>
    ),
  },
  {
    id: "your-rights",
    title: "Your Rights",
    content: (
      <>
        <p>Depending on your jurisdiction, you may have the following rights regarding your personal data:</p>
        <ul>
          <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
          <li><strong>Correction:</strong> Request correction of inaccurate personal data</li>
          <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
          <li><strong>Export:</strong> Request an export of your simulation data in a machine-readable format</li>
          <li><strong>Opt-Out:</strong> Unsubscribe from non-essential email communications at any time</li>
          <li><strong>Withdraw Consent:</strong> Where processing is based on consent, you may withdraw it at any time</li>
        </ul>
        <p>
          To exercise any of these rights, please contact us at{" "}
          <a href="mailto:privacy@teamdynamics.dev">privacy@teamdynamics.dev</a>. We will respond
          to your request within 30 days.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies & Local Storage",
    content: (
      <>
        <p>TeamDynamics uses minimal cookies and browser storage:</p>
        <ul>
          <li>
            <strong>Authentication Token:</strong> A JWT token stored in your browser&apos;s local
            storage to maintain your login session
          </li>
          <li>
            <strong>Theme Preference:</strong> Your dark/light mode preference is stored locally
          </li>
        </ul>
        <p>
          We do not use third-party tracking cookies, advertising pixels, or behavioral tracking
          technologies.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children's Privacy",
    content: (
      <p>
        TeamDynamics is not intended for use by individuals under the age of 16. We do not
        knowingly collect personal information from children under 16. If we become aware that we
        have collected personal data from a child under 16, we will take steps to delete that
        information promptly. If you believe a child has provided us with personal data, please
        contact us at{" "}
        <a href="mailto:privacy@teamdynamics.dev">privacy@teamdynamics.dev</a>.
      </p>
    ),
  },
  {
    id: "international",
    title: "International Data Transfers",
    content: (
      <p>
        Your data may be processed and stored in jurisdictions outside your country of residence,
        including the United States, where our service providers (Stripe, OpenAI, Google, Sentry)
        operate. By using the Service, you consent to the transfer of your information to these
        jurisdictions, which may have different data protection laws than your country. We take
        reasonable steps to ensure that your data is treated securely and in accordance with this
        Privacy Policy.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to This Policy",
    content: (
      <p>
        We may update this Privacy Policy periodically. Material changes will be communicated
        through the Service or via email to registered users. The &quot;Last updated&quot; date at
        the top of this page indicates the most recent revision. Your continued use of the Service
        after changes constitutes acceptance of the updated Privacy Policy.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact Information",
    content: (
      <>
        <p>If you have questions about this Privacy Policy or wish to exercise your data rights:</p>
        <ul>
          <li>
            <strong>Privacy inquiries:</strong>{" "}
            <a href="mailto:privacy@teamdynamics.dev">privacy@teamdynamics.dev</a>
          </li>
          <li>
            <strong>General support:</strong>{" "}
            <a href="mailto:support@teamdynamics.dev">support@teamdynamics.dev</a>
          </li>
        </ul>
        <p>
          For more information about our service terms, please see our{" "}
          <Link href="/terms">Terms of Service</Link>.
        </p>
      </>
    ),
  },
];

export default function PrivacyContent() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="Data Protection"
      icon={<Shield className="w-3.5 h-3.5" />}
      lastUpdated="May 10, 2026"
      sections={sections}
      crossLink={{ href: "/terms", label: "Terms of Service" }}
    />
  );
}
