import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Open Science — Distributed AI Research",
  description:
    "A Folding@Home for AI-powered research. Contributors run agents that work on research tasks coordinated by a central server.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-950 font-sans text-zinc-100 antialiased`}
      >
        <Header />
        <Sidebar />
        <main className="pt-14 lg:pl-56">
          <div className="mx-auto max-w-7xl p-4 lg:p-6">{children}</div>
        </main>
      </body>
    </html>
  );
}
