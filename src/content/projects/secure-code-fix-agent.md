---
title: "Secure Code Fix Agent 安全代码修复工作流"
summary: "基于 Dify Workflow 的安全代码修复 Agent 原型，强调沙箱执行、人机确认和自动测试反馈循环。"
date: 2026-02-09
tags: ["Dify", "Agent", "Secure Sandbox", "Human-in-the-loop", "Workflow"]
role: "Agent 工作流与风控设计"
category: "实习项目"
sourcePath: "D:/coding/voyah/Secure Code Fix Agent"
highlight: false
links: []
---

## 项目简介

该项目是一个基于 Dify 工作流架构的安全代码修复 Agent 原型，目标是让自动化代码修复过程更可控、更安全。

## 技术栈

- Dify Workflow
- OpenAPI 工具接口
- Docker 沙箱
- 自动测试反馈循环
- Human-in-the-loop 审批

## 我的工作

我完成了核心设计文档，规划了从 Issue 分析、修复迭代、测试反馈到人工确认的完整工作流。

## 方法与实现

工作流采用 Start -> LLM Analysis -> Iteration Fix Loop -> Human Confirm -> End 的结构。敏感的文件读写和代码执行封装为安全沙箱工具，避免 Agent 直接操作宿主机。

## 难点与解决

自动修复代码的风险在于误改、越权执行和不可审计。项目通过 Docker 隔离、最大重试次数和提交前人工确认降低风险。

## 复盘

这个项目适合展示你对 Agent 安全边界的理解。后续可以补充一个最小可运行 demo 和修复前后测试结果。
