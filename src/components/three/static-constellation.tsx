import { buildConstellation, CLUSTERS } from "./constellation-data";

/**
 * SVG projection of the same constellation. Shown while WebGL loads, and as
 * the permanent visual for reduced motion / no-WebGL devices.
 */
export function StaticConstellation({ className }: { className?: string }) {
  const data = buildConstellation(26, 160, true);
  const project = (x: number, y: number, z: number) => {
    const s = 9 / (9 - z);
    return [500 + x * 95 * s, 300 - y * 95 * s] as const;
  };
  const segments: string[] = [];
  for (let i = 0; i < data.segments.length; i += 6) {
    const [x1, y1] = project(data.segments[i]!, data.segments[i + 1]!, data.segments[i + 2]!);
    const [x2, y2] = project(data.segments[i + 3]!, data.segments[i + 4]!, data.segments[i + 5]!);
    segments.push(`M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`);
  }
  const points = Array.from({ length: data.sizes.length }, (_, i) => {
    const [x, y] = project(data.positions[i * 3]!, data.positions[i * 3 + 1]!, data.positions[i * 3 + 2]!);
    return { x, y, r: data.sizes[i]! * 0.45, o: 0.25 + (Math.sin(data.phases[i]!) + 1) * 0.3 };
  });
  return (
    <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <path d={segments.join("")} stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.8" fill="none" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={p.r.toFixed(2)} fill="currentColor" fillOpacity={p.o.toFixed(2)} />
      ))}
      {CLUSTERS.map((c) => {
        const [x, y] = project(c.position[0], c.position[1] + 0.38, c.position[2]);
        return (
          <text key={c.key} x={x} y={y} textAnchor="middle" fill="currentColor" fillOpacity="0.45" fontSize="9" letterSpacing="1.6" fontFamily="var(--font-mono)">
            {c.label.toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}
