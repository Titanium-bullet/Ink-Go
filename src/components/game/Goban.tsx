import { useEffect, useMemo, useRef, useState } from "react";
import { BLACK, Color, EMPTY, GameState } from "../../go/types";
import { isLegal } from "../../go/engine";
import { useT } from "../../i18n/LanguageContext";
import { InkBeasts } from "./InkBeasts";

const VIEW = 1000;
const MARGIN = 74;

function starPoints(size: number): number[] {
  if (size === 19) return [3, 9, 15];
  if (size === 13) return [3, 6, 9];
  if (size === 9) return [2, 4, 6];
  const c = Math.floor(size / 2);
  return [c];
}

const LETTERS = "ABCDEFGHJKLMNOPQRST";

interface Burst {
  i: number;
  color: number;
  key: number;
}

export function Goban({
  state,
  onPlay,
  flavor = true,
  locked = false,
}: {
  state: GameState;
  onPlay: (i: number) => void;
  flavor?: boolean;
  /** 锁定棋盘（AI 思考中 / AI 回合）：禁用落子与悬停 */
  locked?: boolean;
}) {
  const { size, board, moveNumber } = state;
  const t = useT();
  const [hover, setHover] = useState<number | null>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [illegal, setIllegal] = useState<{ i: number; label: string; key: number } | null>(null);
  const prevBoard = useRef<Color[] | null>(null);
  const prevMove = useRef(0);
  const flashTimer = useRef<number | null>(null);

  const cell = (VIEW - 2 * MARGIN) / (size - 1);
  const px = (n: number) => MARGIN + n * cell;
  const stoneR = cell * 0.46;
  const stars = starPoints(size);

  // 合法落点查表：以 state 为依赖缓存。hover/burst/illegal 触发的重渲染不会重算，
  // 落子后 state 换引用才重建一次。19×19 从「每帧 361×5 BFS + 361 次数组拷贝」
  // 降到「落子后一次同样计算，渲染时纯查表」。
  const legalMap = useMemo(() => {
    const m = new Uint8Array(board.length);
    if (state.finished) return m;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === EMPTY && isLegal(state, i).legal) m[i] = 1;
    }
    return m;
  }, [state]);

  const flashIllegal = (i: number, reason: string) => {
    const label =
      reason === "ko"
        ? t.illegal.ko
        : reason === "suicide"
          ? t.illegal.suicide
          : t.illegal.other;
    setIllegal({ i, label, key: Date.now() });
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setIllegal(null), 900);
  };

  // 卸载时清掉未触发的非法提示定时器，避免 setState on unmounted
  useEffect(() => {
    return () => {
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    };
  }, []);

  // detect captures for the 散墨 burst (only on a real move, not a reset/undo)
  useEffect(() => {
    const prev = prevBoard.current;
    const advanced = moveNumber === prevMove.current + 1;
    if (prev && prev !== board && advanced) {
      const found: Burst[] = [];
      for (let i = 0; i < board.length; i++) {
        if (prev[i] !== EMPTY && board[i] === EMPTY) {
          found.push({ i, color: prev[i], key: moveNumber });
        }
      }
      if (found.length) {
        setBursts(found);
        prevBoard.current = board;
        prevMove.current = moveNumber;
        const id = window.setTimeout(() => setBursts([]), 700);
        return () => window.clearTimeout(id);
      }
    }
    prevBoard.current = board;
    prevMove.current = moveNumber;
  }, [board, moveNumber]);

  const lastColor = state.lastMove !== null ? board[state.lastMove] : EMPTY;

  return (
    <div className="goban-wrap">
      <svg
        className="goban"
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        role="img"
        aria-label={t.aria.board}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {/* paper */}
          <linearGradient id="paperBase" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#f0ddb2" />
            <stop offset="55%" stopColor="#e1c892" />
            <stop offset="100%" stopColor="#cdb67c" />
          </linearGradient>
          <radialGradient id="paperLight" cx="42%" cy="34%" r="70%">
            <stop offset="0%" stopColor="#f7ecc8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f7ecc8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vignette" cx="50%" cy="50%" r="62%">
            <stop offset="60%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#2a1c0c" stopOpacity="0.42" />
          </radialGradient>
          <filter id="paperGrain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.52  0 0 0 0 0.38  0 0 0 0 0.22  0 0 0 0.14 0"
            />
          </filter>

          {/* stones */}
          <radialGradient id="blackStone" cx="34%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#7a665a" />
            <stop offset="30%" stopColor="#332a24" />
            <stop offset="70%" stopColor="#120d0a" />
            <stop offset="100%" stopColor="#040302" />
          </radialGradient>
          <radialGradient id="whiteStone" cx="34%" cy="28%" r="74%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#f3ecdc" />
            <stop offset="80%" stopColor="#d8c9a8" />
            <stop offset="100%" stopColor="#b8a784" />
          </radialGradient>
          <radialGradient id="blackSpec" cx="34%" cy="26%" r="22%">
            <stop offset="0%" stopColor="#bca48f" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#bca48f" stopOpacity="0" />
          </radialGradient>

          <filter id="stoneShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="4" stdDeviation="3.4" floodColor="#1a1208" floodOpacity="0.5" />
          </filter>
          <filter id="jadeGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#fff7e2" floodOpacity="0.5" />
          </filter>

          {/* ko rift 龙脉裂隙 */}
          <radialGradient id="riftGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f5b94a" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#c8392a" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#3a1a2a" stopOpacity="0" />
          </radialGradient>

          {/* 灵泉 spirit spring — warm amber-gold to match the ink/paper palette */}
          <radialGradient id="springGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e0a847" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#9a6b25" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#6e4a18" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="springCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbe6ad" />
            <stop offset="60%" stopColor="#c0832b" />
            <stop offset="100%" stopColor="#6e4516" />
          </radialGradient>
        </defs>

        {/* paper */}
        <rect x="0" y="0" width={VIEW} height={VIEW} fill="url(#paperBase)" />
        <rect x="0" y="0" width={VIEW} height={VIEW} fill="url(#paperLight)" />
        <rect
          x="0"
          y="0"
          width={VIEW}
          height={VIEW}
          filter="url(#paperGrain)"
          opacity="0.5"
          style={{ mixBlendMode: "multiply" }}
        />
        <rect x="0" y="0" width={VIEW} height={VIEW} fill="url(#vignette)" />

        {/* ink grid */}
        <g stroke="#5a4326" strokeOpacity="0.82" strokeWidth={Math.max(1.1, cell * 0.02)} strokeLinecap="round">
          {Array.from({ length: size }).map((_, i) => (
            <line key={`v${i}`} x1={px(i)} y1={px(0)} x2={px(i)} y2={px(size - 1)} />
          ))}
          {Array.from({ length: size }).map((_, i) => (
            <line key={`h${i}`} x1={px(0)} y1={px(i)} x2={px(size - 1)} y2={px(i)} />
          ))}
        </g>

        {/* star points — 开启墨兽时化作灵泉 (spirit springs) */}
        <g>
          {stars.flatMap((sx) =>
            stars.map((sy) =>
              flavor ? (
                <g key={`s${sx}-${sy}`} className="spring">
                  <circle cx={px(sx)} cy={px(sy)} r={cell * 0.24} fill="url(#springGlow)" />
                  <circle cx={px(sx)} cy={px(sy)} r={cell * 0.10} fill="url(#springCore)" />
                  <circle cx={px(sx)} cy={px(sy)} r={cell * 0.10} fill="none" stroke="#e6b85a" strokeWidth={cell * 0.035} opacity="0">
                    <animate attributeName="r" values={`${cell * 0.09};${cell * 0.26}`} dur="3.6s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0" dur="3.6s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={px(sx)} cy={px(sy)} r={cell * 0.10} fill="none" stroke="#e6b85a" strokeWidth={cell * 0.03} opacity="0">
                    <animate attributeName="r" values={`${cell * 0.09};${cell * 0.26}`} dur="3.6s" begin="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0" dur="3.6s" begin="1.8s" repeatCount="indefinite" />
                  </circle>
                </g>
              ) : (
                <g key={`s${sx}-${sy}`}>
                  <circle cx={px(sx)} cy={px(sy)} r={cell * 0.16} fill="#d8b36e" opacity="0.22" />
                  <circle cx={px(sx)} cy={px(sy)} r={cell * 0.09} fill="#3a2412" />
                </g>
              )
            )
          )}
        </g>

        {/* coordinates */}
        <g fill="#6b5230" fontSize={cell * 0.3} fontFamily="serif" textAnchor="middle">
          {Array.from({ length: size }).map((_, i) => (
            <g key={`coord${i}`}>
              <text x={px(i)} y={MARGIN * 0.5} dominantBaseline="middle">{LETTERS[i]}</text>
              <text x={px(i)} y={VIEW - MARGIN * 0.5} dominantBaseline="middle">{LETTERS[i]}</text>
              <text x={MARGIN * 0.45} y={px(i)} dominantBaseline="middle">{size - i}</text>
              <text x={VIEW - MARGIN * 0.45} y={px(i)} dominantBaseline="middle">{size - i}</text>
            </g>
          ))}
        </g>

        {/* ko rift 龙脉裂隙 */}
        {state.koPoint !== null && (
          <circle
            className="ko-rift-svg"
            cx={px(state.koPoint % size)}
            cy={px(Math.floor(state.koPoint / size))}
            r={stoneR * 1.5}
            fill="url(#riftGrad)"
          />
        )}

        {/* last move glow (under stone) */}
        {state.lastMove !== null && (
          <circle
            className="last-glow"
            cx={px(state.lastMove % size)}
            cy={px(Math.floor(state.lastMove / size))}
            r={stoneR * 1.25}
            fill="#e6a747"
            opacity="0.5"
          />
        )}

        {/* stones */}
        {board.map((c, i) => {
          if (c === EMPTY) return null;
          const cx = px(i % size);
          const cy = px(Math.floor(i / size));
          return (
            <g key={`st${i}`} filter={c === BLACK ? "url(#stoneShadow)" : "url(#jadeGlow)"}>
              <circle cx={cx} cy={cy} r={stoneR} fill={`url(#${c === BLACK ? "blackStone" : "whiteStone"})`} />
              {c === BLACK && (
                <circle cx={cx - stoneR * 0.18} cy={cy - stoneR * 0.22} r={stoneR * 0.6} fill="url(#blackSpec)" />
              )}
            </g>
          );
        })}

        {/* placement ripple 墨晕扩散 */}
        {state.lastMove !== null && (
          <circle
            key={`ripple-${moveNumber}`}
            className="ink-ripple"
            cx={px(state.lastMove % size)}
            cy={px(Math.floor(state.lastMove / size))}
            r={stoneR}
            fill={lastColor === BLACK ? "#1a1410" : "#f4efe4"}
          />
        )}

        {/* capture bursts 散墨 */}
        {bursts.map((b) => {
          const cx = px(b.i % size);
          const cy = px(Math.floor(b.i / size));
          const col = b.color === BLACK ? "#0a0807" : "#3a3326";
          return (
            <g key={`burst-${b.i}-${b.key}`}>
              <circle
                className="burst-bloom"
                cx={cx}
                cy={cy}
                r={stoneR}
                fill={col}
              />
              <circle
                className="burst-ring"
                cx={cx}
                cy={cy}
                r={stoneR}
                fill="none"
                stroke={col}
                strokeWidth={cell * 0.08}
              />
            </g>
          );
        })}

        {/* ink beasts 墨兽 (thickness / liberty visualization) */}
        {flavor && <InkBeasts state={state} cell={cell} px={px} />}

        {/* hover preview */}
        {!locked && !state.finished && hover !== null && legalMap[hover] === 1 && (
          <circle
            cx={px(hover % size)}
            cy={px(Math.floor(hover / size))}
            r={stoneR}
            fill={`url(#${state.turn === BLACK ? "blackStone" : "whiteStone"})`}
            opacity="0.45"
            style={{ pointerEvents: "none" }}
          />
        )}

        {/* hit areas */}
        {!locked &&
          !state.finished &&
          board.map((_, i) => {
            const x = i % size;
            const y = Math.floor(i / size);
            const legal = legalMap[i] === 1;
            return (
              <rect
                key={`hit${i}`}
                x={px(x) - cell / 2}
                y={px(y) - cell / 2}
                width={cell}
                height={cell}
                fill="transparent"
                style={{ cursor: legal ? "pointer" : "default" }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onClick={() => {
                  if (legal) {
                    onPlay(i);
                    return;
                  }
                  // 点击非法点时才花一次 isLegal 拿原因（打劫/自杀提示）
                  const check = isLegal(state, i);
                  flashIllegal(i, check.reason ?? "");
                }}
              />
            );
          })}

        {/* illegal-move hint (打劫 / 自杀) */}
        {illegal && (
          <g
            key={`il-${illegal.key}`}
            className="illegal-flash"
            transform={`translate(${px(illegal.i % size)} ${px(Math.floor(illegal.i / size))})`}
          >
            <circle r={stoneR} fill="none" stroke="#d8553a" strokeWidth={cell * 0.07} />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fill="#d8553a"
              fontSize={stoneR * 1.1}
              fontFamily="serif"
            >
              {illegal.label}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
