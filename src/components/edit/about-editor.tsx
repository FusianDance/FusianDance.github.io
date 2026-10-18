import { useEffect, useRef, useState } from "react";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting, syntaxTree } from "@codemirror/language";
import type { EditorState, Range } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  keymap,
  ViewPlugin,
  WidgetType,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";
import type { SyntaxNode } from "@lezer/common";
import { tags } from "@lezer/highlight";
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

/** Shrinks the photos into the draft's uploads and inserts them at `pos` (default: the cursor), each as its own
 * paragraph. Returns an error message, or "". */
async function addPhotos(view: EditorView, uploads: Record<string, string>, files: File[], pos?: number) {
  const added: Record<string, string> = {};
  const lines = [];
  try {
    for (const file of files) {
      const path = `/uploads/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}.jpg`;
      added[path] = await shrink(file);
      lines.push(`![${file.name.replace(/\.[^.]*$/, "").replace(/[[\]]/g, "")}](${path})`);
    }
  } catch {
    return "Couldn't read that image.";
  }
  if (!updateDraft((d) => ({ ...d, uploads: { ...d.uploads, ...added } }))) {
    return "Not enough browser storage for more unsaved photos. Save first, then add more.";
  }
  Object.assign(uploads, added);
  // The text may have changed while the photos were shrunk.
  const at = Math.min(pos ?? view.state.selection.main.head, view.state.doc.length);
  const line = view.state.doc.lineAt(at);
  const insert = (at > line.from ? "\n\n" : "") + lines.join("\n\n") + (at < line.to ? "\n\n" : "");
  view.dispatch({ changes: { from: at, insert }, selection: { anchor: at + insert.length } });
  view.focus();
  return "";
}

// Live preview, like Obsidian: the text stays markdown, but its syntax is hidden (images shown, bullets drawn)
// except on the lines the cursor is on, which show the raw markdown to edit.
class ImageWidget extends WidgetType {
  constructor(
    readonly src: string,
    readonly alt: string,
  ) {
    super();
  }
  eq(other: ImageWidget) {
    return other.src === this.src && other.alt === this.alt;
  }
  toDOM() {
    const img = document.createElement("img");
    img.src = this.src;
    img.alt = this.alt;
    img.className = "my-2 max-w-full rounded-lg";
    return img;
  }
}

class BulletWidget extends WidgetType {
  eq() {
    return true;
  }
  toDOM() {
    const span = document.createElement("span");
    span.textContent = "•";
    return span;
  }
}

const hidden = Decoration.replace({});
const bullet = Decoration.replace({ widget: new BulletWidget() });
// Same looks as `.rich-text` in app.css (no margins: CodeMirror can't measure them on lines).
const headings: Record<string, Decoration> = {
  ATXHeading1: Decoration.line({ class: "text-4xl font-bold" }),
  ATXHeading2: Decoration.line({ class: "text-2xl font-semibold" }),
  ATXHeading3: Decoration.line({ class: "text-xl font-semibold" }),
};
const quote = "border-x border-destructive/40 px-4! text-lg text-destructive";

function preview(view: EditorView, show: (src: string) => string): DecorationSet {
  const { state } = view;
  const doc = state.doc;
  const raw = new Set<number>();
  if (view.hasFocus) {
    for (const r of state.selection.ranges) {
      for (let n = doc.lineAt(r.from).number; n <= doc.lineAt(r.to).number; n++) raw.add(n);
    }
  }
  const isRaw = (pos: number) => raw.has(doc.lineAt(pos).number);
  // Hides a mark, and the space after it for line marks like "## " or "> ".
  const hide = (from: number, to: number, space = false) =>
    hidden.range(from, space && doc.sliceString(to, to + 1) === " " ? to + 1 : to);
  const decos: Range<Decoration>[] = [];
  // ponytail: walks the whole document on every cursor move, fine for one page; use view.visibleRanges if it grows long.
  syntaxTree(state).iterate({
    enter: (node) => {
      const { name, from, to } = node;
      const parent = node.node.parent?.name;
      if (headings[name]) decos.push(headings[name].range(doc.lineAt(from).from));
      if (name === "Blockquote") {
        const first = doc.lineAt(from).number;
        const last = doc.lineAt(to).number;
        for (let n = first; n <= last; n++) {
          const cls = `${quote} ${n === first ? "rounded-t-lg border-t pt-3!" : ""} ${n === last ? "rounded-b-lg border-b pb-3!" : ""}`;
          decos.push(Decoration.line({ class: cls }).range(doc.line(n).from));
        }
      }
      if (isRaw(from)) return;
      if (name === "Image") {
        const marks = node.node.getChildren("LinkMark");
        const url = node.node.getChild("URL");
        if (url && marks.length > 1) {
          const alt = doc.sliceString(marks[0].to, marks[1].from);
          decos.push(
            Decoration.replace({ widget: new ImageWidget(show(doc.sliceString(url.from, url.to)), alt) }).range(
              from,
              to,
            ),
          );
          return false;
        }
      }
      if (name === "HeaderMark" || name === "QuoteMark") decos.push(hide(from, to, true));
      if (["EmphasisMark", "StrikethroughMark", "CodeMark", "LinkMark"].includes(name)) decos.push(hide(from, to));
      if ((name === "URL" || name === "LinkTitle") && parent === "Link") decos.push(hide(from, to));
      if (name === "ListMark" && node.node.parent?.parent?.name === "BulletList") decos.push(bullet.range(from, to));
    },
  });
  return Decoration.set(decos, true);
}

