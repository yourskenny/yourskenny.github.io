# 浮士德网页远程接入与运行

> 历史阶段记录：当前网站入口已切换为[原生 DSH Web](./faust-native.md)。下文自制聊天页、4320消息API和刷新需重登的行为描述属于前一版本；数据库及源码保留。

网页： https://yourskenny.top/faust/ 。网站仍由 GitHub Pages 发布，根域及现有 DNS 保持原用途。

源站在这台 Windows 电脑运行。网站方的 Node 网关仅监听 `127.0.0.1:4322`，Tailscale Funnel 提供 `https://desktop-9v90afb.tail40a158.ts.net` 的有效 HTTPS，再将允许的网页 API 代理至 DSH `127.0.0.1:4320`。这条源站地址独立于个人域名，不代表已配置 `faust-api.yourskenny.top`。

## 登录

点击网页“登录后开始对话”，输入单所有者口令。初始口令仅在本机受权限限制的 `D:\DSH\faust-service\data\owner-bootstrap.txt`；不要提交至网站仓库或放入网址。服务保存 scrypt 哈希并限制错误尝试，登录返回可撤销的短期 Bearer 会话。

网页将访问 token 和 CSRF 仅保存在当前页面内存。刷新或关闭后需重新登录；退出会撤销后端会话、关闭事件流并清除私有界面。跨站请求不使用 Cookie，也不把模型供应商密钥交给浏览器。

已安装 Tailscale 的设备可能把源站名解析为自己的 tailnet 地址。Chromium 此时可能询问“本地网络访问”，允许网站访问后重试。未加入 tailnet 的设备通过公开 Funnel 接入，无需安装 Tailscale。电脑断电或进程停止时，网页仍可打开，但 Agent 离线。

## 实际能力

- 文字聊天与已有历史、分句依次呈现、任务状态及动作记录。
- 模型选择只作用于下一条消息；发送后恢复服务默认。当前实际列表来自 DSH：DeepSeek V4.1 Flash、DeepSeek V4 Pro、Qwen3-VL 8B。图片需选择列表中标有“可看图”的模型；文本模型收到图片会明确拒绝。
- 图片及文件可选择、粘贴、拖拽；发送时上传，随后让模型读取。消息附件可以再次查看或下载。网页接受 PNG/JPEG/WebP/GIF/PDF/TXT/MD/CSV/JSON/DOCX，最多4件、单件10MiB、合计20MiB，最终以更严格的服务上限为准。扫描 PDF 尚无 OCR，会明确拒绝。
- `/help`、`/status`、`/refresh`、`/model [id]`、`/files`、`/new [标题]`、`/pause [task_id]`、`/resume [task_id]`、`/stop [task_id]`、`/cancel [task_id]`。任务卡也提供按钮。多个可操作任务同时存在时要求指定 ID，不猜测。
- 新建/切换在服务端真实创建、绑定会话；旧对话保留，可从设置中切回。暂停丢弃正在生成的结果，恢复时重新生成；取消阻止该任务写入成功回复，不能撤回供应商已进行的计算。
- 语音、B站工具、长期记忆召回不在这次交互补全范围内。

## 运行与恢复

先启动 DSH 服务（其脚本、数据、模型与 QQ 配置由 DSH 管理），再启动网站网关：

```powershell
cd C:\coding\ai-portfolio
npm run build
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\start-faust-gateway.ps1
tailscale funnel --bg --yes 4322
```

网关后台运行且不弹终端窗口；PID 与日志位于忽略的 `.tmp-dev-server/faust-gateway.*`。若4322已有进程，启动脚本拒绝覆盖，需先核对进程命令行是否为本网关。重启网关前检查其PID和入口脚本，不要批量结束Node或Python进程。Funnel后台映射在Tailscale服务内持久保存；电脑重启后仍需确认DSH与网关进程已启动。

撤掉新增公开入口：`tailscale funnel --https=443 off`。这不会改变个人网站、DNS或删除后端对话。暂停远程网页连接可把 `public/faust/config.json` 的 `enabled` 设为 false 后重新发布。

## 边界与协作证据

网关只代理具体白名单路径，拒绝 `/v1/dev/session`、OneBot 回调、兼容 `/api/*`、OpenAPI、密钥及点文件；未登录私有快照返回401。网关重建转发协议头，不信任外来 `X-Forwarded-*`，透传 CORS 预检及会话鉴权头，SSE 不缓冲。

DSH的返回物：`D:\DSH\faust-service\docs\WEB-EXTENSIONS-RETURN.md`、`handoff-web-status.json`。网站方通过本机 DeepSeek Harness UI 直接下达、读取、审查并迭代，不需要用户转交中间文档。

独立浏览器验证使用真实 HTTPS 后端：TXT 中 `BRONZE-WINDCHIME-7319` 正确读出；视觉模型正确识别蓝色正方形与绿色圆形；DeepSeek V4 Pro 正确读出 PDF 的 `27183`；PDF 下载保留正确文件名；新会话为空、切回恢复旧记录；暂停/继续/取消得到实际任务状态，取消后未产生新回复；未发送草稿阻止意外切换；斜杠命令不会作为台词发给角色；退出清空私有界面且原会话请求返回401。

2026-10-25 正式发布完成：网站源码 `cafcce8`、静态发布 `f3311ce`，GitHub Pages 两条发布流程均成功，个人域名及 GitHub 域名的 `/faust/` 均可访问（后者跳转个人域名）。发布前曾临时替换静态页面联调，后端API始终未模拟；正式验收已去除全部替换，直接加载公开站点，登录、创建对话并调用真实 DeepSeek V4 Pro 返回 `WEB-LIVE-2846`。单轮模型选择发送后恢复默认 Flash；刷新需重新登录；390px 手机视口没有页面横向溢出，页面无 JavaScript 异常。

网站完整 `npm test` 与44页构建通过，浮士德协议/网关11项测试通过。网站方独立执行DSH最终测试得到 `31 passed`，后端测试提交 `d581085`、最终回执提交 `2039e3e`；新增覆盖同版本命令竞争、完成与取消/暂停互斥、取消后不可重启、迟到失败和旧 generation 不得覆盖新状态、恢复后仅新 generation 写回一次。DSH 内部仍有 FastAPI 生命周期旧接口的弃用警告，不影响本轮通过结果。

通过公开 DNS 查询得到的 Funnel 公网地址及 HTTPS 域名验证过健康200、未登录快照401；本机 tailnet 地址访问也通过。手机真机触摸与各运营商网络未替用户操作，不能据此宣称全平台已验收。
