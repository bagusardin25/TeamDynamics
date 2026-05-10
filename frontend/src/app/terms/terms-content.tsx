"use client";

import Link from "next/link";
import { Scale } from "lucide-react";
import LegalPageLayout, { LegalSection } from "@/components/legal-page-layout";

const sections: LegalSection[] = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    content: (
      <>
        <p>
          By accessing or using TeamDynamics (&quot;the Service&quot;), you agree to be bound by these
          Terms of Service (&quot;Terms&quot;). If you do not agree to all of these Terms, you may not
          access or use the Service. These Terms constitute a legally binding agreement between you
          and TeamDynamics.
        </p>
        <p>
          We may update these Terms from time to time. Your continued use of the Service after
          changes constitutes acceptance of the revised Terms.
        </p>
      </>
    ),
  },
  {
    id: "description",
    title: "Description of Service",
    content: (
      <>
        <p>
          TeamDynamics is an <strong>AI-powered multi-agent team simulation platform</strong> that
          allows users to:
        </p>
        <ul>
          <li>Create virtual teams composed of AI-driven personas with distinct psychological profiles</li>
          <li>Inject crisis scenarios and observe real-time team dynamics</li>
          <li>Receive AI-generated post-simulation analysis reports</li>
          <li>Use management interventions during active simulations</li>
        </ul>
        <p>
          The Service is provided on an &quot;as-is&quot; and &quot;as-available&quot; basis. We
          reserve the right to modify, suspend, or discontinue any part of the Service at any time
          without prior notice.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "User Accounts",
    content: (
      <>
        <p>To access certain features of the Service, you must create an account. When creating an account, you agree to:</p>
        <ul>
          <li>Provide accurate and complete registration information</li>
          <li>Maintain the security of your account credentials</li>
          <li>Promptly update your account information if it changes</li>
          <li>Accept responsibility for all activity that occurs under your account</li>
          <li>Notify us immediately of any unauthorized access to your account</li>
        </ul>
        <p>
          You may register using email/password or through Google OAuth 2.0. We reserve the right
          to suspend or terminate accounts that violate these Terms.
        </p>
      </>
    ),
  },
  {
    id: "credits",
    title: "Simulation Credits & Payments",
    content: (
      <>
        <p>
          TeamDynamics operates on a <strong>credit-based system</strong>. Each simulation consumes
          one credit. New accounts receive a complimentary allocation of simulation credits.
        </p>
        <ul>
          <li>Additional credits can be purchased through our pricing page via Stripe</li>
          <li>All payments are processed securely through Stripe and subject to Stripe&apos;s terms of service</li>
          <li>Purchased credits do not expire and are non-transferable</li>
          <li>
            <strong>Refund Policy:</strong> Credits that have been used to run simulations are
            non-refundable. For unused credits, refund requests may be submitted within 14 days of
            purchase by contacting our support team
          </li>
          <li>We reserve the right to modify pricing at any time; existing purchased credits will not be affected</li>
        </ul>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use",
    content: (
      <>
        <p>You agree not to use the Service to:</p>
        <ul>
          <li>Violate any applicable laws, regulations, or third-party rights</li>
          <li>Generate content that is illegal, harmful, abusive, harassing, or discriminatory</li>
          <li>Attempt to reverse-engineer, decompile, or disassemble any part of the Service</li>
          <li>Circumvent any access controls, rate limits, or credit systems</li>
          <li>Use automated tools (bots, scrapers) to access the Service without prior written consent</li>
          <li>Impersonate any person or entity, or misrepresent your affiliation</li>
          <li>Interfere with or disrupt the integrity or performance of the Service</li>
        </ul>
        <p>
          Violation of these acceptable use policies may result in immediate account suspension or
          termination without notice.
        </p>
      </>
    ),
  },
  {
    id: "ip",
    title: "Intellectual Property",
    content: (
      <>
        <p>
          <strong>Our Property:</strong> The Service, including its source code, design, algorithms,
          AI models, documentation, and all associated intellectual property, is owned by
          TeamDynamics and is protected by copyright, trademark, and other intellectual property laws.
        </p>
        <p>
          <strong>Your Content:</strong> You retain ownership of any simulation configurations,
          custom agent profiles, and uploaded documents. By using the Service, you grant us a
          limited license to process your content solely for the purpose of delivering the Service.
        </p>
        <p>
          <strong>AI-Generated Output:</strong> Simulation outputs, reports, and AI-generated
          analysis are created through the Service and may be used by you for personal or internal
          business purposes. You may not resell AI-generated outputs as a standalone product.
        </p>
      </>
    ),
  },
  {
    id: "ai-content",
    title: "AI-Generated Content Disclaimer",
    content: (
      <>
        <p>
          TeamDynamics uses large language models (LLMs) to power agent simulations and generate
          reports. You acknowledge and agree that:
        </p>
        <ul>
          <li>
            <strong>Simulations are fictional.</strong> Agent behaviors, conversations, and outcomes
            are AI-generated scenarios and do not represent real people or guaranteed outcomes
          </li>
          <li>
            <strong>Not professional advice.</strong> Simulation results and reports should not be
            treated as professional HR, psychological, legal, or management advice
          </li>
          <li>
            AI-generated content may occasionally contain inaccuracies, biases, or unexpected outputs
          </li>
          <li>
            You are solely responsible for any decisions made based on simulation outputs
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "data-privacy",
    title: "Data & Privacy",
    content: (
      <p>
        Your privacy is important to us. Please review our{" "}
        <Link href="/privacy">Privacy Policy</Link> for detailed information about how we collect,
        use, store, and protect your personal data. The Privacy Policy is incorporated into and
        forms part of these Terms.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Termination",
    content: (
      <>
        <p>
          We may suspend or terminate your access to the Service at any time, with or without cause,
          including but not limited to:
        </p>
        <ul>
          <li>Violation of these Terms or Acceptable Use policies</li>
          <li>Fraudulent or illegal activity</li>
          <li>Extended period of account inactivity</li>
          <li>Request from law enforcement or government agencies</li>
        </ul>
        <p>
          You may terminate your account at any time by contacting our support team. Upon
          termination, your right to use the Service immediately ceases. Unused purchased credits
          are non-refundable upon voluntary termination.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    content: (
      <>
        <p>
          To the maximum extent permitted by applicable law, TeamDynamics shall not be liable for
          any indirect, incidental, special, consequential, or punitive damages, including but not
          limited to:
        </p>
        <ul>
          <li>Loss of profits, data, or business opportunities</li>
          <li>Decisions made based on simulation outputs or AI-generated reports</li>
          <li>Service interruptions, errors, or security breaches</li>
          <li>Third-party actions, including LLM provider outages</li>
        </ul>
        <p>
          Our total liability for any claims arising from or related to the Service shall not exceed
          the amount you paid to us in the twelve (12) months preceding the claim.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to Terms",
    content: (
      <p>
        We reserve the right to modify these Terms at any time. Material changes will be
        communicated through the Service or via email to registered users. The &quot;Last
        updated&quot; date at the top of this page reflects the most recent revision. Your continued
        use of the Service after changes constitutes acceptance of the updated Terms.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact Information",
    content: (
      <>
        <p>If you have questions about these Terms of Service, please contact us:</p>
        <ul>
          <li>
            <strong>Email:</strong>{" "}
            <a href="mailto:legal@teamdynamics.dev">legal@teamdynamics.dev</a>
          </li>
          <li>
            <strong>Subject Line:</strong> Terms of Service Inquiry
          </li>
        </ul>
      </>
    ),
  },
];

export default function TermsContent() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      subtitle="Legal Agreement"
      icon={<Scale className="w-3.5 h-3.5" />}
      lastUpdated="May 10, 2026"
      sections={sections}
      crossLink={{ href: "/privacy", label: "Privacy Policy" }}
    />
  );
}
