import type { Metadata } from "next";
import { Bricolage_Grotesque, Manrope, Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Valura — GIFT City Tax Optimizer",
  description:
    "LRS & TCS calculator, algorithmic tax-loss harvesting, and AI-powered tax advisory for Indian HNI investors",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bricolage.variable} ${manrope.variable} ${inter.variable}`}
    >
      <body className="font-body bg-brand-bg text-brand-dark antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="ml-60 flex-1 min-h-screen overflow-auto bg-[#FFFFFC]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
