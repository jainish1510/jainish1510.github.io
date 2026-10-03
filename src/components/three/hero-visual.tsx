"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { chooseStrategy, detectCapabilities, type RenderStrategy } from "./render-strategy";
import { StaticConstellation } from "./static-constellation";

const ConstellationScene = dynamic(() => import("./constellation-scene"), { ssr: false });

/**
 * Lazy WebGL: the SVG constellation renders on the server and stays put
 * until the browser is idle, the device qualifies, and the canvas has
 * actually created a context — then the scene cross-fades in.
 */
export function HeroVisual() {
  const [strategy, setStrategy] = useState<RenderStrategy | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const start = () => {
      const s = chooseStrategy(detectCapabilities());
      if (s.name !== "static") setStrategy(s);
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(start, { timeout: 1200 });
    else setTimeout(start, 300);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 [&_button]:pointer-events-auto" data-webgl={strategy ? strategy.name : "static"}>
      <StaticConstellation
        className={`absolute inset-0 size-full text-fg transition-opacity duration-1000 ${ready ? "opacity-0" : "opacity-100"}`}
      />
      {strategy ? (
        <div className={`absolute inset-0 transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}>
          <ConstellationScene strategy={strategy} onReady={() => setReady(true)} />
        </div>
      ) : null}
    </div>
  );
}
