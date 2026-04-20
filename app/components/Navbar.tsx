"use client";

import { ConnectButton } from "../providers";

export function Navbar() {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl rounded-2xl bg-[var(--bg-secondary)]/90 backdrop-blur-md border border-[var(--border)] shadow-[0_0_30px_rgba(16,185,129,0.15)]">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--emerald-primary)] to-[var(--emerald-dark)] flex items-center justify-center">
            <svg
              className="w-5 h-5 text-[var(--bg-primary)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
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

