# Unlimited Free Tools

SEO-focused Astro project for a multi-tool website with browser-only utilities, static blog content, and scalable landing pages.

## Included tools

- QR code generator with logo overlay and PNG download
- Image compressor and converter for JPG, PNG, WebP, and AVIF
- Password generator with strength feedback
- JSON formatter, validator, and minifier
- Unit converter for length, weight, and temperature
- PDF merge
- PDF split by page range
- PDF compress for image-heavy documents
- Background remover with on-page AI processing
- YouTube thumbnail downloader for image extraction only

## SEO features

- Dedicated tool pages and 30+ SEO landing pages
- Static blog built with Astro Content Collections
- Structured data for tool pages and blog posts
- Sitemap generation at `/sitemap.xml`
- `robots.txt`
- Internal linking blocks for related tools, popular tools, and latest posts

## Stack

- Astro 5
- Tailwind CSS
- React islands with `@astrojs/react`
- `qrcode`
- `pdf-lib`
- `pdfjs-dist`
- `@jsquash/avif`
- `@imgly/background-removal`
- `onnxruntime-web`

## Project structure

```text
src/
├── components/
│   ├── AdBlock.astro
│   ├── BlogCard.astro
│   ├── FAQSection.astro
│   ├── Footer.astro
│   ├── LatestBlogPosts.astro
│   ├── Navbar.astro
│   ├── PopularTools.astro
│   ├── RelatedTools.astro
│   ├── SEOSection.astro
│   ├── ToolCard.astro
│   ├── ToolPage.astro
│   └── tools/
│       ├── BGRemover.jsx
│       ├── ImageTool.jsx
│       ├── JSONTool.jsx
│       ├── PasswordTool.jsx
│       ├── PDFTool.jsx
│       ├── QRTool.jsx
│       ├── UnitTool.jsx
│       └── YTTool.jsx
├── content/
│   └── blog/
├── data/
│   ├── site-config.js
│   └── tool-content.js
├── layouts/
│   └── BaseLayout.astro
├── pages/
│   ├── index.astro
│   ├── qr-code-generator.astro
│   ├── image-compressor.astro
│   ├── password-generator.astro
│   ├── json-formatter.astro
│   ├── unit-converter.astro
│   ├── pdf-merge.astro
│   ├── pdf-split.astro
│   ├── pdf-compress.astro
│   ├── background-remover.astro
│   ├── youtube-thumbnail-downloader.astro
│   ├── [slug].astro
│   └── blog/
│       ├── index.astro
│       └── [slug].astro
└── utils/
    ├── background.js
    ├── convert.js
    ├── image.js
    ├── json.js
    ├── password.js
    ├── pdf.js
    ├── qr.js
    └── youtube.js
```

## Local development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Open the Astro URL shown in the terminal, usually:

```text
http://127.0.0.1:4321
```

## Production build

```bash
npm run build
npm run preview
```

## Configuration

Main configuration files:

- `astro.config.mjs` for site URL and Astro integrations
- `src/data/site-config.js` for global site settings, including ad placeholder toggles
- `src/data/tool-content.js` for tool metadata and SEO landing page content
- `src/content.config.ts` for the blog content schema

## Notes

- All tool processing is implemented without a backend.
- The YouTube tool only extracts thumbnail images. It does not download video files.
- Background removal and PDF processing use large client-side dependencies, so those features are loaded only when their tool routes are used.
