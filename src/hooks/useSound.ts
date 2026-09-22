import { useCallback, useEffect, useRef, useState } from "react";
import type { Phase } from "../go/types";
import bgmUrl from "../assets/bgm.m4a";

type Ctx = AudioContext;

/* 背景雅乐:外部 mp3 循环播放。母带很响,必须压到"床底"电平,
   否则会盖过落子/钟鼓等音效(旧合成铺底 peak 仅 0.075)。 */
const BGM_VOLUME = 0.12;

export interface UseSound {
  playStone: () => void;
  playCapture: (n: number) => void;
  playPhase: (phase: Phase) => void;
  muted: boolean;
  toggleMute: () => void;
  prime: () => void;
}

function disconnectAfter(nodes: AudioNode[], ms: number) {
  window.setTimeout(() => {
    for (const n of nodes) {
      try {
        n.disconnect();
      } catch {
        /* ignore */
      }
    }
  }, ms);
}

/* ---- 天象应声 ---- */

function playBell(ctx: Ctx, when: number, base: number, partials: Array<[number, number]>, peak: number, dur: number) {
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, when);
  out.gain.exponentialRampToValueAtTime(peak, when + 0.005);
  out.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  out.connect(ctx.destination);
  for (const [mult, g] of partials) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = base * mult;
    const pg = ctx.createGain();
    pg.gain.value = g;
    osc.connect(pg);
    pg.connect(out);
    osc.start(when);
    osc.stop(when + dur + 0.2);
  }
  disconnectAfter([out], (dur + 0.4) * 1000);
}

function playDawn(ctx: Ctx, when: number) {
  // 晨钟:非和谐倍频,长尾
  playBell(ctx, when, 261.63, [
    [1, 1.0],
    [2.0, 0.5],
    [2.4, 0.4],
    [3.0, 0.3],
    [3.2, 0.25],
    [4.5, 0.15],
    [5.4, 0.1],
  ], 0.2, 3.0);
}

function playNoon(ctx: Ctx, when: number) {
  // 编钟/清磬:明亮、高频、短尾,轻击两声
  playBell(ctx, when, 784.0, [
    [1, 1.0],
    [2.76, 0.4],
    [5.4, 0.2],
    [8.9, 0.1],
  ], 0.15, 1.3);
  playBell(ctx, when + 0.22, 1046.5, [
    [1, 0.8],
    [2.76, 0.3],
    [5.4, 0.16],
  ], 0.1, 1.1);
}

function playDusk(ctx: Ctx, when: number) {
  // 暮鼓:低频 body + 攻击噪声
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, when);
  osc.frequency.exponentialRampToValueAtTime(60, when + 0.18);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(0.34, when + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.55);
  osc.connect(g).connect(ctx.destination);
  osc.start(when);
  osc.stop(when + 0.6);

  const len = 0.05;
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 400;
  const ng = ctx.createGain();
  ng.gain.value = 0.2;
  noise.connect(lp).connect(ng).connect(ctx.destination);
  noise.start(when);
  disconnectAfter([g, lp, ng], 900);
}

function playNight(ctx: Ctx, when: number) {
  // 虫鸣:高频纯音短促 trill
  const burstCount = 7;
  for (let i = 0; i < burstCount; i++) {
    const t = when + i * 0.07;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 4500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 4500;
    bp.Q.value = 8;
    osc.connect(bp).connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
    disconnectAfter([g, bp], 200 + i * 70);
  }
}

/* ------------------------------------------------------------------ */

export function useSound(opts: { music?: boolean } = {}): UseSound {
  // music 默认 true（对局视图 PlayView/GomokuView 需要 BGM）；
  // DemoPanel 等仅需音效的场景传 { music: false }，避免落地页响起 BGM。
  const enableMusic = opts.music !== false;
  const ctxRef = useRef<Ctx | null>(null);
  const [muted, setMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem("inkgo-muted") === "1";
    } catch {
      return false;
    }
  });
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const getBgm = useCallback(() => {
    if (!bgmRef.current) {
      const a = new Audio(bgmUrl);
      a.loop = true; // 4'25" 无缝循环
      a.volume = BGM_VOLUME;
      bgmRef.current = a;
    }
    return bgmRef.current;
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("inkgo-muted", muted ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [muted]);

  const ensure = useCallback((): Ctx | null => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const stopMusic = useCallback(() => {
    bgmRef.current?.pause();
  }, []);

  const startMusic = useCallback(() => {
    ensure(); // 解锁 AudioContext,供音效使用
    if (!mutedRef.current) {
      void getBgm()
        .play()
        .catch(() => {
          /* 浏览器自动播放策略拦截,忽略 */
        });
    }
  }, [ensure, getBgm]);

  // 背景雅乐启停：与 muted / enableMusic 绑定的自清理 effect。
  // 启动与停止成对出现在同一 effect 内，保证卸载时（退出对局视图）必然停止，
  // 不会因 effect 间的执行顺序差异导致 BGM 泄漏到落地页。
  useEffect(() => {
    if (!enableMusic || muted) return;
    startMusic();
    return () => stopMusic();
  }, [muted, startMusic, stopMusic, enableMusic]);

  // AudioContext 资源清理：仅卸载时关闭上下文（bgm 已由上面的 effect cleanup 停掉）。
  useEffect(() => {
    return () => {
      bgmRef.current?.pause();
      bgmRef.current = null;
      const ctx = ctxRef.current;
      if (ctx) {
        ctxRef.current = null;
        void ctx.close().catch(() => {
          /* ignore */
        });
      }
    };
  }, []);

  const playStone = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = ensure();
    if (!ctx) return;
    const t = ctx.currentTime;

    // wood "tok" — bandpass noise attack
    const len = 0.07;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2400;
    bp.Q.value = 1.4;
    const ng = ctx.createGain();
    ng.gain.value = 0.22;
    noise.connect(bp).connect(ng).connect(ctx.destination);
    noise.start(t);

    // low thud
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.08);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.16, t + 0.005);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(og).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.13);
  }, [ensure]);

  const playCapture = useCallback(
    (n: number) => {
      if (mutedRef.current || n <= 0) return;
      const ctx = ensure();
      if (!ctx) return;
      const t = ctx.currentTime;
      const dur = 0.32;
      const buffer = ctx.createBuffer(
        1,
        ctx.sampleRate * dur,
        ctx.sampleRate
      );
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.5);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(1600, t);
      lp.frequency.exponentialRampToValueAtTime(280, t + dur);
      const g = ctx.createGain();
      const peak = Math.min(0.28, 0.14 + n * 0.03);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      noise.connect(lp).connect(g).connect(ctx.destination);
      noise.start(t);
    },
    [ensure]
  );

  const playPhase = useCallback(
    (phase: Phase) => {
      if (mutedRef.current) return;
      const ctx = ensure();
      if (!ctx) return;
      const t = ctx.currentTime + 0.02;
      switch (phase) {
        case "dawn":
          playDawn(ctx, t);
          break;
        case "noon":
          playNoon(ctx, t);
          break;
        case "dusk":
          playDusk(ctx, t);
          break;
        case "night":
          playNight(ctx, t);
          break;
      }
    },
    [ensure]
  );

  const prime = useCallback((): (() => void) => {
    let done = false;
    const unlock = () => {
      if (done) return;
      done = true;
      const ctx = ensure();
      if (ctx && !mutedRef.current) startMusic();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      done = true;
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [ensure, startMusic]);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  return { playStone, playCapture, playPhase, muted, toggleMute, prime };
}
