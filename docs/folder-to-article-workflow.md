# 本地文件夹到网站文章工作流

这套流程用于以后每次“根据本地项目文件夹更新网站”的任务。目标是从本地目录提取材料，自动判断更适合写成项目、课程归档还是博客文章，并在确认内容后发布到线上。

## 适用场景

- 本地有一个项目目录，需要整理成作品页。
- 本地有一组课程作业、实验、课件或学习材料，需要整理成课程归档。
- 本地有笔记、复盘、迁移记录或工程实践材料，需要整理成博客。

当前站点仍使用两个 Astro 内容集合：

- 项目与课程：`src/content/projects`
- 博客：`src/content/blog`

课程会作为独立输入类型识别，但落到 `projects` 集合，并使用 `category: "课程归档"`。

## 快速命令

只生成内容并运行验证：

```powershell
npm run content:from-folder -- "C:\path\to\local-folder"
```

指定类型：

```powershell
npm run content:from-folder -- "C:\path\to\local-folder" --type course
npm run content:from-folder -- "C:\path\to\local-folder" --type project
npm run content:from-folder -- "C:\path\to\local-folder" --type blog
```

指定标题和 slug：

```powershell
npm run content:from-folder -- "C:\path\to\local-folder" --title "文章标题" --slug "article-slug"
```

生成、验证并发布：

```powershell
npm run content:from-folder -- "C:\path\to\local-folder" --publish
```

如果目标 Markdown 已存在，需要明确覆盖：

```powershell
npm run content:from-folder -- "C:\path\to\local-folder" --force
```

## 自动判断规则

脚本会扫描目录里的 README、Markdown、配置文件、源码文件和文件名。

- 课程：包含 `course`、`lab`、`homework`、`assignment`、`lecture`、`syllabus`、`课程`、`实验`、`作业` 等信号。
- 项目：包含 `package.json`、`pyproject.toml`、`src/`、`tests/`、应用入口、部署文件或较多源码文件。
- 博客：以 Markdown 笔记、复盘、草稿、迁移记录为主，且源码较少。

目录含义不清时，用 `--type` 手动指定。课程仍写入 `src/content/projects`，但 frontmatter 会使用 `category: "课程归档"`。

## Codex 更新网站时必须执行的流程

以后只要用户要求“更新网站”“把这个项目放到网站上”“根据这个文件夹写文章并发布”，按这个流程执行：

1. 确认当前仓库在 `C:\coding\ai-portfolio`，并查看 `git status --short --branch`。
2. 查看输入文件夹的 README、主要文档、源码结构和最近修改内容。
3. 运行 `npm run content:from-folder -- "<folder>"` 生成初稿；如果用户已明确类型，就加 `--type`。
4. 打开生成的 Markdown，基于材料把自动摘要打磨成可读文章，保留正确 frontmatter。
5. 运行 `npm test` 和 `npm run build`。
6. 提交并推送 `source` 分支。
7. 运行 `npm run deploy`，把静态产物发布到 `main`。
8. 用生成的路径检查两个线上入口：
   - `https://yourskenny.github.io/<section>/<slug>/`
   - `https://yourskenny.top/<section>/<slug>/`

`public/CNAME` 已配置为 `yourskenny.top`，所以两个域名看到的是同一份 GitHub Pages 构建产物。若 `source` 已更新但线上没有变化，优先检查是否执行了 `npm run deploy`。

## 发布失败处理

如果 `npm run deploy` 因 GitHub 网络失败中断，按 `docs/publishing-workflow.md` 的代理发布或手动发布流程处理。

如果只是刚发布后线上短时间不可见，等待 20 到 60 秒后重新请求页面。GitHub Pages 和 CDN 有短暂刷新延迟。
