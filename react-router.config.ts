import type { Config } from "@react-router/dev/config";

// Static site for GitHub Pages: no server, every route is prerendered to HTML at build time.
export default {
  appDirectory: "src",
  ssr: false,
  prerender: true,
} satisfies Config;
