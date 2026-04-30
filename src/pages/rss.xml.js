import { getCollection } from "astro:content";

export async function GET({ site }) {
  const base = site ?? new URL("https://yourskenny.top");
  const posts = (await getCollection("blog")).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );

  const items = posts
    .map((post) => {
      const link = new URL(`/blog/${post.id}/`, base).toString();
      return `<item>
        <title><![CDATA[${post.data.title}]]></title>
        <description><![CDATA[${post.data.description}]]></description>
        <link>${link}</link>
        <guid>${link}</guid>
        <pubDate>${post.data.date.toUTCString()}</pubDate>
      </item>`;
    })
    .join("");

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>AI Portfolio Blog</title>
        <description>AI 项目复盘、论文笔记和工程实践</description>
        <link>${new URL("/", base).toString()}</link>
        ${items}
      </channel>
    </rss>`, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8"
    }
  });
}
