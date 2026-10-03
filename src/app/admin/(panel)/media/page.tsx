import { PageHeader } from "@/components/admin/shell";
import { MediaLibrary } from "@/components/admin/media-library";
import { listMediaAction } from "@/app/admin/actions/media";

export const metadata = { title: "Media" };

export default async function MediaPage() {
  const items = await listMediaAction();
  return (
    <>
      <PageHeader title="Media library" description="PNG, JPEG, WebP, GIF, AVIF, MP4 and WebM up to 12 MB. File types are verified from their bytes; SVG is not accepted." />
      <MediaLibrary initial={items} />
    </>
  );
}
