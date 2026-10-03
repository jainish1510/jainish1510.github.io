"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LiveDot } from "@/components/ui/primitives";
import { isTypingTarget, UI_EVENTS } from "./events";

const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];

type Health = { ok: boolean; database: "connected" | "unavailable"; latencyMs: number; integrations: { github: boolean; spotify: boolean }; posts: number; uptimeS: number; node: string };

function detectWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ?? canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return "Unavailable";
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
    return `Active${canvas.getContext("webgl2") ? " · WebGL 2" : ""}${renderer ? ` · ${renderer.split("(")[0]!.trim().slice(0, 28)}` : ""}`;
  } catch {
    return "Unavailable";
  }
}

export function EasterEggs() {
  const [konami, setKonami] = useState(false);
  const [system, setSystem] = useState(false);
  const [health, setHealth] = useState<Health | null>(null);
  const [webgl, setWebgl] = useState("…");

  useEffect(() => {
    let progress = 0;
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      progress = e.key.toLowerCase() === KONAMI[progress] ? progress + 1 : e.key.toLowerCase() === KONAMI[0] ? 1 : 0;
      if (progress === KONAMI.length) {
        progress = 0;
        setKonami(true);
      }
    };
    const onSystem = () => setSystem(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(UI_EVENTS.openSystem, onSystem);
    // A note for the curious.
    console.log(
      "%c◉ Jainish Patel — Research Studio%c\nYou opened the console, so you're my kind of person.\nTry ⌘K → \"sudo\", or the Konami code.",
      "font: 600 13px system-ui; color: #7dd3d8",
      "font: 12px system-ui; color: #84878f",
    );
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(UI_EVENTS.openSystem, onSystem);
    };
  }, []);

  useEffect(() => {
    if (!system) return;
    setWebgl(detectWebGL());
    const started = performance.now();
    fetch("/api/health", { cache: "no-store" })
      .then((r) => r.json() as Promise<Health>)
      .then((h) => setHealth({ ...h, latencyMs: h.latencyMs ?? Math.round(performance.now() - started) }))
      .catch(() => setHealth(null));
  }, [system]);

  const rows: [string, string, boolean][] = [
    ["WebGL", webgl, !webgl.startsWith("Unavailable")],
    ["API", health ? "Connected" : "Checking…", !!health],
    ["Database", health ? `${health.database === "connected" ? "Connected" : "Unavailable"} · SQLite · ${health.latencyMs}ms` : "Checking…", health?.database === "connected"],
    ["GitHub", health ? (health.integrations.github ? "Token configured" : "Public API") : "…", true],
    ["Spotify", health ? (health.integrations.spotify ? "Live" : "Demo state") : "…", !!health?.integrations.spotify],
    ["Published posts", health ? String(health.posts) : "…", true],
    ["Runtime", health ? `Node ${health.node} · up ${Math.round(health.uptimeS / 60)}m` : "…", true],
  ];

  return (
    <>
      <Dialog open={system} onOpenChange={setSystem}>
        <DialogContent title="System status" description="Developer mode — the machinery behind the page." className="font-mono">
          <ul className="divide-y divide-line rounded-xl border border-line bg-bg-raised text-xs">
            {rows.map(([k, v, ok]) => (
              <li key={k} className="flex items-center justify-between gap-4 px-4 py-2.5">
                <span className="text-muted">{k}</span>
                <span className="flex items-center gap-2 truncate text-fg">
                  {v}
                  <LiveDot tone={ok ? "success" : "warm"} />
                </span>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
      <AnimatePresence>
        {konami ? (
          <motion.div
            role="dialog"
            aria-label="Hidden message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] grid place-items-center bg-bg/90 p-6 backdrop-blur-md"
            onClick={() => setKonami(false)}
            onKeyDown={(e) => e.key === "Escape" && setKonami(false)}
            tabIndex={-1}
          >
            <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="max-w-md text-center">
              <p className="eyebrow mb-6">↑ ↑ ↓ ↓ ← → ← → B A</p>
              <p className="font-serif text-3xl italic leading-snug text-fg">“The best way to have a good idea is to have a lot of ideas.”</p>
              <p className="mt-3 text-sm text-muted">— Linus Pauling</p>
              <p className="mt-10 text-sm text-fg-2">You found the back door of the lab. Thanks for exploring this far — say hi and mention the code.</p>
              <p className="mt-6 font-mono text-[0.6875rem] text-subtle">click anywhere to close</p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
