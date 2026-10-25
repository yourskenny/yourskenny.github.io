import { ApiError, createSseParser, normalizeMessage, readableError, stateLabels, validateConfig } from "./protocol.js";
import { createFeatures, parseCommand } from "./features.js";

const el = id => document.getElementById(id);
const ui = Object.fromEntries(["connection-status", "environment-label", "welcome-panel", "welcome-description",
  "connect-button", "refresh-button", "logout-button", "message-input", "send-button", "feedback", "messages",
  "chat-scroll", "thinking-label", "conversation-hint", "task-summary", "task-list", "action-list", "actions-button",
  "persona-status", "channel-status", "connection-detail"].map(id => [id, el(id)]));
let config = { enabled: false }, csrf = "", accessToken = "", authenticated = false, sending = false;
let epoch = 0, cursor = "0", streamController, streamRetry, syncTimer, refreshing = false, ready = false;
let messages = new Map(), tasks = new Map(), actions = new Map(), currentConversation, pendingSend;
let conversations = [], canControlTasks = false, canManageConversations = false, conversationBusy = false;
const taskCommandsInFlight = new Set();
let animations = Promise.resolve();
let features;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const clientId = crypto.randomUUID();

function status(label, state = "idle") {
  ui["connection-status"].textContent = label;
  ui["connection-status"].dataset.state = state;
}
function feedback(text = "", kind = "general") { ui.feedback.textContent = text; ui.feedback.hidden = !text; ui.feedback.dataset.kind = kind; }
function transport() { return { credentials: accessToken ? "omit" : "include", headers: accessToken ? { Authorization: "Bearer " + accessToken } : {} }; }
function controls() {
  ui["message-input"].disabled = !authenticated || conversationBusy;
  const text = ui["message-input"].value.trim();
  const localCommand = Boolean(parseCommand(text));
  ui["send-button"].disabled = sending || conversationBusy || (!localCommand && (!authenticated || (!text && !features?.hasFiles()) || features?.canSend() === false));
  ui["logout-button"].hidden = !authenticated;
  ui["actions-button"].disabled = !authenticated;
  ui["connect-button"].hidden = authenticated || !config.enabled;
  features?.render();
}
function stopStream() {
  clearTimeout(streamRetry); clearTimeout(syncTimer);
  streamRetry = undefined; syncTimer = undefined;
  streamController?.abort(); streamController = undefined;
}
function clearPrivateState() {
  epoch++; stopStream(); authenticated = false; ready = false; csrf = ""; accessToken = ""; cursor = "0";
  refreshing = false;
  conversations = []; canControlTasks = false; canManageConversations = false; taskCommandsInFlight.clear();
  currentConversation = undefined; pendingSend = undefined; messages.clear(); tasks.clear(); actions.clear();
  ui.messages.replaceChildren(); animations = Promise.resolve();
  ui["welcome-panel"].hidden = false; ui["thinking-label"].hidden = true;
  ui["conversation-hint"].textContent = "连接后载入已有记录";
  ui["channel-status"].textContent = "待确认"; renderTasks(); renderActions(); controls();
  features?.reset();
}

async function api(path, { method = "GET", body, key, signal } = {}) {
  const auth = transport();
  const headers = { ...auth.headers, Accept: "application/json" };
  const multipart = body instanceof FormData;
  if (body !== undefined && !multipart) headers["Content-Type"] = "application/json";
  if (method !== "GET") {
    headers["X-CSRF-Token"] = csrf;
    headers["Idempotency-Key"] = key || crypto.randomUUID();
  }
  let response;
  try {
    response = await fetch(config.apiBase + path, { method, credentials: auth.credentials, cache: "no-store", headers,
      body: body === undefined ? undefined : multipart ? body : JSON.stringify(body),
      redirect: "error", signal: signal || AbortSignal.timeout(multipart ? 60_000 : 12_000) });
  } catch (error) { throw new ApiError("连接失败", 0, error.name); }
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(data?.error?.message || "服务请求失败", response.status, data?.error?.code);
  if (response.status !== 204 && !data) throw new ApiError("服务没有返回有效数据", 502);
  return data;
}

