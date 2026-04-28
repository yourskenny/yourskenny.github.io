---
title: "烧结矿 FeO 含量智能预测系统"
summary: "面向钢铁冶金场景的工业多模态预测系统，融合机尾断面图像、红外温度场和工艺参数，用于 FeO 含量预测与质量评估。"
date: 2026-04-21
tags: ["Industrial AI", "Swin Transformer", "YOLO", "Multimodal Fusion", "PyTorch"]
role: "算法工程与系统封装"
category: "实习项目"
sourcePath: "C:/coding/FEO; D:/coding/Winter_break_internship/FEO_Project"
highlight: true
links: []
---

## 项目简介

该项目来自实习与后续整理阶段，是一个面向烧结生产过程控制的工业 AI 系统。项目主线包含两个能力：基于 YOLO 的烧结机尾断面识别，以及基于 Swin Transformer 的 FeO 含量回归预测。

## 技术栈

- Python / PyTorch / TorchVision / TIMM
- YOLO 目标检测
- Swin Transformer 回归预测
- Flask + Chart.js Web 演示系统
- 多模态数据融合、不确定性量化、边缘部署优化

## 我的工作

我负责整理和封装核心算法库、构建 Web 演示版、梳理训练/推理流程，并将项目重构为更适合交付和展示的目录结构。

## 方法与实现

系统将可见光纹理、红外温度信息和工艺参数作为异构输入，通过深度模型提取局部与全局特征，再输出 FeO 含量预测结果。Web 演示版支持图像上传、批量预测、质量评级、历史记录和趋势可视化。

## 难点与解决

工业数据存在噪声、工况漂移和模态不一致问题。项目通过多模态融合、置信区间估计和在线漂移补偿思路提升模型在真实场景中的稳定性。

## 复盘

这是当前最适合作为作品集核心项目的经历。后续可以继续补充真实指标、架构图、模型对比实验和线上演示截图，让它成为求职和复试时的主项目。
