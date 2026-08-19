import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import AppWrapper from "@/components/AppWrapper";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";

/* Display: architectural grotesque, used only for headlines. */
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

/* Body: the neutral workhorse everything is actually read in. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/* Mono: a face drawn for reading code — this product is about code. */
const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DevLeap AI | Your commits already made the case",
  description:
    "DevLeap reads your repositories, builds a technical profile from the source itself, matches it against live roles, and drafts pitches that cite the exact code behind every claim.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
    { media: "(prefers-color-scheme: light)", color: "#f4f6f9" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bricolage.variable} ${inter.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <head>
        {/* Applies the saved theme before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ClerkProvider>
          <AppWrapper>{children}</AppWrapper>
        </ClerkProvider>
      </body>
    </html>
  );
}
