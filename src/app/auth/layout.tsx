import Link from "next/link";
import { Logo } from "~/components/logo";
import { AuthFooterPrompt } from "./_components/auth-footer-prompt";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#08080C] text-zinc-100 selection:bg-purple-500 selection:text-white">
      {/* Left Column: Auth Shell & Children */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between px-6 sm:px-12 md:px-16 xl:px-24 py-10 min-h-screen z-10">
        {/* Top Header Logo */}
        <div>
          <Link href="/" className="inline-block transition hover:opacity-90">
            <Logo size="md" />
          </Link>
        </div>

        {/* Center Container for Child Page Form */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          {children}
        </div>

        {/* Bottom Footer Section */}
        <div className="w-full pt-8 border-t border-zinc-900/80">
          <div>
            <AuthFooterPrompt />
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-500 mt-4">
            <Link href="#" className="hover:text-zinc-300 transition">Terms of Service</Link>
            <span>•</span>
            <Link href="#" className="hover:text-zinc-300 transition">Privacy Policy</Link>
            <span>•</span>
            <Link href="#" className="hover:text-zinc-300 transition">Documentation</Link>
            <span>•</span>
            <span>T3 Boilerplate © {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>

      {/* Right Column: Branded Hero Showcase */}
      <div className="hidden lg:relative lg:flex lg:w-1/2 min-h-screen overflow-hidden bg-zinc-950 items-center justify-center p-12">
        {/* Ambient Gradient Background Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(147,51,234,0.25),rgba(255,255,255,0))]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md text-left space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-semibold text-purple-400">
            <span>✨ Full-Stack T3 Boilerplate</span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Type-safe full stack with modern JWT auth
          </h2>

          <p className="text-sm text-zinc-400 leading-relaxed">
            Pre-configured with Next.js 15 App Router, NextAuth v5 JWT session strategy,
            bcrypt credentials authentication, password strength meter, Resend transactional emails,
            and Prisma ORM on PostgreSQL.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="text-lg font-bold text-white mb-1">🔐 Auth</div>
              <div className="text-xs text-zinc-400">JWT sessions &amp; bcrypt password hashing</div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="text-lg font-bold text-white mb-1">✉️ Emails</div>
              <div className="text-xs text-zinc-400">Resend &amp; React Email templates</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