const livePreview = (show: (src: string) => string) =>
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = preview(view, show);
      }
      update(u: ViewUpdate) {
        if (u.docChanged || u.selectionSet || u.focusChanged || syntaxTree(u.startState) !== syntaxTree(u.state)) {
          this.decorations = preview(u.view, show);
        }
      }
    },
    { decorations: (p) => p.decorations },
  );

const highlight = HighlightStyle.define([
  { tag: tags.strong, class: "font-bold" },
  { tag: tags.emphasis, class: "italic" },
  { tag: tags.strikethrough, class: "line-through" },
  { tag: [tags.link, tags.url], class: "text-primary" },
  { tag: tags.monospace, class: "rounded bg-muted px-1 py-0.5 font-mono text-sm" },
  { tag: tags.processingInstruction, class: "text-muted-foreground" },
]);

const theme = EditorView.theme({
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "inherit", lineHeight: "inherit" },
  ".cm-content": { minHeight: "60vh", padding: "0" },
});

/** The innermost `name` node around the cursor. */
function around(state: EditorState, name: string) {
  for (let n: SyntaxNode | null = syntaxTree(state).resolveInner(state.selection.main.head, -1); n; n = n.parent) {
    if (n.name === name) return n;
  }
  return null;
}

type Tool = {
  label: string;
  icon: LucideIcon;
  key?: string;
  active: (s: EditorState) => boolean;
  run: (v: EditorView) => void;
};

/** Toggles `prefix` on the selected lines; `family` matches the prefixes it replaces (other heading levels etc.). */
function linePrefix(prefix: string, own: RegExp, family: RegExp) {
  const active = (s: EditorState) => own.test(s.doc.lineAt(s.selection.main.head).text);
  return {
    active,
    run: (v: EditorView) => {
      const { state } = v;
      const off = active(state);
      const { from, to } = state.selection.main;
      const changes = [];
      for (let n = state.doc.lineAt(from).number; n <= state.doc.lineAt(to).number; n++) {
        const line = state.doc.line(n);
        const old = line.text.match(family)?.[0] ?? "";
        changes.push({ from: line.from, to: line.from + old.length, insert: off ? "" : prefix });
      }
      v.dispatch({ changes });
      v.focus();
    },
  };
}

/** Removes the `node` around the cursor, or wraps the selection in `mark`. */
function inlineMark(node: string, mark: string) {
  return {
    active: (s: EditorState) => !!around(s, node),
    run: (v: EditorView) => {
      const n = around(v.state, node);
      if (n) {
        v.dispatch({ changes: n.getChildren("EmphasisMark").map(({ from, to }) => ({ from, to })) });
      } else {
        const { from, to } = v.state.selection.main;
        v.dispatch({
          changes: [
            { from, insert: mark },
            { from: to, insert: mark },
          ],
          selection: { anchor: from + mark.length, head: to + mark.length },
        });
      }
      v.focus();
    },
  };
}

