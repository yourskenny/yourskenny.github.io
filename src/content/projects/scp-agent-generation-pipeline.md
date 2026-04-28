---
title: "SCP 专家 Agent 与生成管线"
summary: "围绕 SCP 中文维基构建离线知识库、RAG 检索、Function Calling、自主爬取和内容生成的专家智能体。"
date: 2026-04-13
tags: ["RAG", "Agent", "Function Calling", "FastAPI", "Gradio", "SQLite"]
role: "RAG Agent 与生成系统设计"
category: "独立项目"
sourcePath: "C:/coding/SCP_ai"
highlight: true
links: []
---

## 项目简介

该项目围绕 SCP 基金会中文维基，构建离线文本与多媒体数据库，并在此基础上实现能理解设定、检索资料、调用工具和生成 SCP 档案的专家 Agent。

## 技术栈

- Python / FastAPI / Gradio / Tkinter
- SQLite 离线知识库
- RAG 检索增强生成
- Function Calling
- 爬虫、媒体同步、DPO/LoRA 训练脚本规划

## 我的工作

我整理了统一启动入口、离线数据库构建、专家 Agent、Web 生成界面、维基沙盒和 API 服务等模块，让项目从“点子生成”扩展为完整的生成系统管线。

## 方法与实现

Agent 在本地知识库中检索 SCP 设定和历史文本；当资料缺失时，可以调用爬虫补充数据库。生成结果可通过 Gradio 界面或 API 服务访问，并可在本地 Wikidot 沙盒中预览。

## 难点与解决

难点在于内容生成必须符合复杂设定和维基语法，而不是普通故事续写。项目通过站规、GOI、设定中心等技能库，以及本地 RAG 数据库来约束输出。

## 复盘

这是一个很适合展示 LLM 工程能力的项目。后续可以补充检索评估、生成质量样例和工具调用链路图。
