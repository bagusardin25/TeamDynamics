import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "TeamDynamics | Startup Simulator",
  description: "What happens when you push your team too hard? A multi-agent AI sandbox to explore office politics, morale, and productivity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Force dark mode for that sleek SaaS aesthetic
  return (
    <html lang="en" className="dark">
      <body
        className={`${poppins.variable} antialiased min-h-screen bg-background text-foreground font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
