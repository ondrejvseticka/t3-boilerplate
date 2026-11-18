"use client";

import dynamic from "next/dynamic";
import { Flame } from "lucide-react";

export const Boiler3DView = dynamic(
  () => import("./boiler-3d-view").then((mod) => mod.Boiler3DView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 sm:h-72 md:h-80 rounded-2xl bg-[#0a0a0c] border border-white/[0.08] flex flex-col items-center justify-center gap-2">
        <Flame className="w-6 h-6 text-orange-500 animate-pulse" />
        <span className="text-[11px] font-mono text-zinc-400">Načítám 3D ohniště...</span>
      </div>
    ),
  },
);
