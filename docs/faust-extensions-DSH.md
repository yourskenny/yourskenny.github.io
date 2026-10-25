# 网站扩展接口交接（2026-10-25）

当前DSH服务0.1.0只有文字消息与任务命令，没有模型管理、附件上传接口。网站已完成模型选择、命令菜单、附件选择/粘贴/拖拽、本地图片预览，以及按需下载服务端消息附件的组件。此文档是待双方采用的新增约定，不是DSH已实现声明。此轮不修改DSH后端、不代发消息给DSH。

## 1. 必须完成的服务能力

所有接口使用既有会话、CSRF、Origin与幂等保护；文件和模型权限仅限所有者。模型密钥不返回网页、不写静态配置、不由网页直连模型供应商。

GET /v1/capabilities：

    {
      "schema_version": "faust.web.v1",
      "models": {"available": true, "per_message": true},
      "attachments": {
        "available": true, "message_references": true,
        "max_count": 4, "max_bytes": 10485760, "max_total_bytes": 20971520
      }
    }

没有此接口或未明确给出标志时，相应功能禁用。models.per_message意味着后端真实读取model_id并实际使用，不能悄悄忽略；attachments.message_references意味着上传后的attachment_ids会被处理并传给本轮模型/工具，不能只保存文件而不读取。

## 2. 模型选择

GET /v1/models：

    {"items":[
      {"id":"配置中的模型ID","label":"显示名","available":true,"input_modalities":["text","image"]}
    ]}

仅返回用户已配置、已允许使用的模型，不暴露供应商凭据。网页没有内置假模型列表，只列出available=true的服务结果。选择仅作用于下一条消息，随POST /v1/messages发送model_id；未选则省略。后端拒绝未知/无权限/不可用模型，不能静默替换。审计回复meta.model记录实际执行模型。历史不因切换被删除，角色资料仍用同一人格机制。

缺省模型配置变更、供应商设置及全局模型管理由DSH负责；首版网站提供单轮选择，不在浏览器写.env。

## 3. 上传、发消息和接收

POST /v1/attachments：multipart/form-data，字段file，附X-CSRF-Token及Idempotency-Key。先检查权限、文件大小、实际类型和解析限制，再持久保存，文件名不是磁盘路径。

    {"attachment":{
      "attachment_id":"att_123","name":"note.pdf","media_type":"application/pdf",
      "bytes":1024,"status":"ready"
    }}

网页只引用ready文件；此初版协议要求请求完成时已ready或返回明确错误，不处理无限pending。上传幂等键重试返回同一文件ID。单文件10MB、合计20MB、最多4件；服务可声明更严格上限，网站从严限制。支持PNG/JPEG/WebP/GIF/PDF/TXT/MD/CSV/JSON/DOCX，后端检查文件内容而非只凭扩展名。禁止把上传文件当权限指令执行。

POST /v1/messages增加：

    {"text":"解释附件","client_message_id":"...","mode":"chat",
     "model_id":"可选的模型ID","attachment_ids":["att_123"]}

允许仅附件消息（text为空且attachment_ids非空）。服务验证所有文件归属、ready状态、实际输入模型能力及本轮引用。图片交给支持图像的模型；文档由宿主提取/工具读取；未支持解析时明确422/415，不能角色假装已读。服务拒绝不认识的字段，而非忽略。入库消息返回顶层attachments，包含attachment_id/name/media_type/bytes；快照、历史和新消息具有一致结构。模型失败和附件拒绝不写成功回复。

GET /v1/attachments/{attachment_id}/content：每次验证会话与归属，no-store、nosniff；网页用credentials读取，拒绝跨源重定向。常见图片点击查看并用blob展示，其他文件下载；不执行HTML/SVG。网站不使用服务返回的任意URL、签名查询token或外部图片跟踪地址。返回正确Content-Type和Content-Disposition。

首次选择文件仅在浏览器内存，显示“未发送”，无网络上传；点击发送时才上传。上传成功而消息未发送的文件需后端有孤立附件清理与配额，建议24小时过期。用户删除本地待发附件不会伪称服务端文件已删。模型或消息结果未知时网页冻结该次正文/模型/附件和幂等键，禁止改内容复用旧键。

## 4. 命令

现有网页可直接使用/help、/status、/refresh、/model、/files；菜单支持鼠标、键盘与Esc关闭。这些命令不作为角色台词入库；/model <id>只接受服务列表。

/stop、/cancel、/pause、/resume、/new当前明确返回“尚未接入”，不交给模型猜测执行。DSH需先落实任务状态机、expected_version、停止动作边界、暂停/恢复检查点，终态不能被正在生成的worker覆盖；再由网站方按实际接口加上任务控制。新会话须后端真正创建/选择会话，不能只清空DOM。

## 5. 公网放行与返回物

DSH此前登录流程、幂等冲突、绑定二次确认、快照一致性、会话撤销SSE及CORS X-CSRF-Token仍需修复。域名/证书/网页发布归网站方；本包没有开放本机公网端口或更改DNS。

DSH返还更新的OpenAPI、实际模型列表结构、capabilities结果、上传/拒绝样例、任务命令一致性测试、附件权限与恢复测试，以及版本/启动说明。至少验证图片一张、文本/PDF各一份、仅附件消息、切换模型真实生效、无图像能力时拒绝、越权下载拒绝、重复上传/消息重试不重复处理和失效会话读取拒绝。
