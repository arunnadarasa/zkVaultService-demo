"use client";

import Image from "next/image";
import { ConnectButton } from "../providers";

export function Navbar() {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl rounded-2xl bg-[var(--bg-secondary)]/90 backdrop-blur-md border border-[var(--border)] shadow-[0_0_30px_rgba(16,185,129,0.15)]">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 relative">
            <Image
              src="/logo.png"
              alt="ZkVaultService"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
            ZkVaultService
          </span>
        </div>
        <ConnectButton />
      </div>
    </nav>
  );
}

