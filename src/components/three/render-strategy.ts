/**
 * Strategy selection for 3D scenes. Each strategy is a bundle of quality
 * settings; components ask for one instead of sprinkling device checks.
 */
export type RenderStrategy = {
  name: "full" | "lite" | "static";
  particles: number;
  dust: number;
  lines: boolean;
  dpr: [number, number];
  pointerParallax: boolean;
};

export const STRATEGIES: Record<RenderStrategy["name"], RenderStrategy> = {
  full: { name: "full", particles: 46, dust: 900, lines: true, dpr: [1, 1.75], pointerParallax: true },
  lite: { name: "lite", particles: 26, dust: 320, lines: true, dpr: [1, 1.25], pointerParallax: false },
  static: { name: "static", particles: 0, dust: 0, lines: false, dpr: [1, 1], pointerParallax: false },
};

export type Capabilities = { webgl: boolean; reducedMotion: boolean; coarsePointer: boolean; cores: number; memory: number; saveData: boolean };

export function detectCapabilities(): Capabilities {
  let webgl = false;
  try {
    const c = document.createElement("canvas");
    webgl = !!(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    webgl = false;
  }
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return {
    webgl,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    coarsePointer: window.matchMedia("(pointer: coarse)").matches,
    cores: navigator.hardwareConcurrency ?? 4,
    memory: nav.deviceMemory ?? 4,
    saveData: !!nav.connection?.saveData,
  };
}

export function chooseStrategy(c: Capabilities): RenderStrategy {
  if (!c.webgl || c.reducedMotion || c.saveData) return STRATEGIES.static;
  if (c.coarsePointer || c.cores <= 4 || c.memory <= 4) return STRATEGIES.lite;
  return STRATEGIES.full;
}
