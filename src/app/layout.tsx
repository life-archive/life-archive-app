import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";

import { rendererDefaults } from "@/defaults";

import "./globals.css";

// LAF archives are filesystem-backed and can change while the server is running.
export const dynamic = "force-dynamic";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: rendererDefaults.metadata.defaultTitle,
    template: "%s",
  },
  description: rendererDefaults.metadata.description,
  icons: {
    icon: "/icon",
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
      data-theme={rendererDefaults.defaultTheme}
      className={`${inter.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
