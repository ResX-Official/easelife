const log = (...a) => console.log(...a);
const t = await (await fetch("http://127.0.0.1:9222/json/new?about:blank", { method: "PUT" })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
await new Promise((r) => (ws.onopen = r));
ws.onmessage = (m) => { const x = JSON.parse(m.data); if (x.id && pending.has(x.id)) { pending.get(x.id)(x); pending.delete(x.id); } };
const send = async (method, params = {}) => {
  const i = ++id; const p = new Promise((res) => pending.set(i, res));
  ws.send(JSON.stringify({ id: i, method, params }));
  const r = await p; if (r.error) throw new Error(method + ": " + JSON.stringify(r.error)); return r.result;
};
const evalJs = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true })).result?.value;
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 412, height: 915, deviceScaleFactor: 1, mobile: true });
await send("Page.navigate", { url: "http://localhost:3000/listings/cmsc9wjk50000bvae69qm4tnu" });
for (let i = 0; i < 20; i++) { await new Promise(r => setTimeout(r, 800)); if (await evalJs(`!!document.querySelector('#senderPhone')`)) break; }

log("label:", await evalJs(`document.querySelector('label[for=senderPhone]').textContent.trim()`));
log("required attr:", await evalJs(`document.querySelector('#senderPhone').required`));

await evalJs(`(() => { const set=(s,v)=>{const el=document.querySelector(s); el.value=v; el.dispatchEvent(new Event('input',{bubbles:true}));};
  set('#senderName','Blank Phone'); set('#senderEmail','blank@example.com'); set('#body','No phone given.'); return 1; })()`);
log("form valid without phone:", await evalJs(`document.querySelector('#senderPhone').form.checkValidity()`));
log("invalid field:", await evalJs(`document.querySelector('#senderPhone').validationMessage`));

await evalJs(`(() => { const el=document.querySelector('#senderPhone'); el.value='123'; el.dispatchEvent(new Event('input',{bubbles:true})); return 1; })()`);
ws.send(JSON.stringify({ id: ++id, method: "Runtime.evaluate", params: { expression: `document.querySelector('#senderPhone').form.querySelector('button[type=submit]').click()` } }));
for (let i = 0; i < 10; i++) {
  await new Promise(r => setTimeout(r, 1200));
  const err = await evalJs(`(document.querySelector('.bg-red-50')?.textContent)||''`);
  if (err) { log("short number rejected:", err); break; }
  if (i === 9) log("short number: no error shown");
}

await evalJs(`(() => { const el=document.querySelector('#senderPhone'); el.value='08031234567'; el.dispatchEvent(new Event('input',{bubbles:true})); return 1; })()`);
ws.send(JSON.stringify({ id: ++id, method: "Runtime.evaluate", params: { expression: `document.querySelector('#senderPhone').form.querySelector('button[type=submit]').click()` } }));
for (let i = 0; i < 10; i++) {
  await new Promise(r => setTimeout(r, 1200));
  const ok = await evalJs(`(document.querySelector('.bg-green-50')?.textContent)||''`);
  if (ok) { log("valid number accepted:", ok.trim().slice(0, 50)); break; }
  if (i === 9) log("valid number: no success message");
}
process.exit(0);
