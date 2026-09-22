import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BLACK, Color, EMPTY, GameState } from "../../go/types";
import { isLegal } from "../../go/engine";
import { useT } from "../../i18n/LanguageContext";
import { useWallet } from "../../state/wallet";
import { InkBeasts } from "./InkBeasts";
import {
  BoardCoords,
  BoardDefs,
  BoardGrid,
  BoardPaper,
  BoardStars,
  VIEW,
  boardGeom,
} from "./boardChrome";
import { MATERIALS } from "../board/materials";

const LETTERS = "ABCDEFGHJKLMNOPQRST";

/** 散墨动画时长：JS 定时清理与 CSS burst-* 动画共用，改这里即可（勿再回 CSS 硬编码） */
const BURST_MS = 700;
/** 墨涌时长：主浪 1400ms + 回声延迟 260ms，动画结束后再清 state */
const DRAGON_WAVE_MS = 1700;

interface Fleck {
  /** 飞溅墨点的落点偏移（SVG 用户单位），生成时定死，渲染保持纯函数 */
  dx: number;
  dy: number;
  r: number;
}

interface Burst {
  i: number;
  color: number;
  key: number;
  flecks: Fleck[];
}

/** 墨涌 · 屠龙：单手提走 ≥4 子时的全盘墨浪，锚定提子群质心（棋盘索引坐标） */
interface DragonWave {
  cx: number;
  cy: number;
  key: number;
}

// 棋子层：只依赖盘面与死子标记。hover / 提示闪烁不再触发整层 diff。
// lastMove 仅在真实落子（board 引用变化）时随之更新，不引入额外重渲染。
const GoStones = memo(function GoStones({
  board,
  size,
  deadStones,
  rim,
  lastMove,
}: {
  board: Color[];
  size: number;
  deadStones: number[];
  rim: { color: string; width: number } | null;
  lastMove: number | null;
}) {
  const { px, stoneR } = boardGeom(size);
  const dead = useMemo(() => new Set(deadStones), [deadStones]);
  return (
    <g>
      {board.map((c, i) => {
        if (c === EMPTY) return null;
        const cx = px(i % size);
        const cy = px(Math.floor(i / size));
        const isDead = dead.size > 0 && dead.has(i);
        return (
          <g
            key={`st${i}`}
            filter={c === BLACK ? "url(#stoneShadow)" : "url(#jadeGlow)"}
            opacity={isDead ? 0.38 : undefined}
            className={isDead ? "dead-stone" : i === lastMove ? "stone-drop" : undefined}
          >
            <circle cx={cx} cy={cy} r={stoneR} fill={`url(#${c === BLACK ? "blackStone" : "whiteStone"})`} />
            {c === BLACK && (
              <circle cx={cx - stoneR * 0.18} cy={cy - stoneR * 0.22} r={stoneR * 0.6} fill="url(#blackSpec)" />
            )}
            {c === BLACK && rim && (
              <circle cx={cx} cy={cy} r={stoneR - 0.8} fill="none" stroke={rim.color} strokeWidth={rim.width} />
            )}
            {isDead && (
              <circle
                cx={cx}
                cy={cy}
                r={stoneR * 0.62}
                fill="none"
                stroke="#b3402e"
                strokeWidth={stoneR * 0.16}
                opacity="0.85"
                style={{ pointerEvents: "none" }}
              />
            )}
          </g>
        );
      })}
    </g>
  );
});

