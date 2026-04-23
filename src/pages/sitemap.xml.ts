import { getCollection } from "astro:content";

const SITE = "https://free-image-tools-online.pages.dev";

export async function GET() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  const staticRoutes = [
    "/",
    "/tools/compress/",
    "/tools/convert/",
    "/blog/",
    "/about/",
    "/contact/",
    "/privacy-policy/"
  ];

  const urls = [
    ...staticRoutes.map((route) => `${SITE}${route}`),
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
