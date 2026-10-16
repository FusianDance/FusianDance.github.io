import { ContactEditor } from "@/components/edit/contact-editor";
import { Button } from "@/components/ui/button";
import { login, useDraft } from "@/lib/edit";

export const meta = () => [{ title: "Edit contact – Fusian Dance Crew" }, { name: "robots", content: "noindex" }];

// Edit-mode only page, not in the nav.
export default function EditContactPage() {
  const draft = useDraft();
  if (draft) return <ContactEditor draft={draft} />;
  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-4 text-4xl font-bold">Contact</h1>
      <p className="mb-6 text-muted-foreground">This page is only available in edit mode.</p>
      <Button onClick={login}>Log in to edit</Button>
    </div>
  );
}
