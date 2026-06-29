---
title: "商贸大模型营销智能体"
summary: "面向商贸场景的企业级营销智能体原型，围绕活动策略、目标人群、选品规则、ROI/参与度预测、上下文管理和工作流编排拆解 Agent 能力边界。"
date: 2026-06-22
tags: ["LLM Agent", "Marketing", "Workflow", "REST API", "Context Management", "LangGraph", "RAG"]
role: "Agent 开发，需求梳理、原型设计、能力边界拆解与接口设计"
category: "研究原型"
sourcePath: "resume-records + marketing-agent workspace"
highlight: true
links:
  - label: "架构演示"
    url: "/demos/marketing-agent-architecture/"
---

## 项目背景

这个项目来自武汉大学计算机学院田纲教授课题组相关工作，面向商贸场景建设覆盖采购、营销、运营、商品与供应链的企业级智能体矩阵。

我参与的是营销智能体方向：让系统理解运营人员输入，并生成活动策略、目标人群、选品建议、活动规则和效果预测。

## 我的工作

- 参与商贸大模型营销智能体 Agent 开发。
- 围绕采购、营销、运营、商品与供应链场景拆解企业级智能体矩阵能力边界与协同流程。
- 负责营销智能体方向需求梳理与原型设计。
- 参与统一 RESTful API、上下文管理、可解释推理记录与工作流编排接口设计。

## 方法与实现

本地 workbench 把营销智能体作为 `standardized-agent-workflow` 的下游项目来验证：同一份项目 brief、知识边界、回归问题和验收标准，可以分别接入原生 agent kernel 和 LangGraph runtime 做对比。

这种结构让项目不只是一个 prompt demo，而是能持续比较两条 Agent 编排路线在上下文管理、工具调用、流程可解释性和维护成本上的差异。

## 架构演示

我把本地 demo 中的架构讲解页整理成了静态演示，用来说明数据层、构建层、记忆层、接口层、Agent pipeline、可信机制和前端展示之间的关系。

这个演示只发布静态页面，不接入本地 `127.0.0.1:8765` 后端服务，也不暴露原始 Excel、API key 或内部材料。

## 公开边界

不公开原始需求文档、业务敏感细节或内部材料全文。这里只写公开可描述的能力拆解、工程边界和我负责的 Agent 开发工作。

## 复盘

这个项目是我从个人 Agent 工具走向业务 Agent 的关键材料：它要求我把“模型能力”翻译成运营人员可用的业务流程、接口和可解释记录。
