// 第 1 步可行性原型 · 常驻回归守卫。
//
// 用一个 41 字节的最小 wasm（导出 add(i32,i32)->i32）验证 base64 内联 wasm
// 在 worker 里能加载执行 —— 这是 singlefile 打包下整个 AI 链路的根基。
// GnuGo 集成后保留它作为不依赖 GnuGo 的轻量守卫。
//
// 运行：node scripts/proto-smoke.mjs
import { Worker } from "node:worker_threads";

let failures = 0;
function assert(cond, msg) {
  if (!cond) {
    failures++;
    console.error("  ✗ FAIL:", msg);
  } else {
    console.log("  ✓", msg);
  }
}

// 最小 add wasm（i32.add），字节已用 WebAssembly 校验过。
const B64 = "AGFzbQEAAAABBwFgAn9/AX8DAgEABwcBA2FkZAAACgkBBwAgACABags=";
function b64ToBytes(b64) {
  const bin = Buffer.from(b64, "base64").toString("binary");
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

console.log("\n[1] 主线程：base64 -> bytes -> instantiate");
{
  const r = await WebAssembly.instantiate(b64ToBytes(B64));
  const inst = r instanceof WebAssembly.Instance ? r : r.instance;
  const add = inst.exports.add;
  assert(typeof add === "function", "wasm 导出 add 函数");
  assert(add(2, 3) === 5, "add(2,3) === 5");
  assert(add(40, 2) === 42, "add(40,2) === 42");
}

console.log("\n[2] worker_threads：在 worker 里加载并执行 wasm");
{
  const workerSrc = `
    import { parentPort } from "node:worker_threads";
    const B64 = ${JSON.stringify(B64)};
    function b64ToBytes(b64) {
      const bin = Buffer.from(b64, "base64").toString("binary");
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    }
    const ready = WebAssembly.instantiate(b64ToBytes(B64)).then(r => (r.instance ?? r).exports);
    parentPort.on("message", async ({ id, a, b }) => {
      const ex = await ready;
      parentPort.postMessage({ id, result: ex.add(a, b) });
    });
    parentPort.postMessage({ type: "online" });
  `;
  const worker = new Worker(workerSrc, { eval: true });
  let seq = 0;
  const pending = new Map();
  const send = (a, b) =>
    new Promise((res) => {
      const id = ++seq;
      pending.set(id, res);
      worker.postMessage({ id, a, b });
    });
  await new Promise((res) => worker.once("message", res));
  worker.on("message", (m) => {
    const r = pending.get(m.id);
    if (r) {
      pending.delete(m.id);
      r(m.result);
    }
  });

  assert((await send(2, 3)) === 5, "worker add(2,3) === 5");
  assert((await send(40, 2)) === 42, "worker add(40,2) === 42");
  assert((await send(100, 23)) === 123, "worker add(100,23) === 123");
  await worker.terminate();
}

if (failures === 0) {
  console.log("\n=== PROTOTYPE SMOKE TEST PASSED ===\n");
} else {
  console.error(`\n=== ${failures} TEST(S) FAILED ===\n`);
  process.exit(1);
}
