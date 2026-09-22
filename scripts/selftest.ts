import { createGame, playMove, isLegal, pass, undo, resign, finalScore, toggleDead, confirmScore } from "../src/go/engine";
import { scoreArea } from "../src/go/scoring";
import { BLACK, WHITE, EMPTY } from "../src/go/types";
import type { Color, GameState } from "../src/go/types";
import { indexToSgf, sgfToIndex, historyToSgf, extractLastMove } from "../src/ai/gnugo/sgf";
import * as gm from "../src/gomoku/engine";

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    failures++;
    console.error("  ✗ FAIL:", msg);
  } else {
    console.log("  ✓", msg);
  }
}

function raw(size: number, black: number[], white: number[], turn: Color, komi = 6.5): GameState {
  const g = createGame(size, komi);
  for (const i of black) g.board[i] = BLACK;
  for (const i of white) g.board[i] = WHITE;
  g.turn = turn;
  return g;
}
const idx = (x: number, y: number, s: number) => y * s + x;

console.log("\n[1] Basic single-stone capture");
{
  const g = createGame(9, 6.5);
  const moves = [1, 10, 9, 80, 11, 71, 19]; // B(1,0) W(1,1) B(0,1) W(8,8) B(2,1) W(8,7) B(1,2)
  let st = g;
  for (const m of moves) {
    const r = playMove(st, m);
    assert(r.ok, `move ${m} legal`);
    if (r.ok) st = r.state;
  }
  assert(st.board[10] === EMPTY, "white stone at (1,1) captured");
  assert(st.captures.black === 1, "black capture count = 1");
}

console.log("\n[2] Suicide is illegal");
{
  // white at (1,0) and (0,1); black to play corner (0,0) -> no liberties, no capture
  const g = raw(9, [], [1, 9], BLACK);
  const c = isLegal(g, 0);
  assert(!c.legal && c.reason === "suicide", "corner suicide blocked");
}

console.log("\n[3] Capture overrides suicide");
{
  // white group (1,0),(0,1),(1,1) with only liberty (0,0); black fills (0,0) -> captures 3
  const white = [1, 9, 10];
  const black = [2, 18, 11, 19];
  const g = raw(9, black, white, BLACK);
  const c = isLegal(g, 0);
  assert(c.legal, "filling the eye captures -> legal despite no own liberty");
  const r = playMove(g, 0);
  assert(r.ok && r.captured === 3, "captured exactly 3 white stones");
}

console.log("\n[4] Ko rule");
{
  // P=(2,1)=11 white captures Q=(1,1)=10 black; white P becomes single stone in atari -> ko
  const black = [12, 2, 20, 10]; // (3,1),(2,0),(2,2) + Q=(1,1)
  const white = [9, 1, 19]; // (0,1),(1,0),(1,2) — Q's other neighbors
  const g = raw(9, black, white, WHITE);
  const r = playMove(g, 11); // white (2,1) captures black (1,1)
  assert(r.ok && r.captured === 1, "white captures exactly one black");
  if (r.ok) {
    const after = r.state;
    assert(after.koPoint === 10, "ko point set to captured intersection (1,1)");
    const recapture = isLegal(after, 10);
    assert(!recapture.legal, "immediate black recapture blocked by ko");
    // black plays elsewhere, white passes, black recaptures -> allowed
    const elsewhere = playMove(after, 72); // black plays far away (0,8)
    assert(elsewhere.ok, "black plays elsewhere");
    if (elsewhere.ok) {
      const wp = pass(elsewhere.state);
      const back = playMove(wp.ok ? wp.state : elsewhere.state, 10); // black recaptures
      assert(back.ok && back.captured === 1, "recapture allowed after ko resolved");
    }
  }
}

