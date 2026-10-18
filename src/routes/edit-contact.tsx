import { ContactEditor } from "@/components/edit/contact-editor";
import { Button } from "@/components/ui/button";
import { login, useDraft, useEditDraft } from "@/lib/edit/session";

export const meta = () => [{ title: "Edit contact – Fusian Dance Crew" }, { name: "robots", content: "noindex" }];

// Edit-mode only page, in the navbar only while editing.
export default function EditContactPage() {
  const draft = useDraft();
  const editDraft = useEditDraft();
  if (editDraft) return <ContactEditor draft={editDraft} />;
  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-4 text-4xl font-bold">Contact</h1>
      <p className="mb-6 text-muted-foreground">This page is only available in edit mode.</p>
      {!draft && <Button onClick={login}>Log in to edit</Button>}
    </div>
  );
}
