---
title: "把 Codex Autoresearch 改造成 Windows 可安装 Skill"
description: "一次围绕 Codex Windows 桌面端的工程化移植：把自动改进循环封装成可安装、可验证、可恢复上下文的 skill 分发包。"
date: 2026-04-29
category: "AI 工程实践"
---

## 项目背景

这个项目是我对 Codex Autoresearch 的 Windows 客户端适配与封装。原始思路是让 Codex 能围绕一个可度量目标持续迭代：扫描仓库、定义指标、做一次聚焦修改、机械验证、保留收益或丢弃回退，并把每轮结果记录下来。

项目仓库：

[codex-autoresearch-windows-skill](https://github.com/yourskenny/codex-autoresearch-windows-skill)

它的目标不是再写一个普通脚本，而是把这套自动研究/自动改进流程变成 Windows 上可复制安装、可被 Codex 发现、可在不同项目中复用的 skill。

## 它解决了什么问题

很多自动化 Agent 项目在 Linux/macOS 环境里跑得比较自然，但迁移到 Windows 桌面端时会遇到一串工程细节：

- PowerShell、`cmd`、PATHEXT 和可执行 shim 的差异。
- 本地 skill 安装目录和 Codex 发现机制。
- 前台会话与后台长运行任务之间的上下文恢复。
- 运行结果、状态文件、日志和 git 指针应该落在哪里。
- 如何避免工具误把父级目录、兄弟仓库或历史 artifacts 当作当前项目上下文。

这个仓库的核心价值，就是把这些“看起来琐碎但会决定能不能稳定使用”的问题系统化处理掉。

## 核心能力

仓库把 Autoresearch 封装成 `$codex-autoresearch` 入口。典型流程是：

1. 扫描目标仓库。
2. 推导目标、范围、指标、验证命令和保护命令。
3. 让用户选择前台或后台模式。
4. 执行一次聚焦改动。
5. 运行机械验证。
6. 保留有效改动，丢弃退化改动。
7. 记录迭代结果。
8. 重复，直到达到目标或被停止。

它支持交互式运行、后台运行、状态查询、停止/恢复，以及 `codex exec` 的非交互自动化路径。

## Windows 适配设计

安装脚本位于 `scripts/install_windows_skill.ps1`，会把仓库复制到：

```text
%USERPROFILE%\.codex\skills\codex-autoresearch
```

同时通过 Python 管理用户级 hooks，让未来的前台/后台会话能够恢复当前 run context。安装后重启 Codex，就可以在任意项目中调用 `$codex-autoresearch`。

我在适配时特别关注一个规则：**结果目录必须留在启动上下文里**。如果 Codex 从一个 Git 仓库内启动，默认 workspace root 就是该仓库根目录；如果不是 Git 仓库，则使用当前启动目录。它不应该因为父目录下有其他仓库或旧产物，就悄悄把工作区扩大到更上层。

这条规则看似小，但对自动化 Agent 很关键。工作区边界一旦模糊，就可能出现错误扫描、错误提交、错误恢复，甚至把不相关项目混进一次迭代。

## 工程结构

仓库主要分成几块：

- `SKILL.md`：Codex 加载的 skill 入口，定义模式、规则和运行协议。
- `agents/openai.yaml`：Codex UI 元数据和默认提示。
- `references/`：前台、后台、debug、fix、security、ship、exec 等模式的流程协议。
- `scripts/`：状态管理、hooks、runtime、workspace、commit gate、health check 等辅助脚本。
- `tests/`：Python 单元测试和 smoke invariant 检查。
- `docs/`：安装、使用示例和操作文档。

这让 skill 本身不只是一个提示词文件，而是一个带运行时、状态协议、验证逻辑和文档的完整分发包。

## 验证方式

完整测试可以用：

```powershell
python -m unittest discover -s tests -q
```

hooks 状态可以用：

```powershell
python .\scripts\autoresearch_hooks_ctl.py status
```

这些测试不是装饰性的。对于这种自动迭代工具来说，状态文件、工作区边界、hooks 恢复、exec artifact 是否保留，都是运行安全的一部分。

## 我学到的东西

这次改造让我更明确地意识到，Agent 工程不是“让模型会做事”这么简单。真正难的是让它在复杂本地环境里稳定、可恢复、可审计。

尤其是长运行任务，必须回答几个问题：

- 它现在在哪个仓库里工作？
- 它的结果写在哪里？
- 它上一次做到哪一步？
- 它保留了什么，丢弃了什么？
- 它能不能在重启后恢复，而不是重新猜测上下文？

这些问题如果没有工程协议托底，自动化能力越强，风险反而越高。

## 后续计划

这个仓库目前已经完成 Windows-friendly 的安装和验证路径。后续我希望继续补充：

- 更完整的 Windows 使用截图和安装录屏。
- 典型项目中的真实运行案例。
- 前台/后台模式的对比说明。
- 对失败恢复、上下文压缩、长运行日志的更多测试。

对我来说，这是一个很典型的 AI 工程项目：核心不是模型，而是把一个 Agent 能力变成真实用户能安装、能验证、能长期使用的工具。
