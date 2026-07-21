import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TeamDynamics Documentation",
  description:
    "Learn how TeamDynamics supports decision rehearsal with multi-agent simulations, controlled interventions, replay, and transparent AI model usage.",
};

export default function DocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