function time(value) {
  if (!value || Number.isNaN(Date.parse(value))) return "";
  return new Date(value).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}
function node(tag, className, text) {
  const n = document.createElement(tag); if (className) n.className = className;
  if (text !== undefined) n.textContent = text; return n;
}
function scrollBottom(force = false) {
  const pane = ui["chat-scroll"];
  if (force || pane.scrollHeight - pane.clientHeight - pane.scrollTop < 160) pane.scrollTop = pane.scrollHeight;
}
function addMessage(raw, animate) {
  const message = normalizeMessage(raw);
  if (!message.id || !["user", "assistant", "system"].includes(message.role) || messages.has(message.id)) return;
  const item = node("article", "faust-message"); item.dataset.role = message.role; item.dataset.messageId = message.id;
  const label = node("div", "faust-message-label");
  label.append(node("span", "", message.role === "user" ? "你" : message.role === "assistant" ? "浮士德" : "系统"),
    node("time", "", time(message.createdAt)));
  const body = node("div", "faust-message-body"); item.append(label, body); ui.messages.append(item);
  features?.observe(raw); features?.receive(raw, item);
  messages.set(message.id, { ...message, item }); ui["welcome-panel"].hidden = true;
  if (!animate || message.role !== "assistant" || reducedMotion.matches) {
    body.textContent = message.text; scrollBottom(); return;
  }
  const generation = epoch;
  animations = animations.then(async () => {
    for (const part of message.parts) {
      if (generation !== epoch || !item.isConnected) return;
      body.append(document.createTextNode(part)); scrollBottom();
      await new Promise(resolve => setTimeout(resolve, Math.min(1800, Math.max(700, part.length * 35))));
    }
  }).catch(() => { if (generation === epoch) body.textContent = message.text; });
}

function renderTasks() {
  const all = [...tasks.values()].sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
  const active = all.filter(t => !["completed", "failed", "cancelled"].includes(t.state));
  ui["task-summary"].textContent = !authenticated ? "等待连接" : active.length ? active.length + " 个任务进行中" : "没有进行中的任务";
  ui["thinking-label"].hidden = !active.some(t => ["running", "queued", "planned"].includes(t.state));
  ui["task-list"].replaceChildren();
  for (const task of all.slice(0, 3)) {
    const card = node("article", "faust-task-item");
    card.append(node("p", "faust-task-title", task.title || "对话任务"));
    const meta = node("div", "faust-task-meta");
    const state = node("span", "faust-task-state", stateLabels[task.state] || task.state);
    state.dataset.state = task.state; meta.append(state, node("time", "", time(task.updated_at)));
    card.append(meta); ui["task-list"].append(card);
    if (canControlTasks && authenticated) {
      const buttons = node("div", "faust-task-controls");
      for (const [command, title] of [["pause", "暂停"], ["resume", "继续"], ["cancel", "取消"]]) {
        if (!task.available_commands?.includes(command)) continue;
        const button = node("button", "faust-text-button", title); button.type = "button";
        button.disabled = taskCommandsInFlight.has(task.task_id);
        button.addEventListener("click", () => { void taskCommand(command, task.task_id).catch(error => feedback(readableError(error))); });
        buttons.append(button);
      }
      card.append(buttons);
    }
  }
  if (!all.length) ui["task-list"].append(node("p", "faust-empty", "任务开始后，进展会显示在这里。"));
}
function renderActions() {
  ui["action-list"].replaceChildren();
  const all = [...actions.values()].sort((a, b) => (b.started_at || b.at || "").localeCompare(a.started_at || a.at || ""));
  for (const action of all.slice(0, 30)) {
    const item = node("li", "faust-action-item"); item.dataset.state = action.state;
    item.append(node("strong", "", action.name === "persona.generate" ? "组织角色回复" : action.name || "执行步骤"),
      node("span", "", (stateLabels[action.state] || action.state || "已记录") + " · " + time(action.finished_at || action.started_at || action.at)));
    ui["action-list"].append(item);
  }
  if (!all.length) ui["action-list"].append(node("li", "faust-empty", "还没有动作记录。"));
}
async function loadActions() {
  const generation = epoch;
  const recent = [...tasks.values()].sort((a,b) => (b.updated_at || "").localeCompare(a.updated_at || "")).slice(0,3);
  const results = await Promise.allSettled(recent.map(t => api("/v1/tasks/" + encodeURIComponent(t.task_id) + "/actions?limit=20")));
  if (generation !== epoch) return;
  for (const r of results) if (r.status === "fulfilled") for (const a of r.value.items || []) actions.set(a.action_id, a);
  renderActions();
}

