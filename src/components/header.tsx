"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Flame, History, LogOut, Settings } from "lucide-react";

import { triggerHaptic } from "~/lib/haptics";
import { useI18n } from "~/i18n/context";

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  const userName = session?.user?.name ?? "Topič";
  const userRole = session?.user?.role ?? "MEMBER";
  const avatarColor = session?.user?.avatarColor ?? "#f97316";
  const userInitial = userName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    triggerHaptic("medium");
    setMenuOpen(false);
    await signOut({ callbackUrl: "/login" });
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Hlavní správce";
      case "ADMIN":
        return "Správce";
      default:
        return "Člen";
    }
  };

  const navLinks = [
    { href: "/", label: t.nav.boiler, icon: Flame, active: pathname === "/" },
    { href: "/historie", label: t.nav.history, icon: History, active: pathname === "/historie" },
    { href: "/nastaveni", label: t.nav.settings, icon: Settings, active: pathname === "/nastaveni" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.06] px-4 sm:px-6 pt-safe pb-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          onClick={() => triggerHaptic("light")}
          className="flex items-center gap-2.5 active:opacity-80 transition-opacity shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white leading-tight">
              {t.common.appTitle}
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono leading-none">
              {t.common.appSubtitle}
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        {session?.user && pathname !== "/login" && (
          <nav className="hidden md:flex items-center gap-1 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/80">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    link.active
                      ? "bg-[#18181b] text-orange-400 shadow-xs font-semibold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* User Profile */}
        {session?.user && (
          <div className="relative shrink-0">
            <button
              onClick={() => {
                triggerHaptic("light");
                setMenuOpen(!menuOpen);
              }}
              className="flex items-center gap-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 rounded-full py-1 pl-1 pr-3 active:scale-95 transition-all"
              aria-label="Uživatelský profil"
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                style={{ backgroundColor: avatarColor }}
              >
                {userInitial}
              </div>
              <span className="text-xs font-medium text-zinc-300 truncate max-w-[100px]">
                {userName}
              </span>
            </button>

            {/* Profile dropdown */}
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#121215] border border-zinc-800 shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-zinc-800/80 mb-1">
                    <p className="text-xs font-semibold text-white truncate">{userName}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{session.user.email}</p>
                    <span className="inline-block text-[10px] font-medium text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded mt-1.5">
                      {getRoleLabel(userRole)}
                    </span>
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    {t.common.signOut}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
