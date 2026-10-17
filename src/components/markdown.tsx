import type { ComponentProps } from "react";
import ReactMarkdown, { type ExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";

// Raw HTML in the markdown is not rendered (react-markdown default), and unsafe link targets are dropped.
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
          img: ({ node, src, alt }) => (
            <img src={(typeof src === "string" && images?.[src]) || src} alt={alt ?? ""} loading="lazy" />
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