console.log("\n[5] Scoring (territory + area) — 精确数值");
{
  // 5x5 komi=0：黑 8 子环围 (2,2)，白 16 子沿边一圈。
  // 唯一空点 (2,2) 只贴黑 -> 黑地 1；黑面积 8+1=9，白面积 16。
  const ring = [idx(1,1,5), idx(2,1,5), idx(3,1,5), idx(1,2,5), idx(3,2,5), idx(1,3,5), idx(2,3,5), idx(3,3,5)];
  const border: number[] = [];
  for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
    if (x === 0 || x === 4 || y === 0 || y === 4) border.push(idx(x, y, 5));
  }
  const g = raw(5, ring, border, BLACK, 0);
  const score = scoreArea(g);
  assert(score.blackStones === 8 && score.whiteStones === 16, `stones 8/16 (got ${score.blackStones}/${score.whiteStones})`);
  assert(score.blackTerritory === 1 && score.whiteTerritory === 0, `territory 1/0 (got ${score.blackTerritory}/${score.whiteTerritory})`);
  assert(score.blackArea === 9 && score.whiteArea === 16, `area 9/16 (got ${score.blackArea}/${score.whiteArea})`);
  assert(score.winner === WHITE && score.margin === 7, `white wins by 7 (got ${score.winner} margin ${score.margin})`);

  // 全盘死子：白边圈整圈标死 -> 死子点+中心全归黑地，白面积归零
  const g2 = raw(5, ring, border, BLACK, 0);
  g2.deadStones = [...border];
  const s2 = scoreArea(g2);
  assert(s2.deadWhite === 16 && s2.deadBlack === 0, `dead 16/0 (got ${s2.deadWhite}/${s2.deadBlack})`);
  assert(s2.blackTerritory === 17, `dead removed: black territory 17 (got ${s2.blackTerritory})`);
  assert(s2.blackArea === 25 && s2.whiteArea === 0, `dead removed: area 25/0 (got ${s2.blackArea}/${s2.whiteArea})`);
  assert(s2.winner === BLACK, "black wins after white border is dead");
}

console.log("\n[6] 两次虚着 -> 死子标记 -> 确认数子终局");
{
  // 黑三子一-group + 白一子；两次虚着进入标记阶段而非直接终局
  let st = raw(9, [0, 1, 9], [80], BLACK);
  const a = pass(st); assert(a.ok, "first pass ok");
  if (a.ok) st = a.state;
  assert(!st.finished && !st.marking, "one pass: neither finished nor marking");
  const b = pass(st); assert(b.ok, "second pass ok");
  if (b.ok) st = b.state;
  assert(st.marking && !st.finished, "two consecutive passes enter marking (not finished)");

  // 标记阶段锁盘：落子/虚手/合法性均拒绝
  const mv = playMove(st, 40);
  assert(!mv.ok && mv.reason === "marking", "playMove rejected during marking");
  const ps = pass(st);
  assert(!ps.ok && ps.reason === "marking", "pass rejected during marking");
  const lg = isLegal(st, 40);
  assert(!lg.legal && lg.reason === "marking", "isLegal returns marking=false");

  // toggleDead：整组切换；空点无操作；再点恢复
  const t1 = toggleDead(st, 0);
  assert(
    t1.deadStones.length === 3 && t1.deadStones.includes(0) && t1.deadStones.includes(1) && t1.deadStones.includes(9),
    "toggleDead marks the whole black group"
  );
  const t1s = t1.deadStones.join(",");
  assert(t1s === "0,1,9", `deadStones sorted (got ${t1s})`);
  const t2 = toggleDead(t1, 9);
  assert(t2.deadStones.length === 0, "toggleDead again revives the group");
  const t3 = toggleDead(st, 40);
  assert(t3 === st, "toggleDead on empty point is a no-op");

  // 标记不改变棋盘；确认后终局且死子计分生效
  const t4 = toggleDead(st, 80); // 白子标死
  const done = confirmScore(t4);
  assert(done.finished && !done.marking, "confirmScore finishes the game");
  const fs = finalScore(done);
  assert(fs.deadWhite === 1 && fs.winner === BLACK, "scored with dead white counted to black");

  // 标记阶段悔棋 = 退回最后一次虚手，继续对局
  const back = undo(st, 1);
  assert(!back.marking && back.consecutivePasses === 1, "undo exits marking, resumes play");
}

