import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/editor/post-editor";
import { getEditorOptions, loadEditorPost } from "@/lib/admin/editor-data";

export const metadata = { title: "Edit post" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, options] = await Promise.all([loadEditorPost(id), getEditorOptions()]);
  if (!post) notFound();
  return <PostEditor key={post.id} initial={post} options={options} />;
}
