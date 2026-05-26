import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";
import AppWrapper from "@/components/AppWrapper";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "DevLeap AI | Autonomous Recruiter Platform",
  description: "AI-powered developer portfolios and autonomous recruiter outreach.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ClerkProvider>
          <AppWrapper>
            {children}
          </AppWrapper>
        </ClerkProvider>
      </body>
    </html>
  );
}
