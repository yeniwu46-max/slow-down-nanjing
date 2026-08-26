import type { Metadata } from "next";
import { Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { GestureShell } from "@/components/gesture/gesture-shell";
import "./globals.css";

const notoSerif = Noto_Serif_SC({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSans = Noto_Sans_SC({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "\u5b81\u53ef\u6162\u4e00\u70b9 | Slow down, Feel Nanjing",
  description:
    "用 AI 与 AR，让当代人走进金陵水墨，把日子过慢一点。Slow down, Feel Nanjing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${notoSerif.variable} ${notoSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-charcoal font-sans">
        <AppProviders>
          {children}
          <GestureShell />
        </AppProviders>
      </body>
    </html>
  );
}
