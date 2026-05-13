import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  analyzeFolder,
  classifyFolder,
  renderContent,
  slugify,
  writeGeneratedContent
} from "../scripts/content-from-folder-core.mjs";

function makeTempFolder(name) {
  return mkdtempSync(join(tmpdir(), `ai-portfolio-${name}-`));
}

function write(path, content) {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, content, "utf8");
}

function makeCourseFixture() {
  const folder = makeTempFolder("course");
  write(
    join(folder, "README.md"),
    "# Computer Vision Course Labs\n\nA course archive with homework labs, lecture notes, image processing assignments, and experiment reports."
  );
  write(join(folder, "labs", "lab-01.md"), "# Lab 01\n\nEdge detection homework.");
  write(join(folder, "homework", "assignment-02.py"), "print('assignment')");
  return folder;
}

function makeProjectFixture() {
  const folder = makeTempFolder("project");
  write(
    join(folder, "README.md"),
    "# Agent Workflow Toolkit\n\nA reusable agent engineering project with tests and deployment scripts."
  );
  write(join(folder, "package.json"), JSON.stringify({ dependencies: { astro: "^6.0.0" } }));
  write(join(folder, "src", "index.js"), "export const run = () => true;");
  write(join(folder, "tests", "run.test.js"), "console.log('test');");
  return folder;
}

function makeBlogFixture() {
  const folder = makeTempFolder("blog");
  write(
    join(folder, "README.md"),
    "# RAG Retrospective Notes\n\nA reflective essay draft about a local RAG migration and lessons learned."
  );
  write(join(folder, "notes", "retrospective.md"), "# Retrospective\n\nThis note captures the migration decisions.");
  write(join(folder, "notes", "draft.md"), "# Draft\n\nBlog outline.");
  return folder;
}

function cleanup(...paths) {
  for (const path of paths) {
    rmSync(path, { recursive: true, force: true });
  }
}

{
  const course = makeCourseFixture();
  const analysis = analyzeFolder(course);
  const classification = classifyFolder(analysis);
  const rendered = renderContent(analysis, { date: "2026-05-13" });

  assert.equal(classification.type, "course");
  assert.equal(rendered.collection, "projects");
  assert.match(rendered.markdown, /category: "课程归档"/);
  assert.match(rendered.markdown, /sourcePath:/);
  assert.match(rendered.markdown, /## 内容概览/);
  cleanup(course);
}

{
  const project = makeProjectFixture();
  const analysis = analyzeFolder(project);
  const classification = classifyFolder(analysis);
  const rendered = renderContent(analysis, { date: "2026-05-13" });

  assert.equal(classification.type, "project");
  assert.equal(rendered.collection, "projects");
  assert.match(rendered.markdown, /category: "独立项目"/);
  assert.match(rendered.markdown, /tags: \[/);
  cleanup(project);
}

{
  const blog = makeBlogFixture();
  const analysis = analyzeFolder(blog);
  const classification = classifyFolder(analysis);
  const rendered = renderContent(analysis, { date: "2026-05-13" });

  assert.equal(classification.type, "blog");
  assert.equal(rendered.collection, "blog");
  assert.match(rendered.markdown, /category: "AI 工程实践"/);
  assert.match(rendered.markdown, /description:/);
  cleanup(blog);
}

{
  assert.equal(slugify("Computer Vision 课程 Labs"), "computer-vision-ke-cheng-labs");
  assert.equal(slugify("  Agent_Workflow Toolkit!  "), "agent-workflow-toolkit");
}

{
  const source = makeProjectFixture();
  const outputRoot = makeTempFolder("output");
  const first = writeGeneratedContent(source, {
    outputRoot,
    date: "2026-05-13",
    slug: "agent-workflow-toolkit"
  });
  assert.match(first.outputPath, /src[\\/]content[\\/]projects[\\/]agent-workflow-toolkit\.md$/);
  assert.match(readFileSync(first.outputPath, "utf8"), /Agent Workflow Toolkit/);

  assert.throws(
    () =>
      writeGeneratedContent(source, {
        outputRoot,
        date: "2026-05-13",
        slug: "agent-workflow-toolkit"
      }),
    /already exists/
  );

  const second = writeGeneratedContent(source, {
    outputRoot,
    date: "2026-05-13",
    slug: "agent-workflow-toolkit",
    force: true
  });
  assert.equal(second.outputPath, first.outputPath);
  cleanup(source, outputRoot);
}

