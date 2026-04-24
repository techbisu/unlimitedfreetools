import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

const site = process.env.SITE_URL || "https://utilityhub.example.com";

export default defineConfig({
  site,
  output: "static",
  integrations: [react(), sitemap()],
  vite: {
    optimizeDeps: {
      exclude: ["@jsquash/avif", "@imgly/background-removal", "onnxruntime-web"]
    }
  }
});
