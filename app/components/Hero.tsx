"use client";

import { useState } from "react";
import { CopyIcon, CheckIcon } from "./Icons";

interface SystemStatusProps {
  label: string;
  value: string;
  copyable?: boolean;
}

function SystemStatus({ label, value, copyable = true }: SystemStatusProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!copyable) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isShort = value.length <= 12;
  const display = isShort ? value : `${value.slice(0, 6)}...${value.slice(-4)}`;

  return (
    <div
      onClick={copy}
      className={`p-3 rounded-xl border bg-[var(--bg-secondary)] transition-all group ${
        copyable
          ? "border-[var(--border)] hover:border-[var(--emerald-primary)]/50 cursor-pointer"
          : "border-[var(--border)]/50"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">
          {label}
        </span>
        {copyable &&
          (copied ? <CheckIcon /> : <CopyIcon className="w-4 h-4" />)}
      </div>
      <div
        className={`text-sm font-mono text-[var(--emerald-light)] ${isShort ? "" : "truncate"}`}
      >
        {display}
      </div>
    </div>
  );
}

export function Hero() {
  const zkVault = process.env.NEXT_PUBLIC_ZKVAULT_ADDRESS;
  const evvmCore = process.env.NEXT_PUBLIC_EVVM_CORE_ADDRESS;
  const usdc = process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS;

  return (
    <section className="pt-32 pb-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="container w-full flex justify-center">
          <img src="/logos/logo-green.png" alt="EVVM" className="h-6" />
        </div>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 animate-slide-up">
          <span className="text-[var(--text-primary)]">ZkVaultService</span>
        </h1>

        <p className="text-xl md:text-2xl text-[var(--text-secondary)] max-w-2xl mx-auto animate-fade-in delay-100">
          Private and compliant USDC transactions on Ethereum.
          <br />
          <span className="text-[var(--emerald-light)]">
            Shielded pools, ZK proofs, audit-ready.
          </span>
        </p>

        <div className="mt-12 max-w-3xl mx-auto animate-fade-in delay-200">
          <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-3 text-left">
            System Status
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <SystemStatus label="Network" value="Sepolia" copyable={false} />
            <SystemStatus label="ZkVault" value={zkVault} />
            <SystemStatus label="EVVM Core" value={evvmCore} />
            <SystemStatus label="USDC" value={usdc} />
          </div>
        </div>
      </div>
    </section>
  );
}
