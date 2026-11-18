"use client";

import { useEffect, useRef, useState } from "react";
import { Flame, RotateCcw, Sparkles } from "lucide-react";

import { FireboxSceneManager, type FireboxStatus } from "./firebox-scene";

interface Boiler3DViewProps {
  status: FireboxStatus;
  className?: string;
}

export function Boiler3DView({ status, className = "" }: Boiler3DViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneManagerRef = useRef<FireboxSceneManager | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize Babylon.js Scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let manager: FireboxSceneManager | null = null;

    try {
      manager = new FireboxSceneManager(canvas, status);
      sceneManagerRef.current = manager;
      setIsLoaded(true);
    } catch (err) {
      console.error("Failed to initialize Babylon 3D firebox:", err);
    }

    // Resize observer for responsive layout
    const resizeObserver = new ResizeObserver(() => {
      manager?.resize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (manager) {
        manager.dispose();
        sceneManagerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update status when prop changes
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setStatus(status);
    }
  }, [status]);

  const handleResetCamera = () => {
    sceneManagerRef.current?.resetCamera();
  };

  const getStatusBadge = () => {
    switch (status) {
      case "ok":
        return {
          label: "Žhavý oheň",
          dotColor: "bg-orange-500",
          textColor: "text-orange-400",
          badgeBg: "bg-orange-500/10 border-orange-500/20",
        };
      case "warn":
        return {
          label: "Dohořívá – žhavé uhlíky",
          dotColor: "bg-amber-500",
          textColor: "text-amber-400",
          badgeBg: "bg-amber-500/10 border-amber-500/20",
        };
      case "expired":
        return {
          label: "Vychládá – zbytky uhlíků",
          dotColor: "bg-red-500 animate-pulse",
          textColor: "text-red-400",
          badgeBg: "bg-red-500/10 border-red-500/20",
        };
      case "off":
      default:
        return {
          label: "Vyhaslo – studený popel",
          dotColor: "bg-zinc-500",
          textColor: "text-zinc-400",
          badgeBg: "bg-zinc-800/60 border-zinc-700/50",
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-64 sm:h-72 md:h-80 rounded-2xl overflow-hidden bg-[#0a0a0c] border border-white/[0.08] shadow-inner select-none ${className}`}
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full outline-none block cursor-grab active:cursor-grabbing transition-opacity duration-700 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Loading Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0a0a0c]">
          <Flame className="w-6 h-6 text-orange-500 animate-pulse" />
          <span className="text-[11px] font-mono text-zinc-400">Načítám 3D ohniště...</span>
        </div>
      )}

      {/* Top Left: Status Pill */}
      <div className="absolute top-3 left-3 pointer-events-none flex items-center gap-1.5 z-10">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium backdrop-blur-md ${badge.badgeBg} ${badge.textColor}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`} />
          <span>{badge.label}</span>
        </div>
      </div>

      {/* Top Right: Reset Camera Control */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleResetCamera}
          aria-label="Obnovit pohled do ohniště"
          className="p-1.5 rounded-lg bg-zinc-900/70 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/[0.08] backdrop-blur-md transition-all active:scale-95"
          title="Obnovit výchozí úhel pohledu"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Subtle Interaction Hint */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 pointer-events-none z-10">
        <span className="text-[10px] text-zinc-400/80 font-mono tracking-wider backdrop-blur-xs px-2 py-0.5 rounded-full">
          3D ohniště • tažením pootočíte
        </span>
      </div>
    </div>
  );
}
