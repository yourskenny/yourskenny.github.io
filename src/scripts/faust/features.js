export const FILE_LIMITS = { count: 4, bytes: 10 * 1024 * 1024, total: 20 * 1024 * 1024 };
export const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif", "pdf", "txt", "md", "csv", "json", "docx"]);

export function checkFiles(current, incoming, limits = FILE_LIMITS) {
  const combined = [...current, ...incoming];
  if (combined.length > limits.count) throw new Error("每条消息最多附加 " + limits.count + " 个文件。");
  if (combined.some(f => !EXTENSIONS.has(f.name.split(".").at(-1).toLowerCase()))) throw new Error("请选择常见图片、PDF、文本或 DOCX 文件。");
  if (combined.some(f => f.size > limits.bytes || f.size <= 0)) throw new Error("单个文件需大于 0 字节，且不超过 " + formatBytes(limits.bytes) + "。");
  if (combined.reduce((sum, f) => sum + f.size, 0) > limits.total) throw new Error("附件总大小不能超过 " + formatBytes(limits.total) + "。");
  return combined;
}
export function formatBytes(bytes) {
  return bytes >= 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(1) + " MB" : Math.max(1, Math.round(bytes / 1024)) + " KB";
}
export function webCapabilities(data) {
  const valid = data?.schema_version === "faust.web.v1";
  return { models: valid && data.models?.available === true && data.models?.per_message === true,
    attachments: valid && data.attachments?.available === true && data.attachments?.message_references === true,
    limits: {
      count: Math.min(FILE_LIMITS.count, positiveInt(data?.attachments?.max_count, FILE_LIMITS.count)),
      bytes: Math.min(FILE_LIMITS.bytes, positiveInt(data?.attachments?.max_bytes, FILE_LIMITS.bytes)),
      total: Math.min(FILE_LIMITS.total, positiveInt(data?.attachments?.max_total_bytes, FILE_LIMITS.total)),
    } };
}
function positiveInt(value, fallback) { return Number.isSafeInteger(value) && value > 0 ? value : fallback; }

// No arbitrary remote URL or untrusted signed query is used for private attachments.
export function attachmentPath(attachment) {
  const id = attachment?.attachment_id;
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) return null;
  return "/v1/attachments/" + id + "/content";
}
export function parseCommand(text) {
  if (!text.startsWith("/")) return null;
  const [name, ...args] = text.split(/\s+/);
  return { name: name.toLowerCase(), args: args.join(" ") };
}

