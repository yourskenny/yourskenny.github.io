# Core Project Backfill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backfill the approved but previously skipped core resume projects onto the personal site.

**Architecture:** Keep using Astro content collections. Publish core work as `projects` entries, and use `blog` entries only for retrospectives or weak/non-core experiences that should not be presented as headline projects.

**Tech Stack:** Astro 6 content collections, Markdown content entries, Node-based regression checks, GitHub Pages deploy scripts.

---

### Task 1: Add Missing Core Project Pages

**Files:**
- Create: `src/content/projects/lcfc-nl2sql-intelligent-query.md`
- Create: `src/content/projects/ai-pr-review-assistant.md`
- Create: `src/content/projects/echogrid-minigame.md`
- Create: `src/content/projects/marketing-agent-workbench.md`
- Create: `src/content/projects/ccf-origin-uni-2026.md`

- [ ] **Step 1: Add LCFC NL2SQL**

Use `resume-records/records/projects/2026-05-lcfc-nl2sql.md`, the public README, and the prior design doc. Do not mention unpublished ranking, live score, hidden data, key files, or raw submission packages.

- [ ] **Step 2: Add AI PR Review Assistant**

Use `resume-records/records/projects/2026-05-ai-pr-review-assistant.md` and `C:/coding/AI PR Review/README.md`. State competition result as pending.

- [ ] **Step 3: Add EchoGrid**

Use `resume-records/records/projects/2026-05-echogrid.md` and public evidence only. State result as pending.

- [ ] **Step 4: Add Marketing Agent Workbench**

Use `resume-records/records/research/2026-03-marketing-agent.md` and `C:/coding/marketing-agent-workbench/README.md`. Do not publish raw demand documents.

- [ ] **Step 5: Add CCF Origin Uni**

Use `resume-records/records/competitions/2026-05-ccf-origin-uni.md`. Mark the project as non-lead participation and include the confirmed third prize.

### Task 2: Add Lower-Priority Retrospectives

**Files:**
- Create: `src/content/blog/yolo-fd-local-reproduction-research.md`
- Create: `src/content/blog/kaiwu-sweeper-ppo-agent-retrospective.md`

- [ ] **Step 1: Add YOLO-FD retrospective**

Publish as a failure/stop-rule retrospective, not as a high-performance project page.

- [ ] **Step 2: Add Kaiwu Sweeper retrospective**

Publish as a minor competition participation retrospective with non-lead and non-award boundaries.

### Task 3: Update Site Entry Points and Tests

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/pages/about.astro`
- Modify: `src/pages/research/index.astro`
- Modify: `tests/check-site.mjs`

- [ ] **Step 1: Refresh homepage representative projects**

Feature LCFC, AI PR Review, and Marketing Agent Workbench as the main current Agent/AI-engineering spine.

- [ ] **Step 2: Update about/research copy**

Mention the confirmed CCF third prize and keep pending-result boundaries explicit.

- [ ] **Step 3: Extend tests**

Require all new content files and assert key public-boundary phrases.

### Task 4: Verify and Publish

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run `npm test`**

Expected: `test:site` and `test:content` pass.

- [ ] **Step 2: Run `npm run build`**

Expected: new project and blog routes are generated.

- [ ] **Step 3: Browser-check key routes**

Check homepage, project index, and at least LCFC / AI PR Review / Marketing pages locally.

- [ ] **Step 4: Commit, push, deploy, and verify public URLs**

Push `source`, run `npm run deploy`, and verify `yourskenny.github.io` plus `yourskenny.top` routes contain the new titles.
