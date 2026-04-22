"use client";

import { useEvvm } from "@/hooks/useEvvm";
import { formatUsdcBalance } from "@/util/formatUsdcBalance";
import { HexString } from "@evvm/evvm-js";
import { useEffect, useMemo, useState } from "react";

const USDC_TOKEN = process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS as HexString;

export function UsdcBalance() {
  const { core, signer, ready } = useEvvm();
  const [balance, setBalance] = useState<string>("");

  useEffect(() => {
    const fetchBalance = async () => {
      if (!signer || !core) return;

      const _balance = await core.getBalance(signer.address, USDC_TOKEN);
      setBalance(formatUsdcBalance(_balance));
    };

    void fetchBalance();
  }, [core, signer]);

  const shortedAddress = useMemo(() => {
    if (!signer) return "";
    const { address } = signer;
    return `${address.slice(0, 5)}...${address.slice(-5)}`;
  }, [signer]);

  if (!ready)
    return (
      <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[var(--text-secondary)]">Balance</span>
          <span className="text-sm text-[var(--text-secondary)] animate-pulse bg-[var(--border)] h-4 w-24 rounded"></span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-[var(--emerald-light)] animate-pulse bg-[var(--border)] h-8 w-32 rounded"></span>
          <span className="text-xs text-[var(--emerald-primary)] animate-pulse bg-[var(--border)] h-4 w-16 rounded"></span>
        </div>
      </div>
    );

  return (
    <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[var(--text-secondary)]">Balance</span>
        <span className="text-sm text-[var(--text-secondary)]">
          {shortedAddress}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-[var(--emerald-light)]">
          {balance} USDc
        </span>
        <span className="text-xs text-[var(--emerald-primary)]">Sepolia</span>
      </div>
    </div>
  );
}
