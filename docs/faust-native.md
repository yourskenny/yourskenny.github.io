# 浮士德原生 DSH 网页

2026-10-25 起，网站 `/faust/` 作为原生 DSH 的入口，完整页面跳转到 `https://desktop-9v90afb.tail40a158.ts.net/dsh/`。不再使用自制聊天页面代理消息。个人网站仍由 GitHub Pages 发布，其余内容不变。

## 运行链路

个人网站入口 → 本机 Node 网关（loopback 4322，经 Tailscale Funnel HTTPS）→ 原生 DSH `faust` profile（loopback 54002）。网关剥去 `/dsh` 前缀，完整代理原生资源、HTTP API、SSE 和 WebSocket，不重写原生客户端。

`/dsh-access/` 提供远程登录和退出。使用此前的所有者口令，网关在服务端向4320认证服务校验，获取可撤销会话，并在本机用 `data/native-web-launch.txt` 的进程凭据交换原生 signed cookie。浏览器仅获得随机、HttpOnly、Secure、SameSite=Lax 的外层 cookie；原生 cookie、launch token、Bearer 不进入网页源码或客户端存储。原生 Host/Origin 围栏和 cookie 验证保持有效。

网关每次 HTTP 请求和 WS 升级校验外层会话，长连接每15秒复核，退出即时关闭所属连接。外层会话最多12小时，刷新可保持；网关重启清空会话，需要重新登录。原生 DSH 重启后启动脚本刷新本机凭据文件；已登录页面若连接失效，可退出后重新登录。

## 能力与数据

原生 `faust` profile 提供原来的浮士德人格、记忆、B站插件、活动/日记、定时任务及 DSH 原生工具。界面直接采用 DSH 的模型选择、文件、命令、会话、任务和轨迹组件，不再逐个仿制。

原生 Web 的功能取决于该 profile 实际挂载的插件，不等同于桌面版安装的全部额外插件。例如桌面专用的语音、worktree、团队编排等没有因为换入口就自动加入。B站工具是否可实际执行仍取决于账号登录态、网络和原生插件配置。

`faust-service`（4320）的旧消息与原生 DSH 会话是两套记录；本次保留旧数据库，不伪称自动合并。原生 profile 的人格/记忆配置与桌面配置有区别，但当前 DSH_HOME 的工作区和会话索引有共享，不能宣称所有数据隔离。原生 Web 按所有者完整工作空间处理。QQ/NapCat 当前未运行，本轮没有启动机器人或发送QQ测试消息。

## 启动与恢复

1. 保持4320认证服务运行（现有 `D:\DSH\faust-service\scripts\start-service.ps1`）。它保留旧数据，本次主要用于登录与会话撤销。
2. 运行 `D:\DSH\faust\scripts\native-web-start.ps1`，启动原生54002；已有进程不能重复启动。脚本由DSH维护，带活动检查并核验进程身份。凭据文件仅保存在受限的本机data目录中，不要提交。
3. 网站目录 `C:\coding\ai-portfolio` 构建后运行 `scripts\start-faust-gateway.ps1`，再确认 `tailscale funnel --bg --yes 4322`。

停止/查询原生服务使用DSH的 `native-web-stop.ps1`、`native-web-status.ps1`，停止前确认没有运行中的任务。不要批量结束Node/Python/DeepSeek进程。网关日志及PID仍在网站忽略目录 `.tmp-dev-server`。

DSH实施记录：`D:\DSH\faust\docs\NATIVE-WEB-RETURN.md`、`native-web-status.json`。旧阶段接入记录见 `faust-remote.md`，其中旧网页刷新需重新登录等行为不再描述当前入口。

## 验证

网站网关测试覆盖所有者登录、跨站写请求拒绝、原生凭据不返回浏览器、前缀转换、请求体转发、HTTP/WS代理与退出撤销。完整测试12项通过，网站构建44页成功。

真实HTTPS浏览器已加载原生静态资源、SSE `plugins/events` 与 WebSocket `api/remote.mux`，选择faust工作区及浮士德预设，调用原生记忆状态工具并由真实模型返回 `NATIVE-DSH-8241`，轨迹内可见实际工具调用与结果。通过原生附件控件上传TXT，模型成功读取并返回文件内的校验词；390px手机视口已检查。没有向B站或QQ执行写操作。

最终网关版本已验证刷新保持登录，HTTP资源无失败、无页面异常，SSE返回200、WebSocket收到7帧；退出后显示登录表单，原生API返回401。

DSH原生启动脚本修订见该工程提交 `19973ad`、`f47f109`：未闭合turn无论静默多久都按活动处理，解析或读取失败拒绝启动/停止；状态输出区分idle、active、unknown，不依赖时长认定空闲。
