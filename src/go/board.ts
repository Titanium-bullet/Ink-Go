// 盘面基础算法：邻点与棋组 flood fill。engine / scoring / groups 共用，
// 避免各自维护一份漂移的邻居推导。
import { Color, EMPTY } from "./types";

export function neighbors(i: number, size: number): number[] {
  const x = i % size;
  const y = Math.floor(i / size);
  const out: number[] = [];
  if (x > 0) out.push(i - 1);
  if (x < size - 1) out.push(i + 1);
  if (y > 0) out.push(i - size);
  if (y < size - 1) out.push(i + size);
  return out;
}

export interface Group {
  stones: number[];
  liberties: Set<number>;
}

// BFS 用游标代替 shift() 出队（shift 是 O(n)，大组会退化成 O(n²)）。
export function getGroup(board: Color[], start: number, size: number): Group {
  const color = board[start];
  const stones: number[] = [];
  const liberties = new Set<number>();
  if (color === EMPTY) return { stones, liberties };
  const visited = new Set<number>([start]);
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head];
    stones.push(i);
    for (const n of neighbors(i, size)) {
      if (board[n] === EMPTY) {
        liberties.add(n);
      } else if (board[n] === color && !visited.has(n)) {
        visited.add(n);
        queue.push(n);
      }
    }
  }
  return { stones, liberties };
}
