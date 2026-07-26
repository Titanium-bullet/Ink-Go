import { useEffect, useRef, useState, type CSSProperties } from "react";
import { BLACK, EMPTY } from "../../go/types";
import { GomokuState } from "../../gomoku/types";
import { useT } from "../../i18n/LanguageContext";

const VIEW = 1000;
const MARGIN = 74;
const LETTERS = "ABCDEFGHIJKLMNO";

function starPoints(size: number): number[] {
  if (size === 15) return [3, 7, 11];
  const c = Math.floor(size / 2);
  return [c];
}

export function GomokuBoard({
  state,
  onPlay,
}: {
  state: GomokuState;
  onPlay: (i: number) => void;
}) {
  const t = useT();
  const { size, board, moveNumber, winLine } = state;
  const [hover, setHover] = useState<number | null>(null);
  const [illegal, setIllegal] = useState<{ i: number; key: number } | null>(
    null
  );
  const flashTimer = useRef<number | null>(null);

  // 卸载时清掉未触发的非法提示定时器，避免 setState on unmounted
  useEffect(() => {
    return () => {
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    };
  }, []);

  const cell = (VIEW - 2 * MARGIN) / (size - 1);
  const px = (n: number) => MARGIN + n * cell;
  const stoneR = cell * 0.46;
  const stars = starPoints(size);

  const flashIllegal = (i: number) => {
    setIllegal({ i, key: Date.now() });
    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => {
      setIllegal(null);
      flashTimer.current = null;
    }, 900);
  };

  const occupied = (i: number) => state.finished || board[i] !== EMPTY;

  const lastColor =
    state.lastMove !== null ? board[state.lastMove] : EMPTY;

  // winning ink line: stones are collinear, span = (n-1) cells
  const winLen =
    winLine && winLine.length >= 2 ? (winLine.length - 1) * cell : 0;
  const winPath =
    winLine && winLine.length >= 2
      ? (() => {
          const a = winLine[0];
          const b = winLine[winLine.length - 1];
          return {
            x1: px(a % size),
            y1: px(Math.floor(a / size)),
            x2: px(b % size),
            y2: px(Math.floor(b / size)),
          };
        })()
      : null;

  return (
    <div className="goban-wrap">
      <svg
        className="goban"
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        role="img"
        aria-label={t.aria.gomokuBoard}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="gomokuPaperBase" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#f0ddb2" />
            <stop offset="55%" stopColor="#e1c892" />
            <stop offset="100%" stopColor="#cdb67c" />
          </linearGradient>
          <radialGradient id="gomokuPaperLight" cx="42%" cy="34%" r="70%">
            <stop offset="0%" stopColor="#f7ecc8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f7ecc8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="gomokuVignette" cx="50%" cy="50%" r="62%">
            <stop offset="60%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#2a1c0c" stopOpacity="0.42" />
          </radialGradient>
          <filter id="gomokuPaperGrain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              seed="7"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.52  0 0 0 0 0.38  0 0 0 0 0.22  0 0 0 0.14 0"
            />
          </filter>

          <radialGradient id="gmBlackStone" cx="34%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#7a665a" />
            <stop offset="30%" stopColor="#332a24" />
            <stop offset="70%" stopColor="#120d0a" />
            <stop offset="100%" stopColor="#040302" />
          </radialGradient>
          <radialGradient id="gmWhiteStone" cx="34%" cy="28%" r="74%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#f3ecdc" />
            <stop offset="80%" stopColor="#d8c9a8" />
            <stop offset="100%" stopColor="#b8a784" />
          </radialGradient>
          <radialGradient id="gmBlackSpec" cx="34%" cy="26%" r="22%">
            <stop offset="0%" stopColor="#bca48f" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#bca48f" stopOpacity="0" />
          </radialGradient>

          <filter id="gmStoneShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="3.4"
              floodColor="#1a1208"
              floodOpacity="0.5"
            />
          </filter>
          <filter id="gmJadeGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="4"
              floodColor="#fff7e2"
              floodOpacity="0.5"
            />
          </filter>
        </defs>

        {/* paper */}
        <rect x="0" y="0" width={VIEW} height={VIEW} fill="url(#gomokuPaperBase)" />
        <rect x="0" y="0" width={VIEW} height={VIEW} fill="url(#gomokuPaperLight)" />
        <rect
          x="0"
          y="0"
          width={VIEW}
          height={VIEW}
          filter="url(#gomokuPaperGrain)"
          opacity="0.5"
          style={{ mixBlendMode: "multiply" }}
        />
        <rect x="0" y="0" width={VIEW} height={VIEW} fill="url(#gomokuVignette)" />

        {/* ink grid */}
        <g
          stroke="#5a4326"
          strokeOpacity="0.82"
          strokeWidth={Math.max(1.1, cell * 0.02)}
          strokeLinecap="round"
        >
          {Array.from({ length: size }).map((_, i) => (
            <line key={`v${i}`} x1={px(i)} y1={px(0)} x2={px(i)} y2={px(size - 1)} />
          ))}
          {Array.from({ length: size }).map((_, i) => (
            <line key={`h${i}`} x1={px(0)} y1={px(i)} x2={px(size - 1)} y2={px(i)} />
          ))}
        </g>

        {/* star points — plain dots (no ink-beast flavor) */}
        <g>
          {stars.flatMap((sx) =>
            stars.map((sy) => (
              <g key={`s${sx}-${sy}`}>
                <circle cx={px(sx)} cy={px(sy)} r={cell * 0.16} fill="#d8b36e" opacity="0.22" />
                <circle cx={px(sx)} cy={px(sy)} r={cell * 0.09} fill="#3a2412" />
              </g>
            ))
          )}
        </g>

        {/* coordinates */}
        <g fill="#6b5230" fontSize={cell * 0.3} fontFamily="serif" textAnchor="middle">
          {Array.from({ length: size }).map((_, i) => (
            <g key={`coord${i}`}>
              <text x={px(i)} y={MARGIN * 0.5} dominantBaseline="middle">
                {LETTERS[i]}
              </text>
              <text x={px(i)} y={VIEW - MARGIN * 0.5} dominantBaseline="middle">
                {LETTERS[i]}
              </text>
              <text x={MARGIN * 0.45} y={px(i)} dominantBaseline="middle">
                {size - i}
              </text>
              <text x={VIEW - MARGIN * 0.45} y={px(i)} dominantBaseline="middle">
                {size - i}
              </text>
            </g>
          ))}
        </g>

        {/* winning ink line glow (under stones) */}
        {winPath && (
          <line
            x1={winPath.x1}
            y1={winPath.y1}
            x2={winPath.x2}
            y2={winPath.y2}
            stroke="#e6a747"
            strokeWidth={stoneR * 1.5}
            strokeLinecap="round"
            opacity="0.45"
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
          const isWin = winLine?.includes(i);
          return (
            <g
              key={`st${i}`}
              filter={c === BLACK ? "url(#gmStoneShadow)" : "url(#gmJadeGlow)"}
            >
              <circle
                cx={cx}
                cy={cy}
                r={stoneR}
                fill={`url(#${c === BLACK ? "gmBlackStone" : "gmWhiteStone"})`}
              />
              {c === BLACK && (
                <circle
                  cx={cx - stoneR * 0.18}
                  cy={cy - stoneR * 0.22}
                  r={stoneR * 0.6}
                  fill="url(#gmBlackSpec)"
                />
              )}
              {isWin && (
                <circle
                  className="win-stone-ring"
                  cx={cx}
                  cy={cy}
                  r={stoneR}
                  fill="none"
                  stroke="#f5b94a"
                  strokeWidth={cell * 0.06}
                />
              )}
            </g>
          );
        })}

        {/* winning ink stroke (crisp, self-drawing) */}
        {winPath && (
          <line
            className="gomoku-win-line"
            x1={winPath.x1}
            y1={winPath.y1}
            x2={winPath.x2}
            y2={winPath.y2}
            stroke="#0a0807"
            strokeWidth={cell * 0.14}
            strokeLinecap="round"
            style={
              { ["--gm-len" as string]: `${winLen}` } as CSSProperties
            }
          />
        )}

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

        {/* hover preview */}
        {!state.finished && hover !== null && board[hover] === EMPTY && (
          <circle
            cx={px(hover % size)}
            cy={px(Math.floor(hover / size))}
            r={stoneR}
            fill={`url(#${state.turn === BLACK ? "gmBlackStone" : "gmWhiteStone"})`}
            opacity="0.45"
            style={{ pointerEvents: "none" }}
          />
        )}

        {/* hit areas */}
        {!state.finished &&
          board.map((_, i) => {
            const x = i % size;
            const y = Math.floor(i / size);
            const free = !occupied(i);
            return (
              <rect
                key={`hit${i}`}
                x={px(x) - cell / 2}
                y={px(y) - cell / 2}
                width={cell}
                height={cell}
                fill="transparent"
                style={{ cursor: free ? "pointer" : "default" }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onClick={() => (free ? onPlay(i) : flashIllegal(i))}
              />
            );
          })}

        {/* illegal hint */}
        {illegal && (
          <g
            key={`il-${illegal.key}`}
            className="illegal-flash"
            transform={`translate(${px(illegal.i % size)} ${px(
              Math.floor(illegal.i / size)
            )})`}
          >
            <circle r={stoneR} fill="none" stroke="#d8553a" strokeWidth={cell * 0.07} />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fill="#d8553a"
              fontSize={stoneR * 1.1}
              fontFamily="serif"
            >
              ×
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
