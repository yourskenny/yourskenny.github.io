---
title: "本地 GSD 三 Agent 系统复盘：从能跑到可编排、可观测、可交接"
description: "一次 Windows 本地多 Agent 工程改造复盘：把 GSD、Codex、Claude Code、AstrBot 和 Phoenix 串成统一工作流，并通过 MCP、ChatOps、trace 和大型仓库试点验证可行性。"
date: 2026-04-30
category: "AI 工程实践"
---

## 背景

我在本地做过一组围绕 GSD 的复杂改造：接入 Codex、Claude Code 和 AstrBot，并尝试让它们一起承担真实软件工程任务。最初的问题不是“哪个模型更强”，而是一个更工程化的问题：多个 agent 都能做事时，谁来维护任务状态，谁来执行，谁来复核，谁来对人汇报？

如果没有边界，多 Agent 系统很容易变成多个聊天窗口和几段脚本的拼接。它看起来热闹，但任务状态分散、日志不完整、失败不可复盘，也很难长期维护。

所以我最终选择把 GSD 作为唯一编排控制面，把其他 agent 和服务都收敛到明确职责里。

## 最终架构

系统被拆成五个角色：

- GSD：任务、里程碑、切片和 workflow 的权威控制面。
- Codex：主执行 agent，负责仓库分析、代码修改、测试和文档。
- Claude Code via LiteLLM：独立 review agent，负责第二视角、风险判断和替代路线验证。
- AstrBot：ChatOps agent，负责 QQ/NapCat/IM 方向的状态汇报和人机交互入口。
- Phoenix：trace 可视化界面，用于观察一次工作流里每个 agent 做了什么。

这个架构里最重要的约束是：AstrBot 不做构建和测试，Claude Code 不替代真实验证，Codex 不把状态私有化，GSD 仍然是任务状态中心。

## AstrBot 为什么要通过 MCP 接入

AstrBot 本身有 WebUI，也有 HTTP API。如果让每个 workflow 脚本直接拼 HTTP 请求，短期能跑，但会让调用方式散落在脚本里。后续要换 session、改鉴权、处理 SSE 或主动消息时，每个脚本都要改。

所以我写了一个本地 AstrBot MCP bridge，放在 GSD 项目的 `.gsd/astrbot-mcp/server.mjs`。它把 AstrBot 的稳定接口封装成三个 MCP 工具：

- `astrbot_chat`
- `astrbot_list_sessions`
- `astrbot_send_message`

这个 bridge 负责处理 API key、请求超时、SSE 文本解析、JSON/纯文本输出兼容和错误摘要。GSD 或其他 MCP client 只需要调用工具，不需要知道 AstrBot 的内部细节。

这一步的意义是把 AstrBot 从“另一个要特殊处理的服务”变成“GSD 工作流里一个标准工具端点”。

## 为什么最后选择 Phoenix 做可视化

我曾经试过在 GSD Web 里做自定义 Agents 页面，用来展示多 Agent 工作流。但试点之后，我把这个方向清理掉了，保留 Phoenix 作为正式可视化路径。

原因很实际：多 Agent 工作流最需要的是可靠 trace，而不是一个临时 UI。Phoenix 已经能按 span、属性、耗时、错误信息组织执行链路，只要工作流把关键步骤写入 OTLP endpoint，就能复盘每个阶段发生了什么。

我把 trace 属性设计成围绕 agent 和 workflow stage 展开，例如：

- `agent`
- `route`
- `role`
- `workflow.stage`
- `exitCode`
- `elapsedMs`

这样一次复杂任务可以被拆开看：Codex 做了什么，Claude Code 复核了什么，AstrBot 有没有完成通知，哪个命令失败，失败摘要是什么。

## Windows 本地工程问题

这个项目里很多时间花在了“看起来不核心但会决定能不能用”的地方。

例如，GSD Web 的源码改动不一定会反映到正在运行的浏览器，因为实际页面可能来自全局 npm 安装下的 packaged standalone chunk。为了让本地 UI 真正中文化，我写了 `scripts/patch-gsd-ui-cn.js`，直接 patch 当前 served chunk，并通过浏览器实际渲染结果确认。

再比如，Python runner 在 Windows 上调用 Node 工具时，不能简单执行 `npm` 或 `gsd`，需要调用 `npm.cmd` 和 `gsd.cmd`。如果 stdout/stderr 没有强制 UTF-8，还会遇到 GBK 编码问题。MCP 工具输出也不能假设全是 JSON，有些返回就是纯文本。

这些问题不解决，系统就只能在一次临时演示里跑通，不能变成日常可用工具。

## 大型仓库试点

为了避免自欺欺人，我没有只用一个小 demo 验证系统，而是选择了 `microsoft/playwright` 作为大型仓库试点。

试点策略是先做基线切片，而不是直接让 agent 改功能。验证内容包括：

1. 读取贡献说明。
2. 安装依赖。
3. 构建。
4. TypeScript 检查。
5. package lint。
6. 记录 Windows 特有失败。
7. 将 Codex、Claude Code 和 AstrBot 的阶段行为写入 Phoenix trace。

结果是 `npm ci --ignore-scripts`、`npm run build`、`npm run tsc`、`npm run lint-packages` 都成功了。`npm run check-deps` 暴露出 Windows 路径归一化问题，生成了类似 `../../C:/file/...` 的路径；我把它记录为环境问题，而不是把整个试点判定失败。

这个结论很重要：多 Agent 系统适合先建立项目健康基线，再进入小范围任务。对于大型仓库，第一步不应该是“让 AI 自由发挥”，而应该是让它理解项目的验证边界。

## 清理比堆功能更重要

试点过程中产生过临时 runner、报告、runtime JSON、milestone、GSD Web Agents 页面和额外 MCP 配置。验证完成后，我把这些 trial scaffolding 清理掉，只保留稳定部分：

- AstrBot MCP bridge
- `.gsd/mcp.json` 中的 `astrbot-api`
- Phoenix 可视化路径
- 中文操作手册
- 必要的 GSD workflow MCP 配置

这一步对长期维护很关键。Agent 项目很容易越试越乱，每次试点都留下一组脚本和页面，最后没有人知道哪条路径才是主线。清理后的仓库表达了一个明确事实：Phoenix 是正式 trace 界面，AstrBot 是 ChatOps 工具，GSD 是控制面。

## 文档化交付

我最后写了一份中文操作手册，内容不是架构介绍，而是操作者真的会用到的流程：

- 如何启动 AstrBot 栈。
- 如何启动 Phoenix。
- 如何检查 GSD 模型路由。
- 如何验证 Codex 和 Claude Code 路线。
- 如何验证 AstrBot HTTP API。
- 如何验证 AstrBot MCP 工具。
- 如何在 Phoenix 中观察 trace。
- 常见故障怎么处理。

这份文档的价值在于把本地复杂改造变成可交接系统。未来即使忘记某个细节，也可以按手册恢复。

## 复盘

这次改造让我对多 Agent 系统有了一个更清晰的判断：真正难的不是“接入更多 agent”，而是让每个 agent 有清楚的责任边界，并且让整个系统有统一状态、统一工具入口、统一可观测路径和统一操作文档。

如果要总结这套系统的工程价值，我会写成一句话：

> 在 Windows 本地将 GSD 改造成统一多 Agent 编排控制面，接入 Codex、Claude Code/LiteLLM、AstrBot 与 Phoenix，完成 MCP 桥接、ChatOps 通知、trace 可观测、中文操作手册、大型仓库可行性验证和试点清理。

这不是一个单点功能，而是一套把 Agent 能力推进到真实工程环境里的基础设施。
