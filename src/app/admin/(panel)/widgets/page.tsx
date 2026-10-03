import { PageHeader } from "@/components/admin/shell";
import { WidgetsForm } from "@/components/admin/widgets-form";
import { env } from "@/lib/env";
import { listWidgets, parseJson } from "@/lib/repositories/personal";

export const metadata = { title: "Widgets" };

export default async function WidgetsPage() {
  const widgets = await listWidgets();
  return (
    <>
      <PageHeader title="Widgets" description="The live details on the About page. External APIs are optional — each widget has a designed fallback." />
      <WidgetsForm
        widgets={widgets.map((w) => ({ key: w.key, title: w.title, enabled: w.enabled, config: parseJson<Record<string, unknown>>(w.config, {}), cachedAt: w.cachedAt?.toISOString() ?? null }))}
        integrations={{ spotify: env.spotify.configured, githubToken: Boolean(env.github.token), githubUser: env.github.username }}
      />
    </>
  );
}