async function sync(initial = false) {
  if (!authenticated || refreshing) return;
  const generation = epoch; refreshing = true;
  try {
    const snapshot = await api("/v1/snapshot");
    if (generation !== epoch) return;
    conversations = snapshot.conversations || [];
    currentConversation ||= snapshot.current_conversation_id || conversations[0]?.conversation_id;
    for (const raw of snapshot.messages || []) if (!raw.conversation_id || raw.conversation_id === currentConversation) addMessage(raw, !initial && ready);
    // DSH v0.1 can omit a concurrent write from snapshot. Regular fresh reads complement SSE.
    if (initial) cursor = String(snapshot.after_cursor ?? "0");
    tasks = new Map([...(snapshot.active_tasks || []), ...(snapshot.terminal_tasks || [])].filter(t => !t.conversation_id || t.conversation_id === currentConversation).map(t => [t.task_id, t]));
    const count = messages.size;
    ui["conversation-hint"].textContent = snapshot.history_has_more ? "显示近期记录 · 更早历史仍保存在服务端" : count ? "同一会话 · " + count + " 条记录" : "已连接 · 可以开始对话";
    const linked = (snapshot.bindings || []).some(b => b.state === "active" && b.external_user_id);
    ui["channel-status"].textContent = linked ? "已绑定" : "未绑定";
    renderTasks(); ready = true; status("已连接", "online");
    features?.render();
    if (ui.feedback.dataset.kind === "connection") feedback();
    if (!count) { ui["welcome-panel"].hidden = false; ui["welcome-description"].textContent = "连接已就绪。可以说一句问候，也可以继续刚才的话题。"; }
    if (initial) { scrollBottom(true); await loadActions(); }
  } catch (error) {
    if (generation !== epoch) return;
    if (error.status === 401) { clearPrivateState(); status("需要连接"); ui["welcome-description"].textContent = "会话已过期，请重新连接浮士德。"; }
    else { status("连接中断", "offline"); feedback(readableError(error) + " 已显示的内容是上次同步记录。", "connection"); }
  } finally { if (generation === epoch) refreshing = false; }
}
function scheduleSync() {
  if (syncTimer) return;
  syncTimer = setTimeout(() => { syncTimer = undefined; void sync(); }, 200);
}
function eventReceived(frame) {
  const data = frame.payload;
  const next = frame.id || (data.seq === undefined ? null : String(data.seq));
  if (!next || !/^\d+$/.test(next)) throw new Error("事件缺少有效游标");
  if (BigInt(next) <= BigInt(cursor)) return;
  if (["tool.action", "task.action"].includes(data.type)) {
    const action = data.data || {};
    if (action.action_id && (actions.has(action.action_id) || tasks.has(action.task_id))) actions.set(action.action_id, { ...actions.get(action.action_id), ...action, at: data.at });
    renderActions();
  }
  if (data.type === "task.state") {
    const task = data.data || {};
    if (task.task_id && (tasks.has(task.task_id) || task.conversation_id === currentConversation)) tasks.set(task.task_id, { ...tasks.get(task.task_id), ...task, updated_at: data.at });
    renderTasks();
  }
  // Backend events can be sparse; messages are loaded from the canonical snapshot.
  cursor = next; scheduleSync();
}
async function stream() {
  if (!authenticated || document.hidden) return;
  stopStream(); const generation = epoch; const controller = new AbortController(); streamController = controller;
  try {
    const auth = transport();
    const response = await fetch(config.apiBase + "/v1/events?after=" + encodeURIComponent(cursor),
      { credentials: auth.credentials, cache: "no-store", headers: { ...auth.headers, Accept: "text/event-stream" }, signal: controller.signal });
    if (response.status === 410) { await sync(true); throw new ApiError("重新同步", 410); }
    if (!response.ok) throw new ApiError("事件连接失败", response.status);
    if (!response.headers.get("content-type")?.includes("text/event-stream") || !response.body) throw new ApiError("事件格式错误", 502);
    const reader = response.body.getReader(); const decoder = new TextDecoder(); const parse = createSseParser(eventReceived);
    while (true) { const { done, value } = await reader.read(); if (done) break; if (generation !== epoch) return; parse(decoder.decode(value, { stream: true })); }
    if (generation === epoch) status("正在重连");
  } catch (error) {
    if (controller.signal.aborted || generation !== epoch) return;
    if (error.status === 401) { clearPrivateState(); status("需要连接"); feedback("会话已过期，请重新连接。"); return; }
    status("正在重连", "offline");
  } finally {
    if (!controller.signal.aborted && generation === epoch && authenticated && !document.hidden) streamRetry = setTimeout(stream, 3500);
  }
}

