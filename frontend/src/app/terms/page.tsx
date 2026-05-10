import { Metadata } from "next";
import TermsContent from "./terms-content";

export const metadata: Metadata = {
  title: "Terms of Service | TeamDynamics",
  description:
    "Read the TeamDynamics Terms of Service governing the use of our AI-powered team simulation platform.",
};

export default function TermsPage() {
  return <TermsContent />;
}
