import type { ComponentProps, ElementType } from "react";
import ReactMarkdown, { type ExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";

// Raw HTML in the markdown is not rendered (react-markdown default), and unsafe link targets are dropped.
function styled(tag: keyof React.JSX.IntrinsicElements, className: string) {
  const Tag = tag as ElementType;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return ({ node, ...props }: ExtraProps) => <Tag className={className} {...props} />;
}

const components = {
  h1: styled("h1", "mb-8 text-4xl font-bold"),
  h2: styled("h2", "mt-8 mb-4 text-2xl font-semibold"),
  h3: styled("h3", "mt-6 mb-2 text-xl font-semibold"),
  p: styled("p", "mb-6"),
  ul: styled("ul", "mb-6 list-inside list-disc space-y-2"),
  ol: styled("ol", "mb-6 list-inside list-decimal space-y-2"),
  blockquote: styled(
    "blockquote",
    "my-6 rounded-lg border border-destructive/40 px-4 py-3 text-lg text-destructive [&>p]:mb-0",
  ),
  hr: styled("hr", "my-8"),
  code: styled("code", "rounded bg-muted px-1 py-0.5 font-mono text-sm"),
  table: styled("table", "mb-6 w-full border-collapse text-sm"),
  th: styled("th", "border px-3 py-2 text-left font-semibold"),
  td: styled("td", "border px-3 py-2"),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  a: ({ node, href = "", ...props }: ComponentProps<"a"> & ExtraProps) => (
    <a
      href={href}
      className="text-primary underline-offset-4 hover:underline"
      {...(/^https?:/.test(href) && { target: "_blank", rel: "noopener noreferrer" })}
      {...props}
    />
  ),
};

/** GitHub flavored markdown. `images` maps a src to another URL (photos not uploaded yet, in the editor). */
export function Markdown({ text, images }: { text: string; images?: Record<string, string> }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        ...components,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        img: ({ node, src, alt }) => (
          <img
            src={(typeof src === "string" && images?.[src]) || src}
            alt={alt ?? ""}
            loading="lazy"
            className="my-6 max-w-full rounded-lg"
          />
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
