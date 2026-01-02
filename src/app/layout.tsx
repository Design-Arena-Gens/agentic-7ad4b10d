import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Clarity Ledger — Expense Tracking Dashboard",
  description:
    "Manage and analyze your spending with an interactive expense tracking dashboard that keeps data on your device.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-950">
      <body className={`${inter.variable} min-h-screen bg-slate-950 font-sans antialiased`}>{children}</body>
    </html>
  );
}
