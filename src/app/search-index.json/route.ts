import { buildSearchDocuments } from "@/lib/search/documents";

export const dynamic = "force-static";

export function GET() {
  return Response.json(buildSearchDocuments());
}