async function session() {
  const current = await api("/v1/session");
  csrf = current.csrf_token || current.session?.csrf_token || "";
  currentConversation = current.session?.conversation_id || current.current_conversation_id;
  if (!csrf) throw new ApiError("缺少会话校验信息", 502);
  authenticated = true; controls(); await sync(true);
  if (authenticated) { void stream(); await features.load(); }
}
async function probe() {
  if (!config.enabled) return;
  status("检查连接中"); feedback();
  try {
    const health = await api("/health/ready");
    ui["persona-status"].textContent = health.persona?.mode === "fake" ? "测试人格" : health.persona?.available ? "已加载" : "未就绪";
    await session();
  } catch (error) {
    if (error.status === 401) { clearPrivateState(); status("服务在线 · 未连接"); ui["welcome-description"].textContent = config.devLogin ? "本机服务已经就绪。连接后，会载入与浮士德的已有对话。" : "登录后，可以继续与浮士德的对话。"; }
    else { status("服务离线", "offline"); feedback(readableError(error)); ui["welcome-description"].textContent = "暂时无法连接服务。已有记录仍保存在服务端，可以稍后重试。"; }
    controls();
  }
}

ui["connect-button"].addEventListener("click", async () => {
  if (config.authMode === "owner_password") { el("login-error").hidden = true; el("login-dialog").showModal(); return; }
  if (!config.devLogin) { window.location.assign(config.apiBase + "/auth/login"); return; }
  ui["connect-button"].disabled = true; feedback();
  try { await api("/v1/dev/session", { method: "POST", body: {} }); await session(); }
  catch (error) { feedback(readableError(error)); status("连接未完成", "error"); }
  finally { ui["connect-button"].disabled = false; }
});
el("login-close").addEventListener("click", () => el("login-dialog").close());
el("login-dialog").addEventListener("close", () => { el("owner-password").value = ""; });
el("login-form").addEventListener("submit", async event => {
  event.preventDefault(); if (el("login-submit").disabled) return;
  el("login-submit").disabled = true; el("login-error").hidden = true;
  try {
    const result = await api("/auth/owner/login", { method: "POST", body: { password: el("owner-password").value } });
    if (typeof result.access_token !== "string" || result.access_token.length < 32) throw new Error("登录服务未返回可用会话。");
    accessToken = result.access_token;
    await session();
    if (!authenticated) throw new Error("连接未完成，请重试。");
    el("login-dialog").close(); feedback();
  } catch (error) {
    clearPrivateState();
    el("login-error").textContent = error.status === 401 ? "口令不正确。" : error.status === 429 ? "尝试次数过多，请稍后重试。" : "登录未完成，请检查服务连接后重试。";
    el("login-error").hidden = false;
  } finally { el("owner-password").value = ""; el("login-submit").disabled = false; }
});
ui["refresh-button"].addEventListener("click", async () => {
  ui["refresh-button"].disabled = true;
  try { if (authenticated) { feedback(); await sync(); await loadActions(); void stream(); } else await probe(); }
  finally { ui["refresh-button"].disabled = false; }
});
ui["logout-button"].addEventListener("click", async () => {
  try { await api("/v1/logout", { method: "POST" }); clearPrivateState(); status("已退出"); ui["message-input"].value = ""; feedback(); }
  catch (error) { clearPrivateState(); status("已在此页面退出"); ui["message-input"].value = ""; feedback("此页面已清除登录状态，服务端撤销未确认。" + readableError(error)); }
});
ui["actions-button"].addEventListener("click", () => { void loadActions(); });
ui["message-input"].addEventListener("input", controls);
ui["message-input"].addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) { event.preventDefault(); if (!ui["send-button"].disabled) el("message-form").requestSubmit(); }
});
el("message-form").addEventListener("submit", async event => {
  event.preventDefault(); const text = ui["message-input"].value.trim();
  if (sending) return;
  if (parseCommand(text)) {
    try { await features.command(text); ui["message-input"].value = ""; }
    catch (error) { feedback(error instanceof ApiError ? readableError(error) : error.message); }
    controls(); return;
  }
  if (!authenticated || (!text && !features.hasFiles()) || !features.canSend()) return;
  const fingerprint = features.fingerprint();
  if (pendingSend && (pendingSend.text !== text || pendingSend.fingerprint !== fingerprint)) { feedback("上一条发送结果尚未确认。请先刷新记录，确认是否收到，再重新连接后发送新内容。"); return; }
  pendingSend ||= { text, key: crypto.randomUUID(), fingerprint };
  const attempt = pendingSend; const generation = epoch; sending = true; feedback(); controls();
  try {
    if (!attempt.body) {
      const extras = await features.payload();
      if (generation !== epoch) return;
      attempt.body = { text, client_message_id: attempt.key,
        ...(currentConversation ? { conversation_id: currentConversation } : {}), mode: "chat", ...extras };
    }
    await api("/v1/messages", { method: "POST", key: attempt.key, body: attempt.body });
    if (generation !== epoch) return;
    pendingSend = undefined; if (ui["message-input"].value.trim() === text) ui["message-input"].value = "";
    features.consume();
    await sync(); scrollBottom(true); ui["message-input"].focus();
  } catch (error) {
    if (generation !== epoch) return;
    if ((error.status >= 400 && error.status < 500) || !(error instanceof ApiError)) pendingSend = undefined;
    feedback((error instanceof ApiError ? readableError(error) : error.message) + " 输入已保留；未自动重发。");
    if (error.status === 401) { clearPrivateState(); status("需要连接"); }
  } finally { sending = false; controls(); }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopStream(); else if (authenticated) { void sync(); void stream(); }
});
window.addEventListener("pagehide", stopStream);
window.addEventListener("pageshow", event => { if (event.persisted) void probe(); });
setInterval(() => { if (authenticated && !document.hidden) void sync(); }, 6000);

