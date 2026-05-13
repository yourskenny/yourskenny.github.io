# Folder To Article Publishing Design

## Goal

Build a reusable workflow that turns a local project folder into website content, chooses whether it should be treated as a project, course archive, or blog post, and publishes the updated Astro site so both `yourskenny.github.io` and `yourskenny.top` show the same update.

## Current Site Constraints

The site has two Astro content collections:

- `src/content/projects`: project pages, including course archives through `category: "课程归档"`.
- `src/content/blog`: blog posts and retrospectives.

The source branch is `source`. The deployed GitHub Pages branch is `main`. `public/CNAME` contains `yourskenny.top`, so GitHub Pages serves the same static build through both the GitHub Pages URL and the custom domain.

## Recommended Approach

Use a local Node script as the durable mechanism and keep Codex as the editorial layer.

The script will:

1. Scan a supplied local folder while ignoring generated and dependency directories.
2. Read high-signal files such as `README.md`, package manifests, notebooks, markdown notes, and source filenames.
3. Score the folder as `course`, `project`, or `blog`.
4. Generate Markdown content in the correct collection:
   - `course` -> `src/content/projects/<slug>.md` with `category: "课程归档"`.
   - `project` -> `src/content/projects/<slug>.md` with a normal project category.
   - `blog` -> `src/content/blog/<slug>.md`.
5. Optionally run the publish flow: `npm test`, `npm run build`, commit source changes, push `source`, then run `npm run deploy`.

Codex will use this script whenever the user asks to update the website from a local folder. The generated file is an evidence-based draft; Codex can then refine the article text before publishing when the source material deserves a more polished narrative.

## Alternatives Considered

### Manual-Only Workflow

Keep writing Markdown by hand and only document the steps. This is simple, but it does not satisfy the request for a repeatable mechanism and leaves classification and publishing easy to forget.

### Add A New `courses` Collection

Create a first-class `src/content/courses` collection. This gives courses a cleaner domain model, but it requires page, schema, navigation, and migration work. The current site already models courses as project-category content, so this would add more risk than value for the immediate workflow.

### Scripted Workflow With Existing Collections

Add a script and docs while preserving the existing content collections. This gives repeatability now, keeps URLs stable, and still treats courses as a distinct auto-detected content type. This is the selected approach.

## Content Classification

The classifier will use simple, explainable scoring:

- Course signals: `course`, `lab`, `homework`, `assignment`, `lecture`, `syllabus`, `实验`, `课程`, `作业`, `课设`, `课件`.
- Blog signals: many standalone markdown notes, words like `retrospective`, `note`, `essay`, `draft`, `复盘`, `笔记`, `博客`, with little runnable source code.
- Project signals: `package.json`, `pyproject.toml`, source directories, app entrypoints, tests, model or agent code, deployment files.

Manual override stays available through `--type course|project|blog` because local folders can be ambiguous.

## Publishing Flow

The safe default generates content and runs local verification. Full publishing requires an explicit `--publish` flag.

The publish flow will:

1. Run `npm test`.
2. Run `npm run build`.
3. Commit changed source files on `source`.
4. Push `source`.
5. Run `npm run deploy`, which rebuilds and pushes static output to `main`.
6. Print the expected GitHub Pages and custom-domain URLs for the generated article.

## Error Handling

The script will fail early when:

- The input folder does not exist.
- The target Markdown file already exists and `--force` was not supplied.
- The repository is not on the expected source branch.
- Git publishing commands fail.

Network failures during deployment should still be handled using `docs/publishing-workflow.md`.

## Testing

Add focused tests for the classifier and Markdown generation:

- Course folders generate project Markdown with `category: "课程归档"`.
- Project folders generate project Markdown with a normal project category.
- Blog-like folders generate blog Markdown.
- Existing output files are not overwritten unless forced.

