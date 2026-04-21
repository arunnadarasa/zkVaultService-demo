"use client";

import { useState } from "react";
import { PlusIcon } from "./Icons";

export function DepositCard({ onAction }: { onAction?: () => void }) {
  const [amount, setAmount] = useState("");

  const mockBalance = "1.2345";
  const mockAddress = "0x7a2...f3d1";

  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--emerald-primary)]/50 shadow-[0_0_40px_rgba(16,185,129,0.08)] hover:shadow-[0_0_60px_rgba(16,185,129,0.2)] transition-all duration-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-[var(--emerald-subtle)] flex items-center justify-center text-[var(--emerald-light)]">
          <PlusIcon />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-[var(--text-primary)]">
            Deposit
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Deposit USDc to shielded notes
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[var(--text-secondary)]">Balance</span>
          <span className="text-sm text-[var(--text-secondary)]">
            {mockAddress}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-[var(--emerald-light)]">
            {mockBalance} USDc
          </span>
          <span className="text-xs text-[var(--emerald-primary)]">Sepolia</span>
        </div>
      </div>

      <div className="relative mb-4">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full p-4 pr-16 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] font-mono text-lg focus:outline-none focus:border-[var(--emerald-primary)] transition-all"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
          USDc
        </span>
      </div>

      <button
        onClick={onAction}
        disabled={!amount.trim()}
        className="w-full py-3 px-6 rounded-xl font-medium bg-[var(--emerald-primary)] text-[var(--bg-primary)] hover:bg-[var(--emerald-light)] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
      >
        Deposit USDc
      </button>
    </div>
  );
}

