import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    excerpt: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.string(),
    author: z.string().default("UtilityHub Editorial"),
    featuredImage: z.string().default("/images/blog/tools-guide-cover.svg"),
    featuredImageAlt: z.string().default("Featured article illustration"),
    tags: z.array(z.string()).default([]),
    relatedTools: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false)
  })
});

export const collections = { blog };
