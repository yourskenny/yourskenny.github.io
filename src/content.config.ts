import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.date(),
    tags: z.array(z.string()),
    role: z.string(),
    category: z.enum(["独立项目", "竞赛项目", "实习项目", "研究原型", "课程归档"]),
    sourcePath: z.string().optional(),
    highlight: z.boolean().default(false),
    links: z
      .array(
        z.object({
          label: z.string(),
          url: z.string()
        })
      )
      .default([])
  })
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    category: z.enum(["项目复盘", "论文笔记", "AI 工程实践", "考研基础"])
  })
});

export const collections = { projects, blog };
