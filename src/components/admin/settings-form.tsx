"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { saveSettingsAction } from "@/app/admin/actions/site";
import { Markdown } from "@/components/content/markdown";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

type Def = { key: string; label: string; type: string; group: string; help?: string };

export function SettingsForm({ defs, values: initial }: { defs: Def[]; values: Record<string, string> }) {
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const router = useRouter();
  const groups = [...new Set(defs.map((d) => d.group))];
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  async function save() {
    setSaving(true);
    const r = await saveSettingsAction(values);
    setSaving(false);
    if (r.ok) {
      toast.success("Settings saved — the site is updated");
      router.refresh();
    } else toast.error(r.error);
  }

  return (
    <div className="max-w-3xl space-y-10 pb-24">
      {groups.map((g) => (
        <section key={g} className="rounded-xl border border-line bg-surface">
          <h2 className="border-b border-line px-5 py-3 text-sm font-medium text-fg">{g}</h2>
          <div className="divide-y divide-line">
            {defs
              .filter((d) => d.group === g)
              .map((d) => (
                <div key={d.key} className="grid gap-2 px-5 py-4 sm:grid-cols-[12rem_1fr]">
                  <label htmlFor={d.key} className="pt-2 text-sm text-fg-2">
                    {d.label}
                    {d.help ? <span className="mt-0.5 block text-xs text-subtle">{d.help}</span> : null}
                  </label>
                  {d.type === "boolean" ? (
                    <div className="pt-1.5">
                      <Switch id={d.key} checked={values[d.key] === "true"} onCheckedChange={(v) => setValues({ ...values, [d.key]: String(v) })} />
                    </div>
                  ) : d.type === "text" ? (
                    <Input id={d.key} value={values[d.key] ?? ""} onChange={(e) => setValues({ ...values, [d.key]: e.target.value })} />
                  ) : (
                    <div className="space-y-1.5">
                      {d.type === "markdown" ? (
                        <button type="button" onClick={() => setPreview(preview === d.key ? null : d.key)} className="text-xs text-muted hover:text-fg">
                          {preview === d.key ? "Edit" : "Preview markdown"}
                        </button>
                      ) : null}
                      {preview === d.key ? (
                        <div className="rounded-lg border border-line bg-bg p-4">
                          <Markdown source={values[d.key] ?? ""} className="text-base" />
                        </div>
                      ) : (
                        <Textarea
                          id={d.key}
                          value={values[d.key] ?? ""}
                          onChange={(e) => setValues({ ...values, [d.key]: e.target.value })}
                          className={d.type === "markdown" || d.type === "nav" ? "min-h-36 font-mono text-[0.8125rem]" : "min-h-20"}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>
      ))}
      <div className="fixed bottom-6 right-6 z-30 flex items-center gap-3 rounded-xl border border-line-strong bg-surface px-4 py-2 shadow-2xl">
        <span className="text-xs text-muted">{dirty ? "Unsaved changes" : "All changes saved"}</span>
        <Button variant="primary" size="sm" onClick={save} disabled={!dirty || saving}>
          {saving ? <Loader2 className="animate-spin" /> : null} Save settings
        </Button>
      </div>
    </div>
  );
}
