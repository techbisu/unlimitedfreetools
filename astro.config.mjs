import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";

const site = process.env.SITE_URL || "https://free-image-tools-online.vercel.app";

export default defineConfig({
  site,
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
