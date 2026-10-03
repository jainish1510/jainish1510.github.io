"use client";

import { useMemo, useState } from "react";
import { mulberry32 } from "@/lib/utils";

/**
 * Two-armed bandit: compares greedy vs. ε-greedy over many simulated runs to
 * show why acting under uncertainty needs deliberate exploration.
 */
function simulate(epsilon: number, gap: number, runs: number, steps: number, seed: number) {
  const rand = mulberry32(seed);
  const best = 0.5 + gap / 2;
  const worse = 0.5 - gap / 2;
  let foundBest = 0;
  let reward = 0;
  for (let r = 0; r < runs; r++) {
    const pulls = [0, 0];
    const wins = [0, 0];
    const p = rand() < 0.5 ? [best, worse] : [worse, best];
    for (let t = 0; t < steps; t++) {
      const est = [0, 1].map((a) => (pulls[a] ? wins[a]! / pulls[a]! : 0.5));
      const arm = rand() < epsilon ? (rand() < 0.5 ? 0 : 1) : est[0]! >= est[1]! ? 0 : 1;
      const win = rand() < p[arm]! ? 1 : 0;
      pulls[arm]!++;
      wins[arm]! += win;
      reward += win;
    }
    const chosen = pulls[0]! >= pulls[1]! ? 0 : 1;
    if (p[chosen] === best) foundBest++;
  }
  return { foundBest: foundBest / runs, avgReward: reward / (runs * steps) };
}

export default function UncertaintySim() {
  const [epsilon, setEpsilon] = useState(0.1);
  const [gap, setGap] = useState(0.1);
  const greedy = useMemo(() => simulate(0, gap, 400, 200, 11), [gap]);
  const explore = useMemo(() => simulate(epsilon, gap, 400, 200, 11), [epsilon, gap]);

  const Bar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="space-y-1">
      <div className="flex justify-between font-mono text-xs text-muted">
        <span>{label}</span>
        <span className="text-fg">{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${value * 100}%`, background: color }} />
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-xs text-muted">
          <span className="flex justify-between font-mono">exploration ε <span className="text-fg">{epsilon.toFixed(2)}</span></span>
          <input type="range" min={0.01} max={0.5} step={0.01} value={epsilon} onChange={(e) => setEpsilon(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
        </label>
        <label className="space-y-2 text-xs text-muted">
          <span className="flex justify-between font-mono">arm gap Δ <span className="text-fg">{gap.toFixed(2)}</span></span>
          <input type="range" min={0.02} max={0.5} step={0.01} value={gap} onChange={(e) => setGap(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
        </label>
      </div>
      <div className="space-y-3">
        <p className="eyebrow">Runs that settled on the better arm (400 simulations × 200 steps)</p>
        <Bar label="greedy" value={greedy.foundBest} color="var(--muted)" />
        <Bar label={`ε-greedy (ε=${epsilon.toFixed(2)})`} value={explore.foundBest} color="var(--accent)" />
      </div>
      <p className="text-xs text-muted">
        Average reward — greedy {greedy.avgReward.toFixed(3)}, ε-greedy {explore.avgReward.toFixed(3)}. Simulated in your browser.
      </p>
    </div>
  );
}