console.log("\n[7] Turn alternation & history");
{
  const g = createGame(9, 6.5);
  const r = playMove(g, 0);
  assert(r.ok && r.state.turn === WHITE, "turn passes to white after black move");
  assert(r.state.moveNumber === 1 && r.state.history.length === 1, "history recorded");
  assert(
    r.state.history[0].type === "move" &&
      r.state.history[0].index === 0,
    "history[0] is {type:'move', index:0}"
  );
}

console.log("\n[8] SGF 坐标往返（GnuGo 适配层）");
{
  // 9路天元 i=40 -> "ee"；左上 i=0 -> "aa"；右下 i=80 -> "ii"
  assert(indexToSgf(40, 9) === "ee", "9路 index 40 -> SGF 'ee' (天元)");
  assert(indexToSgf(0, 9) === "aa", "9路 index 0 -> 'aa' (左上)");
  assert(indexToSgf(80, 9) === "ii", "9路 index 80 -> 'ii' (右下)");
  // 19路 星位 (3,3)=60 -> "dd"；天元 (9,9)=180 -> "jj"
  assert(indexToSgf(60, 19) === "dd", "19路 (3,3) idx60 -> 'dd'");
  assert(indexToSgf(180, 19) === "jj", "19路天元 180 -> 'jj'");
  // 往返
  for (const i of [0, 40, 80, 13, 27]) {
    assert(sgfToIndex(indexToSgf(i, 9), 9) === i, `9路 i=${i} 往返一致`);
  }
  // 非法/空
  assert(sgfToIndex("", 9) === null, "空串 -> null (虚手)");
  assert(sgfToIndex("zz", 9) === null, "'zz' 非法 -> null");
  assert(sgfToIndex("a", 9) === null, "'a' 过短 -> null");
}

console.log("\n[9] SGF 不跳过字母 i（区别于 GTP）");
{
  // 第 9 列(index 8)应是 'i'，不是 'j'；GTP 会跳过 I
  assert(indexToSgf(8, 19) === "ia"[0] + "" + "a", "列8 首字母为 'i'");
  assert(sgfToIndex("ii", 19) === 8 * 19 + 8, "'ii' = (col8,row8)");
}

console.log("\n[10] historyToSgf 序列化");
{
  const g = createGame(9, 6.5);
  const moves = [40, 50, 41]; // B天元 W(f,5) B(f,4)
  let st: GameState = g;
  for (const m of moves) {
    const r = playMove(st, m);
    if (r.ok) st = r.state;
  }
  const sgf = historyToSgf(st);
  assert(sgf.startsWith("(;GM[1]FF[4]SZ[9]KM[6.5]"), "SGF 头含 GM/FF/SZ/KM");
  assert(sgf.includes(";B[ee]"), "第1手 B[ee]");
  assert(sgf.includes(";W[ff]"), "第2手 W[ff]");
  assert(sgf.includes(";B[fe]"), "第3手 B[fe]");
  assert(sgf.endsWith(")"), "SGF 以 ')' 收尾");
}

console.log("\n[11] extractLastMove 解析 GnuGo 回包");
{
  const sample = "(;GM[1]FF[4]\nSZ[9]\n;B[ee]C[x];W[ff])";
  assert(extractLastMove(sample) === "ff", "取最后一手 W[ff]");
  const withPass = "(;GM[1]SZ[9];B[ee];W[])";
  assert(extractLastMove(withPass) === null, "空括号=虚手 -> null");
}

