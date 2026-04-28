---
title: "Lumina 视障辅助与避障导航智能体"
summary: "面向视障人群的端云协同多模态智能体，结合 YOLOv8、Qwen-VL、语音交互、位置服务和安全反馈仲裁。"
date: 2026-03-30
tags: ["Android", "YOLOv8", "Qwen-VL", "Agent", "ONNX Runtime", "Kotlin"]
role: "多模态智能体与端侧感知设计"
category: "竞赛项目"
sourcePath: "D:/coding/Software_Innovation_Contest/Lumina_n"
highlight: true
links: []
---

## 项目简介

Lumina 是一个面向视障人群的视觉辅助与避障导航智能体。它不是单纯的目标检测应用，而是把端侧实时感知、云端视觉语言模型、语音意图分发、位置服务和反馈仲裁组合成一个完整系统。

## 技术栈

- Kotlin / Android / Jetpack Compose
- YOLOv8s + ONNX Runtime
- Qwen-Plus / Qwen-VL-Plus
- AMap Location SDK / Web API
- LangChain4j、Clean Architecture、MVVM

## 我的工作

项目 README 显示系统已设计端云协同感知、意图分发、上下文记忆和安全优先反馈架构。这个项目适合作为竞赛/产品型 AI 项目展示，重点突出“AI 能力如何进入真实交互场景”。

## 方法与实现

系统采用 Fast/Slow 双系统：端侧 YOLO 提供低延迟障碍物检测，云侧 VLM 负责复杂场景理解。端侧检测结果会注入 VLM prompt，降低幻觉并提升场景描述的可靠性。

## 难点与解决

视觉辅助应用的核心不是模型精度本身，而是安全反馈时序。项目通过反馈仲裁器管理 TTS 和震动优先级，让危险提醒打断普通对话或状态播报。

## 复盘

后续可以补充实际设备截图、检测效果、语音交互流程和竞赛材料。它非常适合独立抽象成“多模态智能体 + 移动端 AI”作品。
