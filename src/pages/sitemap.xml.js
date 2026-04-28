import { getCollection } from "astro:content";

export async function GET({ site }) {
  const base = site ?? new URL("https://yourskenny.github.io");
  const projects = await getCollection("projects");
  const posts = await getCollection("blog");

  const paths = [
    "/",
    "/projects/",
    "/courses/",
    "/blog/",
    "/research/",
    "/about/",
    ...projects.map((project) => `/projects/${project.id}/`),
    ...posts.map((post) => `/blog/${post.id}/`)
  ];

  const urls = paths
    .map((path) => `<url><loc>${new URL(path, base).toString()}</loc></url>`)
    .join("");

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urls}
    </urlset>`, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
}
