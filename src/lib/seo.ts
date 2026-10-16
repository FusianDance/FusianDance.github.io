import type { MetaDescriptor } from "react-router";

export const SITE = "https://fusiandance.github.io";
const NAME = "Fusian Dance Crew";

/** Title, description, canonical URL and link-preview tags for one page. `path` as GitHub Pages serves it
 * (trailing slash: "/about" redirects to "/about/"). */
export function seo(path: string, title: string, description: string): MetaDescriptor[] {
  const fullTitle = path === "/" ? title : `${title} – ${NAME}`;
  return [
    { title: fullTitle },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: SITE + path },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: NAME },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:url", content: SITE + path },
  ];
}
