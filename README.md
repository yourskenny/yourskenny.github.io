# AI Student Portfolio

面向考研复试、联系导师和求职展示的个人网站。技术栈为 Astro + Markdown，可部署到 GitHub Pages 或 Vercel。

当前项目固定维护在：

```text
C:\coding\ai-portfolio
```

## 本地开发

```powershell
cd C:\coding\ai-portfolio
npm install
npm run dev -- --host 127.0.0.1 --port 4321
```

## 常用命令

```powershell
npm test
npm run build
npm run preview
npm run deploy
```

## 内容目录

- `src/content/projects`：项目案例
- `src/content/blog`：博客文章
- `src/components`：本地 Astro 组件
- `src/pages/research`：研究方向
- `src/pages/about.astro`：个人介绍
- `docs/usage-manual.md`：博客使用手册

把页面里的“你的名字”、学校、邮箱、GitHub 和简历文件替换成你的真实信息即可。

更完整的维护流程见 `docs/usage-manual.md`。
