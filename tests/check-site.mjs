import { existsSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";

const requiredPaths = [
  "astro.config.mjs",
  "src/content.config.ts",
  "src/layouts/BaseLayout.astro",
  "src/components/ProjectCard.astro",
  "src/components/PostRow.astro",
  "src/components/Seo.astro",
  "src/pages/index.astro",
  "src/pages/404.astro",
  "src/pages/rss.xml.js",
  "src/pages/sitemap.xml.js",
  "src/pages/projects/index.astro",
  "src/pages/blog/index.astro",
  "src/pages/research/index.astro",
  "src/pages/about.astro",
  "src/content/projects/vision-quality-inspection.md",
  "src/content/blog/project-retrospective-template.md",
  "scripts/deploy-gh-pages.mjs",
  "public/favicon.svg",
  "public/og-image.svg",
  "public/robots.txt",
  "public/resume-placeholder.pdf"
];

for (const path of requiredPaths) {
  assert.ok(existsSync(path), `${path} should exist`);
}

const layout = readFileSync("src/layouts/BaseLayout.astro", "utf8");
assert.match(layout, /import "\.\.\/styles\/global\.css";/);
assert.match(layout, /import Seo from "\.\.\/components\/Seo\.astro";/);
assert.match(layout, /<Seo/);
assert.doesNotMatch(layout, /href="\/styles\/global\.css"/);

const seo = readFileSync("src/components/Seo.astro", "utf8");
assert.match(seo, /og:title/);
assert.match(seo, /twitter:card/);
assert.match(seo, /canonical/);

const home = readFileSync("src/pages/index.astro", "utf8");
assert.match(home, /class="hero-shell"/);
assert.match(home, /class="proof-grid"/);
assert.match(home, /ProjectCard/);
assert.match(home, /PostRow/);

const css = readFileSync("src/styles/global.css", "utf8");
assert.match(css, /\.hero-shell/);
assert.match(css, /\.bento-grid/);
assert.match(css, /@media \(max-width: 760px\)/);

const contentConfig = readFileSync("src/content.config.ts", "utf8");
assert.match(contentConfig, /glob\(\{ pattern: "\*\*\/\*\.\{md,mdx\}"/);

const robots = readFileSync("public/robots.txt", "utf8");
assert.match(robots, /Sitemap:/);

const deployScript = readFileSync("scripts/deploy-gh-pages.mjs", "utf8");
assert.match(deployScript, /worktree/);
assert.match(deployScript, /gh-pages/);
