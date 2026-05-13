# Folder To Article Publishing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a repeatable workflow that turns a local folder into classified website content and can publish the site to both GitHub Pages URLs.

**Architecture:** Implement the core behavior as a dependency-free Node module plus a CLI wrapper. Keep generated content in the existing Astro collections, with courses represented as `projects` entries using `category: "课程归档"`.

**Tech Stack:** Node.js ESM, Astro content collections, existing npm scripts, Git worktree deployment script.

---

## File Structure

- `scripts/content-from-folder-core.mjs`: pure helpers for scanning files, classifying content, slugifying titles, and rendering Markdown.
- `scripts/content-from-folder.mjs`: CLI wrapper for generating content and optionally publishing.
- `tests/content-from-folder.test.mjs`: focused unit tests for classification, generation, and overwrite behavior.
- `tests/check-site.mjs`: extend the repository structure smoke test so the workflow files stay present.
- `package.json`: add scripts for the new tests and CLI.
- `docs/folder-to-article-workflow.md`: user-facing workflow for future website updates.
- `README.md` and `docs/usage-manual.md`: add short pointers to the new workflow.

## Tasks

### Task 1: Write Failing Tests

**Files:**
- Create: `tests/content-from-folder.test.mjs`

- [ ] Add tests that create temporary folders for course, project, and blog inputs.
- [ ] Assert generated courses go to `src/content/projects` with `category: "课程归档"`.
- [ ] Assert generated projects go to `src/content/projects` with a normal project category.
- [ ] Assert generated blog posts go to `src/content/blog`.
- [ ] Assert existing generated files are not overwritten without `force`.
- [ ] Run `node tests/content-from-folder.test.mjs` and confirm it fails because the module does not exist.

### Task 2: Implement Core Module

**Files:**
- Create: `scripts/content-from-folder-core.mjs`

- [ ] Export `analyzeFolder`, `classifyFolder`, `renderContent`, `writeGeneratedContent`, and `slugify`.
- [ ] Implement ignored directory filtering for `.git`, `node_modules`, `dist`, `.astro`, `.deploy-pages`, and common caches.
- [ ] Implement simple scoring for course, project, and blog signals.
- [ ] Render valid Astro Markdown frontmatter for both collections.
- [ ] Run `node tests/content-from-folder.test.mjs` and confirm it passes.

### Task 3: Add CLI And Package Scripts

**Files:**
- Create: `scripts/content-from-folder.mjs`
- Modify: `package.json`

- [ ] Add CLI parsing for `<folder>`, `--type`, `--title`, `--slug`, `--force`, `--publish`, and `--no-verify`.
- [ ] Add `content:from-folder`, `test:content`, and update `test` to include both smoke and content tests.
- [ ] In publish mode, run verification, commit source changes, push `source`, and call `npm run deploy`.
- [ ] Run `node scripts/content-from-folder.mjs --help`.
- [ ] Run `npm run test:content`.

### Task 4: Document Workflow

**Files:**
- Create: `docs/folder-to-article-workflow.md`
- Modify: `README.md`
- Modify: `docs/usage-manual.md`
- Modify: `tests/check-site.mjs`

- [ ] Document the future Codex workflow for "更新网站" requests.
- [ ] Explain auto-classification, overrides, publish mode, and post-publish verification.
- [ ] Add smoke-test assertions for new workflow files.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.