export function createFeatures({ api, context, feedback, changed, refresh }) {
  const el = id => document.getElementById(id);
  let capabilities = webCapabilities(null), models = [], selected = "", latestModel = "", checking = false;
  let files = [], revision = 0, pendingResources = new Set();
  const urls = new Set();
  const controller = () => context().authenticated;
  function modelLabel() {
    const chosen = models.find(m => m.id === selected);
    return chosen?.label || chosen?.id || (latestModel ? latestModel.split("/").at(-1) : "服务默认模型");
  }
  function render() {
    const select = el("model-select");
    select.replaceChildren(new Option("服务默认模型", ""));
    for (const model of models) select.append(new Option(model.label || model.id, model.id));
    select.value = selected; select.disabled = !capabilities.models || !controller() || context().sending || Boolean(context().pending);
    el("composer-model").textContent = modelLabel();
    el("composer-model").title = selected || latestModel || "服务端默认模型";
    el("model-note").textContent = !controller() ? "连接服务后，可以检查当前模型和切换能力。" : checking ? "正在检查模型列表……" :
      capabilities.models ? "仅影响下一条消息；历史与角色保持不变。上一次实际模型：" + (latestModel || "暂无记录") :
      "最近一次回复模型：" + (latestModel || "暂无记录") + "。服务尚未提供模型切换接口。";
    el("files-feature-status").textContent = capabilities.attachments && controller() ? "已接入上传与消息附件" : "可本地预览，上传接口尚未接入";
    el("attach-button").disabled = context().sending || Boolean(context().pending);
    el("attachment-input").disabled = context().sending || Boolean(context().pending);
    const tray = el("attachment-tray"); tray.replaceChildren(); tray.hidden = !files.length;
    for (const entry of files) {
      const card = document.createElement("div"); card.className = "faust-pending-file";
      if (entry.preview) { const img = document.createElement("img"); img.src = entry.preview; img.alt = entry.file.name; card.append(img); }
      const text = document.createElement("span"); text.textContent = entry.file.name;
      const size = document.createElement("small"); size.textContent = formatBytes(entry.file.size) + " · " + (entry.uploaded ? "已上传，尚未发送" : "未发送");
      const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "×";
      remove.setAttribute("aria-label", "移除 " + entry.file.name); remove.disabled = context().sending || Boolean(context().pending);
      remove.addEventListener("click", () => { if (entry.preview) { URL.revokeObjectURL(entry.preview); urls.delete(entry.preview); } files = files.filter(f => f !== entry); revision++; render(); changed(); });
      const info = document.createElement("div"); info.append(text, size); card.append(info, remove); tray.append(card);
    }
    const note = el("attachment-notice"); note.hidden = !files.length;
    note.textContent = capabilities.attachments ? "附件将在发送时上传；上传不等于角色已收到。" :
      "仅在本地预览，尚未发送。服务缺少附件接口，请移除附件后发送文字。";
  }
  function stage(list) {
    if (context().sending || context().pending) return feedback("先确认上一条消息的发送结果，再修改附件。");
    try {
      checkFiles(files.map(e => e.file), [...list], capabilities.limits);
      for (const file of list) {
        const preview = IMAGE_TYPES.has(file.type) ? URL.createObjectURL(file) : "";
        if (preview) urls.add(preview);
        files.push({ file, preview, key: crypto.randomUUID() });
      }
      revision++; render(); changed(); feedback();
    } catch (error) { feedback(error.message); }
  }
  async function load() {
    const generation = context().epoch; checking = true; render();
    try {
      const data = await api("/v1/capabilities");
      if (generation !== context().epoch) return;
      capabilities = webCapabilities(data);
      if (capabilities.models) {
        const response = await api("/v1/models");
        if (generation !== context().epoch) return;
        models = (response.items || []).filter(m => typeof m.id === "string" && m.id && m.available === true);
        if (!models.some(m => m.id === selected)) selected = "";
      }
    } catch (error) {
      if (generation !== context().epoch) return;
      capabilities = webCapabilities(null); models = []; selected = "";
      if (![404, 405, 501].includes(error.status)) feedback("暂时无法确认扩展能力；可继续文字对话。");
    } finally { if (generation === context().epoch) { checking = false; render(); changed(); } }
  }
  async function payload() {
    if (files.length && !capabilities.attachments) throw new Error("附件尚未接入，不能作为已发送内容。");
    const generation = context().epoch;
    for (const entry of files) {
      if (entry.uploaded) continue;
      const form = new FormData(); form.append("file", entry.file);
      const response = await api("/v1/attachments", { method: "POST", body: form, key: entry.key });
      if (generation !== context().epoch) throw new Error("会话已变化");
      const attachment = response.attachment;
      if (!attachmentPath(attachment) || attachment.status !== "ready") throw new Error("文件未处理就绪，请稍后重试。");
      entry.uploaded = attachment; render();
    }
    return { ...(selected && capabilities.models ? { model_id: selected } : {}),
      ...(files.length ? { attachment_ids: files.map(f => f.uploaded.attachment_id) } : {}) };
  }
  function releaseFiles() { for (const f of files) if (f.preview) { URL.revokeObjectURL(f.preview); urls.delete(f.preview); } files = []; revision++; }
  function reset() {
    releaseFiles(); for (const url of urls) URL.revokeObjectURL(url); urls.clear();
    for (const c of pendingResources) c.abort(); pendingResources.clear();
    capabilities = webCapabilities(null); models = []; selected = ""; latestModel = ""; checking = false; render();
  }
  function consume() { releaseFiles(); render(); }
  function observe(raw) {
    let meta = raw.meta;
    if (!meta && raw.meta_json) { try { meta = JSON.parse(raw.meta_json); } catch {} }
    if (raw.role === "assistant" && typeof meta?.model === "string") latestModel = meta.model;
  }
  function receive(raw, container) {
    let meta = raw.meta;
    if (!meta && raw.meta_json) { try { meta = JSON.parse(raw.meta_json); } catch {} }
    const attachments = raw.attachments || meta?.attachments;
    if (!Array.isArray(attachments)) return;
    for (const item of attachments.slice(0, 10)) {
      const path = attachmentPath(item); if (!path) continue;
      const card = document.createElement("div"); card.className = "faust-received-file";
      const name = document.createElement("span"); name.textContent = typeof item.name === "string" ? item.name : "附件";
      const button = document.createElement("button"); button.type = "button"; button.className = "faust-text-button";
      button.textContent = IMAGE_TYPES.has(item.media_type) ? "查看图片" : "下载文件";
      button.addEventListener("click", async () => {
        if (!controller() || button.disabled) return;
        button.disabled = true;
        const generation = context().epoch; const abort = new AbortController(); pendingResources.add(abort);
        try {
          const response = await fetch(context().apiBase + path, { credentials: "include", cache: "no-store",
            redirect: "error", signal: AbortSignal.any([abort.signal, AbortSignal.timeout(30_000)]) });
          if (!response.ok || !response.body) throw new Error("附件读取失败，请重新连接后重试。");
          const chunks = []; let bytes = 0; const reader = response.body.getReader();
          try {
            while (true) { const { value, done } = await reader.read(); if (done) break; bytes += value.length;
              if (bytes > FILE_LIMITS.bytes) { await reader.cancel(); throw new Error("附件超过本页下载限制。"); } chunks.push(value); }
          } finally { reader.releaseLock(); }
          if (generation !== context().epoch) return;
          const type = response.headers.get("content-type")?.split(";")[0] || "application/octet-stream";
          const image = IMAGE_TYPES.has(item.media_type) && type === item.media_type;
          const url = URL.createObjectURL(new Blob(chunks, { type: image ? type : "application/octet-stream" })); urls.add(url);
          if (image) { const img = document.createElement("img"); img.src = url; img.alt = name.textContent; card.prepend(img); }
          else { const link = document.createElement("a"); link.href = url; link.download = name.textContent.replace(/[\\/:*?"<>|]/g, "_"); link.click(); URL.revokeObjectURL(url); urls.delete(url); }
        } catch (error) { if (generation === context().epoch) feedback(error.message); }
        finally { pendingResources.delete(abort); if (generation === context().epoch) button.disabled = false; }
      });
      card.append(name, button); container.append(card);
    }
  }
  async function command(text) {
    const cmd = parseCommand(text); if (!cmd) return false;
    const dialog = el("commands-dialog");
    if (cmd.name === "/help") { if (!dialog.open) dialog.showModal(); }
    else if (cmd.name === "/status") feedback(context().status + "；" + context().taskSummary + "；模型：" + (latestModel || "尚无记录"), "command");
    else if (cmd.name === "/refresh") { if (!controller()) feedback("请先连接服务。"); else await refresh(); }
    else if (cmd.name === "/model") {
      if (cmd.args) {
        if (!capabilities.models) feedback("当前服务尚未提供模型切换接口。");
        else if (!models.some(m => m.id === cmd.args)) feedback("该模型不在服务提供的可用列表中。");
        else { selected = cmd.args; render(); feedback("下一条消息已选择模型：" + selected, "command"); }
      } else { el("settings-dialog").showModal(); }
    } else if (cmd.name === "/files") el("attachment-input").click();
    else if (["/stop", "/cancel", "/pause", "/resume", "/new"].includes(cmd.name)) feedback("此服务的任务控制或新会话能力尚未完成接入。命令没有发给角色。");
    else feedback("未知命令。输入 /help 查看支持的命令；斜杠命令不会发给角色。");
    return true;
  }
  el("settings-button").addEventListener("click", () => { render(); el("settings-dialog").showModal(); });
  el("settings-close").addEventListener("click", () => el("settings-dialog").close());
  el("commands-button").addEventListener("click", () => el("commands-dialog").showModal());
  el("commands-close").addEventListener("click", () => el("commands-dialog").close());
  el("commands-dialog").querySelectorAll("[data-command]").forEach(button => button.addEventListener("click", () => {
    el("commands-dialog").close(); void command(button.dataset.command);
  }));
  el("model-select").addEventListener("change", event => { selected = event.target.value; changed(); render(); });
  el("attach-button").addEventListener("click", () => el("attachment-input").click());
  el("attachment-input").addEventListener("change", event => { stage([...event.target.files]); event.target.value = ""; });
  el("message-input").addEventListener("paste", event => {
    if (event.clipboardData?.files.length) { event.preventDefault(); stage([...event.clipboardData.files]); }
  });
  el("message-form").addEventListener("dragover", event => { if (event.dataTransfer.types.includes("Files")) event.preventDefault(); });
  el("message-form").addEventListener("drop", event => { if (event.dataTransfer.files.length) { event.preventDefault(); stage([...event.dataTransfer.files]); } });
  render();
  return { load, payload, consume, reset, observe, receive, render, command,
    hasFiles: () => files.length > 0, canSend: () => !files.length || capabilities.attachments,
    fingerprint: () => JSON.stringify([selected, revision]) };
}