// 落子命中层：只依赖合法点表与回调。hover 状态收敛在这层内部，
// 悬停时只有幽灵子重绘，棋子/网格/坐标全部跳过。
const HitLayer = memo(function HitLayer({
  size,
  legalMap,
  turn,
  onPlay,
  onIllegal,
  rim,
}: {
  size: number;
  legalMap: Uint8Array;
  turn: Color;
  onPlay: (i: number) => void;
  onIllegal: (i: number, reason: string) => void;
  rim: { color: string; width: number } | null;
}) {
  const { cell, px, stoneR } = boardGeom(size);
  const [hover, setHover] = useState<number | null>(null);
  return (
    <g>
      {hover !== null && legalMap[hover] === 1 && (
        <g style={{ pointerEvents: "none" }}>
          <circle
            cx={px(hover % size)}
            cy={px(Math.floor(hover / size))}
            r={stoneR}
            fill={`url(#${turn === BLACK ? "blackStone" : "whiteStone"})`}
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
      {Array.from(legalMap).map((legal, i) => {
        if (!legal) {
          // 非法点也保留 hit rect：点击时给出打劫/自杀提示
          return (
            <rect
              key={`hit${i}`}
              x={px(i % size) - cell / 2}
              y={px(Math.floor(i / size)) - cell / 2}
              width={cell}
              height={cell}
              fill="transparent"
              onClick={() => onIllegal(i, "hint")}
            />
          );
        }
        return (
          <rect
            key={`hit${i}`}
            x={px(i % size) - cell / 2}
            y={px(Math.floor(i / size)) - cell / 2}
            width={cell}
            height={cell}
            fill="transparent"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onPlay(i)}
          />
        );
      })}
    </g>
  );
});

// 死子标记层：点棋子整组切换死/活。空点不可交互。
const MarkHitLayer = memo(function MarkHitLayer({
  board,
  size,
  onToggleDead,
}: {
  board: Color[];
  size: number;
  onToggleDead: (i: number) => void;
}) {
  const { cell, px } = boardGeom(size);
  return (
    <g>
      {board.map((c, i) =>
        c === EMPTY ? null : (
          <rect
            key={`mk${i}`}
            x={px(i % size) - cell / 2}
            y={px(Math.floor(i / size)) - cell / 2}
            width={cell}
            height={cell}
            fill="transparent"
            style={{ cursor: "pointer" }}
            onClick={() => onToggleDead(i)}
          />
        )
      )}
    </g>
  );
});

export function Goban({
  state,
  onPlay,
  onToggleDead,
  flavor = true,
  locked = false,
}: {
  state: GameState;
  onPlay: (i: number) => void;
  /** 死子标记阶段：点棋子切换死/活（由 state.marking 自动启用） */
  onToggleDead?: (i: number) => void;
  flavor?: boolean;
  /** 锁定棋盘（AI 思考中 / AI 回合）：禁用落子与悬停 */
  locked?: boolean;
}) {
  const { size, board, moveNumber } = state;
  const t = useT();
  const { equippedBoard } = useWallet();
  const mat = MATERIALS[equippedBoard];
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [stains, setStains] = useState<Burst[]>([]);
  const [dragon, setDragon] = useState<DragonWave | null>(null);
  const [illegal, setIllegal] = useState<{ i: number; label: string; key: number } | null>(null);
  const prevBoard = useRef<Color[] | null>(null);
  const prevMove = useRef(0);
  const flashTimer = useRef<number | null>(null);

  const { cell, px, stoneR } = boardGeom(size);
  const marking = state.marking;

  // SMIL（灵泉星位涟漪）不受 CSS `.is-offscreen` 暂停管辖：
  // 标签页隐藏或棋盘滚出视口时手动 pauseAnimations，
  // 避免 9 星位 × 2 个无限 SMIL 动画在无人观看时空转
  const svgRef = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    let pageVisible = !document.hidden;
    let boardInView = true;
    const sync = () => {
      if (pageVisible && boardInView) svg.unpauseAnimations();
      else svg.pauseAnimations();
    };
    const onVis = () => {
      pageVisible = !document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVis);
    const io = new IntersectionObserver(([entry]) => {
      boardInView = entry.isIntersecting;
      sync();
    });
    io.observe(svg);
    sync();
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      io.disconnect();
    };
  }, []);

  // 合法落点查表：以 state 为依赖缓存。hover/burst/illegal 触发的重渲染不会重算，
  // 落子后 state 换引用才重建一次。19×19 从「每帧 361×5 BFS + 361 次数组拷贝」
  // 降到「落子后一次同样计算，渲染时纯查表」。
  const legalMap = useMemo(() => {
    const m = new Uint8Array(board.length);
    if (state.finished || state.marking) return m;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === EMPTY && isLegal(state, i).legal) m[i] = 1;
    }
    return m;
  }, [state]);

  const handleIllegal = useCallback(
    (i: number, _kind: string) => {
      // 点击非法点时才花一次 isLegal 拿原因（打劫/自杀提示）
      const check = isLegal(state, i);
      const reason = check.reason ?? "";
      const label =
        reason === "ko"
          ? t.illegal.ko
          : reason === "suicide"
            ? t.illegal.suicide
            : t.illegal.other;
      setIllegal({ i, label, key: Date.now() });
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setIllegal(null), 900);
    },
    [state, t]
  );

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
          // 飞溅墨点：随机方向/远近在触发时一次性生成并冻结进 state，
          // 重渲染不会重新掷骰子
          const flecks: Fleck[] = Array.from({ length: 3 + (Math.random() < 0.5 ? 1 : 0) }, () => {
            const ang = Math.random() * Math.PI * 2;
            const dist = cell * (0.55 + Math.random() * 0.75);
            return { dx: Math.cos(ang) * dist, dy: Math.sin(ang) * dist, r: cell * (0.05 + Math.random() * 0.06) };
          });
          found.push({ i, color: prev[i], key: moveNumber, flecks });
        }
      }
      if (found.length) {
        setBursts(found);
        // 提子墨痕：提走的位置留一抹渐隐的淡痕，延展「被提走」的叙事
        setStains(found);
        prevBoard.current = board;
        prevMove.current = moveNumber;
        // 屠龙判定：单手提走 ≥4 子，全盘墨浪自提子群质心涌起。
        // 墨涌属「墨境特效包」彩蛋，与墨兽同受 flavor 门控（未购包/关闭时不触发）
        if (found.length >= 4 && flavor) {
          const cx = found.reduce((s, b) => s + (b.i % size), 0) / found.length;
          const cy = found.reduce((s, b) => s + Math.floor(b.i / size), 0) / found.length;
          setDragon({ cx, cy, key: moveNumber });
        }
        const id = window.setTimeout(() => setBursts([]), BURST_MS);
        const stainId = window.setTimeout(() => setStains([]), 1800);
        const waveId = window.setTimeout(() => setDragon(null), DRAGON_WAVE_MS);
        return () => {
          window.clearTimeout(id);
          window.clearTimeout(stainId);
          window.clearTimeout(waveId);
        };
      }
    }
    prevBoard.current = board;
    prevMove.current = moveNumber;
  }, [board, moveNumber, cell, flavor]);

  const lastColor = state.lastMove !== null ? board[state.lastMove] : EMPTY;

  return (
    <div className="goban-wrap">
      <svg
        ref={svgRef}
        className="goban"
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        role="img"
        aria-label={t.aria.board}
      >
        <BoardDefs p="" theme={equippedBoard} />
        <BoardPaper p="" theme={equippedBoard} />
        <BoardGrid size={size} theme={equippedBoard} />
        <BoardStars size={size} kind="go" flavor={flavor} theme={equippedBoard} />
        <BoardCoords size={size} letters={LETTERS} theme={equippedBoard} />

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

        {/* last move ring 最后一手金圈：收缩定格后常驻，
            直到下一手落下（key 变化）才移走——快速定位刚落的子 */}
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

        <GoStones board={board} size={size} deadStones={marking ? state.deadStones : EMPTY_DEAD} rim={mat.blackRim} lastMove={state.lastMove} />

        {/* placement ripple 墨晕扩散：双圈错相，水滴入水 */}
        {state.lastMove !== null && (
          <g key={`ripple-${moveNumber}`}>
            <circle
              className="ink-ripple"
              cx={px(state.lastMove % size)}
              cy={px(Math.floor(state.lastMove / size))}
              r={stoneR}
              fill={lastColor === BLACK ? "#1a1410" : "#f4efe4"}
            />
            <circle
              className="ink-ripple ink-ripple--echo"
              cx={px(state.lastMove % size)}
              cy={px(Math.floor(state.lastMove / size))}
              r={stoneR * 0.6}
              fill={lastColor === BLACK ? "#1a1410" : "#f4efe4"}
            />
          </g>
        )}

        {/* capture bursts 散墨：黑方爆墨、白方化雾，飞溅墨点随机散开 */}
        {bursts.map((b) => {
          const cx = px(b.i % size);
          const cy = px(Math.floor(b.i / size));
          const col = b.color === BLACK ? "#0a0807" : "#f4efe4";
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
              {b.flecks.map((f, fi) => (
                <circle
                  key={`fleck-${fi}`}
                  className="burst-fleck"
                  cx={cx}
                  cy={cy}
                  r={f.r}
                  fill={col}
                  style={{ "--dx": `${f.dx}px`, "--dy": `${f.dy}px` } as React.CSSProperties}
                />
              ))}
            </g>
          );
        })}

        {/* capture stains 提子墨痕：淡痕渐隐，比散墨活得更久 */}
        {stains.map((b) => (
          <circle
            key={`stain-${b.i}-${b.key}`}
            className="burst-stain"
            cx={px(b.i % size)}
            cy={px(Math.floor(b.i / size))}
            r={stoneR * 0.6}
            fill={b.color === BLACK ? "#0a0807" : "#f4efe4"}
          />
        ))}

        {/* 墨涌 · 屠龙：单手大提子，全盘墨浪自提子群涌起翻卷 */}
        {dragon && (
          <g key={`dragon-${dragon.key}`} style={{ pointerEvents: "none" }}>
            <circle
              className="dragon-wave"
              cx={px(dragon.cx)}
              cy={px(dragon.cy)}
              r={VIEW * 0.52}
            />
            <circle
              className="dragon-wave dragon-wave--echo"
              cx={px(dragon.cx)}
              cy={px(dragon.cy)}
              r={VIEW * 0.52}
            />
          </g>
        )}

        {/* ink beasts 墨兽 (thickness / liberty visualization) */}
        {flavor && !marking && <InkBeasts state={state} cell={cell} px={px} />}

        {/* 落子 / 死子标记 交互层 */}
        {marking ? (
          onToggleDead && <MarkHitLayer board={board} size={size} onToggleDead={onToggleDead} />
        ) : (
          !locked &&
          !state.finished && (
            <HitLayer
              size={size}
              legalMap={legalMap}
              turn={state.turn}
              onPlay={onPlay}
              onIllegal={handleIllegal}
              rim={mat.blackRim}
            />
          )
        )}

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

const EMPTY_DEAD: number[] = [];
