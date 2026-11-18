/**
 * Triggers haptic feedback vibration on supported mobile devices (iOS/Android).
 */
export function triggerHaptic(
  type: "light" | "medium" | "heavy" | "success" | "warning" = "medium",
) {
  if (typeof window === "undefined" || !("vibrate" in navigator)) {
    return;
  }

  try {
    switch (type) {
      case "light":
        navigator.vibrate(25);
        break;
      case "medium":
        navigator.vibrate(50);
        break;
      case "heavy":
        navigator.vibrate(85);
        break;
      case "success":
        navigator.vibrate([40, 60, 60]);
        break;
      case "warning":
        navigator.vibrate([60, 80, 80, 100]);
        break;
      default:
        navigator.vibrate(50);
    }
  } catch {
    // Vibration API not supported or blocked
  }
}
