import { test } from "node:test";
import assert from "node:assert/strict";
import { createSseParser, normalizeMessage, validateConfig } from "../src/scripts/faust/protocol.js";
import { previewAllowed, routeAllowed } from "../scripts/faust-preview.mjs";
import { checkFiles, attachmentPath, parseCommand, webCapabilities } from "../src/scripts/faust/features.js";

test("SSE handles split frames, CRLF, multiple data lines and keepalives", () => {
  const events = []; const feed = createSseParser(e => events.push(e));
  feed(": ping\n\nid: 9007199254740993\r\ndata: {\"type\":\"tool.action\",\r\n");
  feed("data: \"data\":{\"text\":\"浮士德\"}}\r\n\r"); feed("\nid: 9\ndata: {}\n\n");
  assert.equal(events.length, 2); assert.equal(events[0].id, "9007199254740993");
  assert.equal(events[0].payload.data.text, "浮士德");
});
test("Attachments enforce size, type and count without discarding existing selections", () => {
  const first = {name:"image.png",size:100};
  assert.deepEqual(checkFiles([first],[{name:"notes.md",size:30}]).map(f=>f.name), ["image.png","notes.md"]);
  assert.throws(()=>checkFiles([], [{name:"vector.svg",size:100}]));
  assert.throws(()=>checkFiles([], [{name:"big.pdf",size:11*1024*1024}]));
  assert.throws(()=>checkFiles([], Array.from({length:5},()=>first)));
  assert.throws(()=>checkFiles([], [{name:"empty.txt",size:0}]));
});
test("Extended features only enable when backend explicitly supports message semantics", () => {
  assert.equal(webCapabilities(null).models, false);
  assert.equal(webCapabilities({schema_version:"unrecognized",models:{available:true,per_message:true}}).models, false);
  assert.equal(webCapabilities({schema_version:"faust.web.v1",attachments:{available:true}}).attachments, false);
  const valid=webCapabilities({schema_version:"faust.web.v1",models:{available:true,per_message:true},attachments:{available:true,message_references:true,max_count:500}});
  assert.equal(valid.models,true);assert.equal(valid.attachments,true);assert.equal(valid.limits.count,4);
});
test("Attachment rendering never uses arbitrary content URLs or unsafe identifiers", () => {
  assert.equal(attachmentPath({attachment_id:"file_1",url:"https://untrusted.example/file"}),"/v1/attachments/file_1/content");
  assert.equal(attachmentPath({attachment_id:"../private"}),null);
  assert.equal(attachmentPath({attachment_id:"x?token=leak"}),null);
  assert.equal(attachmentPath({url:"javascript:alert(1)"}),null);
});
test("Slash commands are distinct from character dialogue", () => {
  assert.deepEqual(parseCommand("/MODEL test-model"),{name:"/model",args:"test-model"});
  assert.equal(parseCommand("请解释 /model"),null);
  assert.deepEqual(parseCommand("/stop"),{name:"/stop",args:""});
});
test("Historical DB and snapshot message variants preserve all text", () => {
  const row = { message_id: "m", role: "assistant", text: "第一句。第二句。", meta_json: JSON.stringify({ utterances: ["第一句。", "第二句。"] }) };
  assert.deepEqual(normalizeMessage(row).parts, ["第一句。", "第二句。"]);
  assert.deepEqual(normalizeMessage({ ...row, meta_json: "{}" }).parts, [row.text]);
});
test("Public config cannot enable a development login or HTTP remote service", () => {
  assert.equal(validateConfig({ enabled: true, apiBase: "https://api.example", devLogin: true }, "https://site.example", false).devLogin, false);
  assert.throws(() => validateConfig({ enabled: true, apiBase: "http://127.0.0.1:4320" }, "https://site.example"));
  assert.equal(validateConfig({ enabled: true, apiBase: "/__faust", devLogin: true }, "http://127.0.0.1:4321", true).devLogin, true);
});
test("Local preview blocks cross-origin writes, nonloopback hosts and bot routes", () => {
  const request = { address: "127.0.0.1", host: "127.0.0.1:4321", origin: "http://127.0.0.1:4321", site: "same-origin", method: "POST" };
  assert.equal(previewAllowed(request), true);
  assert.equal(previewAllowed({ ...request, origin: "https://untrusted.example" }), false);
  assert.equal(previewAllowed({ ...request, host: "rebind.example:4321" }), false);
  assert.equal(previewAllowed({ ...request, address: "192.168.1.2" }), false);
  assert.equal(previewAllowed({ ...request, origin: undefined }), false);
  assert.equal(routeAllowed("POST", "/onebot/events"), false);
  assert.equal(routeAllowed("POST", "/v1/messages"), true);
  assert.equal(routeAllowed("POST", "/v1/tasks/task_123/commands"), false);
});
