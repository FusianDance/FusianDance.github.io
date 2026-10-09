import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  // FEATURE_<KEY>=true env vars reach the client as import.meta.env.FEATURE_<KEY>
  envPrefix: ["VITE_", "FEATURE_"],
  resolve: { tsconfigPaths: true },
  plugins: [tailwindcss(), reactRouter()],
});
