import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";

import { Providers } from "~/components/providers";
import { Header } from "~/components/header";
import { BottomNav } from "~/components/bottom-nav";

export const metadata: Metadata = {
  title: "Kotelna | Správa topení",
  description: "Správa přikládání a sledování stavu kotle",
  applicationName: "Kotelna",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kotelna",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs" className="dark">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-[#09090b] text-zinc-100 min-h-dvh flex flex-col font-sans selection:bg-orange-500/20">
        <Providers>
          <Header />
          <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pt-4 pb-nav md:pb-12">
            {children}
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
