import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateDraft, type Draft } from "@/lib/edit";

// ponytail: unsaved photos live in localStorage (~5 MB), so shrink them; IndexedDB if people need dozens at once.
async function shrink(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; // JPEG has no transparency
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function AboutEditor({ draft }: { draft: Draft }) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  // Replaces the selection with `text` and puts the cursor after it.
  function insert(text: string, uploads: Record<string, string> = {}) {
    const el = textarea.current!;
    const { selectionStart: start, selectionEnd: end } = el;
    const ok = updateDraft((d) => ({
      ...d,
      about: d.about.slice(0, start) + text + d.about.slice(end),
      uploads: { ...d.uploads, ...uploads },
    }));
    if (!ok) return setError("Not enough browser storage for more unsaved photos. Save first, then add more.");
    requestAnimationFrame(() => el.setSelectionRange(start + text.length, start + text.length));
  }

  async function addPhotos(files: File[]) {
    setError("");
    const uploads: Record<string, string> = {};
    let text = "";
    try {
      for (const file of files) {
        const path = `/uploads/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}.jpg`;
        uploads[path] = await shrink(file);
        text += `\n![${file.name.replace(/\.[^.]*$/, "").replace(/[[\]]/g, "")}](${path})\n`;
      }
    } catch {
      return setError("Couldn't read that image.");
    }
    insert(text, uploads);
  }

  const images = (list: FileList) => [...list].filter((f) => f.type.startsWith("image/"));

  function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const files = images(e.clipboardData.files);
    if (files.length) {
      e.preventDefault();
      addPhotos(files);
      return;
    }
    // A link pasted onto selected text turns it into a markdown link.
    const url = e.clipboardData.getData("text/plain").trim();
    const el = e.currentTarget;
    if (/^https?:\/\/\S+$/.test(url) && el.selectionStart !== el.selectionEnd) {
      e.preventDefault();
      insert(`[${el.value.slice(el.selectionStart, el.selectionEnd)}](${url})`);
    }
  }

  function onDrop(e: React.DragEvent<HTMLTextAreaElement>) {
    const files = images(e.dataTransfer.files);
    if (!files.length) return;
    e.preventDefault();
    addPhotos(files);
  }

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">About page (Markdown)</h2>
            <Button variant="outline" onClick={() => fileInput.current!.click()}>
              <ImagePlus />
              Add photo
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                addPhotos(images(e.target.files!));
                e.target.value = "";
              }}
            />
          </div>
          <Textarea
            ref={textarea}
            aria-label="About page text (Markdown)"
            className="min-h-[60vh] font-mono text-sm md:text-sm"
            value={draft.about}
            onChange={(e) => updateDraft((d) => ({ ...d, about: e.target.value }))}
            onPaste={onPaste}
            onDrop={onDrop}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <p className="text-sm text-muted-foreground">
            <code># Heading</code>, <code>## Subheading</code>, <code>**bold**</code>, <code>- list</code>,{" "}
            <code>[text](https://…)</code>, <code>&gt; highlighted note</code>. Paste a link onto selected text to link
            it. Paste, drop or add photos.
          </p>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Preview</h2>
          <div className="rounded-lg border border-dashed p-6">
            <Markdown text={draft.about} images={draft.uploads} />
          </div>
        </div>
      </div>
    </div>
  );
}
