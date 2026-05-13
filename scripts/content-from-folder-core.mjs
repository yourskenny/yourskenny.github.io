import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync
} from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";

const ignoredDirectories = new Set([
  ".astro",
  ".cache",
  ".deploy-pages",
  ".git",
  ".next",
  ".nuxt",
  ".pytest_cache",
  ".venv",
  "__pycache__",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "target",
  "venv"
]);

const textExtensions = new Set([
  ".astro",
  ".css",
  ".html",
  ".ipynb",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mdx",
  ".mjs",
  ".py",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml"
]);

const sourceExtensions = new Set([
  ".astro",
  ".c",
  ".cpp",
  ".go",
  ".java",
  ".js",
  ".jsx",
  ".mjs",
  ".py",
  ".rs",
  ".ts",
  ".tsx"
]);

const courseSignals = [
  "assignment",
  "course",
  "experiment",
  "homework",
  "lab",
  "lecture",
  "syllabus",
  "实验",
  "课程",
  "课设",
  "课件",
  "作业"
];

const blogSignals = ["article", "blog", "draft", "essay", "note", "retrospective", "复盘", "博客", "笔记"];

const projectSignals = [
  "app",
  "agent",
  "deploy",
  "package.json",
  "pyproject.toml",
  "src/",
  "tests/",
  "workflow"
];

const pinyinWords = new Map([
  ["课程", "ke-cheng"],
  ["项目", "xiang-mu"],
  ["博客", "bo-ke"],
  ["复盘", "fu-pan"],
  ["笔记", "bi-ji"],
  ["实验", "shi-yan"],
  ["作业", "zuo-ye"]
]);

function readMaybe(path, maxChars = 12000) {
  try {
    return readFileSync(path, "utf8").slice(0, maxChars);
  } catch {
    return "";
  }
}

function walk(root, current = root, files = []) {
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }

    const fullPath = join(current, entry.name);
    if (entry.isDirectory()) {
      walk(root, fullPath, files);
      continue;
    }

    const stats = statSync(fullPath);
    const rel = relative(root, fullPath).replace(/\\/g, "/");
    const ext = extname(entry.name).toLowerCase();
    files.push({
      absolutePath: fullPath,
      relativePath: rel,
      name: entry.name,
      extension: ext,
      size: stats.size,
      isSource: sourceExtensions.has(ext),
      isText: textExtensions.has(ext)
    });
  }
  return files;
}

function findPrimaryText(files) {
  const preferredNames = ["README.md", "README.mdx", "readme.md", "index.md"];
  const preferred = files.find((file) => preferredNames.includes(file.relativePath));
  const fallback = files.find((file) => [".md", ".mdx", ".txt"].includes(file.extension));
  const primary = preferred ?? fallback;

  return primary
    ? {
        path: primary.relativePath,
        content: readMaybe(primary.absolutePath)
      }
    : { path: "", content: "" };
}

function firstHeading(markdown, fallback) {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return heading || fallback;
}

function firstParagraph(text) {
  const cleaned = text
    .replace(/^---[\s\S]*?---/m, "")
    .split(/\r?\n\r?\n/)
    .map((part) => part.replace(/^#+\s+/gm, "").trim())
    .find((part) => part && !part.startsWith("```"));

  return cleaned ? cleaned.replace(/\s+/g, " ").slice(0, 180) : "";
}

function scoreSignals(haystack, signals) {
  return signals.reduce((score, signal) => {
    const escaped = signal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = haystack.match(new RegExp(escaped, "gi"));
    return score + (matches?.length ?? 0);
  }, 0);
}

function yamlString(value) {
  return `"${String(value).replace(/\\/g, "/").replace(/"/g, '\\"')}"`;
}

function truncateSentence(value, maxLength = 120) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 1)}…`;
}

function inferTags(analysis, type) {
  const tags = new Set();
  const names = analysis.files.map((file) => file.relativePath.toLowerCase()).join("\n");

  if (type === "course") tags.add("Course");
  if (names.includes("agent")) tags.add("Agent");
  if (names.includes("rag")) tags.add("RAG");
  if (names.includes("astro") || names.includes("package.json")) tags.add("JavaScript");
  if (analysis.files.some((file) => file.extension === ".py")) tags.add("Python");
  if (analysis.files.some((file) => file.extension === ".ipynb")) tags.add("Notebook");
  if (analysis.files.some((file) => [".md", ".mdx"].includes(file.extension))) tags.add("Documentation");

  if (tags.size === 0) {
    tags.add(type === "blog" ? "Writing" : "Project");
  }

  return Array.from(tags).slice(0, 6);
}

function sectionFromFiles(files) {
  return files
    .slice(0, 12)
    .map((file) => `- \`${file.relativePath}\``)
    .join("\n");
}

export function analyzeFolder(folderPath) {
  const root = resolve(folderPath);
  if (!existsSync(root)) {
    throw new Error(`Input folder does not exist: ${folderPath}`);
  }

  const rootStats = statSync(root);
  if (!rootStats.isDirectory()) {
    throw new Error(`Input path is not a folder: ${folderPath}`);
  }

  const files = walk(root).sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  const primaryText = findPrimaryText(files);
  const title = firstHeading(primaryText.content, basename(root));
  const description =
    firstParagraph(primaryText.content) ||
    `本条目根据本地目录 ${basename(root)} 的文件结构和说明材料自动整理。`;
  const manifest = files.map((file) => file.relativePath).join("\n");
  const haystack = `${title}\n${description}\n${primaryText.content}\n${manifest}`.toLowerCase();

  return {
    root,
    title,
    description,
    primaryText,
    files,
    haystack,
    counts: {
      markdown: files.filter((file) => [".md", ".mdx"].includes(file.extension)).length,
      source: files.filter((file) => file.isSource).length,
      total: files.length
    }
  };
}

