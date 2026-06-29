# Marketing Agent Architecture Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the Marketing Agent Workbench architecture explanation as a static demo on the personal website.

**Architecture:** Copy the standalone architecture HTML/CSS/JS into `public/demos/marketing-agent-architecture/`, change HTML asset URLs to relative paths, and link the route from the existing Marketing Agent Workbench project page. The live backend service and `/api/*` endpoints remain out of scope.

**Tech Stack:** Astro static site, Markdown content collection, Node.js site checks.

---

### Task 1: Static Demo Assets

**Files:**
- Create: `public/demos/marketing-agent-architecture/index.html`
- Create: `public/demos/marketing-agent-architecture/architecture.css`
- Create: `public/demos/marketing-agent-architecture/architecture.js`

- [x] **Step 1: Copy the source architecture files**

Copy `architecture.html`, `architecture.css`, and `architecture.js` from `C:\coding\marketing-agent-workbench\web\` into the personal-site public demo directory.

- [x] **Step 2: Adapt HTML paths**

In `index.html`, set CSS and JS references to `./architecture.css` and `./architecture.js`, and set the back link to `/projects/marketing-agent-workbench/`.

### Task 2: Project Page Entry

**Files:**
- Modify: `src/content/projects/marketing-agent-workbench.md`

- [x] **Step 1: Add a project link**

Add front matter link:

```yaml
links:
  - label: "架构演示"
    url: "/demos/marketing-agent-architecture/"
```

- [x] **Step 2: Add static-only explanation**

Add a short `## 架构演示` section that states the page is static-only and does not connect to `127.0.0.1:8765`.

### Task 3: Guardrails

**Files:**
- Modify: `tests/check-site.mjs`

- [x] **Step 1: Assert required assets**

Add all three demo asset paths to `requiredPaths`.

- [x] **Step 2: Assert route linkage and safe paths**

Check that the project page links to `/demos/marketing-agent-architecture/`, the copied HTML includes the architecture title, uses relative CSS/JS paths, and does not use root-level `/architecture.css` or `/architecture.js` paths.

### Task 4: Verification

**Files:**
- Test: `tests/check-site.mjs`

- [x] **Step 1: Run site tests**

Run:

```powershell
npm test
```

Expected: both `test:site` and `test:content` exit with code 0.

- [x] **Step 2: Run production build**

Run:

```powershell
npm run build
```

Expected: Astro build exits with code 0 and publishes the demo assets under `dist/demos/marketing-agent-architecture/`.
