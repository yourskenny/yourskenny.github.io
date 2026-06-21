---
title: "LCFC NL2SQL 智能问数系统"
summary: "面向制造业数据问答的受控 NL2SQL 竞赛项目：自然语言先转结构化 IR，再由 schema linker、SQL guardrails、compiler、结果契约和 benchmark 闭环校验。"
date: 2026-06-22
tags: ["NL2SQL", "Agent", "SQLite", "IR", "SQL Compiler", "Benchmark", "Truthfulness"]
role: "独立开发，受控 NL2SQL 架构、benchmark 与提交包校验"
category: "竞赛项目"
sourcePath: "resume-records + LCFC workspace"
highlight: true
links:
  - label: "GitHub"
    url: "https://github.com/yourskenny/lcfc-nl2sql"
---

## 项目背景

这是一个面向制造业场景的 NL2SQL 智能问数竞赛项目。目标不是把公开题写成固定模板，而是把自然语言问题转成可执行 SQL，并输出可信结果、解释和洞察。

我把它作为受控 AI 工程项目来做：模型可以参与候选生成，但不能直接绕过 schema 检索、结构化 IR、SQL guardrails、执行校验和结果契约。

## 我的工作

- 独立搭建受控 NL2SQL 工程框架，避免直接依赖裸 LLM 生成 SQL。
- 设计自然语言解析、schema 检索、join path、结构化 IR、SQL compiler、语义检查和结果检查链路。
- 建立公开题、近邻扰动和 hidden-like benchmark，用于判断系统是否具备泛化能力。
- 维护能力地图、实验报告、提交包构建脚本和本地验证命令。

## 方法与实现

项目的核心链路是：

```text
自然语言问题
  -> deterministic / LLM-assisted IR candidate
  -> schema linker + SQL guardrails
  -> controlled SQL compiler
  -> SQLite execution + result contract
  -> truthfulness gate + benchmark feedback
```

这个设计把不可控的“模型一次性写 SQL”拆成多个可验证环节。每一步都要留下失败原因：是 schema miss、catalog miss、join path 不支持、compiler 不能表达，还是结果契约不匹配。

## 公开边界

比赛结果尚未公布，所以这里只写“独立开发/参赛项目/结果待公布”。不公开未发布分数、隐藏数据、提交包、平台账号、key 文件或原始题面细节。

## 复盘

这个项目最适合展示我对 AI Agent 工程的判断：真正可靠的系统不是让模型自由发挥，而是给模型一个受控的结构化出口，再用执行结果、语义契约和 benchmark 把输出收回来。
