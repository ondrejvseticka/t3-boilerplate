/**
 * České formátování relativního a absolutního času pro Kotelnu.
 */

export function formatRelativeTimeCz(date: Date | string | null | undefined): string {
  if (!date) return "Nikdy";
  const target = new Date(date).getTime();
  const now = Date.now();
  const diffSeconds = Math.floor((now - target) / 1000);

  if (diffSeconds < 45) {
    return "právě teď";
  }

  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) {
    return `před ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;

  if (hours < 24) {
    return remMinutes === 0 ? `před ${hours} h` : `před ${hours} h ${remMinutes} min`;
  }

  const days = Math.floor(hours / 24);
  if (days === 1) {
    return "včera";
  }
  return `před ${days} dny`;
}

export function formatTimeOfDayCz(date: Date | string | null | undefined): string {
  if (!date) return "--:--";
  const d = new Date(date);
  return d.toLocaleTimeString("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTimeCz(date: Date | string | null | undefined): string {
  if (!date) return "--";
  const d = new Date(date);
  const now = new Date();

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  const timeStr = formatTimeOfDayCz(d);

  if (isToday) return `Dnes, ${timeStr}`;
  if (isYesterday) return `Včera, ${timeStr}`;

  return `${d.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
  })}, ${timeStr}`;
}

export type CountdownStatus = "ok" | "warn" | "expired" | "off";

export interface CountdownResult {
  formatted: string;
  status: CountdownStatus;
  isOverdue: boolean;
  secondsRemaining: number;
  totalDurationSeconds: number;
  percentElapsed: number;
}

export function calculateCountdown(
  nextCheckAt: Date | string | null | undefined,
  lastFuelAt: Date | string | null | undefined,
): CountdownResult {
  if (!nextCheckAt) {
    return {
      formatted: "--:--",
      status: "off",
      isOverdue: false,
      secondsRemaining: 0,
      totalDurationSeconds: 0,
      percentElapsed: 100,
    };
  }

  const targetTime = new Date(nextCheckAt).getTime();
  const fuelTime = lastFuelAt ? new Date(lastFuelAt).getTime() : targetTime - 120 * 60 * 1000;
  const now = Date.now();
  const diffMs = targetTime - now;
  const totalDuration = Math.max(1, targetTime - fuelTime);

  if (diffMs <= 0) {
    const overdueSeconds = Math.floor(Math.abs(diffMs) / 1000);
    const hours = Math.floor(overdueSeconds / 3600);
    const minutes = Math.floor((overdueSeconds % 3600) / 60);
    const seconds = overdueSeconds % 60;

    const formatted = `+${hours > 0 ? `${hours}:` : ""}${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    return {
      formatted,
      status: "expired",
      isOverdue: true,
      secondsRemaining: -overdueSeconds,
      totalDurationSeconds: Math.floor(totalDuration / 1000),
      percentElapsed: 100,
    };
  }

  const remainingSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const formatted = `${hours > 0 ? `${hours}:` : ""}${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const isWarn = remainingSeconds <= 30 * 60;
  const elapsedMs = Math.max(0, now - fuelTime);
  const percentElapsed = Math.min(100, Math.max(0, (elapsedMs / totalDuration) * 100));

  return {
    formatted,
    status: isWarn ? "warn" : "ok",
    isOverdue: false,
    secondsRemaining: remainingSeconds,
    totalDurationSeconds: Math.floor(totalDuration / 1000),
    percentElapsed,
  };
}
