import { getCollection } from "astro:content";
import { seoLandingPages, toolList } from "../data/tool-content.js";
import { siteConfig } from "../data/site-config.js";

const SITE = siteConfig.siteUrl;

export async function GET() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  const staticRoutes = [
    "/",
    "/blog/",
    "/about/",
    "/contact/",
    "/privacy-policy/"
  ];

  const toolRoutes = toolList.map((tool) => `/${tool.slug}/`);
  const seoRoutes = seoLandingPages.map((page) => `/${page.slug}/`);
  const legacyRoutes = [
    "/tools/compress/",
    "/tools/convert/"
  ];

  const urls = [
    ...staticRoutes.map((route) => `${SITE}${route}`),
    ...toolRoutes.map((route) => `${SITE}${route}`),
    ...seoRoutes.map((route) => `${SITE}${route}`),
    ...legacyRoutes.map((route) => `${SITE}${route}`),
    ...posts.map((post) => `${SITE}/blog/${post.id}/`)
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url>\n    <loc>${url}</loc>\n  </url>`)
    .join("\n")}\n</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
}
