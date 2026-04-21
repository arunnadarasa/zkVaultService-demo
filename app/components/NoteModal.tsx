"use client";

import { useState } from "react";

interface NoteModalProps {
  note: object;
  onClose: () => void;
}

const CopyIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export function NoteModal({ note, onClose }: NoteModalProps) {
  const [address, setAddress] = useState("");
  const [splitCount, setSplitCount] = useState(2);
  const [toast, setToast] = useState<string | null>(null);
  const [createdNotes, setCreatedNotes] = useState<string[]>([]);

  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(address);

  const handleWithdraw = () => {
    if (!isValidAddress) return;
    setToast(`Withdrawn to ${address.slice(0, 6)}...${address.slice(-4)}`);
    setTimeout(onClose, 2000);
  };

  const handleSplit = () => {
    const amount = (note as { amount?: string }).amount || "1";
    const baseAmount = parseFloat(amount) / splitCount;
    const notes: string[] = [];

    for (let i = 0; i < splitCount; i++) {
      const newNote = JSON.stringify({
        amount: baseAmount.toString(),
        index: i,
      });
      const encoded = btoa(newNote);
      const url = `${window.location.origin}?note=${encoded}`;
      notes.push(url);
    }

    setCreatedNotes(notes);
    setToast(`Created ${splitCount} notes`);
    setTimeout(() => setToast(null), 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setToast("Copied to clipboard!");
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] shadow-[0_0_60px_rgba(16,185,129,0.2)]">
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
            Amount: {(note as { amount?: string }).amount || "0"} USDc
          </p>
        </div>

        {!createdNotes.length ? (
          <>
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
          </>
        ) : (
          <div className="space-y-2">
            {createdNotes.map((noteUrl, i) => (
              <div
                key={i}
                onClick={() => copyToClipboard(noteUrl)}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] cursor-pointer hover:border-[var(--emerald-primary)] transition-all"
              >
                <span className="text-sm text-[var(--text-primary)] truncate font-mono">
                  {noteUrl.slice(0, 30)}...
                </span>
                <CopyIcon />
              </div>
            ))}
            <p className="text-xs text-[var(--text-secondary)] text-center mt-2">
              Click to copy
            </p>
          </div>
        )}

        {toast && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-[var(--emerald-primary)] text-[var(--bg-primary)] text-sm font-medium animate-fade-in">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
