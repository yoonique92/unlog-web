"use client";

import { useEffect, useState } from "react";

type StoneWalletResponse =
  | { success: true; walletBalance: number }
  | { success: false; error?: string };

export type StoneWalletBalanceStatus =
  | "loading"
  | "ready"
  | "unauthenticated"
  | "error";

export function useStoneWalletBalance(refreshKey?: string) {
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [status, setStatus] = useState<StoneWalletBalanceStatus>("loading");

  useEffect(() => {
    const controller = new AbortController();

    async function loadWalletBalance() {
      setStatus("loading");

      try {
        const response = await fetch("/api/stones/wallet", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json()) as StoneWalletResponse;

        if (response.status === 401) {
          setWalletBalance(null);
          setStatus("unauthenticated");
          return;
        }
        if (!response.ok || data.success !== true) {
          throw new Error("STONE_WALLET_READ_FAILED");
        }

        setWalletBalance(data.walletBalance);
        setStatus("ready");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setWalletBalance(null);
        setStatus("error");
      }
    }

    void loadWalletBalance();
    return () => controller.abort();
  }, [refreshKey]);

  return { walletBalance, status };
}
