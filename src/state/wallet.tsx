import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { BoardTheme } from "../components/board/materials";
import { format, useT } from "../i18n/LanguageContext";

/**
 * 文钱钱包：余额 / 已购商品 / 已装备盘面，localStorage 单键持久化。
 * 形态与 LanguageContext 一致：模块私有 context + 抛错 hook +
 * lazy init 读取 + setter 内写入（try/catch 防隐私模式）。
 * 获取规则：仅每日登录可领 30 文（在墨阁内手动领取），对局不产出文钱。
 */

export type ProductId = "gomoku-dlc" | "skin-paper" | "skin-lacquer" | "ink-effects";

export const PRODUCTS: Record<ProductId, { price: number }> = {
  "gomoku-dlc": { price: 60 },
  "skin-paper": { price: 60 },
  "skin-lacquer": { price: 100 },
  "ink-effects": { price: 80 },
};

export const DAILY_REWARD = 30;

const STORAGE_KEY = "inkgo-wallet-v1";

interface WalletState {
  balance: number;
  owned: ProductId[];
  equippedBoard: BoardTheme;
  /** 最近一次领取每日登录的本地日期（YYYY-MM-DD） */
  lastDaily: string;
}

const DEFAULT_STATE: WalletState = {
  balance: 0,
  owned: [],
  equippedBoard: "wood",
  lastDaily: "",
};

function readInitial(): WalletState {
  if (typeof localStorage === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<WalletState>;
    return {
      balance:
        typeof parsed.balance === "number" && parsed.balance > 0
          ? Math.floor(parsed.balance)
          : 0,
      owned: Array.isArray(parsed.owned)
        ? parsed.owned.filter((id): id is ProductId => id in PRODUCTS)
        : [],
      equippedBoard:
        parsed.equippedBoard === "paper" || parsed.equippedBoard === "lacquer"
          ? parsed.equippedBoard
          : "wood",
      lastDaily: typeof parsed.lastDaily === "string" ? parsed.lastDaily : "",
    };
  } catch {
    /* 忽略配额/隐私模式 */
    return DEFAULT_STATE;
  }
}

function persist(state: WalletState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* 忽略配额/隐私模式 */
  }
}

export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export interface WalletToast {
  id: number;
  text: string;
  kind: "gain" | "spend";
}

interface WalletCtx {
  balance: number;
  owned: ProductId[];
  equippedBoard: BoardTheme;
  /** 今日（本地日期）是否还可领取每日文钱 */
  canClaimDaily: boolean;
  owns: (id: ProductId) => boolean;
  /** 在墨阁领取每日文钱；今日已领过返回 false */
  claimDaily: () => boolean;
  /** 购买：余额不足或已拥有返回 false */
  purchase: (id: ProductId) => boolean;
  equipBoard: (t: BoardTheme) => void;
}

const Ctx = createContext<WalletCtx | null>(null);

let toastSeq = 0;

export function WalletProvider({ children }: { children: ReactNode }) {
  const t = useT();
  const [state, setState] = useState<WalletState>(readInitial);
  const [toasts, setToasts] = useState<WalletToast[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  const pushToast = useCallback(
    (text: string, kind: WalletToast["kind"]) => {
      const id = ++toastSeq;
      setToasts((list) => [...list.slice(-2), { id, text, kind }]);
      const timer = window.setTimeout(() => {
        setToasts((list) => list.filter((x) => x.id !== id));
      }, 3200);
      timers.current.push(timer);
    },
    [],
  );

  const apply = useCallback((next: WalletState) => {
    setState(next);
    persist(next);
  }, []);

  const claimDaily = useCallback((): boolean => {
    const today = localToday();
    if (state.lastDaily === today) return false;
    apply({
      ...state,
      balance: state.balance + DAILY_REWARD,
      lastDaily: today,
    });
    pushToast(format(t.shop.toastDaily, { amount: DAILY_REWARD }), "gain");
    return true;
  }, [state, apply, pushToast, t]);

  const owns = useCallback((id: ProductId) => state.owned.includes(id), [state.owned]);

  const purchase = useCallback(
    (id: ProductId): boolean => {
      if (state.owned.includes(id)) return false;
      const price = PRODUCTS[id].price;
      if (state.balance < price) return false;
      apply({
        ...state,
        balance: state.balance - price,
        owned: [...state.owned, id],
      });
      pushToast(
        format(t.shop.toastPurchased, { name: t.shop.products[id].name }),
        "spend",
      );
      return true;
    },
    [state, apply, pushToast, t],
  );

  const equipBoard = useCallback(
    (theme: BoardTheme) => {
      if (theme !== "wood" && !state.owned.includes(`skin-${theme}` as ProductId)) {
        return;
      }
      if (state.equippedBoard === theme) return;
      apply({ ...state, equippedBoard: theme });
    },
    [state, apply],
  );

  return (
    <Ctx.Provider
      value={{
        balance: state.balance,
        owned: state.owned,
        equippedBoard: state.equippedBoard,
        canClaimDaily: state.lastDaily !== localToday(),
        owns,
        claimDaily,
        purchase,
        equipBoard,
      }}
    >
      {children}
      <div className="wallet-toast-layer" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`wallet-toast is-${toast.kind}`}>
            <span className="wallet-toast-coin" aria-hidden="true" />
            {toast.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useWallet(): WalletCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
