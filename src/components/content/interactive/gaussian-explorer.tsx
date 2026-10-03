"use client";

import { useMemo, useState } from "react";

/**
 * Two 1-D Gaussians: an approximate posterior q = N(μ, σ²) against the prior
 * p = N(0, 1). Shows the closed-form KL term a VAE pays per latent dimension.
 */
const W = 560;
const H = 200;

function pdf(x: number, mu: number, sigma: number) {
  return Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
}

function path(mu: number, sigma: number, yMax: number) {
  const pts: string[] = [];
  for (let i = 0; i <= 160; i++) {
    const x = -4 + (8 * i) / 160;
    const y = pdf(x, mu, sigma);
    pts.push(`${((x + 4) / 8) * W},${H - (y / yMax) * (H - 12)}`);
  }
  return `M${pts.join("L")}`;
}

export default function GaussianExplorer({ props }: { props: Record<string, string> }) {
  const [mu, setMu] = useState(Number(props.mu ?? 1.2));
  const [sigma, setSigma] = useState(Number(props.sigma ?? 0.5));
  const kl = useMemo(() => 0.5 * (sigma ** 2 + mu ** 2 - 1 - Math.log(sigma ** 2)), [mu, sigma]);
  const yMax = Math.max(pdf(0, 0, 1), pdf(mu, mu, sigma)) * 1.05;

  return (
    <div className="space-y-5">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Prior N(0,1) and posterior N(${mu.toFixed(2)}, ${sigma.toFixed(2)}²)`}>
        <line x1={W / 2} x2={W / 2} y1={0} y2={H} stroke="var(--line-strong)" strokeDasharray="3 4" />
        <path d={`${path(0, 1, yMax)}L${W},${H}L0,${H}Z`} fill="var(--line)" />
        <path d={path(0, 1, yMax)} fill="none" stroke="var(--muted)" strokeWidth={1.5} />
        <path d={`${path(mu, sigma, yMax)}L${W},${H}L0,${H}Z`} fill="var(--accent-soft)" />
        <path d={path(mu, sigma, yMax)} fill="none" stroke="var(--accent)" strokeWidth={2} />
      </svg>
      <div className="grid gap-4 sm:grid-cols-3 sm:items-end">
        <label className="space-y-2 text-xs text-muted">
          <span className="flex justify-between font-mono">μ <span className="text-fg">{mu.toFixed(2)}</span></span>
          <input type="range" min={-3} max={3} step={0.01} value={mu} onChange={(e) => setMu(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
        </label>
        <label className="space-y-2 text-xs text-muted">
          <span className="flex justify-between font-mono">σ <span className="text-fg">{sigma.toFixed(2)}</span></span>
          <input type="range" min={0.15} max={2.5} step={0.01} value={sigma} onChange={(e) => setSigma(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
        </label>
        <div className="rounded-lg border border-line bg-surface px-3 py-2">
          <p className="eyebrow">KL(q ‖ p)</p>
          <p className="font-mono text-lg tabular-nums text-fg">{kl.toFixed(3)} <span className="text-xs text-muted">nats</span></p>
        </div>
      </div>
      <p className="text-xs text-muted">
        <span className="mr-3 inline-flex items-center gap-1.5"><i className="inline-block h-px w-4 bg-muted" /> prior p(z)</span>
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-0.5 w-4 bg-accent" /> posterior q(z|x)</span>
      </p>
    </div>
  );
}
