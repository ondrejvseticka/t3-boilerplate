"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, History, Settings } from "lucide-react";
import { triggerHaptic } from "~/lib/haptics";
import { useI18n } from "~/i18n/context";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  if (pathname === "/login") {
    return null;
  }

  const navItems = [
    {
      href: "/",
      label: t.nav.boiler,
      icon: Flame,
      isActive: pathname === "/",
    },
    {
      href: "/historie",
      label: t.nav.history,
      icon: History,
      isActive: pathname === "/historie",
    },
    {
      href: "/nastaveni",
      label: t.nav.settings,
      icon: Settings,
      isActive: pathname === "/nastaveni",
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#09090b]/90 backdrop-blur-xl border-t border-white/[0.06] px-4 pt-2 pb-[max(env(safe-area-inset-bottom,0px),0.75rem)]"
      role="navigation"
      aria-label="Main Navigation"
    >
      <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => triggerHaptic("light")}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-150 active:scale-95 ${
                item.isActive
                  ? "text-orange-500 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Icon className="w-5 h-5 transition-transform" />
              <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