console.log("\n[12] 虚手进 history：undo / replay / SGF 颜色");
{
  // 序列：B(0) -> W 虚手 -> B(1) -> W 虚手 -> B(2)
  // 历史遗留 bug：pass 不进 history，导致 moveNumber 与 history.length 偏离，
  // undo 切片错位、SGF 颜色错位。修复后应全部正确。
  let st = createGame(9, 6.5);
  const b1 = playMove(st, 0); assert(b1.ok, "B(0,0) legal");
  if (b1.ok) st = b1.state;
  const wp1 = pass(st); assert(wp1.ok, "W pass legal");
  if (wp1.ok) st = wp1.state;
  const b2 = playMove(st, 1); assert(b2.ok, "B(1,0) legal after white pass");
  if (b2.ok) st = b2.state;
  const wp2 = pass(st); assert(wp2.ok, "W pass legal");
  if (wp2.ok) st = wp2.state;
  const b3 = playMove(st, 2); assert(b3.ok, "B(2,0) legal after white pass");
  if (b3.ok) st = b3.state;

  // moveNumber 与 history.length 始终相等
  assert(
    st.moveNumber === st.history.length,
    `moveNumber(${st.moveNumber}) === history.length(${st.history.length})`
  );
  // 5 拍 = 3 落子 + 2 虚手
  assert(st.history.length === 5, "history records 5 actions (3 moves + 2 passes)");
  assert(st.history[1].type === "pass", "history[1] is pass");
  assert(st.history[2].type === "move" && st.history[2].index === 1, "history[2] is B(1,0)");

  // 悔 1 手：target=5-1=4，回放 [m0, pass, m1, pass]，停在 W 第二次虚手之后
  // 关键回归点：原 bug 里 pass 不进 history，target=4 会切到 history(长度3)之外，
  // 实际回放全部 3 手，相当于"悔 0 手"。修复后应正确回退到 moveNumber=4。
  const after1 = undo(st, 1);
  assert(
    after1.moveNumber === 4 && after1.turn === BLACK,
    "undo 1 step: moveNumber=4, black to move (after white pass)"
  );
  assert(
    after1.consecutivePasses === 1,
    "undo 1 step: consecutivePasses restored to 1"
  );
  assert(after1.history.length === 4, "undo 1 step: history.length=4");

  // 悔 2 手：跨虚手 target=3，回放 [m0, pass, m1]，停在 B(1,0) 之后
  const after2 = undo(st, 2);
  assert(
    after2.moveNumber === 3 && after2.turn === WHITE,
    "undo across pass: moveNumber=3, white to move"
  );
  assert(after2.consecutivePasses === 0, "undo 2 steps: consecutivePasses=0");
  assert(
    after2.history[2].type === "move" && after2.history[2].index === 1,
    "undo 2 steps: last action is B(1,0)"
  );

  // SGF：中途虚手后颜色不错位。预期：B[aa] W[] B[ba] W[] B[ca]
  const sgf = historyToSgf(st);
  assert(sgf.includes(";B[aa];W[];B[ba];W[];B[ca]"), "SGF alternates correctly with mid passes");
}

console.log("\n[13] 认输结算：winner 是对方，resigned 是认输方");
{
  // 回归保护：早期 bug 把 score.winner 当作「认输方」传给文案，导致显示反了。
  // 修复后 Score 带 resigned 字段，UI 应以 score.resigned 为「认输方」。
  let st = createGame(9, 6.5);
  const b1 = playMove(st, 0); if (b1.ok) st = b1.state;  // 黑下，轮到白
  const resigned = resign(st);  // 白认输
  const score = finalScore(resigned);
  assert(score.reason === "resign", "reason === 'resign'");
  assert(score.resigned === WHITE, "resigned === WHITE (认输方)");
  assert(score.winner === BLACK, "winner === BLACK (胜方 = 对方)");
  assert(score.resigned !== score.winner, "resigned !== winner (关键不变式)");
}

console.log("\n[14] 打劫误报：提一子但己方两气时不应设 koPoint");
{
  // 黑 (2,1) 三面被白围、仅剩 (3,1) 一口气。白下 (3,1) 提 1 子，
  // 但白新子提完后有 (2,1)+(4,1) 两口气——不是打劫形状，koPoint 必须为 null。
  const g = raw(9, [idx(2,1,9)], [idx(1,1,9), idx(2,0,9), idx(2,2,9)], WHITE);
  const r = playMove(g, idx(3,1,9));
  assert(r.ok && r.captured === 1, "white captures exactly one black stone");
  if (r.ok) {
    assert(r.state.koPoint === null, `koPoint stays null with 2 liberties (got ${r.state.koPoint})`);
  }
}

