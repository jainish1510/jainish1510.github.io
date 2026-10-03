import { json } from "@/lib/api";
import { getGitHubSnapshot } from "@/lib/integrations/github";

export const revalidate = 3600;

export async function GET() {
  return json(await getGitHubSnapshot(), { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
