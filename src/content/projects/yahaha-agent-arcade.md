---
title: "YAHAHA Agent Arcade"
summary: "三天面试 MVP：从 creator prompt 到 Agent 生成 playable bundle，再到对象存储、预览、发布、公开游玩、remix 和 creator dashboard 的完整闭环。"
date: 2026-06-21
tags: ["Agent", "React", "Vite", "Node.js", "SQLite", "Object Storage", "Testing"]
role: "全栈 MVP 设计、Agent Harness、对象存储与交付文档"
category: "面试项目"
sourcePath: "C:/coding/YAHAHA"
highlight: true
links: []
---

## 项目背景

这是一个面向全栈系统设计面试的三天 MVP。题目重点不是做一个静态游戏列表，而是证明一条高风险链路可以端到端跑通：

```text
creator prompt -> Agent task -> generated playable bundle -> object storage
  -> preview -> publish -> public play -> remix -> creator dashboard
```

因此我把项目定位为“AI Native interactive game platform MVP”，围绕生成、存储、发布、游玩和创作者后台做最小但完整的产品闭环。

## 交付范围

项目包含 React/Vite 前端、Node HTTP API、SQLite 元数据、对象存储抽象和本地 deterministic Agent Harness。主要页面包括 Home、Create、Play、Dashboard 和 Delivery。

已经实现的核心能力：

- 浏览、搜索、标签筛选和排序公开游戏。
- Demo login 后进入 creator 工作台。
- 从 prompt 创建游戏生成任务，并轮询 `pending -> running -> succeeded` 状态。
- 上传参考资产，并把资产作为生成上下文写入 manifest。
- 生成可玩的 HTML bundle 和 manifest，而不是在前端硬编码游戏组件。
- 将 bundle 存入本地对象存储，并用与 S3/MinIO 相同的 object-key contract 读取。
- Play 页面通过 sandboxed iframe 加载 `/storage/<bundle_key>`。
- 支持 publish、play tracking、remix lineage 和 creator dashboard 统计。
- 提供 API 文档、OpenAPI、系统设计、部署说明、demo script 和 closeout plan。

## Agent Harness

为了让面试评审可以稳定复现，当前 Agent Harness 默认使用 deterministic local provider，而不是依赖不可控模型输出。它把一次生成拆成以下步骤：

- `plan`：从 prompt 提取主题、玩法和约束。
- `asset_review`：整理上传资产对生成的影响。
- `generate`：选择 rhythm lane、orbital drift、defense grid、maze runner、collector dash 等可玩 archetype。
- `validate`：检查 object key、bundle hash、manifest 和 sandbox readiness。
- `quality_scorecard`：给 playable runtime、sandbox safety、prompt fit 和 asset use 打分。
- `publish_gate`：判断生成结果是否允许 preview 和 publish。

这让生成结果不是一个黑盒字符串，而是带有日志、manifest、hash 和质量门禁的可检查产物。

## 工程边界

项目刻意把 MVP 边界写清楚，避免把面试项目包装成生产 SaaS：

- Demo authentication 代替 OAuth/JWT/cookie session。
- In-process generation task 代替 durable queue 和 worker。
- Local deterministic generation 代替生产级模型调优。
- Local object storage 代替同一 object-key contract 下的 S3/MinIO。
- iframe sandbox、path validation 和 hardening checklist 代表当前安全边界，生产还需要内容扫描、签名 URL、队列隔离和更细的授权。

## 验证方式

交付文档中保留了完整质量门禁：

```bash
npm run lint
npm test
npm run test:prod
npm run build
```

CI 使用 `.github/workflows/ci.yml` 跑同样的验证链路。生产 smoke test 会构建 `dist/`、启动 Node server、检查首页静态资源缓存和 `/api/health`。

## 展示重点

这个项目适合展示短周期面试交付能力：不是只把页面搭出来，而是把高风险链路、数据模型、API 合约、生成日志、质量门禁、部署路径和已知 tradeoff 一起交付。

面试中我会重点讲三点：

1. 生成结果作为远程 bundle 存储和加载，证明产品链路不是静态假数据。
2. Agent Harness 有日志、manifest、hash 和 quality scorecard，评审可以检查生成过程。
3. MVP 明确承认 demo auth、in-process task 和 local provider 的边界，并给出生产替换路径。
