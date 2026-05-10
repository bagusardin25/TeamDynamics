import { Metadata } from "next";
import PrivacyContent from "./privacy-content";

export const metadata: Metadata = {
  title: "Privacy Policy | TeamDynamics",
  description:
    "Learn how TeamDynamics collects, uses, and protects your personal data on our AI-powered team simulation platform.",
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
