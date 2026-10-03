/**
 * Generative artwork for seeded covers and figures. Every image is derived
 * from a seed string, so the seed is reproducible and contains no stock or
 * third-party imagery. Rendered to PNG with sharp.
 */
import { hashString, mulberry32 } from "../src/lib/utils";

const BG = "#0b0c0e";

export function coverSvg(seedText: string, hue: number, w = 1600, h = 900) {
  const rand = mulberry32(hashString(seedText));
  const nodes = Array.from({ length: 70 }, () => ({ x: rand() * w, y: rand() * h, r: 0.8 + rand() * 2.4 }));
  const lines: string[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]!;
      const b = nodes[j]!;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 170) lines.push(`<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke-opacity="${(0.32 * (1 - d / 170)).toFixed(3)}"/>`);
    }
  }
  const waves = Array.from({ length: 14 }, (_, k) => {
    const amp = 30 + rand() * 90;
    const freq = 0.002 + rand() * 0.004;
    const phase = rand() * Math.PI * 2;
    const y0 = h * 0.35 + k * 18;
    let d = `M0 ${y0}`;
    for (let x = 0; x <= w; x += 20) d += ` L${x} ${(y0 + Math.sin(x * freq + phase) * amp).toFixed(1)}`;
    return `<path d="${d}" fill="none" stroke="hsl(${hue} 70% 70%)" stroke-opacity="${(0.05 + k * 0.012).toFixed(3)}" stroke-width="1"/>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <radialGradient id="g" cx="${(30 + rand() * 40).toFixed(0)}%" cy="${(30 + rand() * 30).toFixed(0)}%" r="70%">
      <stop offset="0%" stop-color="hsl(${hue} 60% 45%)" stop-opacity="0.35"/>
      <stop offset="60%" stop-color="hsl(${hue + 40} 40% 20%)" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${BG}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="${BG}"/>
  <rect width="100%" height="100%" fill="url(#g)"/>
  ${waves.join("\n")}
  <g stroke="hsl(${hue} 30% 85%)" stroke-width="0.8">${lines.join("")}</g>
  <g fill="hsl(${hue} 30% 92%)">${nodes.map((n) => `<circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${n.r.toFixed(2)}" fill-opacity="${(0.4 + rand() * 0.6).toFixed(2)}"/>`).join("")}</g>
</svg>`;
}

export function latentGridSvg(w = 1200, h = 800) {
  const cells: string[] = [];
  const n = 8;
  const size = 80;
  const ox = (w - n * size) / 2;
  const oy = (h - n * size) / 2 + 20;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const zx = -2 + (4 * i) / (n - 1);
      const zy = -2 + (4 * j) / (n - 1);
      const cx = ox + i * size + size / 2;
      const cy = oy + j * size + size / 2;
      const rx = 12 + 14 * Math.abs(Math.tanh(zx));
      const ry = 12 + 14 * Math.abs(Math.tanh(zy));
      const rot = (Math.atan2(zy, zx) * 180) / Math.PI;
      cells.push(`<rect x="${ox + i * size + 3}" y="${oy + j * size + 3}" width="${size - 6}" height="${size - 6}" rx="6" fill="#121316" stroke="#23252a"/>`);
      cells.push(`<ellipse cx="${cx}" cy="${cy}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" transform="rotate(${rot.toFixed(1)} ${cx} ${cy})" fill="none" stroke="hsl(${185 + i * 6} 60% ${55 + j * 3}%)" stroke-width="3"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="${BG}"/>
  <text x="${w / 2}" y="44" fill="#84878f" font-family="monospace" font-size="18" text-anchor="middle">PLACEHOLDER FIGURE · latent traversal z₁ × z₂ ∈ [−2, 2]</text>
  ${cells.join("")}</svg>`;
}

export function barsSvg(sorted: boolean, w = 1200, h = 700) {
  const rand = mulberry32(42);
  let values = Array.from({ length: 24 }, () => 10 + Math.floor(rand() * 90));
  if (sorted) values = [...values].sort((a, b) => a - b);
  const bw = (w - 160) / values.length;
  const bars = values
    .map((v, i) => {
      const bh = (v / 100) * (h - 200);
      return `<rect x="${80 + i * bw + 3}" y="${h - 80 - bh}" width="${bw - 6}" height="${bh}" rx="3" fill="${sorted ? "hsl(190 60% 70%)" : "#2a2c31"}"/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="${BG}"/>
  <text x="80" y="70" fill="#84878f" font-family="monospace" font-size="20">PLACEHOLDER FIGURE · ${sorted ? "after" : "before"} sorting</text>${bars}</svg>`;
}
