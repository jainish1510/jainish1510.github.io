"use client";

import { useState } from "react";
import { toast } from "sonner";
import { saveWidgetAction } from "@/app/admin/actions/site";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Badge } from "@/components/ui/primitives";
import { Switch } from "@/components/ui/switch";
import { relativeTime } from "@/lib/utils";

type W = { key: string; title: string; enabled: boolean; config: Record<string, unknown>; cachedAt: string | null };

const DESCRIPTIONS: Record<string, string> = {
  spotify: "Currently playing via the Spotify Web API. Without credentials, shows the demo track below with a visible “demo data” badge.",
  github: "Repositories, stars and activity from the public GitHub API. A token enables the real contribution calendar. The last good response is cached in SQLite.",
  clock: "Local time in the time zone set in Site settings.",
  random_fact: "Cycles through Content → Random facts.",
};

export function WidgetsForm({ widgets, integrations }: { widgets: W[]; integrations: { spotify: boolean; githubToken: boolean; githubUser: string } }) {
  return (
    <div className="grid max-w-4xl gap-4">
      {widgets.map((w) => (
        <WidgetCard key={w.key} widget={w} integrations={integrations} />
      ))}
    </div>
  );
}

function WidgetCard({ widget, integrations }: { widget: W; integrations: { spotify: boolean; githubToken: boolean; githubUser: string } }) {
  const [enabled, setEnabled] = useState(widget.enabled);
  const [config, setConfig] = useState({ title: "", artist: "", album: "", url: "", ...(widget.config as Record<string, string>) });

  async function save(nextEnabled = enabled) {
    const r = await saveWidgetAction(widget.key, nextEnabled, widget.key === "spotify" ? { ...config, durationMs: Number(widget.config.durationMs ?? 240000) } : undefined);
    if (r.ok) toast.success(`${widget.title} saved`);
    else toast.error(r.error);
  }

  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-medium text-fg">
            {widget.title}
            {widget.key === "spotify" ? <Badge tone={integrations.spotify ? "success" : "outline"}>{integrations.spotify ? "live API" : "demo mode"}</Badge> : null}
            {widget.key === "github" ? <Badge tone={integrations.githubToken ? "success" : "neutral"}>{integrations.githubToken ? "token" : "public API"} · @{integrations.githubUser}</Badge> : null}
          </h2>
          <p className="mt-1 max-w-xl text-xs text-muted">{DESCRIPTIONS[widget.key]}</p>
          {widget.cachedAt ? <p className="mt-1 text-xs text-subtle">Last cached {relativeTime(widget.cachedAt)}</p> : null}
        </div>
        <Switch
          checked={enabled}
          aria-label={`Enable ${widget.title}`}
          onCheckedChange={(v) => {
            setEnabled(v);
            void save(v);
          }}
        />
      </div>
      {widget.key === "spotify" ? (
        <div className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
          <p className="eyebrow sm:col-span-2">Demo / fallback track</p>
          {(["title", "artist", "album", "url"] as const).map((k) => (
            <Field key={k} label={k[0]!.toUpperCase() + k.slice(1)} htmlFor={`sp-${k}`}>
              <Input id={`sp-${k}`} value={config[k] ?? ""} onChange={(e) => setConfig({ ...config, [k]: e.target.value })} />
            </Field>
          ))}
          <div className="sm:col-span-2">
            <Button size="sm" variant="secondary" onClick={() => save()}>
              Save demo track
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
