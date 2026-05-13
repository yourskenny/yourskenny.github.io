# Homepage Agent Positioning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a homepage module that clearly presents the strongest Agent-oriented representative project, the mature FeO project, their stacks, common AI tools, and honest demo/detail links.

**Architecture:** Keep the change localized to the homepage and global stylesheet. Use existing Astro content collection data for project titles, summaries, tags, and links, with a small homepage-only configuration object for positioning labels and AI tool copy.

**Tech Stack:** Astro content collections, Astro component markup, CSS, Node smoke tests.

---

## File Structure

- Modify `tests/check-site.mjs`: add assertions for the new homepage module, the two representative project names, and common AI tools.
- Modify `src/pages/index.astro`: derive the two selected project entries from the existing collection, render the new module after the hero and before the current bento/project sections, and fall back to internal detail links when no external links exist.
- Modify `src/styles/global.css`: add responsive styles for the representative module, cards, stack rows, tool rail, and link row.
- Modify `.gitignore`: ignore `.superpowers/` visual brainstorming files.

### Task 1: Smoke Test For Homepage Representative Module

**Files:**
- Modify: `tests/check-site.mjs`

- [ ] **Step 1: Write the failing test**

Add these assertions after the existing homepage assertions:

```js
assert.match(home, /代表项目与工具链/);
assert.match(home, /representativeProjects/);
assert.match(home, /local-gsd-three-agent-orchestration/);
assert.match(home, /industrial-feo-prediction/);
assert.match(home, /常用 AI 工具/);
assert.match(home, /Codex/);
assert.match(home, /Claude Code/);
assert.match(home, /项目详情/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:site`

Expected: FAIL because `src/pages/index.astro` does not yet contain `代表项目与工具链`.

- [ ] **Step 3: Implement the homepage module**

In `src/pages/index.astro`, add homepage-only config for the two representative project IDs, resolve them from `portfolioProjects`, and render a new module after `</section>` for the hero.

The module must:

- Show `代表项目与工具链`
- Use the selected project collection entries
- Show project tags as the stack
- Show AI tool chips from homepage config
- Render each project external link when present
- Render internal `/projects/${project.id}/` with label `项目详情` when no external links exist

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:site`

Expected: PASS.

### Task 2: Styling And Ignore Rules

**Files:**
- Modify: `src/styles/global.css`
- Modify: `.gitignore`

- [ ] **Step 1: Add styles**

Add CSS for:

- `.representative-band`
- `.representative-grid`
- `.representative-card`
- `.representative-meta`
- `.stack-row`
- `.tool-rail`
- `.link-row`

The desktop layout should be two columns for project cards and two columns for the tools/link strategy row. The mobile layout should collapse to one column under the existing `max-width: 900px` media query.

- [ ] **Step 2: Ignore brainstorming files**

Add this line to `.gitignore`:

```gitignore
.superpowers/
```

- [ ] **Step 3: Run full verification**

Run: `npm test`

Expected: PASS.

Run: `npm run build`

Expected: Astro build completes successfully.

## Self-Review

- Spec coverage: the plan covers the selected projects, technical stacks, AI tools, demo/detail link fallback, styling, and verification.
- Placeholder scan: no placeholder tasks remain.
- Type consistency: project IDs match existing content slugs; labels are homepage-local strings.
