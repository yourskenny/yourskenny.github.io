---
title: "卡牌游戏强化学习与搜索优化实验"
summary: "围绕一回合击杀和德州扑克场景，尝试 DQN、模仿学习、遗传算法、Beam Search、Self-play 和 NFSP 等方法。"
date: 2026-03-04
tags: ["Reinforcement Learning", "DQN", "Self-play", "NFSP", "Genetic Algorithm"]
role: "强化学习环境与训练策略探索"
category: "研究原型"
sourcePath: "D:/coding/Reinforcement Learning"
highlight: false
links: []
---

## 项目简介

该目录包含两个强化学习方向的原型：一回合击杀卡牌优化，以及德州扑克训练环境。项目探索了从专家规则、搜索优化到深度强化学习的不同训练策略。

## 技术栈

- Python
- DQN / 模仿学习
- Beam Search / 遗传算法
- Self-play / NFSP
- 课程学习与优先经验回放

## 我的工作

我实现或整理了卡牌环境、专家策略、DQN 训练、协同进化、模仿学习和德州扑克智能体训练脚本。

## 方法与实现

一回合击杀方向侧重组合搜索和策略优化，德州扑克方向侧重多智能体自博弈和策略逼近。项目中保留了训练、评估、可视化和 Web 交互脚本。

## 难点与解决

卡牌环境动作空间大、奖励稀疏，训练容易受性能瓶颈影响。项目文档中记录了引入专家引导、多进程 DQN、Beam Search 与遗传算法的优化思路。

## 复盘

这是一个适合后续整理成“强化学习实验笔记”系列的研究原型。建议补充训练曲线和策略对比表。
