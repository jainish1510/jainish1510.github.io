/** Fire-and-forget analytics beacon (no cookies beyond the visitor id). */
export function trackEvent(type: "project_click" | "outbound_click", data: { entityType?: string; entityId?: string } = {}) {
  try {
    const body = JSON.stringify({ type, ...data });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    else void fetch("/api/events", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
  } catch {
    /* analytics must never break navigation */
  }
}
