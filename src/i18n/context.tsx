"use client";

import React, { createContext, useContext } from "react";
import { cs, type Translations } from "./locales/cs";

interface I18nContextType {
  t: Translations;
}

const I18nContext = createContext<I18nContextType>({
  t: cs,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  return (
    <I18nContext.Provider value={{ t: cs }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
