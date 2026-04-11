import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claude Now — Claudeの最新情報を、あなたの言葉で。",
  description: "Claudeのアップデートを非技術者向けに日本語で分かりやすく届けるニュースサイト",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