export function classifyFolder(analysis, overrideType) {
  if (overrideType && ["blog", "course", "project"].includes(overrideType)) {
    return { type: overrideType, scores: { blog: 0, course: 0, project: 0 }, overridden: true };
  }

  const course = scoreSignals(analysis.haystack, courseSignals);
  const blog =
    scoreSignals(analysis.haystack, blogSignals) +
    (analysis.counts.markdown >= 2 && analysis.counts.source <= 1 ? 3 : 0);
  const project =
    scoreSignals(analysis.haystack, projectSignals) +
    analysis.counts.source +
    (analysis.files.some((file) => ["package.json", "pyproject.toml"].includes(file.name)) ? 4 : 0);

  const scores = { blog, course, project };
  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const type = top && top[1] > 0 ? top[0] : "project";

  return { type, scores, overridden: false };
}

export function slugify(value) {
  let slug = String(value).trim();
  for (const [word, replacement] of pinyinWords) {
    slug = slug.replaceAll(word, ` ${replacement} `);
  }

  return (
    slug
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-") || "generated-content"
  );
}

export function renderContent(analysis, options = {}) {
  const classification = classifyFolder(analysis, options.type);
  const type = classification.type;
  const title = options.title || analysis.title;
  const slug = options.slug || slugify(title);
  const date = options.date || new Date().toISOString().slice(0, 10);
  const summary = truncateSentence(analysis.description);
  const tags = inferTags(analysis, type);
  const sourcePath = analysis.root.replace(/\\/g, "/");
  const fileList = sectionFromFiles(analysis.files);
  const primaryExcerpt = truncateSentence(analysis.description, 240);

  if (type === "blog") {
    return {
      type,
      slug,
      collection: "blog",
      markdown: `---\ntitle: ${yamlString(title)}\ndescription: ${yamlString(summary)}\ndate: ${date}\ncategory: "AI 工程实践"\n---\n\n## 背景\n\n${primaryExcerpt}\n\n## 内容概览\n\n这篇文章根据本地目录 \`${sourcePath}\` 的说明文档、笔记和文件结构整理，重点保留可以复用的经验、决策和后续维护线索。\n\n## 关键材料\n\n${fileList}\n\n## 提炼\n\n从当前材料看，这个主题更适合沉淀为博客文章：它的价值不只在于展示一个最终作品，而在于记录过程中的判断、取舍、问题定位和可复用方法。\n\n## 后续整理方向\n\n发布前可以继续补充具体案例、关键截图、代码链接或结果指标，让文章从目录级总结进一步变成完整复盘。\n`
    };
  }

  const isCourse = type === "course";
  return {
    type,
    slug,
    collection: "projects",
    markdown: `---\ntitle: ${yamlString(title)}\nsummary: ${yamlString(summary)}\ndate: ${date}\ntags: [${tags.map((tag) => yamlString(tag)).join(", ")}]\nrole: ${yamlString(isCourse ? "课程资料整理、实验内容归档与学习路径提炼" : "项目梳理、核心能力提炼与展示材料整理")}\ncategory: ${yamlString(isCourse ? "课程归档" : "独立项目")}\nsourcePath: ${yamlString(sourcePath)}\nhighlight: false\nlinks: []\n---\n\n## 内容概览\n\n${primaryExcerpt}\n\n## 本地材料\n\n该条目由本地目录 \`${sourcePath}\` 自动整理生成。当前扫描到 ${analysis.counts.total} 个文件，其中 Markdown/MDX 文件 ${analysis.counts.markdown} 个，源代码或配置相关文件 ${analysis.counts.source} 个。\n\n## 关键文件\n\n${fileList}\n\n## 展示重点\n\n${isCourse ? "这个目录更适合作为课程归档展示：重点放在课程目标、实验内容、作业脉络、知识点覆盖和可复用材料上。" : "这个目录更适合作为项目展示：重点放在问题背景、实现方案、工程结构、验证方式和个人贡献上。"}\n\n## 后续整理方向\n\n发布前可以继续补充运行结果、截图、实验指标、仓库链接或更具体的个人贡献描述，让页面从自动摘要升级为完整作品页。\n`
  };
}

export function writeGeneratedContent(sourceFolder, options = {}) {
  const analysis = analyzeFolder(sourceFolder);
  const rendered = renderContent(analysis, options);
  const outputRoot = resolve(options.outputRoot || process.cwd());
  const outputDirectory = join(outputRoot, "src", "content", rendered.collection);
  const outputPath = join(outputDirectory, `${rendered.slug}.md`);

  if (existsSync(outputPath) && !options.force) {
    throw new Error(`Generated content already exists: ${outputPath}. Use --force to overwrite.`);
  }

  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(outputPath, rendered.markdown, "utf8");

  return {
    ...rendered,
    outputPath
  };
}
