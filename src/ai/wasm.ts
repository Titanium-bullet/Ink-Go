// 内联 wasm 加载工具。
//
// singlefile 打包下不能依赖 fetch(.wasm)，因此把 wasm 以 base64 字符串内联进
// JS 源码，运行时解码为字节再 WebAssembly.instantiate。整条链路无网络/无 URL，
// Worker 内也可用 —— 这是人机模式能在 singlefile 下成立的根基。
//
// GnuGo(WASM) 与最小原型都走这条路径。

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function instantiateFromBase64(
  b64: string,
  imports?: WebAssembly.Imports
): Promise<WebAssembly.Instance> {
  const bytes = base64ToBytes(b64);
  const result = await WebAssembly.instantiate(bytes, imports);
  // instantiate(bytes) 返回 { module, instance }；instantiate(Module) 直接返回 instance。
  return result instanceof WebAssembly.Instance
    ? result
    : (result as WebAssembly.WebAssemblyInstantiatedSource).instance;
}
