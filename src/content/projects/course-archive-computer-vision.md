---
title: "计算机视觉课程实验归档"
summary: "覆盖 ResNet 图像分类、U-Net 医学图像分割、DeepPose/HRNet 姿态估计、C3D 动作识别，以及 YOLO26n 轻量目标检测结课实验。"
date: 2026-05-13
tags: ["Computer Vision", "ResNet", "UNet", "HRNet", "C3D", "YOLO"]
role: "课程实验与结课报告归档"
category: "课程归档"
sourcePath: "C:/coding/计算机视觉"
highlight: false
links: []
---

## 归档范围

这份课程归档覆盖 `C:/coding/计算机视觉` 下的四个实验和一个结课报告实验。内容没有作为独立项目新增到作品集，而是作为计算机视觉课程训练链路记录在课程板块中。

## 实验主线

### 实验 1：CIFAR-10 图像分类

基于 PyTorch 训练 ResNet18，完成 CIFAR-10 数据读取、随机裁剪、水平翻转、归一化、GPU 训练、checkpoint 保存和预测可视化。最终测试集准确率为 89.590%，训练过程验证了图像分类任务中数据增强、残差网络和模型评估的基础流程。

### 实验 2：医学图像分割

围绕 ISBI 2012 风格的 TIFF 医学图像数据，先用 Otsu 阈值法建立传统分割对照，再实现 U-Net、Dice loss、训练与预测可视化。该实验重点展示像素级预测、skip connection 和前景重叠度评估在分割任务中的作用。

### 实验 3：人体姿态估计

实验分为 DeepPose 坐标回归、HRNet heatmap 前向传播、关键点解码与骨架可视化三层。DeepPose 用 ResNet50 backbone 直接回归 17 个关键点坐标，HRNet 输出关键点热力图，再通过 `get_max_preds` 和 `get_avg_preds` 解码为空间坐标。

### 实验 4：UCF101 动作识别

复现 C3D 的三维卷积结构，验证视频张量 `[batch, channel, frame, height, width]` 的前向传播，并在 UCF101 上完成 GPU 冒烟训练、128 样本小规模训练闭环、checkpoint 保存、验证集评估和 loss 曲线绘制。该实验把单帧视觉扩展到视频时空特征建模。

### 结课报告实验：轻量目标检测

结课报告选择 YOLO26n 作为小于 10 MB 约束下的目标检测模型，围绕模型大小、参数量、mAP50、训练分辨率、小目标漏检和 class 2 crop 增强进行多轮实验。最终形成了从模型选择、约束解释、训练诊断到失败样本分析的完整检测实验记录。

## 展示价值

这组材料展示的是计算机视觉基础能力的横向覆盖：分类、分割、关键点、视频理解和目标检测。更重要的是，它把课程实验从“跑通代码”推进到“能解释模型选择、数据瓶颈和评估限制”的工程复盘层次。
