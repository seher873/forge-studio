import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { StoreProvider } from "@/lib/store";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Forge Studio — AI Website Builder",
  description:
    "A professional VS Code-inspired workspace to generate, edit and preview complete Next.js websites and export them as ZIP projects.",
  applicationName: "Forge Studio",
};

export const viewport: Viewport = {
  themeColor: "#0a0e16",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="bg-bg text-text antialiased">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
