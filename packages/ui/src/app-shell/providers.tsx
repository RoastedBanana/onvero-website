"use client";

import { LanguageProvider } from "@onvero/lib/language-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
