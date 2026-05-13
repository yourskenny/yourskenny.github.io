# Agent Instructions

When the user asks to update, publish, or add website content from a local folder, use the folder-to-article workflow in `docs/folder-to-article-workflow.md`.

Required flow:

1. Inspect the local source folder and current git status.
2. Run `npm run content:from-folder -- "<folder>"` unless the task is explicitly unrelated to folder-derived content.
3. Refine the generated Markdown before publishing when the raw draft needs editorial cleanup.
4. Run `npm test` and `npm run build`.
5. Push source changes on `source`.
6. Run `npm run deploy` so the `main` publishing branch updates.
7. Verify both `https://yourskenny.github.io/` and `https://yourskenny.top/` paths for the new content.

Courses remain in `src/content/projects` with `category: "课程归档"`.

