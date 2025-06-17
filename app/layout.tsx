import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "能不能好好命名？（地信版）",
  description: "能不能好好命名？（地信版）",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
