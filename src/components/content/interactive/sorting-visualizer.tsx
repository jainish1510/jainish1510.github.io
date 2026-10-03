"use client";

import { Pause, Play, RotateCcw, StepForward } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mulberry32 } from "@/lib/utils";

/**
 * Algorithms are written as generators that yield frames, so the UI can
 * play, pause and single-step through the exact same code path.
 */
type Frame = { values: number[]; compare?: [number, number]; sortedFrom?: number; label: string };
type Algorithm = (input: number[]) => Generator<Frame>;

function* bubble(input: number[]): Generator<Frame> {
  const a = [...input];
  for (let end = a.length - 1; end > 0; end--) {
    for (let i = 0; i < end; i++) {
      yield { values: [...a], compare: [i, i + 1], sortedFrom: end + 1, label: `compare ${i} and ${i + 1}` };
      if (a[i]! > a[i + 1]!) {
        [a[i], a[i + 1]] = [a[i + 1]!, a[i]!];
        yield { values: [...a], compare: [i, i + 1], sortedFrom: end + 1, label: "swap" };
      }
    }
  }
  yield { values: a, sortedFrom: 0, label: "sorted" };
}

function* insertion(input: number[]): Generator<Frame> {
  const a = [...input];
  for (let i = 1; i < a.length; i++) {
    let j = i;
    while (j > 0 && a[j - 1]! > a[j]!) {
      yield { values: [...a], compare: [j - 1, j], label: `shift ${a[j]} left` };
      [a[j - 1], a[j]] = [a[j]!, a[j - 1]!];
      j--;
    }
    yield { values: [...a], compare: [j, i], label: `insert at ${j}` };
  }
  yield { values: a, sortedFrom: 0, label: "sorted" };
}

const ALGORITHMS: Record<string, Algorithm> = { bubble, insertion };

export default function SortingVisualizer({ props }: { props: Record<string, string> }) {
  const n = Math.min(40, Math.max(6, Number(props.size ?? 18)));
  const [algo, setAlgo] = useState(ALGORITHMS[props.algorithm ?? ""] ? props.algorithm! : "insertion");
  const [seed, setSeed] = useState(7);
  const initial = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: n }, () => 5 + Math.floor(rand() * 95));
  }, [n, seed]);
  const gen = useRef<Generator<Frame> | null>(null);
  const [frame, setFrame] = useState<Frame>({ values: initial, label: "ready" });
  const [steps, setSteps] = useState(0);
  const [playing, setPlaying] = useState(false);

  const reset = useCallback(() => {
    gen.current = ALGORITHMS[algo]!(initial);
    setFrame({ values: initial, label: "ready" });
    setSteps(0);
    setPlaying(false);
  }, [algo, initial]);

  useEffect(reset, [reset]);

  const step = useCallback(() => {
    const next = gen.current?.next();
    if (!next || next.done) {
      setPlaying(false);
      return;
    }
    setFrame(next.value);
    setSteps((s) => s + 1);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(step, 60);
    return () => clearInterval(t);
  }, [playing, step]);

  return (
    <div className="space-y-4">
      <div className="flex h-48 items-end gap-[3px]" aria-label={`Array state: ${frame.label}`} role="img">
        {frame.values.map((v, i) => {
          const comparing = frame.compare?.includes(i);
          const sorted = frame.sortedFrom !== undefined && i >= frame.sortedFrom;
          return (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-[height] duration-75"
              style={{
                height: `${v}%`,
                background: comparing ? "var(--warm)" : sorted ? "var(--accent)" : "var(--surface-3)",
              }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <select
          value={algo}
          onChange={(e) => setAlgo(e.target.value)}
          className="rounded-md border border-line bg-surface px-2 py-1.5 text-fg"
          aria-label="Algorithm"
        >
          <option value="insertion">Insertion sort</option>
          <option value="bubble">Bubble sort</option>
        </select>
        <button type="button" onClick={() => setPlaying((p) => !p)} className="flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1.5 text-fg hover:bg-surface-2">
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />} {playing ? "Pause" : "Play"}
        </button>
        <button type="button" onClick={step} className="flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1.5 text-fg hover:bg-surface-2">
          <StepForward className="size-3.5" /> Step
        </button>
        <button type="button" onClick={() => setSeed((s) => s + 1)} className="flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1.5 text-fg hover:bg-surface-2">
          <RotateCcw className="size-3.5" /> Shuffle
        </button>
        <span className="ml-auto font-mono text-muted">
          step {steps} · {frame.label}
        </span>
      </div>
    </div>
  );
}
