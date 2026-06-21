import { existsSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";

const requiredPaths = [
  "astro.config.mjs",
  "src/content.config.ts",
  "src/layouts/BaseLayout.astro",
  "src/components/ProjectCard.astro",
  "src/components/PostRow.astro",
  "src/components/Seo.astro",
  "src/components/README.md",
  "src/pages/index.astro",
  "src/pages/404.astro",
  "src/pages/courses/index.astro",
  "src/pages/rss.xml.js",
  "src/pages/sitemap.xml.js",
  "src/pages/projects/index.astro",
  "src/pages/interview/index.astro",
  "src/pages/blog/index.astro",
  "src/pages/research/index.astro",
  "src/pages/about.astro",
  "src/content/projects/industrial-feo-prediction.md",
  "src/content/projects/lcfc-nl2sql-intelligent-query.md",
  "src/content/projects/ai-pr-review-assistant.md",
  "src/content/projects/echogrid-minigame.md",
  "src/content/projects/marketing-agent-workbench.md",
  "src/content/projects/ccf-origin-uni-2026.md",
  "src/content/projects/yahaha-agent-arcade.md",
  "src/content/projects/t3-agent-rubric-delivery.md",
  "src/content/projects/lumina-visual-assistant.md",
  "src/content/projects/course-archive-digital-logic.md",
  "src/content/blog/junior-spring-exam-review-workflow.md",
  "src/content/blog/yolo-fish-detection-failure-retrospective.md",
  "src/content/blog/kaiwu-sweeper-service-outsourcing-retrospective.md",
  "src/content/blog/project-retrospective-template.md",
  "src/content/blog/codex-autoresearch-windows-skill.md",
  "docs/usage-manual.md",
  "docs/folder-to-article-workflow.md",
  "scripts/content-from-folder-core.mjs",
  "scripts/content-from-folder.mjs",
  "scripts/deploy-pages.mjs",
  "tests/content-from-folder.test.mjs",
  "AGENTS.md",
  "public/favicon.svg",
  "public/.nojekyll",
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
assert.match(layout, /\/interview\//);
assert.doesNotMatch(layout, /href="\/styles\/global\.css"/);

const seo = readFileSync("src/components/Seo.astro", "utf8");
assert.match(seo, /og:title/);
assert.match(seo, /twitter:card/);
assert.match(seo, /canonical/);

const home = readFileSync("src/pages/index.astro", "utf8");
assert.match(home, /class="hero-shell"/);
assert.match(home, /class="proof-grid"/);
assert.match(home, /Hay, hermanos, muchísimo que hacer\./);
assert.match(home, /César Vallejo/);
assert.doesNotMatch(home, /把 AI 项目沉淀成可信的研究与工程证据/);
assert.match(home, /ProjectCard/);
assert.match(home, /PostRow/);
assert.match(home, /课程归档/);
assert.match(home, /面试项目/);
assert.match(home, /代表项目与工具链/);
assert.match(home, /representativeProjects/);
assert.match(home, /lcfc-nl2sql-intelligent-query/);
assert.match(home, /ai-pr-review-assistant/);
assert.match(home, /marketing-agent-workbench/);
assert.match(home, /受控 NL2SQL/);
assert.match(home, /AI PR Review/);
assert.match(home, /常用 AI 工具/);
assert.match(home, /Codex/);
assert.match(home, /Claude Code/);
assert.match(home, /项目详情/);

const css = readFileSync("src/styles/global.css", "utf8");
assert.match(css, /\.hero-shell/);
assert.match(css, /\.bento-grid/);
assert.match(css, /\.representative-band/);
assert.match(css, /\.representative-grid/);
assert.match(css, /\.representative-card/);
assert.match(css, /\.tool-rail/);
assert.match(css, /\.interview-note-grid/);
assert.match(css, /\.detail-meta/);
assert.match(css, /@media \(max-width: 760px\)/);

const contentConfig = readFileSync("src/content.config.ts", "utf8");
assert.match(contentConfig, /glob\(\{ pattern: "\*\*\/\*\.\{md,mdx\}"/);
assert.match(contentConfig, /课程归档/);
assert.match(contentConfig, /面试项目/);

const projectsPage = readFileSync("src/pages/projects/index.astro", "utf8");
assert.match(projectsPage, /interviewProjects/);
assert.match(projectsPage, /查看面试项目页/);

const interviewPage = readFileSync("src/pages/interview/index.astro", "utf8");
assert.match(interviewPage, /Interview Projects/);
assert.match(interviewPage, /面试项目/);
assert.match(interviewPage, /不公开/);

const yahahaProject = readFileSync("src/content/projects/yahaha-agent-arcade.md", "utf8");
assert.match(yahahaProject, /YAHAHA Agent Arcade/);
assert.match(yahahaProject, /creator prompt -> Agent task/);
assert.match(yahahaProject, /category: "面试项目"/);

const rubricProject = readFileSync("src/content/projects/t3-agent-rubric-delivery.md", "utf8");
assert.match(rubricProject, /T3-Agent Rubric/);
assert.match(rubricProject, /答案合同化/);
assert.match(rubricProject, /不公开对方面试平台地址/);

const reviewWorkflowPost = readFileSync("src/content/blog/junior-spring-exam-review-workflow.md", "utf8");
assert.match(reviewWorkflowPost, /从聊天式复习到可追踪复习工作流/);
assert.match(reviewWorkflowPost, /category: "项目复盘"/);
assert.match(reviewWorkflowPost, /junior-spring-exam-review/);

const lcfcProject = readFileSync("src/content/projects/lcfc-nl2sql-intelligent-query.md", "utf8");
assert.match(lcfcProject, /LCFC NL2SQL/);
assert.match(lcfcProject, /结果待公布/);
assert.match(lcfcProject, /不公开未发布分数/);

const aiPrProject = readFileSync("src/content/projects/ai-pr-review-assistant.md", "utf8");
assert.match(aiPrProject, /AI PR Review Assistant/);
assert.match(aiPrProject, /SARIF/);
assert.match(aiPrProject, /结果尚未公布/);

const echoGridProject = readFileSync("src/content/projects/echogrid-minigame.md", "utf8");
assert.match(echoGridProject, /EchoGrid/);
assert.match(echoGridProject, /结果待公布/);

const marketingProject = readFileSync("src/content/projects/marketing-agent-workbench.md", "utf8");
assert.match(marketingProject, /商贸大模型营销智能体/);
assert.match(marketingProject, /不公开原始需求文档/);

const ccfProject = readFileSync("src/content/projects/ccf-origin-uni-2026.md", "utf8");
assert.match(ccfProject, /三等奖/);
assert.match(ccfProject, /非主导/);

const yoloPost = readFileSync("src/content/blog/yolo-fish-detection-failure-retrospective.md", "utf8");
assert.match(yoloPost, /失败复盘/);
assert.match(yoloPost, /不把它包装成高性能检测成果/);

const kaiwuPost = readFileSync("src/content/blog/kaiwu-sweeper-service-outsourcing-retrospective.md", "utf8");
assert.match(kaiwuPost, /非主导/);
assert.match(kaiwuPost, /不是获奖经历/);

const robots = readFileSync("public/robots.txt", "utf8");
assert.match(robots, /Sitemap:/);

const deployScript = readFileSync("scripts/deploy-pages.mjs", "utf8");
assert.match(deployScript, /worktree/);
assert.match(deployScript, /main/);

const autoresearchPost = readFileSync("src/content/blog/codex-autoresearch-windows-skill.md", "utf8");
assert.match(autoresearchPost, /codex-autoresearch-windows-skill/);
assert.match(autoresearchPost, /Windows-friendly/);

const usageManual = readFileSync("docs/usage-manual.md", "utf8");
assert.match(usageManual, /C:\\coding\\ai-portfolio/);
assert.match(usageManual, /src\/components/);
assert.match(usageManual, /npm run deploy/);

const folderWorkflow = readFileSync("docs/folder-to-article-workflow.md", "utf8");
assert.match(folderWorkflow, /npm run content:from-folder/);
assert.match(folderWorkflow, /课程归档/);
assert.match(folderWorkflow, /yourskenny\.top/);

const agentInstructions = readFileSync("AGENTS.md", "utf8");
assert.match(agentInstructions, /folder-to-article workflow/);
assert.match(agentInstructions, /npm run deploy/);
