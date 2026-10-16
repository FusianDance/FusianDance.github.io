import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image, { type ImageOptions } from "@tiptap/extension-image";
import { Markdown } from "@tiptap/markdown";
import { Selection } from "@tiptap/pm/state";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link,
  List,
  ListOrdered,
  TextQuote,
  type LucideIcon,
} from "lucide-react";
import { Tip } from "@/components/edit/tip";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
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

const images = (list?: FileList | null) => [...(list ?? [])].filter((f) => f.type.startsWith("image/"));

/** Shrinks the photos into the draft's uploads and inserts them at `pos` (default: the cursor).
 * Returns an error message, or "". */
async function addPhotos(editor: Editor, uploads: Record<string, string>, files: File[], pos?: number) {
  const added: Record<string, string> = {};
  const nodes = [];
  try {
    for (const file of files) {
      const path = `/uploads/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}.jpg`;
      added[path] = await shrink(file);
      nodes.push({ type: "image", attrs: { src: path, alt: file.name.replace(/\.[^.]*$/, "") } });
    }
  } catch {
    return "Couldn't read that image.";
  }
  if (!updateDraft((d) => ({ ...d, uploads: { ...d.uploads, ...added } }))) {
    return "Not enough browser storage for more unsaved photos. Save first, then add more.";
  }
  Object.assign(uploads, added);
  const chain = editor.chain().focus();
  (pos === undefined ? chain.insertContent(nodes) : chain.insertContentAt(pos, nodes))
    // The new photo ends up selected, so the next key or paste would replace it: move on to the text after it.
    .command(({ tr }) => !!tr.setSelection(Selection.near(tr.doc.resolve(tr.selection.to))))
    .run();
  return "";
}

// The markdown keeps "/uploads/<name>.jpg"; photos not saved yet aren't on the server, so show them from the draft.
// A function, since configure() deep-copies plain objects and wouldn't see photos added later.
const DraftImage = Image.extend<ImageOptions & { show: (src: string) => string }>({
  addOptions() {
    return { ...this.parent!(), show: (src) => src };
  },
  renderHTML({ HTMLAttributes }) {
    return ["img", { ...HTMLAttributes, src: this.options.show(HTMLAttributes.src) }];
  },
});

type Tool = { label: string; icon: LucideIcon; active: (e: Editor) => boolean; run: (e: Editor) => void };
const tools: Tool[] = [
  ...([1, 2, 3] as const).map((level) => ({
    label: `Heading ${level}`,
    icon: [Heading1, Heading2, Heading3][level - 1],
    active: (e: Editor) => e.isActive("heading", { level }),
    run: (e: Editor) => e.chain().focus().toggleHeading({ level }).run(),
  })),
  { label: "Bold", icon: Bold, active: (e) => e.isActive("bold"), run: (e) => e.chain().focus().toggleBold().run() },
  {
    label: "Italic",
    icon: Italic,
    active: (e) => e.isActive("italic"),
    run: (e) => e.chain().focus().toggleItalic().run(),
  },
  {
    label: "List",
    icon: List,
    active: (e) => e.isActive("bulletList"),
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    label: "Numbered list",
    icon: ListOrdered,
    active: (e) => e.isActive("orderedList"),
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    label: "Highlighted note",
    icon: TextQuote,
    active: (e) => e.isActive("blockquote"),
    run: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    label: "Link",
    icon: Link,
    active: (e) => e.isActive("link"),
    run: (e) => {
      const href = prompt("Link to (https://… or /page), empty to remove:", e.getAttributes("link").href ?? "");
      if (href === null) return;
      const chain = e.chain().focus().extendMarkRange("link");
      (href.trim() ? chain.setLink({ href: href.trim() }) : chain.unsetLink()).run();
    },
  },
];

export function AboutEditor({ draft }: { draft: Draft }) {
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  // What the editor last wrote, to tell its own updates from outside ones (Discard changes).
  const written = useRef(draft.about);
  // Shown by DraftImage; grows as photos are added, so it's created once and mutated.
  const [uploads] = useState(() => ({ ...draft.uploads }));
  const editorRef = useRef<Editor | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    // ponytail: no table extension, so a hand-written markdown table would be lost on save; add @tiptap/extension-table if the about page needs one.
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        underline: false, // no markdown for it
        codeBlock: false,
        link: { openOnClick: false, autolink: true },
      }),
      DraftImage.configure({ show: (src) => uploads[src] ?? src }),
      Markdown,
    ],
    content: draft.about,
    contentType: "markdown",
    editorProps: {
      attributes: {
        class:
          "rich-text min-h-[60vh] rounded-lg border p-6 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-label": "About page text",
      },
      // Photos go where they're dropped or pasted. A link pasted onto selected text links it (Link's default).
      handleDrop(view, event, _slice, moved) {
        const files = images(event.dataTransfer?.files);
        if (moved || !files.length || !editorRef.current) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        addPhotos(editorRef.current, uploads, files, pos).then(setError);
        return true;
      },
      handlePaste(_view, event) {
        const files = images(event.clipboardData?.files);
        if (!files.length || !editorRef.current) return false;
        addPhotos(editorRef.current, uploads, files).then(setError);
        return true;
      },
    },
    onCreate: ({ editor }) => {
      editorRef.current = editor;
    },
    onUpdate: ({ editor }) => {
      written.current = editor.getMarkdown().trimEnd() + "\n";
      updateDraft((d) => ({ ...d, about: written.current }));
    },
  });

  useEffect(() => {
    if (editor && draft.about !== written.current) {
      written.current = draft.about;
      editor.commands.setContent(draft.about, { contentType: "markdown", emitUpdate: false });
    }
  }, [editor, draft.about]);

  const active = useEditorState({
    editor,
    selector: ({ editor }) => (editor ? tools.map((t) => t.active(editor)) : []),
  });

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-3">
        <div className="sticky top-16 z-10 flex flex-wrap items-center gap-1 rounded-lg border bg-background p-1">
          {tools.map((tool, i) => (
            <Tip key={tool.label} label={tool.label}>
              <Toggle
                size="sm"
                pressed={!!active?.[i]}
                onPressedChange={() => editor && tool.run(editor)}
                disabled={!editor}
              >
                <tool.icon />
              </Toggle>
            </Tip>
          ))}
          <Tip label="Add photos">
            <Button variant="ghost" size="icon-sm" onClick={() => fileInput.current!.click()} disabled={!editor}>
              <ImagePlus />
            </Button>
          </Tip>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              if (editor) addPhotos(editor, uploads, images(e.target.files)).then(setError);
              e.target.value = "";
            }}
          />
        </div>
        <EditorContent editor={editor} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-sm text-muted-foreground">
          Drop, paste or add photos (shrunk to 1600px, uploaded on Save). Paste a link onto selected text to link it.
          Markdown shortcuts work too: <code>## </code> for a heading, <code>- </code> for a list.
        </p>
      </div>
    </div>
  );
}
