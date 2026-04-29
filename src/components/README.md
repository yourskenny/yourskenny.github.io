# 本地组件清单

博客项目的本地 Astro 组件统一维护在：

```text
C:\coding\ai-portfolio\src\components
```

## 组件

- `ProjectCard.astro`：项目列表卡片，读取 `projects` 内容集合中的 `title`、`summary`、`date`、`tags`、`role` 和 `category`。
- `PostRow.astro`：博客列表行，读取 `blog` 内容集合中的 `title`、`description`、`date` 和 `category`。
- `Seo.astro`：页面级 SEO 组件，生成 canonical、favicon、description、Open Graph 和 Twitter Card 元信息。

## 维护规则

- 可复用 UI 才放进这个目录。
- 页面专属结构留在 `src/pages`。
- 全站布局放在 `src/layouts`。
- 全局视觉语言优先放在 `src/styles/global.css`。
- 新增基础组件后，同步更新 `docs/usage-manual.md` 和 `tests/check-site.mjs`。
