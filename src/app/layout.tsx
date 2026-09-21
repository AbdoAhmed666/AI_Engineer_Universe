import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";
import { Header, Footer } from "@/components/layout";
import { Background } from "@/components/common";

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
    'AI Engineer specializing in LLMs, RAG systems, agents, and production ML. Based in Alexandria, Egypt.',
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
    /*
     * `suppressHydrationWarning` here covers a specific, external problem:
     * browser extensions write attributes onto the two root elements before
     * React hydrates — Blackbox adds `bbai-tooltip-injected` to <html>,
     * Grammarly adds `data-gr-ext-installed` to <body> — and React reports
     * the difference as a mismatch.
     *
     * It is safe at exactly these two elements and nowhere else: the flag
     * applies only to the element it is set on, not to its subtree, and the
     * only attributes we author here (`lang`, `className`) are static and
     * never change at runtime. So nothing we control can drift unnoticed,
     * while every real mismatch below still reports normally.
     */
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="relative min-h-full flex flex-col"
        suppressHydrationWarning
      >
        <Providers>
          <Background />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
