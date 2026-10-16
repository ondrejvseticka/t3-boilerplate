import Link from "next/link";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { Logo } from "~/components/logo";

export default async function Home() {
  const session = await auth();
  const hello = await api.post.hello({ text: "from tRPC" }).catch(() => null);

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-between bg-[#08080C] text-zinc-100 selection:bg-purple-500 selection:text-white">
        {/* Navigation bar */}
        <nav className="flex w-full max-w-6xl items-center justify-between px-6 py-6 border-b border-zinc-900/80">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="md" />
          </Link>

          <div className="flex items-center gap-3">
            {session ? (
              <Link
                href="/dashboard"
                className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-500"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-xl bg-gradient-to-r from-[#9333EA] to-[#D946EF] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:brightness-105"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Hero section */}
        <section className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-semibold text-purple-400 mb-8 backdrop-blur-sm">
            <span>🚀 Production T3 Stack with JWT Auth &amp; Resend Emails</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Advanced Boilerplate for{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              T3 Stack &amp; Next.js 15
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base text-zinc-400 sm:text-lg leading-relaxed">
            Kickstart your next production SaaS with NextAuth v5 JWT sessions, bcrypt credentials,
            password strength evaluation, transactional emails with Resend &amp; React Email, Prisma ORM, and tRPC.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <Link
              href={session ? "/dashboard" : "/auth/register"}
              className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-[#9333EA] via-[#A855F7] to-[#D946EF] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:shadow-purple-600/50 hover:brightness-105"
            >
              {session ? "Open Dashboard →" : "Get Started Now →"}
            </Link>
            <Link
              href="/auth/forgot-password"
              className="w-full sm:w-auto rounded-xl border border-zinc-800 bg-zinc-900/60 px-6 py-3.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            >
              Forgot Password Demo
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3 text-left w-full">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-sm">
              <div className="text-2xl mb-3">🔐</div>
              <h3 className="text-sm font-semibold text-white">NextAuth v5 + JWT</h3>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Credentials authentication with bcrypt hashing, password strength evaluation, and sliding-window rate limiting.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-sm">
              <div className="text-2xl mb-3">✉️</div>
              <h3 className="text-sm font-semibold text-white">Resend &amp; React Email</h3>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                Beautiful, responsive email templates for password resets and welcome onboarding with local simulation fallback.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-sm">
              <div className="text-2xl mb-3">⚡️</div>
              <h3 className="text-sm font-semibold text-white">End-to-End Type Safety</h3>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                tRPC v11 connecting React 19 Client components directly to Prisma PostgreSQL models with full autocomplete.
              </p>
            </div>
          </div>

          {/* tRPC Server Call Verification */}
          {hello && (
            <div className="mt-12 text-xs text-zinc-500 font-mono">
              Server status: <span className="text-emerald-400">{hello.greeting}</span>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="w-full border-t border-zinc-900/80 py-6 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} T3 Boilerplate. Built with Next.js 15, Prisma, tRPC, NextAuth, and Resend.
        </footer>
      </main>
    </HydrateClient>
  );
}
