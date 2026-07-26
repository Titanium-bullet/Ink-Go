// 从 gnugo.wasm 二进制生成 src/ai/gnugo/wasm/gnugoWasm.ts（base64 内联）。
// 只在更新 GnuGo 产物时手动跑一次：node scripts/gen-gnugo-wasm.mjs
// 单文件打包要求 wasm 不走 fetch，故以 base64 字符串内联进 JS（见 src/ai/wasm.ts）。
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const from = resolve(root, "src/ai/gnugo/wasm/gnugo.wasm");
const to = resolve(root, "src/ai/gnugo/wasm/gnugoWasm.ts");

const bytes = readFileSync(from);
const b64 = Buffer.from(bytes).toString("base64");
const out = `// 自动生成 —— 请勿手改。由 scripts/gen-gnugo-wasm.mjs 从 gnugo.wasm 产生。
// GnuGo 3.9.1 的 WebAssembly 二进制（base64 内联）。
// 产物来源：https://github.com/TristanCacqueray/wasm-gnugo （pages 分支预编译）。
// 许可：GnuGo 与 wasm-gnugo 均为 GPL-3.0，见项目根 LICENSE。
export const GNUGO_WASM_B64 =
${JSON.stringify(b64)};
`;

writeFileSync(to, out);
console.log(`wrote ${to}`);
console.log(`wasm bytes: ${bytes.length}, base64 chars: ${b64.length}`);
