export class ApiError extends Error {
  constructor(message, status = 0, code = "network_error") {
    super(message); this.status = status; this.code = code;
  }
}

export function validateConfig(value, origin, development = false) {
  if (!value?.enabled) return { enabled: false, label: "远程入口准备中" };
  if (typeof value.apiBase !== "string" || !value.apiBase) throw new Error("缺少服务地址");
  const target = new URL(value.apiBase, origin);
  if (target.username || target.password || target.search || target.hash) throw new Error("服务地址格式不正确");
  const local = development && ["localhost", "127.0.0.1"].includes(new URL(origin).hostname)
    && target.origin === origin && target.pathname === "/__faust";
  if (!local && target.protocol !== "https:") throw new Error("远程服务需要 HTTPS");
  return { enabled: true, apiBase: target.href.replace(/\/$/, ""), devLogin: local && value.devLogin === true,
    authMode: !local && value.authMode === "owner_password" ? "owner_password" : "cookie",
    label: local ? "本机预览" : "远程连接" };
}

export function normalizeMessage(row) {
  let meta = row.meta || {};
  if (typeof row.meta_json === "string") { try { meta = JSON.parse(row.meta_json); } catch { meta = {}; } }
  const text = typeof row.text === "string" ? row.text : "";
  const raw = meta.utterances || row.utterances || [];
  const parts = Array.isArray(raw) ? raw.map(p => typeof p === "string" ? p : p?.text).filter(p => typeof p === "string" && p) : [];
  return { id: row.message_id || row.id, role: row.role, text, createdAt: row.created_at,
    channel: row.channel || row.source_channel, parts: parts.join("") === text ? parts : [text] };
}

// UTF-8 decoding happens before this parser, so split network chunks preserve Chinese.
export function createSseParser(onEvent) {
  let buffer = "";
  return (chunk) => {
    buffer += chunk;
    if (buffer.length > 2_000_000) throw new Error("事件帧超出预览限制");
    let match;
    while ((match = /\r?\n\r?\n/.exec(buffer))) {
      const frame = buffer.slice(0, match.index);
      buffer = buffer.slice(match.index + match[0].length);
      let id; let event; const data = [];
      for (const line of frame.split(/\r?\n/)) {
        if (line.startsWith(":")) continue;
        const colon = line.indexOf(":");
        const key = colon < 0 ? line : line.slice(0, colon);
        const value = colon < 0 ? "" : line.slice(colon + 1).replace(/^ /, "");
        if (key === "id") id = value;
        if (key === "event") event = value;
        if (key === "data") data.push(value);
      }
      if (data.length) onEvent({ id, event, payload: JSON.parse(data.join("\n")) });
    }
  };
}

export const stateLabels = { queued: "排队中", planned: "已安排", running: "进行中", waiting: "等待回应",
  waiting_for_user: "等待回应", paused: "已暂停", stop_requested: "正在停止", completed: "已完成",
  succeeded: "已完成", failed: "未完成", cancelled: "已取消", started: "进行中", unknown: "结果待确认" };

export function readableError(error) {
  if (error.status === 401) return "会话已过期，请重新连接。";
  if (error.status === 403) return "服务拒绝了本次请求，请刷新连接后再试。";
  if (error.status === 501) return "远程登录尚未配置，请先使用本机预览。";
  if (error.status === 409) return "服务状态已变化，请刷新后重试。";
  if (error.status === 429) return "请求过于频繁，请稍后重试。";
  if ([400, 413, 415, 422].includes(error.status)) return error.message && error.message !== "服务请求失败" ? error.message.slice(0, 240) : "这条消息或附件未被服务接受，请检查输入内容与所选模型。";
  if (error.status >= 500 || !error.status) return "暂时连不上浮士德。请确认本机服务仍在运行。";
  return "请求未完成，请刷新连接后再试。";
}
