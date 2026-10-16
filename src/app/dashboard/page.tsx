import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "~/server/auth";
import { UserNav } from "~/app/dashboard/_components/user-nav";
import { Logo } from "~/components/logo";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-purple-500 selection:text-white">
      {/* Top navbar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Logo size="sm" />
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <span className="text-white">Dashboard</span>
            </nav>
          </div>

          <UserNav user={session.user} />
        </div>
      </header>

      {/* Main dashboard content */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Welcome Banner */}
        <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900/80 via-zinc-900/50 to-purple-950/20 p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400 mb-3">
                <span>🔐 Authenticated with JWT Session</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Welcome back, {session.user.name ?? "Developer"}!
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                You are securely signed in using NextAuth v5 JWT session strategy.
              </p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Session Card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-3">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider text-zinc-400">
              Active Session
            </h2>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-zinc-500 block">User ID</span>
                <span className="font-mono text-zinc-300 break-all">{session.user.id}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Email</span>
                <span className="font-mono text-zinc-300">{session.user.email}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Name</span>
                <span className="text-zinc-300">{session.user.name ?? "—"}</span>
              </div>
            </div>
          </div>

          {/* Architecture Card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-3">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider text-zinc-400">
              Architecture
            </h2>
            <ul className="text-xs text-zinc-300 space-y-2">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Next.js 15 (App Router &amp; Turbopack)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>tRPC v11 with Type Safety</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Prisma ORM + PostgreSQL</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>NextAuth v5 (JWT Strategy)</span>
              </li>
            </ul>
          </div>

          {/* Quick Actions Card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-3">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider text-zinc-400">
              Quick Links
            </h2>
            <div className="space-y-2 text-xs">
              <Link
                href="/auth/forgot-password"
                className="block rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-zinc-300 hover:border-zinc-700 hover:text-white transition"
              >
                Test Forgot Password Flow →
              </Link>
              <Link
                href="/"
                className="block rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-zinc-300 hover:border-zinc-700 hover:text-white transition"
              >
                View Public Landing Page →
              </Link>
              <a
                href="https://create.t3.gg/en/introduction"
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-zinc-300 hover:border-zinc-700 hover:text-white transition"
              >
                Create T3 App Docs ↗
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
