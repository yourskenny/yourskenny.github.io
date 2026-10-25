import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createGateway, PUBLIC_HOST } from "../scripts/faust-gateway.mjs";

test("Native access authenticates owner, keeps native credentials server side, preserves RPC and revokes streams", async t => {
  const records = [];
  let valid = true;
  const auth = http.createServer(async (req, res) => {
    let body = ""; for await (const chunk of req) body += chunk;
    if (req.url === "/auth/owner/login") {
      assert.equal(req.headers.origin, "https://" + PUBLIC_HOST);
      if (JSON.parse(body).password !== "test-password") { res.writeHead(401); res.end("{}"); return; }
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ access_token: "owner-bearer-test", csrf_token: "owner-csrf-test", expires_at: new Date(Date.now()+3600000).toISOString() }));
    } else if(req.url === "/v1/session") {
      res.writeHead(valid && req.headers.authorization === "Bearer owner-bearer-test" ? 200 : 401); res.end("{}");
    } else if(req.url === "/v1/logout") { valid = false; res.end("{}"); }
    else { res.writeHead(404); res.end(); }
  });
  const upstream = http.createServer(async (req, res) => {
    if (req.url.startsWith("/?token=")) {
      assert.equal(req.headers.host, PUBLIC_HOST);
      assert.equal(new URL(req.url,"http://test").searchParams.get("token"), "T".repeat(43));
      res.writeHead(303, { "set-cookie":"dsh-auth-test=native-secret; Path=/; HttpOnly; SameSite=Strict", location:"./" }); res.end(); return;
    }
    let body=""; for await(const chunk of req) body+=chunk;
    records.push({url:req.url,headers:req.headers,body});
    res.writeHead(200, {"content-type":"application/json", "set-cookie":"must-not-leak=secret"});
    res.end(JSON.stringify({ok:true}));
  });
  upstream.on("upgrade", (req, socket) => {
    records.push({url:req.url,headers:req.headers});
    socket.write("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n\r\n");
    socket.on("data", data => socket.write(data));
    socket.on("error",()=>{});
  });
  await new Promise(r=>auth.listen(0,"127.0.0.1",r));
  await new Promise(r=>upstream.listen(0,"127.0.0.1",r));
  const dir=mkdtempSync(join(tmpdir(),"faust-native-test-"));
  const launchFile=join(dir,"launch.txt");
  writeFileSync(launchFile,`http://127.0.0.1:54002/?token=${"T".repeat(43)}`);
  const gateway=createGateway({target:`http://127.0.0.1:${auth.address().port}`,nativeOptions:{target:`http://127.0.0.1:${upstream.address().port}`,launchFile}});
  await new Promise(r=>gateway.listen(0,"127.0.0.1",r));
  t.after(()=>{gateway.closeAllConnections();gateway.close();auth.closeAllConnections();auth.close();upstream.closeAllConnections();upstream.close();rmSync(dir,{recursive:true,force:true});});
  function request(path,{method="GET",headers={},body=""}={}) {
    return new Promise((resolve,reject)=>{
      const req=http.request({host:"127.0.0.1",port:gateway.address().port,path,method,headers:{Host:PUBLIC_HOST,...headers}},res=>{
        let data="";res.on("data",c=>data+=c);res.on("end",()=>resolve({status:res.statusCode,headers:res.headers,body:data}));
      });req.on("error",reject);req.end(body);
    });
  }
  const originHeaders={Origin:"https://"+PUBLIC_HOST,"Content-Type":"application/x-www-form-urlencoded"};
  assert.equal((await request("/dsh/api/rpc")).status,401);
  assert.equal((await request("/dsh/",{headers:{Accept:"text/html"}})).headers.location,"/dsh-access/");
  assert.equal((await request("/dsh/?token=private")).status,404);
  assert.equal((await request("/dsh/connect?token=private")).status,404);
  assert.equal((await request("/dsh-access/login",{method:"POST",headers:{...originHeaders,Origin:"https://evil.example"},body:"password=test-password"})).status,403);
  const login=await request("/dsh-access/login",{method:"POST",headers:originHeaders,body:"password=test-password"});
  assert.equal(login.status,303); assert.equal(login.headers.location,"/dsh/");
  const setCookie=login.headers["set-cookie"][0];
  assert.match(setCookie,/Secure; HttpOnly; SameSite=Lax/);
  assert.ok(!setCookie.includes("native-secret")&&!setCookie.includes("owner-bearer-test"));
  const session=setCookie.split(";")[0];
  const rpc=await request("/dsh/api/rpc?x=1",{method:"POST",headers:{Cookie:session,Origin:"https://"+PUBLIC_HOST,"Content-Type":"application/json","X-Forwarded-For":"untrusted"},body:'{"method":"example"}'});
  assert.equal(rpc.status,200); assert.equal(rpc.headers["set-cookie"],undefined);
  assert.equal(records.at(-1).url,"/api/rpc?x=1");
  assert.equal(records.at(-1).headers.cookie,"dsh-auth-test=native-secret");
  assert.equal(records.at(-1).headers["x-forwarded-for"],undefined);
  assert.equal(records.at(-1).body,'{"method":"example"}');
  assert.equal((await request("/dsh/api/rpc",{method:"POST",headers:{Cookie:session,Origin:"https://evil.example"},body:"x"})).status,403);
  const socket=await new Promise((resolve,reject)=>{
    const req=http.request({host:"127.0.0.1",port:gateway.address().port,path:"/dsh/api/terminal",headers:{Host:PUBLIC_HOST,Origin:"https://"+PUBLIC_HOST,Cookie:session,Connection:"Upgrade",Upgrade:"websocket"}});
    req.on("upgrade",(res,socket)=>resolve(socket));req.on("response",()=>reject(new Error("Upgrade rejected")));req.on("error",reject);req.end();
  });
  const echo=new Promise(resolve=>socket.once("data",b=>resolve(b.toString())));socket.write("echo");assert.equal(await echo,"echo");
  const closed=new Promise(resolve=>socket.once("close",resolve));
  const logout=await request("/dsh-access/logout",{method:"POST",headers:{...originHeaders,Cookie:session},body:"csrf=owner-csrf-test"});
  assert.equal(logout.status,303);assert.match(logout.headers["set-cookie"][0],/Max-Age=0/);
  await closed;
  assert.equal((await request("/dsh/api/rpc",{headers:{Cookie:session}})).status,401);
});
