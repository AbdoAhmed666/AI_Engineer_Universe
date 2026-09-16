import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";
import { Header, Footer, LoadingScreen, ScrollProgress } from "@/components/layout";
import { Background, PageTransition } from "@/components/common";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Abdelrhman Ahmed — AI Engineer',
  description:
    'AI Engineer specializing in LLMs, RAG systems, agents, and production ML. Based in Cairo, Egypt.',
  keywords: [
    'AI Engineer',
    'LLM Engineer',
    'Machine Learning',
    'RAG',
    'LangChain',
    'FastAPI',
    'Python',
  ],
  openGraph: {
    title: 'Abdelrhman Ahmed — AI Engineer',
    description: 'Building production-grade AI systems with LLMs, RAG, and ML.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <Background />
          {/* Subtle noise texture overlay for premium depth */}
          <div
            className="noise-overlay fixed inset-0"
            aria-hidden="true"
            style={{ zIndex: 1 }}
          />
          <ScrollProgress />
          <LoadingScreen />
          <Header />
          <main className="flex-1">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
