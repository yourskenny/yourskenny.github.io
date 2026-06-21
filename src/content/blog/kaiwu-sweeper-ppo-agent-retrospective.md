---
title: "开物扫雷 PPO 智能体项目复盘"
description: "腾讯开悟清扫大作战项目已经完成并跑通全流程：PPO 智能体、GRUSentry、BFS 路径规划、guardrail、A/B 双线、地图恢复和隐藏图评估都留下了工程证据。"
date: 2026-06-22
category: "项目复盘"
---

## 先补充完整背景

开物扫雷需要按一个完整跑通的强化学习竞赛项目记录。这个项目已经把主要流程做完并跑通：从官方 PPO 基线出发，完成特征工程、模型结构迭代、规则防护、地图恢复、训练分支、checkpoint、验证脚本和评估记录。

它仍然不是我个人主导或获奖经历，所以不适合放到首页核心代表项目里；但作为一个完整跑通的强化学习竞赛项目，它值得比上一版博客更认真地记录。

## 项目目标

赛题是腾讯开悟 2026 的清扫大作战：控制扫地机器人在 `128 x 128` 网格地图里尽可能多地清扫污渍，同时管理电量、利用充电桩、躲避官方机器人。

难点不只是“往污渍多的地方走”。智能体需要同时处理：

- 8 个离散移动方向。
- 电量耗尽风险和自动充电机制。
- 官方机器人活动区域和碰撞终止条件。
- 公开地图与隐藏地图之间的泛化。
- 训练吞吐、推理开销和策略稳定性的平衡。

## 架构演进

项目经历了几次明确的技术转向。

第一版是轻量 MLP 基线：`91D flat -> 128 -> 64 -> actor/critic`。它吞吐很高，但回充和躲 NPC 都偏反应式，缺少路径规划和时序记忆。

第二版尝试重型空间架构：`21x21 CNN + 16x16x3 Memory CNN + Scalar MLP -> FiLM -> Gated Fusion`。这条路保留了完整空间编码和全局记忆，但计算量和 CPU 前向开销太高，在竞赛训练约束下不可行，因此被明确放弃。

最终主线是 GRUSentry：

```text
Flat 181D obs
  -> state_encoder(101D -> 96D, SiLU)
  -> GRUCell(96 -> 32)
  -> Action-Conditioned Head -> 8 logits
  -> Critic Head -> value
```

这个版本的判断是：模型保留轻量时序记忆，局部动作交给 GRU policy；全局路径、回充、安全约束交给规则层。这个分工比单纯堆大模型更适合竞赛环境。

## Guardrail 和路径规划

项目的关键不是只训练 PPO，而是给 PPO 加了一套确定性防护层：

- Public-map BFS planner：利用恢复出的公开地图做精确路径规划。
- Charger safe dominance：低电量时优先选择安全充电桩，避免进入 NPC 危险区域。
- First-charge hard route：首次回充时用硬路径保护，避免关键早期崩局。
- Charger-room loop breaker：处理充电桩附近反复进出、清扫停滞的问题。
- Initial NPC escape：开局主动远离官方机器人活动范围。
- Action shield：动作级别屏蔽高风险移动。
- Map-aware sampler：训练阶段按地图难度和阶段调度样本。

这些 guardrail 不是“作弊替代模型”，而是把环境中确定性的安全约束先处理掉，让 PPO 专注在局部清扫和策略选择上。

## A/B 双线和验证

项目保留了 `code_A` 和 `code_B` 两条训练线：

- `code_A` 偏稳定继续训练，loop breaker 开启，使用 map sampler。
- `code_B` 让模型更多自主学习回充时机，loop breaker 关闭。
- 两边都保留 PPO、DIY 模板、配置、checkpoint 和训练入口。

仓库中还有面向 guardrail 的单元式检查脚本：

- `verify_guardrails.py` 检查充电桩选择、视野归一化、直达停靠、开局 NPC escape、blocked edge TTL、首次回充路径、卡住切换和充电桩循环打断。
- `verify_public_map_planner.py` 对公开地图采样检查 BFS 路由、充电桩候选和几何最近点不一致情况。
- `map_recovery/recover_maps.py` 用于从回放页解析公开地图数据，支撑 public-map planner。

README 记录的结果是：GRUSentry A 系列在 48 小时训练后隐藏图评估达到 920 分，后续在 830-870 区间波动。这个结果说明项目不是停在想法或半成品，而是完整跑过训练、评估和策略迭代。

## 复盘结论

开物扫雷最值得记录的是“轻模型 + 规则层 + 工程验证”的路线。它不是靠把网络堆大解决问题，而是把路径规划、回充、安全和隐藏图泛化拆成可检查的工程问题。

公开表达时我仍然会保留边界：这是团队竞赛项目、不是我的个人主导获奖经历。但“非主导”和“未获奖”不等于“没做完”。更准确的表述是：项目完整跑通，策略、训练、checkpoint、验证脚本和复盘材料齐全；它适合作为强化学习竞赛工程经验和 Agent guardrail 设计经验来记录。