async function taskCommand(command, taskId) {
  if (!authenticated || !canControlTasks) return feedback("请先连接支持任务控制的服务。");
  const eligible = [...tasks.values()].filter(t => t.available_commands?.includes(command));
  const target = taskId ? tasks.get(taskId) : eligible.length === 1 ? eligible[0] : null;
  if (!target) return feedback(eligible.length > 1 ? "有多个任务可操作，请在命令后填写任务 ID：" + eligible.map(t => t.task_id).join("、") : "当前没有可以执行此命令的任务。");
  if (taskCommandsInFlight.has(target.task_id)) return;
  const generation = epoch; taskCommandsInFlight.add(target.task_id); renderTasks();
  try {
    const response = await api("/v1/tasks/" + encodeURIComponent(target.task_id));
    if (generation !== epoch) return;
    const fresh = response.task || response;
    if (!fresh.available_commands?.includes(command) || !Number.isSafeInteger(fresh.version)) { await sync(); return feedback("任务状态已变化，请查看最新进展。"); }
    await api("/v1/tasks/" + encodeURIComponent(target.task_id) + "/commands", { method: "POST", body: { command, expected_version: fresh.version } });
    if (generation !== epoch) return;
    await sync(); await loadActions();
    feedback(command === "cancel" ? "任务已取消；模型供应商已收到的计算无法撤回。" : command === "pause" ? "任务已暂停；继续时服务会重新执行这次生成。" : "任务已恢复。", "command");
  } finally { taskCommandsInFlight.delete(target.task_id); if (generation === epoch) renderTasks(); }
}

