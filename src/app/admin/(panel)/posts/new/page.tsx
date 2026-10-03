import { PostEditor } from "@/components/admin/editor/post-editor";
import { emptyEditorPost, getEditorOptions } from "@/lib/admin/editor-data";

export const metadata = { title: "New post" };

export default async function NewPostPage() {
  return <PostEditor initial={emptyEditorPost()} options={await getEditorOptions()} />;
}
