"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Trash2, Clock, Flame, Wind } from "lucide-react";

import { api } from "~/trpc/react";
import { triggerHaptic } from "~/lib/haptics";
import { formatDateTimeCz } from "~/lib/date-utils";
import { useI18n } from "~/i18n/context";

type PeriodType = "week" | "month" | "season";

export default function HistoryPage() {
  const router = useRouter();
  const { status } = useSession();
  const { t } = useI18n();
  const utils = api.useUtils();

  const [period, setPeriod] = useState<PeriodType>("week");
  const [logToDelete, setLogToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  const { data, isLoading } = api.boiler.getHistoryAndStats.useQuery(
    { period },
    {
      enabled: status === "authenticated",
      refetchInterval: 20000,
    },
  );

  const deleteMutation = api.boiler.deleteLog.useMutation({
    onSuccess: async () => {
      triggerHaptic("medium");
      setLogToDelete(null);
      await Promise.all([
        utils.boiler.getHistoryAndStats.invalidate(),
        utils.boiler.getDashboard.invalidate(),
      ]);
    },
  });

  const getActionLabel = (type: string) => {
    switch (type) {
      case "STOKE":
      case "WOOD":
      case "COAL":
      case "NIGHT":
        return t.boiler.stokedTitle;
      case "ASH":
        return t.boiler.ashTitle;
      case "OUT":
        return t.boiler.outTitle;
      default:
        return type;
    }
  };

  return (
    <div className="space-y-5 pb-4">
      {/* Top Header Row with Period Segmented Control */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-white">
          {t.history.title}
        </h2>

        {/* Minimal segmented pill control */}
        <div className="inline-grid grid-cols-3 gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
          {(["week", "month", "season"] as const).map((p) => {
            const label =
              p === "week"
                ? t.history.week
                : p === "month"
                  ? t.history.month
                  : t.history.season;
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setPeriod(p);
                }}
                className={`py-1.5 px-3 text-xs font-medium rounded-lg transition-all ${
                  period === p
                    ? "bg-[#18181b] text-white shadow-xs font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Responsive Grid: Leaderboard & Logs side-by-side on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* LEADERBOARD (Desktop 5 Columns / Mobile 1 Column) */}
        <section className="md:col-span-5 rounded-2xl bg-[#121215] border border-white/[0.07] p-4 shadow-sm">
          <h3 className="text-xs font-semibold text-zinc-300 mb-3">
            {t.history.leaderboardTitle}
          </h3>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded-xl bg-zinc-900/50 border border-zinc-800/60 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {data?.leaderboard.map((item, index) => {
                const rank = index + 1;
                return (
                  <div
                    key={item.userId}
                    className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-2.5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-zinc-500 w-4 text-center">
                        {rank}
                      </span>
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: item.avatarColor }}
                      >
                        {item.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white leading-tight">
                          {item.userName}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          {item.totalFuels + item.ashCount} {t.history.totalActions}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <span className="text-[11px] font-mono font-medium text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                        {item.totalFuels} {t.history.stokedCount}
                      </span>
                      <span className="text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        {item.ashCount} {t.history.ashCount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ACTIVITY LOGS (Desktop 7 Columns / Mobile 1 Column) */}
        <section className="md:col-span-7 rounded-2xl bg-[#121215] border border-white/[0.07] p-4 shadow-sm">
          <h3 className="text-xs font-semibold text-zinc-300 mb-3">
            {t.history.logsTitle} ({data?.logs.length ?? 0})
          </h3>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded-xl bg-zinc-900/50 border border-zinc-800/60 animate-pulse"
                />
              ))}
            </div>
          ) : data?.logs && data.logs.length > 0 ? (
            <div className="divide-y divide-zinc-800/60 max-h-[600px] overflow-y-auto pr-1">
              {data.logs.map((log) => {
                const isConfirming = logToDelete === log.id;
                return (
                  <div
                    key={log.id}
                    className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs gap-2"
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
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-200 truncate">
                            {log.userName}
                          </span>
                          <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded">
                            {getActionLabel(log.actionType)}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          {formatDateTimeCz(log.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      {isConfirming ? (
                        <div className="flex items-center gap-1.5 animate-in fade-in">
                          <button
                            type="button"
                            onClick={() => deleteMutation.mutate({ id: log.id })}
                            disabled={deleteMutation.isPending}
                            className="px-2 py-0.5 text-[10px] font-semibold bg-red-600 text-white rounded-md active:scale-95"
                          >
                            {t.common.delete}
                          </button>
                          <button
                            type="button"
                            onClick={() => setLogToDelete(null)}
                            className="px-2 py-0.5 text-[10px] text-zinc-400 hover:text-white"
                          >
                            {t.common.cancel}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic("light");
                            setLogToDelete(log.id);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-red-400 transition-colors"
                          title={t.common.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-zinc-400 text-center py-6">
              {t.history.noLogs}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
