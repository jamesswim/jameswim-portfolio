import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: {
    default: "Jameswim",
    template: "%s | Jameswim",
  },
  description: "嵌入式系統 / BMC / Linux 韌體 — Jameswim 的個人作品集與部落格",
  keywords: ["嵌入式系統", "BMC", "Linux", "韌體", "portfolio", "Jameswim"],
  authors: [{ name: "Jameswim" }],
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Jameswim",
    description: "嵌入式系統 / BMC / Linux 韌體 — Jameswim 的個人作品集與部落格",
    url: "https://jameswim-portfolio.vercel.app",
    siteName: "Jameswim",
    locale: "zh_TW",
    type: "website",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
