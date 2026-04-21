"use client";

import { useState } from "react";
import { EncodedNote } from "@/types/encodedNote.types";
import { toast } from "sonner";
import { formatUnits } from "viem";
import { CloseIcon } from "./Icons";

interface NoteModalProps {
  note: EncodedNote;
  onClose: () => void;
}

export function NoteModal({ note, onClose }: NoteModalProps) {
  const [address, setAddress] = useState("");
  const [splitCount, setSplitCount] = useState(2);

  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(address);

  const handleWithdraw = () => {
    if (!isValidAddress) return;
    toast.success(`Withdrawn to ${address.slice(0, 6)}...${address.slice(-4)}`);
    setTimeout(onClose, 2000);
  };

  const handleSplit = () => {
    const amount = formatUnits(note.value, 6);
    const baseAmount = parseFloat(amount) / splitCount;
    toast.success(`Created ${splitCount} notes of ${baseAmount.toFixed(2)} USDC each`);
  };

  const displayAmount = () => {
    try {
      return formatUnits(note.value, 6);
    } catch {
      return "0";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full max-w-md p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--emerald-primary)]/40"
        style={{
          boxShadow:
            "0 0 80px rgba(16,185,129,0.4), 0 0 120px rgba(16,185,129,0.2), 0 0 200px rgba(16,185,129,0.1)",
          animation: "glowPulse 2s ease-in-out infinite",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <CloseIcon />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Redeem note
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Amount: {displayAmount()} USDC
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-[var(--text-secondary)] mb-2">
            Destination Address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x..."
            className="w-full p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] font-mono text-sm focus:outline-none focus:border-[var(--emerald-primary)]"
          />
        </div>

        <button
          onClick={handleWithdraw}
          disabled={!isValidAddress}
          className="w-full py-3 mb-3 rounded-xl font-medium bg-[var(--emerald-primary)] text-[var(--bg-primary)] hover:bg-[var(--emerald-light)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Withdraw
        </button>

        <div className="mb-4 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)]">
          <label className="block text-sm text-[var(--text-secondary)] mb-2">
            Split into (2-4 notes)
          </label>
          <div className="flex gap-2">
            {[2, 3, 4].map((count) => (
              <button
                key={count}
                onClick={() => setSplitCount(count)}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                  splitCount === count
                    ? "bg-[var(--emerald-primary)] text-[var(--bg-primary)]"
                    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSplit}
          className="w-full py-3 rounded-xl font-medium border border-[var(--emerald-primary)] text-[var(--emerald-light)] hover:bg-[var(--emerald-subtle)] transition-all"
        >
          Split Note
        </button>
      </div>
    </div>
  );
}