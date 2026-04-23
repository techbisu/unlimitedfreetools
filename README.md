# Free Image Tools Online

Production-ready Astro application for compressing and converting images with a fast SEO-focused content site around the tools.

## Overview

Free Image Tools Online includes:

- Image compression with same-format output
- Image conversion to WebP, AVIF, JPG, and PNG
- Before/after previews with size comparison
- Downloadable optimized output
- Mobile-first tool UX
- Blog listing and dynamic article pages
- About, Contact, and Privacy Policy pages
- Sitemap and metadata structure for search indexing

## Stack

- Astro 6
- Vanilla JavaScript
- Tailwind CSS
- Compressor.js
- `@jsquash/avif`

## Project Structure

```text
src/
  components/
  content/
    blog/
  pages/
    blog/
    tools/
  scripts/
  styles/
public/
```

## Local Development

Requirements:

- Node.js 22+
- npm

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Blog Content

Blog posts are stored in `src/content/blog`.

To add a new article:

1. Create a new `.md` file inside `src/content/blog`
2. Add frontmatter matching the content collection schema
3. Push the change and Astro will generate the blog index and detail page automatically

## Vercel Deployment

This project is configured as a static Astro site and is ready to deploy on Vercel.

### Recommended Setup

- Framework preset: `Astro`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`

### Production Environment Variable

Set this in Vercel before the production deploy:

```bash
SITE_URL=https://your-production-domain.com
```

This value is used for canonical URLs, Open Graph URLs, and structured data.

### Deploy from Git

1. Import the GitHub repository into Vercel
2. Let Vercel detect Astro automatically
3. Add the `SITE_URL` environment variable
4. Deploy

After the first import, every push to `main` can trigger a new production deployment.

## Notes

- AVIF export uses `@jsquash/avif`
- Compression preserves same-format output in compress mode
- The tool UI automatically refreshes output when settings change
- Sitemap generation is handled by `src/pages/sitemap.xml.ts`
