---
title: "本地 GSD 三 Agent 编排系统"
summary: "在 Windows 本地把 GSD 改造成统一多 Agent 控制面，接入 Codex、Claude Code/LiteLLM、AstrBot 与 Phoenix，完成 MCP 桥接、ChatOps 通知、trace 可视化和大型仓库可行性验证。"
date: 2026-04-30
tags: ["Agent", "GSD", "MCP", "Codex", "Claude Code", "AstrBot", "Phoenix", "Windows"]
role: "本地多 Agent 编排、MCP 桥接、可观测性与运行手册"
category: "独立项目"
sourcePath: "C:/file/code/GSD"
highlight: true
links: []
---

## 项目简介

这个项目是我在 Windows 本地对 GSD 做的一套多 Agent 工程化改造。目标不是单独跑通某个模型，而是把 Codex、Claude Code、AstrBot 和 Phoenix 接到一个统一的 GSD 工作流里，让本地 Agent 系统具备明确分工、可观测 trace、ChatOps 通知和可复现操作手册。

最终形成的职责划分是：

- GSD 作为唯一编排控制面，维护任务、里程碑、切片和工作流状态。
- Codex 作为主执行 agent，负责代码分析、实现、测试和文档。
- Claude Code via LiteLLM 作为独立 review agent，负责第二视角、风险判断和替代路线验证。
- AstrBot 作为 ChatOps agent，负责状态汇报、QQ/NapCat/IM 方向的对人沟通。
- Phoenix 作为可视化 trace 界面，记录每次工作流中各 agent 做了什么。

## 技术栈

- GSD / Pi SDK / GSD MCP workflow
- Codex CLI
- Claude Code via LiteLLM
- AstrBot / NapCat / AstrBot HTTP API
- Model Context Protocol
- Phoenix / OpenTelemetry trace
- TypeScript / Node.js / PowerShell
- Windows 本地 Docker 与服务编排

## 我的工作

我围绕本地 GSD 仓库完成了从架构设计到运行验证的一整套改造：

- 设计三 Agent 职责边界，避免多个系统重复调度或互相抢状态。
- 编写 AstrBot MCP bridge，把 AstrBot 的 `/api/v1/chat`、会话查询和主动消息能力暴露成 MCP 工具。
- 配置项目级 `.gsd/mcp.json`，让 GSD 能调用本地 AstrBot bridge。
- 配置工作流级 `.mcp.json`，接入 GSD workflow executor 和 write-gate。
- 将 Phoenix 确认为稳定可视化路径，用 trace 记录 Codex、Claude Code、AstrBot 的阶段行为。
- 编写中文操作手册，覆盖启动顺序、健康检查、模型路由、AstrBot API/MCP 验证和 Phoenix 查看流程。
- 处理 GSD Web 本地中文化，包括直接 patch 已打包 runtime 的情况。
- 修复项目选择页的一些本地交互细节，例如项目名 trim、大小写冲突检测、空状态新建入口和中文错误提示。
- 进行真实大型仓库可行性验证，选择 `microsoft/playwright` 而不是玩具项目。
- 在试点结束后清理临时 scaffolding，只保留稳定基线。

## 核心实现

### AstrBot MCP Bridge

我在 `.gsd/astrbot-mcp/server.mjs` 中实现了本地 MCP server。它从环境变量或 GSD 用户认证文件读取 AstrBot API key，然后通过 AstrBot 稳定的 `/api/v1/*` 接口提供三个工具：

- `astrbot_chat`：调用 `/api/v1/chat`，支持普通响应和 SSE 文本解析。
- `astrbot_list_sessions`：查询某个 workflow username 下的会话。
- `astrbot_send_message`：调用 `/api/v1/im/message` 发送主动消息。

这让 GSD 或其他 MCP client 不需要直接理解 AstrBot 内部实现，只要调用统一工具即可完成 ChatOps 状态交接。

### 工作流与权限边界