console.log("\n[15] 五子棋引擎：连珠判定 / 占位 / 悔棋 / 满盘和棋");
{
  // 横向五连：黑白交替，黑在行 2 的 x=3..7 落子（白随手挡一处也保持交替）
  let st = gm.createGame(15);
  const blackMoves = [idx(3,2,15), idx(4,2,15), idx(5,2,15), idx(6,2,15), idx(7,2,15)];
  const whiteMoves = [idx(3,3,15), idx(4,3,15), idx(5,3,15), idx(6,3,15), idx(7,3,15)];
  let won = false;
  for (let k = 0; k < 5 && !won; k++) {
    const rb = gm.playMove(st, blackMoves[k]);
    assert(rb.ok, `gomoku black move ${k} ok`);
    if (rb.ok) {
      st = rb.state;
      if (rb.won) { won = true; break; }
    }
    if (k < 4) {
      const rw = gm.playMove(st, whiteMoves[k]);
      assert(rw.ok, `gomoku white move ${k} ok`);
      if (rw.ok) st = rw.state;
    }
  }
  assert(st.finished && st.winner === 1, "black wins with horizontal five");
  assert(st.winLine !== null && st.winLine.length === 5, `winLine has 5 stones (got ${st.winLine?.length})`);

  // 占位非法
  const occ = gm.playMove(st, blackMoves[0]);
  assert(!occ.ok && occ.reason === "finished", "finished board rejects further moves");

  // 悔棋退回到第 9 手（第五枚黑子落下前）
  let st2 = gm.createGame(15);
  for (let k = 0; k < 4; k++) {
    st2 = gm.playMove(st2, blackMoves[k]).state;
    st2 = gm.playMove(st2, whiteMoves[k]).state;
  }
  const back = gm.undo(st2, 1);
  assert(back.moveNumber === 7 && back.turn === 2, `gomoku undo restores moveNumber/turn (got ${back.moveNumber}/${back.turn})`);

  // 斜向四连不成五：白棋在角落斜四 + 黑先手拦截点外落子后游戏继续
  let st3 = gm.createGame(9);
  const seq3 = [
    idx(0,0,9), idx(8,0,9),
    idx(1,1,9), idx(7,1,9),
    idx(2,2,9), idx(6,2,9),
    idx(3,3,9), idx(5,3,9),
  ];
  for (const m of seq3) st3 = gm.playMove(st3, m).state;
  assert(!st3.finished, "diagonal four is not a win yet");
  const win = gm.playMove(st3, idx(4,4,9));
  assert(win.ok && win.won && win.state.winLine !== null, "fifth diagonal stone wins");

  // 5x5 满盘无五连 -> 和棋。棋盘格的主对角线恰好同色，需交换 (2,2)/(3,2)
  // 破坏两条长对角线后再按黑白交替的顺序填满。
  let st4 = gm.createGame(5);
  const cellsB: number[] = [];
  const cellsW: number[] = [];
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      let isB = (x + y) % 2 === 0;
      if (x === 2 && y === 2) isB = false;
      if (x === 3 && y === 2) isB = true;
      (isB ? cellsB : cellsW).push(idx(x, y, 5));
    }
  }
  const order: number[] = [];
  for (let k = 0; k < 25; k++) order.push(k % 2 === 0 ? cellsB[k / 2] : cellsW[(k - 1) / 2]);
  for (const m of order) {
    const r = gm.playMove(st4, m);
    if (!r.ok) break;
    st4 = r.state;
    if (st4.finished) break;
  }
  assert(st4.finished && st4.winner === "tie", `full board without five-in-a-row is a tie (winner=${st4.winner})`);
}

if (failures === 0) {
  console.log("\n=== ALL ENGINE TESTS PASSED ===\n");
} else {
  console.error(`\n=== ${failures} TEST(S) FAILED ===\n`);
  process.exit(1);
}
