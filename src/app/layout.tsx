import type { Metadata } from "next";
import "./globals.css";
import { ClientShell } from "@/components/ClientShell";

export const metadata: Metadata = {
  title: "轻量仓库管理系统",
  description: "轻量级仓库出入库管理系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
