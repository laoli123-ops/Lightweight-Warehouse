import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

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
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto pt-14 px-4 pb-4 md:pt-6 md:px-6 md:pb-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