async function selectConversation(id) {
  if (!authenticated || !canManageConversations) return feedback("服务尚未支持会话切换。");
  if (conversationBusy || sending || pendingSend) return feedback("请先确认当前消息的发送结果。");
  if (features.hasFiles() || (ui["message-input"].value.trim() && !parseCommand(ui["message-input"].value.trim()))) { controls(); return feedback("请先发送或清空当前草稿，再切换对话。"); }
  if (!id || id === currentConversation) return;
  const generation = epoch; conversationBusy = true; controls();
  try {
    await api("/v1/conversations/" + encodeURIComponent(id) + "/select", { method: "POST", body: {} });
    if (generation !== epoch) return;
    epoch++; stopStream(); refreshing = false; ready = false; cursor = "0"; currentConversation = id;
    messages.clear(); tasks.clear(); actions.clear(); animations = Promise.resolve(); ui.messages.replaceChildren();
    features.reset(); ui["welcome-panel"].hidden = false;
    await sync(true); if (authenticated) { await features.load(); void stream(); }
    feedback("已切换对话。", "command");
  } finally { conversationBusy = false; controls(); }
}

async function newConversation(title) {
  if (!authenticated || !canManageConversations) return feedback("服务尚未支持新建对话。");
  if (conversationBusy || sending || pendingSend) return feedback("请先确认当前消息的发送结果。");
  if (features.hasFiles() || (ui["message-input"].value.trim() && !parseCommand(ui["message-input"].value.trim()))) return feedback("请先发送或清空当前草稿，再新建对话。");
  const generation = epoch; let id;
  conversationBusy = true; controls();
  try {
    const created = await api("/v1/conversations", { method: "POST", body: { title: title || "新对话" } });
    if (generation !== epoch) return;
    id = (created.conversation || created).conversation_id;
    if (!id) throw new Error("服务没有返回新会话。");
  } finally { conversationBusy = false; controls(); }
  await selectConversation(id);
}

features = createFeatures({ api, feedback, changed: controls, taskCommand, newConversation, selectConversation,
  capabilitiesChanged: data => {
    canControlTasks = data?.schema_version === "faust.web.v1" && data.tasks?.available === true && data.tasks?.expected_version === true;
    canManageConversations = data?.schema_version === "faust.web.v1" && data.conversations?.available === true && data.conversations?.session_selection === true;
    renderTasks();
  },
  context: () => ({ authenticated, sending: sending || conversationBusy, pending: pendingSend, epoch, apiBase: config.apiBase, transport,
    conversationId: currentConversation, conversations, canControlTasks, canManageConversations,
    status: ui["connection-status"].textContent, taskSummary: ui["task-summary"].textContent }),
  refresh: async () => { await sync(); await loadActions(); await features.load(); }
});

async function init() {
  try {
    let raw;
    if (import.meta.env.DEV && ["localhost", "127.0.0.1"].includes(location.hostname)) {
      const response = await fetch("/__faust/config", { cache: "no-store" });
      if (response.ok) raw = await response.json();
    }
    if (!raw) { const response = await fetch("/faust/config.json", { cache: "no-store" }); raw = await response.json(); }
    config = validateConfig(raw, location.origin, import.meta.env.DEV);
    ui["environment-label"].textContent = config.label;
    ui["connect-button"].textContent = config.devLogin ? "连接本机浮士德 ↗" : "登录后开始对话 ↗";
    ui["connection-detail"].textContent = config.devLogin ? "本机预览已连接到 DSH 服务。此开发入口只在本机可用，不随静态网站发布。" : config.enabled ? "连接本机运行的同一个浮士德服务。主机需要保持在线；若浏览器询问本地网络访问，请允许后重试连接。" : "远程 API 尚未启用。页面已准备好，服务接通后即可使用。";
    if (!config.enabled) { status("远程入口准备中"); ui["welcome-description"].textContent = "对话空间已准备好。远程服务正在接入，当前还不能发送消息。"; controls(); return; }
    await probe();
  } catch { status("配置暂不可用", "error"); feedback("无法读取连接配置，请稍后刷新页面。"); }
}
void init();
