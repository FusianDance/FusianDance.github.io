import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";

// Dev-only (`apply: "serve"`, so builds and production never have it): lets edit
// mode read the working tree, and write it too when the target is "local".
function localFiles(target: string): Plugin {
  const allowed = /^\/(data\/[\w-][\w.-]*\.(yml|md)|public\/uploads\/[\w-][\w.-]*)$/;
  return {
    name: "edit-local-files",
    apply: "serve",
    configureServer(server) {
      // Routes and content are read with fs at startup, so Vite doesn't track
      // them: restart when data/ changes (debounced, local Save writes several files).
      const dataDir = join(process.cwd(), "data");
      let timer: NodeJS.Timeout | undefined;
      const onChange = (file: string) => {
        if (!file.startsWith(dataDir + sep)) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          server.config.logger.info(`${relative(process.cwd(), file)} changed, restarting`);
          void server.restart();
        }, 300);
      };
      server.watcher.add(dataDir);
      for (const event of ["add", "change", "unlink"]) server.watcher.on(event, onChange);
      server.middlewares.use("/__edit", async (req, res) => {
        try {
          const path = decodeURIComponent((req.url ?? "").split("?")[0]);
          if (!allowed.test(path)) {
            res.statusCode = 403;
            return res.end("Forbidden");
          }
          const file = join(process.cwd(), path);
          if (req.method === "GET") {
            const content = await readFile(file).catch(() => null);
            res.statusCode = content ? 200 : 404;
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            return res.end(content ?? "Not found");
          }
          if (req.method !== "PUT") {
            res.statusCode = 405;
            return res.end("Method not allowed");
          }
          if (target !== "local") {
            res.statusCode = 403;
            return res.end("Read-only: EDIT_TARGET is not local");
          }
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk);
          await mkdir(dirname(file), { recursive: true });
          await writeFile(file, Buffer.concat(chunks));
          res.statusCode = 204;
          res.end();
        } catch (e) {
          res.statusCode = 500;
          res.end(e instanceof Error ? e.message : String(e));
        }
      });
    },
  };
}

export default defineConfig(({ command }) => {
  const target = process.env.EDIT_TARGET || (command === "serve" ? "browser" : "main");
  if (command === "build" && target !== "main") {
    throw new Error(`EDIT_TARGET=${target}: EDIT_TARGET is a dev-server setting, builds always edit main.`);
  }
  return {
    resolve: { tsconfigPaths: true },
    // Edit mode target: browser (read-only), local (working tree) or a GitHub branch
    define: { "import.meta.env.EDIT_TARGET": JSON.stringify(target) },
    plugins: [tailwindcss(), reactRouter(), localFiles(target)],
  };
});
