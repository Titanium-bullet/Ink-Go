import { MiniGoban } from "../board/MiniGoban";
import { useWallet } from "../../state/wallet";

// 15 路盘面示意局：真实「花月」定式主线（连珠黑必胜开局 D4）。
// 手序（列 a-o，行 1-15）：1.h8 2.h9 3.i9 4.i8 5.j7 6.g8 7.j9 8.j10
// 9.j8(冲三) 10.j6 11.i7(双活二) 12.k9 13.k7(双活三) 14.h7 15.h10(活四)
// 16.l6 17.g11 —— 黑沿 g11-k7 斜线五连制胜，白每手均为贴线正常防守。
const BLACK: [number, number][] = [
  [7, 7], [8, 8], [9, 6], [9, 8], [9, 7], [8, 6], [10, 6], [7, 9], [6, 10],
];
const WHITE: [number, number][] = [
  [7, 8], [8, 7], [6, 7], [9, 9], [9, 5], [10, 8], [7, 6], [11, 5],
];
const WIN = { from: [10, 6] as [number, number], to: [6, 10] as [number, number] };

/** DLC 预览棋盘：跟随已装备盘面皮肤（等于商品展示位） */
export function GomokuInkPreview() {
  const { equippedBoard } = useWallet();
  return (
    <div className="dlc-preview" aria-hidden="true">
      <MiniGoban p="dlc" lines={15} theme={equippedBoard} black={BLACK} white={WHITE} win={WIN} />
    </div>
  );
}
