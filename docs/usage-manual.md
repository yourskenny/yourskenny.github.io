# 博客使用手册

这份手册记录个人博客的本地目录、内容维护、组件维护、预览验证和部署流程。当前项目已经迁移并固定在：

```text
C:\coding\ai-portfolio
```

## 1. 项目定位

这个站点用于同时服务三个目标：

- 考研复试：展示 AI 项目经历、课程基础、研究兴趣和复盘能力。
- 联系导师：让对方快速看到你做过什么、能做什么、接下来想研究什么。
- 求职准备：沉淀项目描述、技术栈、代码仓库、博客文章和简历入口。

技术栈：

- Astro 6
- Markdown / MDX 内容集合
- GitHub Pages 静态部署
- 源码分支：`source`
- 发布分支：`main`

## 2. 本地开发

进入项目目录：

```powershell
cd C:\coding\ai-portfolio
```

安装依赖：

```powershell
npm install
```

启动本地预览：

```powershell
npm run dev -- --host 127.0.0.1 --port 4321
```

浏览器访问：

```text
http://127.0.0.1:4321/
```

## 3. 常用命令

运行结构检查：

```powershell
npm test
```

构建静态网站：

```powershell
npm run build
```

本地预览构建结果：

```powershell
npm run preview
```

发布到 GitHub Pages：

```powershell
npm run deploy
```

部署脚本会先执行 `npm run build`，再把 `dist` 里的静态产物推送到 `main` 分支。

## 4. 目录说明

```text
C:\coding\ai-portfolio
├─ src
│  ├─ components       # 本地 Astro 组件
│  ├─ content          # Markdown 内容集合
│  ├─ layouts          # 页面布局
│  ├─ pages            # 路由页面
│  └─ styles           # 全局样式
├─ public              # 静态资源
├─ scripts             # 部署脚本
├─ tests               # 站点结构检查
├─ docs                # 使用手册和维护文档
└─ dist                # 构建产物，不手动编辑
```

不要手动编辑 `dist`。任何页面改动都应该发生在 `src`、`public`、`docs` 或配置文件里。

## 5. 新增项目

项目文章放在：

```text
src/content/projects
```

新建一个 Markdown 文件，例如：

```text
src/content/projects/my-project.md
```

推荐 frontmatter：

```yaml
---
title: "项目名称"
summary: "一句话说明项目解决的问题和你的贡献。"
date: 2026-04-29
tags: ["Python", "LLM", "Astro"]
role: "负责人 / 算法实现 / 前端开发 / 工程化整理"
category: "独立项目"
sourcePath: "C:\\coding\\example-project"
highlight: true
links:
  - label: "GitHub"
    url: "https://github.com/yourskenny/example-project"
---
```

`category` 只能使用这些值：

- `独立项目`
- `竞赛项目`
- `实习项目`
- `研究原型`
- `课程归档`

建议正文按这个顺序写：

```markdown
## 背景

## 我负责的部分

## 技术方案

## 结果与验证

## 复盘
```

## 6. 新增博客

博客文章放在：

```text
src/content/blog
```

新建一个 Markdown 文件，例如：

```text
src/content/blog/my-note.md
```

推荐 frontmatter：

```yaml
---
title: "文章标题"
description: "列表页和 SEO 使用的一句话摘要。"
date: 2026-04-29
category: "AI 工程实践"
---
```

`category` 只能使用这些值：

- `项目复盘`
- `论文笔记`
- `AI 工程实践`
- `考研基础`

博客适合写：

- 项目复盘
- 工程迁移记录
- 论文笔记
- 工具链踩坑
- 面试或考研知识整理

## 7. 课程项目归档原则

课程项目默认放入 `课程归档`，重点说明课程目标、实现内容、技术点和可复用部分。

如果某个课程项目已经能独立体现工程能力或研究能力，可以单独抽象成一个独立项目，同时在正文里说明它最初来自课程作业。这样既保留学习轨迹，也不会埋没真正有展示价值的作品。

## 8. 本地组件维护

组件已经整理在：

```text
C:\coding\ai-portfolio\src\components
```

当前组件：

- `ProjectCard.astro`：项目列表卡片。
- `PostRow.astro`：博客列表行。
- `Seo.astro`：页面 SEO、Open Graph 和 Twitter Card 元信息。

新增组件时遵循三条规则：

- 只把可复用 UI 放进 `src/components`。
- 页面级结构优先放在 `src/pages` 或 `src/layouts`。
- 样式优先复用 `src/styles/global.css` 里的全局设计语言。

如果新增组件会成为站点基础能力，也把它写进 `src/components/README.md` 和 `tests/check-site.mjs`。

## 9. 个人信息修改点

常见修改位置：

- 首页：`src/pages/index.astro`
- 关于页：`src/pages/about.astro`
- 研究方向：`src/pages/research/index.astro`
- 简历文件：`public/resume-placeholder.pdf`
- SEO 默认信息：`src/components/Seo.astro`
- 站点域名：`astro.config.mjs`

正式发布前，建议把占位信息替换为真实姓名、学校、邮箱、GitHub、简历和自定义域名。

## 10. 发布流程

每次发布前按这个顺序执行：

```powershell
npm test
npm run build
npm audit --omit=dev
git status --short
```

确认无误后提交源码：

```powershell
git add .
git commit -m "Update site content"
git push
```

部署静态页面：

```powershell
npm run deploy
```

发布后检查：

```text
https://yourskenny.github.io/
https://yourskenny.github.io/projects/
https://yourskenny.github.io/blog/
```

GitHub Pages 有时会有短暂缓存。如果刚部署后页面没刷新，等几十秒再强制刷新。

## 11. 自定义域名接入

域名审核通过后，通常需要做三件事：

1. 在 GitHub Pages 设置里填写自定义域名。
2. 在域名 DNS 服务商处添加 GitHub Pages 需要的记录。
3. 在项目 `public` 目录中添加 `CNAME` 文件，内容是你的域名。

如果使用 apex 根域名，通常配置 A 记录；如果使用 `www` 子域名，通常配置 CNAME 记录。具体值以 GitHub Pages 设置页当时提示为准。

## 12. 推荐维护节奏

每周：

- 新增或完善 1 个项目条目。
- 写 1 篇短复盘或学习笔记。
- 检查首页高亮项目是否仍然代表当前水平。

每月：

- 更新一次关于页和研究方向。
- 把最近项目里的 README 精炼成博客或项目页。
- 检查简历、GitHub 链接、联系方式是否有效。

考研或求职前：

- 首页只保留最能证明能力的 3 到 5 个项目。
- 每个重点项目都补上“我的贡献”和“验证方式”。
- 博客里至少有 2 到 3 篇能体现思考深度的复盘文章。
