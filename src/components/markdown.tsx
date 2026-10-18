import type { ComponentProps } from "react";
import ReactMarkdown, { type ExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";

/** The embed URL of a Google Form link (https://docs.google.com/forms/d/e/<id>/viewform), else null. */
export function formEmbed(href: string) {
  const id = href.match(/^https:\/\/docs\.google\.com\/forms\/d\/e\/([\w-]+)\/viewform\b/)?.[1];
  return id ? `https://docs.google.com/forms/d/e/${id}/viewform?embedded=true` : null;
}

export const formClass = "block h-[90vh] w-full rounded-lg border";

// Raw HTML in the markdown is not rendered (react-markdown default), and unsafe link targets are dropped.
// An image whose src is a Google Form link shows the form instead (the alt text is its title).
// Typography comes from the shared `.rich-text` class in app.css.
const components = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  a: ({ node, href = "", ...props }: ComponentProps<"a"> & ExtraProps) => (
    <a href={href} {...(/^https?:/.test(href) && { target: "_blank", rel: "noopener noreferrer" })} {...props} />
  ),
};

/** GitHub flavored markdown. `images` maps a src to another URL (photos not uploaded yet, in the editor). */
export function Markdown({ text, images }: { text: string; images?: Record<string, string> }) {
  return (
    <div className="rich-text">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          ...components,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          img: ({ node, src, alt }) => {
            const form = typeof src === "string" && formEmbed(src);
            if (form) return <iframe src={form} title={alt || "Form"} loading="lazy" className={formClass} />;
            return <img src={(typeof src === "string" && images?.[src]) || src} alt={alt ?? ""} loading="lazy" />;
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
