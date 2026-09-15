import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GlobalAIChatbot } from "@/components/chat/GlobalAIChatbot";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NER–MargDarshak | AI Logistics & Accessibility Intelligence Platform",
  description: "AI-Powered Smart Logistics & Accessibility Intelligence Platform for the North Eastern Region of India (NER). Real-time road monitoring, predictive disruption alerts, and RBAC-secured emergency supply coordination.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#FAF8F5] text-stone-900 selection:bg-emerald-200 selection:text-emerald-950">
        <LanguageProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
            {/* Universal AI Chatbot Accessible Across Every Page */}
            <GlobalAIChatbot />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
