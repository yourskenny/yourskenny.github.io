---
title: "推理解密游戏开发范式"
summary: "将推理解密游戏拆分为数据驱动播放器与可视化编辑器，用 JSON 剧本配置驱动终端式解谜体验。"
date: 2026-03-24
tags: ["React", "TypeScript", "Vite", "Tailwind CSS", "Zustand", "Game Tooling"]
role: "前端架构与内容编辑器设计"
category: "独立项目"
sourcePath: "C:/coding/html_game; D:/coding/html_game"
highlight: true
links: []
---

## 项目简介

这是一个面向推理解密游戏的开发范式。项目把传统强耦合剧本结构拆成“播放器”和“编辑器”：播放器负责运行数据驱动的游戏，编辑器负责可视化编辑和导出标准 JSON 剧本。

## 技术栈

- React 18 / TypeScript / Vite
- Tailwind CSS
- Zustand 状态管理
- JSON Schema 剧本规范
- Lucide React

## 我的工作

我设计了终端式交互、文件解锁机制和可视化编辑器，让剧情内容可以脱离代码维护。玩家需要通过时间、地点、人物等线索推理隐藏文件 ID，从而推进剧情。

## 方法与实现

播放器加载 `example_game.json`，根据当前解锁状态和玩家输入展示文件。编辑器支持导入、修改和导出 JSON，使剧本生产流程更像内容工具而不是硬编码页面。

## 难点与解决

关键难点在于把叙事逻辑、解锁规则和 UI 展示拆开。项目通过数据结构约束剧情节点，让游戏机制具备复用性。

## 复盘

这个项目适合展示前端工程和工具化思维。后续可以加入可视化关系图、校验器和更多示例剧本。
