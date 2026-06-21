---
title: "AI PR Review Assistant"
summary: "面向 GitHub Pull Request 的 AI 代码评审工具，先解析 PR metadata 和 diff，再绑定新增行证据、运行低噪声规则、控制上下文预算并输出 Markdown / JSON / SARIF 报告。"
date: 2026-06-22
tags: ["AI Engineering", "GitHub API", "PR Review", "Diff Parsing", "SARIF", "FastAPI", "Typer"]
role: "独立开发，产品定位、核心实现、Dashboard、报告与演示材料"
category: "竞赛项目"
sourcePath: "resume-records + AI PR Review workspace"
highlight: true
links:
  - label: "GitHub"
    url: "https://github.com/yourskenny/AI-PR-Review-Assistant"
---

## 项目背景

这是一个面向比赛作品开发的 GitHub Pull Request 代码评审工具。用户输入 PR URL 后，系统获取 PR 元数据和 diff，生成变更总结、风险识别和 Review 建议。

我没有把它做成“把 diff 直接丢给模型”的自由文本工具，而是先结构化解析 PR，再让规则和 AI 分别承担适合的职责。

## 我的工作

- 独立完成项目设计、核心实现、README、评测材料和 demo 准备。
- 实现 GitHub PR metadata / patch 获取、diff 解析、新增行号绑定、上下文预算控制和报告生成。
- 设计规则优先的低噪声 finding 结构，保留 severity、confidence、source、evidence 和 recommendation。
- 提供 AI JSON fallback、Markdown / JSON / SARIF 输出、Dashboard 和可选 GitHub comment 能力。
- 保留无模型 key 时的本地启发式降级路径，确保 demo 和基础评审流程可运行。

## 方法与实现

系统先从 GitHub REST API 获取 PR 文件级 diff，再按预算保留必要上下文。高置信风险优先由本地规则识别，AI 负责总结、解释和生成更自然的 Review brief。模型返回非法 JSON 或 API 失败时，系统会降级到本地报告，不让 CLI 中断。

输出侧保留多种格式：Markdown 方便人读，JSON 方便自动化，SARIF 方便未来接入代码扫描生态，Dashboard 方便评委或 reviewer 快速浏览。

## 公开边界

七牛云暑期训练营比赛结果尚未公布，所以这里只写“独立开发/参赛项目/结果待公布”。不写获奖、不写排名。

## 复盘

这个项目的核心价值是证据链：AI 可以帮 reviewer 总结和表达，但一条可执行的评审建议仍然要能追溯到 PR、文件、hunk 和新增行。
