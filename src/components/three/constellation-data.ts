import { mulberry32 } from "@/lib/utils";

/** The five regions of the "personal universe" shown in the hero. */
export const CLUSTERS = [
  { key: "research", label: "Research", href: "/research", position: [-3.2, 1.1, -0.6] as const, color: [0.49, 0.83, 0.85] as const },
  { key: "projects", label: "Projects", href: "/projects", position: [2.9, 1.5, -1.2] as const, color: [0.85, 0.86, 0.9] as const },
  { key: "writing", label: "Writing", href: "/blog", position: [3.4, -1.4, 0.2] as const, color: [0.95, 0.78, 0.5] as const },
  { key: "ideas", label: "Ideas", href: "/blog?category=essays", position: [-0.4, -1.9, 0.9] as const, color: [0.78, 0.72, 0.95] as const },
  { key: "technologies", label: "Technologies", href: "/experience#universe", position: [-3.6, -1.6, -1.6] as const, color: [0.62, 0.86, 0.68] as const },
] as const;

export type Constellation = {
  positions: Float32Array;
  colors: Float32Array;
  phases: Float32Array;
  sizes: Float32Array;
  segments: Float32Array;
};

/** Deterministic layout so server fallback and client scene agree. */
export function buildConstellation(perCluster: number, dust: number, withLines: boolean, seed = 7): Constellation {
  const rand = mulberry32(seed);
  const total = CLUSTERS.length * perCluster + dust;
  const positions = new Float32Array(total * 3);
  const colors = new Float32Array(total * 3);
  const phases = new Float32Array(total);
  const sizes = new Float32Array(total);
  const segs: number[] = [];
  let i = 0;

  const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;

  for (const cluster of CLUSTERS) {
    const start = i;
    for (let k = 0; k < perCluster; k++, i++) {
      const spread = k === 0 ? 0 : 1.15;
      positions.set([cluster.position[0] + gauss() * spread, cluster.position[1] + gauss() * spread * 0.8, cluster.position[2] + gauss() * spread], i * 3);
      colors.set(cluster.color, i * 3);
      phases[i] = rand() * Math.PI * 2;
      sizes[i] = k === 0 ? 7 : 1.8 + rand() * 2.6;
    }
    if (withLines) {
      // Connect each point to its two nearest neighbours inside the cluster.
      for (let a = start; a < i; a++) {
        const dists: [number, number][] = [];
        for (let b = start; b < i; b++) {
          if (a === b) continue;
          const dx = positions[a * 3]! - positions[b * 3]!;
          const dy = positions[a * 3 + 1]! - positions[b * 3 + 1]!;
          const dz = positions[a * 3 + 2]! - positions[b * 3 + 2]!;
          dists.push([dx * dx + dy * dy + dz * dz, b]);
        }
        dists.sort((x, y) => x[0] - y[0]);
        for (const [, b] of dists.slice(0, 2)) segs.push(...positions.subarray(a * 3, a * 3 + 3), ...positions.subarray(b * 3, b * 3 + 3));
      }
    }
  }
  if (withLines) {
    // Faint bridges between region centres.
    const centres = CLUSTERS.map((_, c) => c * perCluster);
    for (let a = 0; a < centres.length; a++) {
      const b = (a + 1) % centres.length;
      segs.push(...positions.subarray(centres[a]! * 3, centres[a]! * 3 + 3), ...positions.subarray(centres[b]! * 3, centres[b]! * 3 + 3));
    }
  }
  for (let k = 0; k < dust; k++, i++) {
    const r = 4 + rand() * 9;
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    positions.set([r * Math.sin(phi) * Math.cos(theta) * 1.4, r * Math.cos(phi) * 0.7, r * Math.sin(phi) * Math.sin(theta) - 3], i * 3);
    colors.set([0.7, 0.72, 0.78], i * 3);
    phases[i] = rand() * Math.PI * 2;
    sizes[i] = 0.6 + rand() * 1.2;
  }
  return { positions, colors, phases, sizes, segments: new Float32Array(segs) };
}