项目级 `.gsd/mcp.json` 只保留稳定的 `astrbot-api` server。工作流级 `.mcp.json` 指向 GSD MCP server，并显式配置 workflow executor、write-gate 和项目根目录。

这个设计有两个目的：

- AstrBot 只做通知、会话和对外沟通，不拥有代码构建或测试。
- GSD workflow 仍然是权威状态来源，避免把任务进度散落到多个 agent 自己的上下文里。

### Phoenix 可观测性

早期曾尝试过自制 GSD Web Agents 页面，但最终保留 Phoenix 作为稳定可视化路径。Phoenix 通过本地 OTLP endpoint 接收 trace，每个 agent 可以作为独立 span 或携带 `agent`、`route`、`role`、`workflow.stage`、`exitCode` 等属性。

这让一次多 Agent 工作流不只是“跑完了”，而是能复盘：

- Codex 做了什么主线分析或实现。
- Claude Code 给出了什么复核结论。
- AstrBot 是否完成状态交接。
- 哪个命令失败、耗时多少、失败摘要是什么。

## 大型仓库验证

为了验证这套系统不是只适合小 demo，我选择 `microsoft/playwright` 做大型项目试点。验证过程包括：

- shallow clone 真实大型仓库。
- 读取贡献说明，先建立低风险基线。
- 运行 `npm ci --ignore-scripts`。
- 运行 `npm run build`。
- 运行 `npm run tsc`。
- 运行 `npm run lint-packages`。
- 记录 `npm run check-deps` 在 Windows 下的路径归一化问题。
- 将 Codex triage、Claude Code review、AstrBot status handoff 写入 Phoenix trace。

这次验证说明：本地三 Agent 栈适合先做“环境基线切片”，再逐步进入小范围代码任务；不应该一开始就让 agent 对大型仓库做无边界改动。

## 难点与解决

这个项目的难点主要不在单个 API，而在多个本地系统之间的边界：

- GSD、Codex、Claude Code 和 AstrBot 都有自己的上下文或状态，如果不明确边界，很容易形成重复调度。
- AstrBot 有 WebUI 和内部接口，但外部编排应稳定依赖 `/api/v1/*`。
- GSD Web 源码修改不一定影响当前浏览器看到的 packaged runtime，因此需要检查真实 served chunk。
- Windows Python runner 调 Node 工具时要使用 `npm.cmd`、`gsd.cmd`，还要处理 UTF-8 输出。
- MCP 工具输出不一定总是 JSON，调用侧必须兼容纯文本结果。
- 试点完成后必须区分“稳定基线”和“临时实验”，否则仓库会迅速堆满过期 scaffolding。

我的处理方式是把系统分成三层：GSD 负责工作流状态，agent 负责各自职责，Phoenix 和文档负责可观测与交接。试点产物完成验证后清理掉，保留真正能长期使用的桥接、配置和手册。

## 结果

当前本地 GSD 栈已经形成一套可操作基线：

- Codex 主路线：`codex-mirror/gpt-5.3-codex`
- Claude Code review 路线：`claude-code/deepseek-v4-pro`
- AstrBot ChatOps：本地 `/api/v1/*` + MCP bridge
- Phoenix trace：`http://127.0.0.1:6006`
- GSD Web：作为工作台使用，但不依赖自制 Agents 页面
- 中文手册：记录真实命令、地址、健康检查和故障处理

## 相关阅读

- [本地 GSD 三 Agent 系统复盘：从能跑到可编排、可观测、可交接](/blog/local-gsd-three-agent-engineering-retrospective/)

## 复盘

这个项目让我更明确地认识到，Agent 工程的关键不是把多个模型放在一起，而是让它们在一个干净的控制面下各司其职。

真正有价值的改造包括：统一编排、工具桥接、状态可观测、验证命令、运行手册、密钥边界和试点后清理。只有这些工程层面稳住，多 Agent 才能从一次演示变成可以长期使用的本地系统。
