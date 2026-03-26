"use client";

import { ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n";
import { Sidebar } from "@/components/Sidebar";

export function ClientShell({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pt-14 px-4 pb-4 md:pt-6 md:px-6 md:pb-6">
          {children}
        </main>
      </div>
    </I18nProvider>
  );
}
