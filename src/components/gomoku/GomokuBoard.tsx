import { memo, useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { BLACK, EMPTY } from "../../go/types";
import { GomokuState } from "../../gomoku/types";
import { useT } from "../../i18n/LanguageContext";
import { useWallet } from "../../state/wallet";
import {
  BoardCoords,
  BoardDefs,
  BoardGrid,
  BoardPaper,
  BoardStars,
  VIEW,
  boardGeom,
} from "../game/boardChrome";
import { MATERIALS } from "../board/materials";

const LETTERS = "ABCDEFGHIJKLMNO";
const P = "gm"; // 两盘同屏时（落地页）SVG id 前缀防撞

// 棋子层：只依赖盘面与胜线。hover 不再触发整层 diff。
const GmStones = memo(function GmStones({
  board,
  size,
  winLine,
  ringColor,
  rim,
  lastMove,
}: {
  board: number[];
  size: number;
  winLine: number[] | null;
  ringColor: string;
  rim: { color: string; width: number } | null;
  lastMove: number | null;
}) {
  const { cell, px, stoneR } = boardGeom(size);
  return (
    <g>
      {board.map((c, i) => {
        if (c === EMPTY) return null;
        const cx = px(i % size);
        const cy = px(Math.floor(i / size));
        const isWin = winLine?.includes(i);
        return (
          <g
            key={`st${i}`}
            filter={c === BLACK ? `url(#${P}stoneShadow)` : `url(#${P}jadeGlow)`}
            className={i === lastMove ? "stone-drop" : undefined}
          >
            <circle
              cx={cx}
              cy={cy}
              r={stoneR}
              fill={`url(#${P}${c === BLACK ? "blackStone" : "whiteStone"})`}
            />
            {c === BLACK && (
              <circle
                cx={cx - stoneR * 0.18}
                cy={cy - stoneR * 0.22}
                r={stoneR * 0.6}
                fill={`url(#${P}blackSpec)`}
              />
            )}
            {c === BLACK && rim && (
              <circle
                cx={cx}
                cy={cy}
                r={stoneR - 0.8}
                fill="none"
                stroke={rim.color}
                strokeWidth={rim.width}
              />
            )}
            {isWin && (
              <circle
                className="win-stone-ring"
                cx={cx}
                cy={cy}
                r={stoneR + cell * 0.08}
                fill="none"
                stroke={ringColor}
                strokeWidth={cell * 0.05}
              />
            )}
          </g>
        );
      })}
    </g>
  );
});

export function GomokuBoard({
  state,
  onPlay,
}: {
  state: GomokuState;
  onPlay: (i: number) => void;
}) {
  const t = useT();
  const { equippedBoard } = useWallet();
  const mat = MATERIALS[equippedBoard];
  const { size, board, moveNumber, winLine } = state;
  const [illegal, setIllegal] = useState<{ i: number; key: number } | null>(null);
  const flashTimer = useRef<number | null>(null);

  // 卸载时清掉未触发的非法提示定时器，避免 setState on unmounted
  useEffect(() => {
    return () => {
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    };
  }, []);

  const { cell, px, stoneR } = boardGeom(size);

  const flashIllegal = useCallback((i: number) => {
    setIllegal({ i, key: Date.now() });
    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => {
      setIllegal(null);
      flashTimer.current = null;
    }, 900);
  }, []);

  const lastColor = state.lastMove !== null ? board[state.lastMove] : EMPTY;

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
      >
        <BoardDefs p={P} theme={equippedBoard} />
        <defs>
          {/* 赢线柔底光：随连线方向旋转的椭圆晕（替代旧荧光棒横条） */}
          <radialGradient id={`${P}winGlow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={mat.win.glow} stopOpacity={mat.win.glowOp} />
            <stop offset="100%" stopColor={mat.win.glow} stopOpacity="0" />
          </radialGradient>
        </defs>
        <BoardPaper p={P} theme={equippedBoard} />
        <BoardGrid size={size} theme={equippedBoard} />
        <BoardStars size={size} kind="gomoku" flavor={false} theme={equippedBoard} p={P} />
        <BoardCoords size={size} letters={LETTERS} theme={equippedBoard} />

        {/* winning soft glow (under stones) */}
        {winPath && (
          <ellipse
            cx={(winPath.x1 + winPath.x2) / 2}
            cy={(winPath.y1 + winPath.y2) / 2}
            rx={winLen / 2 + cell * 1.7}
            ry={cell * 1.5}
            fill={`url(#${P}winGlow)`}
            transform={`rotate(${(Math.atan2(winPath.y2 - winPath.y1, winPath.x2 - winPath.x1) * 180) / Math.PI} ${(winPath.x1 + winPath.x2) / 2} ${(winPath.y1 + winPath.y2) / 2})`}
          />
        )}

        {/* last move ring 最后一手金圈：常驻至下一手落下（key 变化） */}
        {state.lastMove !== null && (
          <circle
            key={`ring-${moveNumber}`}
            className="last-ring"
            cx={px(state.lastMove % size)}
            cy={px(Math.floor(state.lastMove / size))}
            r={stoneR * 1.14}
            fill="none"
            stroke="#d8b36e"
            strokeWidth={cell * 0.055}
            opacity="0.9"
          />
        )}

        <GmStones board={board} size={size} winLine={winLine} ringColor={mat.win.ring} rim={mat.blackRim} lastMove={state.lastMove} />

        {/* winning ink stroke (crisp, self-drawing) */}
        {winPath && (
          <line
            className="gomoku-win-line"
            x1={winPath.x1}
            y1={winPath.y1}
            x2={winPath.x2}
            y2={winPath.y2}
            stroke={mat.win.line}
            strokeWidth={cell * 0.115}
            strokeLinecap="round"
            style={{ ["--gm-len" as string]: `${winLen}` } as CSSProperties}
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

        {/* hit areas：hover 幽灵子收敛在此，棋子层不受影响 */}
        {!state.finished && (
          <GmHitLayer state={state} onPlay={onPlay} onIllegal={flashIllegal} rim={mat.blackRim} />
        )}

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

const GmHitLayer = memo(function GmHitLayer({
  state,
  onPlay,
  onIllegal,
  rim,
}: {
  state: GomokuState;
  onPlay: (i: number) => void;
  onIllegal: (i: number) => void;
  rim: { color: string; width: number } | null;
}) {
  const { board, size, turn } = state;
  const { cell, px, stoneR } = boardGeom(size);
  const [hover, setHover] = useState<number | null>(null);
  const occupied = (i: number) => board[i] !== EMPTY;
  return (
    <g>
      {hover !== null && board[hover] === EMPTY && (
        <g style={{ pointerEvents: "none" }}>
          <circle
            cx={px(hover % size)}
            cy={px(Math.floor(hover / size))}
            r={stoneR}
            fill={`url(#${P}${turn === BLACK ? "blackStone" : "whiteStone"})`}
            opacity="0.45"
          />
          {turn === BLACK && rim && (
            <circle
              cx={px(hover % size)}
              cy={px(Math.floor(hover / size))}
              r={stoneR - 0.8}
              fill="none"
              stroke={rim.color}
              strokeWidth={rim.width}
              opacity="0.45"
            />
          )}
        </g>
      )}
      {board.map((_, i) => {
        const free = !occupied(i);
        return (
          <rect
            key={`hit${i}`}
            x={px(i % size) - cell / 2}
            y={px(Math.floor(i / size)) - cell / 2}
            width={cell}
            height={cell}
            fill="transparent"
            style={{ cursor: free ? "pointer" : "default" }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onClick={() => (free ? onPlay(i) : onIllegal(i))}
          />
        );
      })}
    </g>
  );
});
