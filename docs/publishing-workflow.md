# 博客发布工作流与故障排查

这份文档沉淀一次真实发布坑：博客源码已经提交并推到 `source`，但 `yourskenny.top` 上看不到新文章。根因是本站采用双分支发布：`source` 保存源码，`main` 保存 Astro 构建后的静态页面。只推 `source` 不等于发布线上站点。

## 1. 分支职责

```text
source
  站点源码分支
  包含 src/content/blog、src/pages、src/components、docs、scripts 等源文件

main
  GitHub Pages 发布分支
  包含 dist 构建后的静态 HTML、CSS、RSS、sitemap、CNAME 等文件
```

判断一个改动是否真正上线，要同时看两件事：

- `source` 是否包含最新源码提交。
- `main` 是否包含对应的静态站点发布提交。

## 2. 标准发布流程

进入项目目录：

```powershell
cd C:\coding\ai-portfolio
```

检查当前分支和工作区：

```powershell
git branch --show-current
git status --short
```

新增或修改博客后，先验证：

```powershell
npm run test
npm run build
```

提交源码到 `source`：

```powershell
git add -- src/content/blog/<post-file>.md
git commit -m "Add <topic> post"
git push origin source
```

发布静态站点到 `main`：

```powershell
npm run deploy
```

`npm run deploy` 会执行：

```text
npm run build
node scripts/deploy-pages.mjs
```

部署脚本会把 `dist/` 复制到临时 worktree，并强制推送到 `origin/main`。

## 3. 发布后验证

确认远端分支：

```powershell
git ls-remote origin source main
```

确认线上文章页：

```powershell
curl.exe -L https://yourskenny.top/blog/<slug>/ --max-time 30 |
  Select-String -Pattern "<文章标题>|页面未找到|404"
```

确认博客列表：

```powershell
curl.exe -L https://yourskenny.top/blog/ --max-time 30 |
  Select-String -Pattern "<文章标题>|<发布日期>"
```

如果刚推完 `main` 仍然看不到，先等待 20 到 60 秒。GitHub Pages 和 CDN 可能有短暂刷新延迟。

## 4. 快速判断问题在哪

### 情况 A：`source` 有新提交，`main` 没变

症状：

- GitHub 源码里能看到新 Markdown。
- `yourskenny.top` 看不到新文章。
- `git ls-remote origin main` 仍是旧提交。

原因：

只推了源码，没有运行 `npm run deploy`。

处理：

```powershell
npm run deploy
```

### 情况 B：`npm run deploy` 构建成功，但 `git fetch origin main` 失败

常见错误：

```text
Failed to connect to github.com port 443
schannel: failed to receive handshake
TLS connect error: unexpected eof while reading
```

原因：

本地到 GitHub 的 HTTPS Git 通道不稳定，可能是代理、加速器或网络拦截导致。此时文章和构建通常没问题，失败点在 Git 网络。

处理思路：

1. 先确认 `npm run build` 已成功生成新页面。
2. 再确认本地是否已生成发布提交。
3. 最后解决 `git push origin main` 的网络问题。

### 情况 C：`main` 已推送，线上仍旧

症状：

- `git ls-remote origin main` 已显示新发布提交。
- 线上文章路径短时间内仍返回旧页面或 404。

原因：

GitHub Pages 或 CDN 尚未刷新。

处理：

等待 20 到 60 秒后重试：

```powershell
curl.exe -L https://yourskenny.top/blog/<slug>/ --max-time 30
```

## 5. 网络故障时的代理发布

如果浏览器能访问 GitHub，但 Git 命令出现 TLS 握手失败，可以显式指定本地代理。

先查看本地监听端口：

```powershell
Get-NetTCPConnection -State Listen |
  Where-Object { $_.LocalAddress -in @("127.0.0.1","0.0.0.0","::","::1") } |
  Sort-Object LocalPort |
  Select-Object LocalAddress,LocalPort,OwningProcess,
    @{Name="Process";Expression={(Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName}}
```

本次可用代理是：

```text
127.0.0.1:7897  verge-mihomo
```

测试代理是否能访问 GitHub：

```powershell
curl.exe -I --proxy http://127.0.0.1:7897 https://github.com --max-time 20
```

如果返回 `HTTP/1.1 200 OK`，可以让 Git 显式走这个代理：

```powershell
git -c http.proxy=http://127.0.0.1:7897 push origin source
git -c http.proxy=http://127.0.0.1:7897 push origin main --force
```

如果 `npm run deploy` 卡在 `git fetch origin main`，但本地已经有最新的 `origin/main` 引用，也可以手动完成部署。

## 6. 手动部署兜底流程

仅在 `npm run deploy` 因 GitHub 网络失败而中断时使用。

先构建：

```powershell
npm run build
```

再从本地 `origin/main` 创建发布 worktree：

```powershell
$ErrorActionPreference = "Stop"
$root = Resolve-Path "."
$deployPath = Join-Path $root ".deploy-pages"

if (Test-Path $deployPath) {
  $resolved = Resolve-Path $deployPath
  if (-not $resolved.Path.StartsWith($root.Path)) {
    throw "Unexpected deploy path: $($resolved.Path)"
  }
  git worktree remove $deployPath --force
}

git worktree prune
git worktree add -B main $deployPath origin/main
```

替换静态文件：

```powershell
Get-ChildItem -Force $deployPath |
  Where-Object { $_.Name -ne ".git" } |
  ForEach-Object { Remove-Item -LiteralPath $_.FullName -Recurse -Force }

Copy-Item -Path (Join-Path $root "dist\*") -Destination $deployPath -Recurse -Force
```

提交发布产物：

```powershell
git -C $deployPath add .
git -C $deployPath commit -m "Deploy static site"
```

推送 `main`。普通网络可用时：

```powershell
git -C $deployPath push origin main --force
```

需要代理时：

```powershell
git -C $deployPath -c http.proxy=http://127.0.0.1:7897 push origin main --force
```

清理 worktree：

```powershell
git worktree remove $deployPath --force
```

## 7. 本次事故复盘模板

以后遇到“线上没更新”，按这个顺序记录：

```text
1. 源码提交
   source 最新提交：
   是否包含新 Markdown：

2. 构建状态
   npm run test：
   npm run build：
   dist 是否生成新路由：

3. 发布分支
   main 最新提交：
   是否包含 blog/<slug>/index.html：

4. 网络状态
   git push/fetch 是否成功：
   是否需要 http.proxy：

5. 线上验证
   文章 URL：
   博客列表：
   是否等待 CDN 刷新：
```

## 8. 最短记忆版

```text
写博客 -> npm test -> npm build -> push source -> npm run deploy -> 确认 main 更新 -> 等 Pages 刷新 -> curl 验证线上 URL
```

这次的坑，本质不是文章没写好，也不是 Astro 没构建，而是漏了“把静态产物推到发布分支”这一步。以后只要记住 `source` 是源码、`main` 是线上，就能少踩很多发布坑。
