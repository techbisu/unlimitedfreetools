import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://free-image-tools-online.pages.dev",
  output: "static",
  vite: {
    optimizeDeps: {
      exclude: ["@jsquash/avif"]
    },
    resolve: {
      alias: {
        "astro/entrypoints/prerender": fileURLToPath(new URL("./node_modules/astro/dist/entrypoints/prerender.js", import.meta.url)),
        "astro/entrypoints/legacy": fileURLToPath(new URL("./node_modules/astro/dist/entrypoints/legacy.js", import.meta.url))
      }
    }
  }
});
