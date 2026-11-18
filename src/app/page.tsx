"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Flame,
  Trash2,
  Power,
  Clock,
  MessageSquare,
  Check,
} from "lucide-react";

import { api } from "~/trpc/react";
import { triggerHaptic } from "~/lib/haptics";
import {
  calculateCountdown,
  formatRelativeTimeCz,
  formatTimeOfDayCz,
} from "~/lib/date-utils";
import { useI18n } from "~/i18n/context";
import { Boiler3DView } from "~/components/boiler-3d";

type ActionType = "STOKE" | "WOOD" | "COAL" | "NIGHT" | "ASH" | "OUT";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useI18n();
  const utils = api.useUtils();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  const { data: dashboardData, isLoading } = api.boiler.getDashboard.useQuery(
    undefined,
    {
      enabled: status === "authenticated",
      refetchInterval: 15000,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
    },
  );

  const [countdown, setCountdown] = useState(() =>
    calculateCountdown(
      dashboardData?.state.nextCheckAt,
      dashboardData?.state.lastFuelAt,
    ),
  );

  const [noteText, setNoteText] = useState("");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (dashboardData?.state?.note !== undefined && !isEditingNote) {
      setNoteText(dashboardData.state.note);
    }
  }, [dashboardData?.state?.note, isEditingNote]);

  useEffect(() => {
    const tick = () => {
      setCountdown(
        calculateCountdown(
          dashboardData?.state.nextCheckAt,
          dashboardData?.state.lastFuelAt,
        ),
      );
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [dashboardData?.state.nextCheckAt, dashboardData?.state.lastFuelAt]);

  const logMutation = api.boiler.logAction.useMutation({
    onMutate: async ({ actionType }) => {
      triggerHaptic("heavy");
      showToast(t.boiler.actionLogged);

      await utils.boiler.getDashboard.cancel();
      const previousDashboard = utils.boiler.getDashboard.getData();

      if (previousDashboard) {
        const now = new Date();
        const settings = previousDashboard.settings;
        let nextCheckAt = previousDashboard.state.nextCheckAt;
        let lastFuelAt = previousDashboard.state.lastFuelAt;

        if (actionType === "STOKE") {
          lastFuelAt = now;
          nextCheckAt = new Date(now.getTime() + settings.stokeMinutes * 60000);
        } else if (actionType === "OUT") {
          nextCheckAt = null;
        }

        utils.boiler.getDashboard.setData(undefined, {
          ...previousDashboard,
          state: {
            ...previousDashboard.state,
            lastActionType: actionType as any,
            lastUserName: session?.user?.name ?? t.common.you,
            lastFuelAt,
            nextCheckAt,
            updatedAt: now,
          },
        });
      }

      return { previousDashboard };
    },
    onError: (_err, _vars, context) => {
      triggerHaptic("warning");
      if (context?.previousDashboard) {
        utils.boiler.getDashboard.setData(undefined, context.previousDashboard);
      }
    },
    onSettled: async () => {
      await utils.boiler.getDashboard.invalidate();
    },
  });

  const noteMutation = api.boiler.updateNote.useMutation({
    onSuccess: () => {
      triggerHaptic("success");
      setIsEditingNote(false);
      void utils.boiler.getDashboard.invalidate();
    },
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleActionClick = (actionType: "STOKE" | "ASH" | "OUT") => {
    logMutation.mutate({ actionType });
  };

  if (status === "loading" || (isLoading && !dashboardData)) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 py-3">
        <div className="md:col-span-7 lg:col-span-8 space-y-4">
          <div className="h-44 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 animate-pulse" />
          <div className="h-24 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 animate-pulse" />
        </div>
        <div className="md:col-span-5 lg:col-span-4 space-y-4">
          <div className="h-32 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 animate-pulse" />
          <div className="h-48 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 animate-pulse" />
        </div>
      </div>
    );
  }

  const state = dashboardData?.state;
  const settings = dashboardData?.settings;

  let statusDotColor = "bg-emerald-500";
  let statusText = t.boiler.statusOptimal;
  let timerTextColor = "text-white";

  if (countdown.status === "expired") {
    statusDotColor = "bg-red-500 animate-pulse";
    statusText = t.boiler.statusExpired;
    timerTextColor = "text-red-400";
  } else if (countdown.status === "warn") {
    statusDotColor = "bg-amber-500";
    statusText = t.boiler.statusWarning;
    timerTextColor = "text-amber-300";
  } else if (countdown.status === "off") {
    statusDotColor = "bg-zinc-600";
    statusText = t.boiler.statusOff;
    timerTextColor = "text-zinc-500";
  }

  return (
    <div className="pb-4">
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-zinc-800 text-white border border-zinc-700/80 px-4 py-1.5 rounded-full text-xs font-medium shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <Check className="w-3.5 h-3.5 text-orange-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* =========================================================================
            LEFT COLUMN (PRIMARY BOILER CONTROLS)
            ========================================================================= */}
        <div className="md:col-span-7 lg:col-span-8 space-y-4">
          {/* Main Status & Countdown Card */}
          <section className="rounded-2xl bg-[#121215] border border-white/[0.07] p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${statusDotColor}`} />
                <span className="text-xs font-medium text-zinc-300">{statusText}</span>
              </div>

              <span className="text-[11px] font-mono text-zinc-400">
                {countdown.status === "expired"
                  ? t.boiler.overdueBy
                  : t.boiler.nextRefuelIn}
              </span>
            </div>

            <div className="my-2 text-center">
              <div
                className={`text-5xl sm:text-6xl md:text-7xl font-mono font-semibold tracking-tighter ${timerTextColor}`}
              >
                {countdown.formatted}
              </div>
            </div>

            {countdown.status !== "off" && (
              <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden my-4">
                <div
                  className={`h-full transition-all duration-700 ${
                    countdown.status === "expired"
                      ? "bg-red-500"
                      : countdown.status === "warn"
                        ? "bg-amber-500"
                        : "bg-orange-500"
                  }`}
                  style={{ width: `${Math.min(100, countdown.percentElapsed)}%` }}
                />
              </div>
            )}

            <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-zinc-500">{t.boiler.stokedBy}:</span>
                <span className="font-medium text-zinc-200 truncate">
                  {state?.lastUserName ?? "Nikdo"}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0 text-zinc-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatRelativeTimeCz(state?.lastFuelAt)}</span>
                <span className="text-zinc-500">
                  ({formatTimeOfDayCz(state?.lastFuelAt)})
                </span>
              </div>
            </div>
          </section>

          {/* 3D Realistic Firebox Chamber (Babylon.js) */}
          <section>
            <Boiler3DView status={countdown.status} />
          </section>

          {/* SINGLE PRIMARY STOKING ACTION BUTTON */}
          <section className="space-y-2">
            <h2 className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400 px-1">
              {t.boiler.actionsHeading}
            </h2>

            <button
              type="button"
              disabled={logMutation.isPending}
              onClick={() => handleActionClick("STOKE")}
              className="w-full h-24 sm:h-28 rounded-2xl bg-[#121215] hover:bg-zinc-900 border border-orange-500/30 hover:border-orange-500/60 p-4 sm:p-5 flex items-center justify-between active:scale-[0.99] transition-all text-left group shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-bold text-white leading-tight">
                    {t.boiler.stokedTitle}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {t.boiler.stokedDesc} • {settings?.stokeMinutes ?? 180} {t.settings.minutesUnit} (
                    {((settings?.stokeMinutes ?? 180) / 60).toFixed(1)} {t.settings.hoursUnit})
                  </p>
                </div>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-white bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded-xl shadow-xs transition-colors shrink-0">
                {t.boiler.stokedActionBtn}
              </span>
            </button>
          </section>

          {/* Service Actions (Ash & Out) */}
          <section className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={logMutation.isPending}
              onClick={() => handleActionClick("ASH")}
              className="h-14 rounded-2xl bg-[#121215] hover:bg-zinc-900 border border-white/[0.06] p-3 flex items-center gap-2.5 active:scale-[0.99] transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-zinc-200 truncate">
                  {t.boiler.ashTitle}
                </p>
                <p className="text-[10px] text-zinc-400 truncate">{t.boiler.ashDesc}</p>
              </div>
            </button>

            <button
              type="button"
              disabled={logMutation.isPending}
              onClick={() => handleActionClick("OUT")}
              className="h-14 rounded-2xl bg-[#121215] hover:bg-zinc-900 border border-white/[0.06] p-3 flex items-center gap-2.5 active:scale-[0.99] transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                <Power className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-zinc-200 truncate">
                  {t.boiler.outTitle}
                </p>
                <p className="text-[10px] text-zinc-400 truncate">{t.boiler.outDesc}</p>
              </div>
            </button>
          </section>
        </div>

        {/* =========================================================================
            RIGHT COLUMN (NOTICE BOARD & RECENT ACTIVITY)
            ========================================================================= */}
        <div className="md:col-span-5 lg:col-span-4 space-y-4">
          {/* Notice Board */}
          <section className="rounded-2xl bg-[#121215] border border-white/[0.07] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
                {t.boiler.noticeBoard}
              </span>
              {state?.note && !isEditingNote && (
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    setIsEditingNote(true);
                  }}
                  className="text-[11px] font-medium text-orange-400 hover:text-orange-300"
                >
                  {t.common.edit}
                </button>
              )}
            </div>

            {isEditingNote ? (
              <div className="space-y-2 mt-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder={t.boiler.noticePlaceholder}
                  maxLength={250}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 resize-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      setIsEditingNote(false);
                      setNoteText(state?.note ?? "");
                    }}
                    className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                  >
                    {t.common.cancel}
                  </button>
                  {state?.note && (
                    <button
                      type="button"
                      onClick={() => {
                        setNoteText("");
                        noteMutation.mutate({ note: "" });
                      }}
                      className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300"
                    >
                      {t.common.delete}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => noteMutation.mutate({ note: noteText })}
                    disabled={noteMutation.isPending}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded-lg active:scale-95 transition-all"
                  >
                    {t.common.save}
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  triggerHaptic("light");
                  setIsEditingNote(true);
                }}
                className="cursor-pointer bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/60 rounded-xl p-3 transition-colors"
              >
                {state?.note ? (
                  <p className="text-xs text-zinc-200 leading-relaxed">
                    {state.note}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-400">
                    {t.boiler.noticeEmpty}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Recent Activity */}
          <section className="rounded-2xl bg-[#121215] border border-white/[0.07] p-4 shadow-sm">
            <h3 className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400 mb-3">
              {t.boiler.recentActivity}
            </h3>

            {dashboardData?.recentLogs && dashboardData.recentLogs.length > 0 ? (
              <div className="divide-y divide-zinc-800/60">
                {dashboardData.recentLogs.map((log) => {
                  const getActionLabel = (action: string) => {
                    if (action === "ASH") return t.boiler.ashTitle;
                    if (action === "OUT") return t.boiler.outTitle;
                    return t.boiler.stokedTitle;
                  };

                  return (
                    <div
                      key={log.id}
                      className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{
                            backgroundColor: log.user?.avatarColor ?? "#f97316",
                          }}
                        >
                          {log.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className="font-medium text-zinc-200 truncate leading-tight">
                            {log.userName}
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            {getActionLabel(log.actionType)}
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] text-zinc-400 font-mono shrink-0 ml-2">
                        {formatRelativeTimeCz(log.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 text-center py-4">
                {t.boiler.noRecentActivity}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
