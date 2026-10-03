"use client";

import { useEffect, useState } from "react";

/** Live local time for the configured time zone; hydration-safe. */
export function LocalClock({ timezone, label, compact = false }: { timezone: string; label: string; compact?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  let time = "--:--";
  let seconds = "--";
  let offset = "";
  let isNight = false;
  if (now) {
    try {
      const parts = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true, timeZone: timezone, timeZoneName: "short" }).formatToParts(now);
      const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
      time = `${get("hour")}:${get("minute")} ${get("dayPeriod")}`;
      seconds = get("second");
      offset = get("timeZoneName");
      const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: timezone }).format(now));
      isNight = hour < 7 || hour >= 22;
    } catch {
      time = now.toLocaleTimeString();
    }
  }

  return (
    <div className={compact ? "" : "rounded-xl border border-line bg-surface p-5"}>
      <p className="eyebrow">Local time</p>
      <p className="mt-2 font-mono text-3xl tabular-nums tracking-tight text-fg" aria-live="off">
        {time}
        <span className="ml-1 text-sm text-subtle">{seconds}</span>
      </p>
      <p className="mt-1 text-sm text-muted">
        {label} {offset ? <span className="font-mono text-xs text-subtle">· {offset}</span> : null}
        {now ? <span className="ml-2 text-xs text-subtle">{isNight ? "· probably asleep" : "· probably awake"}</span> : null}
      </p>
    </div>
  );
}
