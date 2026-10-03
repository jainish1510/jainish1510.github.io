import { PageHeader } from "@/components/admin/shell";
import { SettingsForm } from "@/components/admin/settings-form";
import { getSettings, parseNav, SETTING_DEFS } from "@/lib/settings";

export const metadata = { title: "Site settings" };

export default async function SettingsPage() {
  const settings = await getSettings();
  const values = { ...settings, "nav.items": parseNav(settings["nav.items"]).map((n) => `${n.label} | ${n.href}`).join("\n") };
  return (
    <>
      <PageHeader title="Site settings" description="Identity, homepage sections, About copy, contact details and navigation." />
      <SettingsForm defs={SETTING_DEFS.map((d) => ({ ...d }))} values={values} />
    </>
  );
}
