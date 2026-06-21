# Site Content Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the approved 2026 content refresh to the personal site, with an interview-project section, two interview project pages, a review-workflow blog post, and updated site entry points.

**Architecture:** Keep the current Astro content architecture: project-like public artifacts stay in `src/content/projects`, method write-ups stay in `src/content/blog`, and dedicated pages compose existing cards instead of introducing a new content collection. Add the interview section as `/interview/` while keeping detail routes under `/projects/<slug>/`.

**Tech Stack:** Astro 6 content collections, Markdown content entries, Node-based site checks, GitHub Pages deploy scripts.

---

### Task 1: Generate Source-Backed Drafts

**Files:**
- Create: `src/content/projects/yahaha-agent-arcade.md`
- Create: `src/content/projects/t3-agent-rubric-delivery.md`
- Create: `src/content/blog/junior-spring-exam-review-workflow.md`

- [ ] **Step 1: Run folder-to-article for YAHAHA**

Run:

```powershell
npm run content:from-folder -- "C:\coding\YAHAHA" --type project --title "YAHAHA Agent Arcade" --slug "yahaha-agent-arcade"
```

Expected: creates `src/content/projects/yahaha-agent-arcade.md` and verifies the current site.

- [ ] **Step 2: Run folder-to-article for Rubric**

Run:

```powershell
npm run content:from-folder -- "C:\coding\rubric" --type project --title "T3-Agent Rubric 试标交付包" --slug "t3-agent-rubric-delivery"
```

Expected: creates `src/content/projects/t3-agent-rubric-delivery.md`. `C:\coding\rubric` is not a valid Git repository, so source status is documented from folder inspection rather than commit history.

- [ ] **Step 3: Run folder-to-article for the review workflow**

Run:

```powershell
npm run content:from-folder -- "C:\coding\junior-spring-exam-review" --type blog --title "从聊天式复习到可追踪复习工作流" --slug "junior-spring-exam-review-workflow"
```

Expected: creates `src/content/blog/junior-spring-exam-review-workflow.md`.

- [ ] **Step 4: Replace generated drafts with edited public copy**

Edit the generated Markdown so it uses accurate public claims:

```markdown
category: "面试项目"
sourcePath: "C:/coding/YAHAHA"
```

for YAHAHA and Rubric, and:

```markdown
category: "项目复盘"
```

for the review workflow blog post.

### Task 2: Extend Content Schema and Navigation

**Files:**
- Modify: `src/content.config.ts`
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Add the project category**

In `src/content.config.ts`, extend the project category enum with:

```ts
"面试项目"
```

Expected: the two interview content entries validate as project entries.

- [ ] **Step 2: Add the interview nav item**

In `src/layouts/BaseLayout.astro`, add:

```ts
{ href: "/interview/", label: "面试项目" }
```

between `项目` and `课程`.

Expected: every page exposes the dedicated interview section.

### Task 3: Add Interview Section Page

**Files:**
- Create: `src/pages/interview/index.astro`
- Modify: `src/styles/global.css`

- [ ] **Step 1: Create `/interview/` page**

The page should collect visible project entries where:

```ts
project.data.category === "面试项目"
```

and render them with `ProjectCard`.

- [ ] **Step 2: Add a compact evidence band**

Use existing `.content-band`, `.split-band`, `.evidence-list`, `.project-grid`, `.tags`, and `.button` patterns. Add only small utility classes if needed, such as:

```css
.interview-note-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
```

Expected: the page feels like the existing portfolio, not a separate landing page.

### Task 4: Update Site Entry Points

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/pages/projects/index.astro`
- Modify: `src/pages/about.astro`
- Modify: `src/pages/research/index.astro`
- Modify: `src/content/projects/industrial-feo-prediction.md`

- [ ] **Step 1: Homepage positioning**

Add an interview-project entry in the hero actions and bento area:

```astro
<a class="button" href="/interview/">面试项目</a>
```

Also add YAHAHA as the third representative project config if the content entry exists.

- [ ] **Step 2: Project index grouping**

Split projects into:

```ts
const interviewProjects = projects.filter((project) => project.data.category === "面试项目");
const featured = projects.filter((project) => project.data.category !== "课程归档" && project.data.category !== "面试项目");
```

Render interview projects in a separate section before the general portfolio grid.

- [ ] **Step 3: About and research copy**

Update public positioning to mention AI Agent / AI engineering first, while still keeping CV, RL, robotics, and NLP in the broader technical map.

- [ ] **Step 4: Confirm existing FEO page instead of duplicating it**

Update `src/content/projects/industrial-feo-prediction.md` only with confirmed resume-records facts:

```markdown
作为队长推进项目参赛材料组织，获中国大学生计算机设计大赛省级二等奖。
```

Do not add unverified national-level awards or production metrics.

### Task 5: Update Tests

**Files:**
- Modify: `tests/check-site.mjs`

- [ ] **Step 1: Add required paths**

Add:

```js
"src/pages/interview/index.astro",
"src/content/projects/yahaha-agent-arcade.md",
"src/content/projects/t3-agent-rubric-delivery.md",
"src/content/blog/junior-spring-exam-review-workflow.md",
```

- [ ] **Step 2: Add content assertions**

Assert that:

```js
assert.match(layout, /\/interview\//);
assert.match(contentConfig, /面试项目/);
assert.match(home, /面试项目/);
assert.match(projectsPage, /interviewProjects/);
assert.match(interviewPage, /YAHAHA Agent Arcade/);
assert.match(interviewPage, /T3-Agent Rubric/);
```

Expected: structural and content regressions are caught before deploy.

### Task 6: Verify, Commit, Push, Deploy

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run site tests**

Run:

```powershell
npm test
```

Expected: `test:site` and `test:content` pass.

- [ ] **Step 2: Run production build**

Run:

```powershell
npm run build
```

Expected: Astro builds all routes, including `/interview/`, `/projects/yahaha-agent-arcade/`, `/projects/t3-agent-rubric-delivery/`, and `/blog/junior-spring-exam-review-workflow/`.

- [ ] **Step 3: Commit source changes**

Run:

```powershell
git status --short --branch
git add docs/superpowers/plans/2026-06-21-site-content-refresh.md src tests
git commit -m "Add 2026 portfolio content refresh"
```

Expected: one implementation commit on top of the existing design commit.

- [ ] **Step 4: Push source and deploy**

Run:

```powershell
git push origin source
npm run deploy
```

Expected: `source` branch updates and the deploy script updates `main`.

- [ ] **Step 5: Verify public routes**

Check both domains:

```powershell
curl.exe -L https://yourskenny.github.io/interview/
curl.exe -L https://yourskenny.top/interview/
curl.exe -L https://yourskenny.github.io/projects/yahaha-agent-arcade/
curl.exe -L https://yourskenny.top/blog/junior-spring-exam-review-workflow/
```

Expected: responses contain the new public content titles.

---

## Self-Review

- Spec coverage: interview section, Rubric, YAHAHA, review workflow blog, FEO confirmation, homepage/project/about/research entry points, verification, push, deploy, and public checks are all covered.
- Placeholder scan: no `TBD`, `TODO`, or `implement later` placeholders are used.
- Type consistency: content collection remains `projects` and `blog`; detail routes remain `/projects/<slug>/` and `/blog/<slug>/`.
