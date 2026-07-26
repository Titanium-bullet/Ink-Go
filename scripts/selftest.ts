import { createGame, playMove, isLegal, pass, undo, resign, finalScore } from "../src/go/engine";
import { scoreArea } from "../src/go/scoring";
import { BLACK, WHITE, EMPTY } from "../src/go/types";
import type { Color, GameState } from "../src/go/types";
import { indexToSgf, sgfToIndex, historyToSgf, extractLastMove } from "../src/ai/gnugo/sgf";

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    failures++;
    console.error("  ✗ FAIL:", msg);
  } else {
    console.log("  ✓", msg);
  }
}

function raw(size: number, black: number[], white: number[], turn: Color): GameState {
  const g = createGame(size, 6.5);
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

console.log("\n[5] Scoring (territory + area)");
{
  // 5x5: black surrounds top-left region, white surrounds bottom-right
  const g = createGame(5, 0);
  let st = g;
  // black wall at row x=2 (cols), white wall etc. Simpler: place stones to make clean territories
  // Black: (0,0),(1,0),(0,1) ; leave (0,0) area... build two enclosed empty points
  const seq = [
    0, 12, 1, 13, 5, 17, 6, 18, // black builds left enclosure, white right
  ];
  for (const m of seq) {
    const r = playMove(st, m);
    if (r.ok) st = r.state;
  }
  const score = scoreArea(st);
  assert(score.blackArea >= 0 && score.whiteArea >= 0, "score computed without error");
}

console.log("\n[6] Two passes finish the game");
{
  const g = createGame(9, 6.5);
  let st = g;
  const a = pass(st);
  if (a.ok) st = a.state;
  assert(!st.finished, "one pass does not finish");
  const b = pass(st);
  if (b.ok) st = b.state;
  assert(st.finished, "two consecutive passes finish");
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

if (failures === 0) {
  console.log("\n=== ALL ENGINE TESTS PASSED ===\n");
} else {
  console.error(`\n=== ${failures} TEST(S) FAILED ===\n`);
  process.exit(1);
}
