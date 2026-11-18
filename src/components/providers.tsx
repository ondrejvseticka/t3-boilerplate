"use client";

import { SessionProvider } from "next-auth/react";
import { TRPCReactProvider } from "~/trpc/react";
import { I18nProvider } from "~/i18n/context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TRPCReactProvider>
        <I18nProvider>{children}</I18nProvider>
      </TRPCReactProvider>
    </SessionProvider>
  );
}
