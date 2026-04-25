import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 物品识别",
  description: "上传图片，AI 识别物品名称和估算重量",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