const tools: Tool[] = [
  { label: "Heading 1", icon: Heading1, ...linePrefix("# ", /^# /, /^#{1,6} /) },
  { label: "Heading 2", icon: Heading2, ...linePrefix("## ", /^## /, /^#{1,6} /) },
  { label: "Heading 3", icon: Heading3, ...linePrefix("### ", /^### /, /^#{1,6} /) },
  { label: "Bold", icon: Bold, key: "Mod-b", ...inlineMark("StrongEmphasis", "**") },
  { label: "Italic", icon: Italic, key: "Mod-i", ...inlineMark("Emphasis", "*") },
  { label: "List", icon: List, ...linePrefix("- ", /^[-*+] /, /^([-*+]|\d+[.)]) /) },
  { label: "Numbered list", icon: ListOrdered, ...linePrefix("1. ", /^\d+[.)] /, /^([-*+]|\d+[.)]) /) },
  { label: "Highlighted note", icon: TextQuote, ...linePrefix("> ", /^>/, /^> ?/) },
  {
    label: "Link",
    icon: Link,
    key: "Mod-k",
    active: (s) => !!around(s, "Link"),
    run: (v) => {
      const { state } = v;
      const n = around(state, "Link");
      const url = n?.getChild("URL");
      const href = prompt(
        "Link to (https://… or /page), empty to remove:",
        url ? state.sliceDoc(url.from, url.to) : "",
      )?.trim();
      if (href === undefined || (!n && !href)) return;
      const marks = n?.getChildren("LinkMark") ?? [];
      const { from, to } = n ?? state.selection.main;
      const text = n ? state.sliceDoc(marks[0].to, marks[1]?.from ?? n.to) : state.sliceDoc(from, to) || href;
      v.dispatch({ changes: { from, to, insert: href ? `[${text}](${href})` : text } });
      v.focus();
    },
  },
];

export function AboutEditor({ draft }: { draft: Draft }) {
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const parent = useRef<HTMLDivElement>(null);
  // What the editor last wrote, to tell its own updates from outside ones (Discard changes).
  const written = useRef(draft.about);
  // Shown by the live preview; grows as photos are added, so it's created once and mutated.
  const [uploads] = useState(() => ({ ...draft.uploads }));
  const [view, setView] = useState<EditorView | null>(null);
  const [active, setActive] = useState<boolean[]>([]);

  useEffect(() => {
    const v: EditorView = new EditorView({
      parent: parent.current!,
      doc: written.current,
      extensions: [
        history(),
        keymap.of([
          ...tools.filter((t) => t.key).map((t) => ({ key: t.key, run: (v: EditorView) => (t.run(v), true) })),
          ...defaultKeymap,
          ...historyKeymap,
        ]),
        markdown({ base: markdownLanguage }), // GFM, as on the page; Enter continues lists and notes
        syntaxHighlighting(highlight),
        livePreview((src) => uploads[src] ?? src),
        theme,
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({ "aria-label": "About page text" }),
        EditorView.domEventHandlers({
          // Photos go where they're dropped or pasted. A link pasted onto selected text links it.
          drop(event, v) {
            const files = images(event.dataTransfer?.files);
            if (!files.length) return false;
            event.preventDefault();
            addPhotos(v, uploads, files, v.posAtCoords({ x: event.clientX, y: event.clientY }) ?? undefined).then(
              setError,
            );
            return true;
          },
          paste(event, v) {
            const files = images(event.clipboardData?.files);
            const text = event.clipboardData?.getData("text/plain").trim() ?? "";
            const { from, to } = v.state.selection.main;
            if (files.length) {
              addPhotos(v, uploads, files).then(setError);
            } else if (from < to && /^https?:\/\/\S+$/.test(text)) {
              v.dispatch({ changes: { from, to, insert: `[${v.state.sliceDoc(from, to)}](${text})` } });
            } else return false;
            event.preventDefault();
            return true;
          },
        }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged && u.state.doc.toString() !== written.current) {
            written.current = u.state.doc.toString();
            updateDraft((d) => ({ ...d, about: written.current }));
          }
          if (u.docChanged || u.selectionSet) setActive(tools.map((t) => t.active(u.state)));
        }),
      ],
    });
    setView(v);
    setActive(tools.map((t) => t.active(v.state)));
    return () => v.destroy();
  }, [uploads]);

  useEffect(() => {
    if (view && draft.about !== written.current) {
      written.current = draft.about;
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: draft.about } });
    }
  }, [view, draft.about]);

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-3">
        {/* mousedown would move the focus out of the editor, and the cursor line would flip to the preview */}
        <div
          className="sticky top-16 z-10 flex flex-wrap items-center gap-1 rounded-lg border bg-background p-1"
          onMouseDown={(e) => e.preventDefault()}
        >
          {tools.map((tool, i) => (
            <Tip key={tool.label} label={tool.label}>
              <Toggle size="sm" pressed={!!active[i]} onPressedChange={() => view && tool.run(view)} disabled={!view}>
                <tool.icon />
              </Toggle>
            </Tip>
          ))}
          <Tip label="Add photos">
            <Button variant="ghost" size="icon-sm" onClick={() => fileInput.current!.click()} disabled={!view}>
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
              if (view) addPhotos(view, uploads, images(e.target.files)).then(setError);
              e.target.value = "";
            }}
          />
        </div>
        <div
          ref={parent}
          className="rounded-lg border p-6 focus-within:ring-[3px] focus-within:ring-ring/50"
          // Clicks in the padding should still reach the text.
          onMouseDown={(e) => e.target === e.currentTarget && (e.preventDefault(), view?.focus())}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-sm text-muted-foreground">
          The text is Markdown: the line you're on shows it, e.g. <code>## </code> for a heading, <code>- </code> for a
          list, <code>&gt; </code> for a highlighted note, <code>**bold**</code>. Drop, paste or add photos (shrunk to
          1600px, uploaded on Save). Paste a link onto selected text to link it.
        </p>
      </div>
    </div>
  );
}
