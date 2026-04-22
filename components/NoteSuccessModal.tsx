"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckIcon, CopyIcon, CloseIcon } from "@/components/Icons";

interface NoteSuccessModalProps {
  notes: string[];
  onClose: () => void;
}

export function NoteSuccessModal({ notes, onClose }: NoteSuccessModalProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (url: string, index: number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIndex(index);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative z-10 w-full max-w-md p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--emerald-primary)]/40"
        style={{
          boxShadow:
            "0 0 80px rgba(16,185,129,0.5), 0 0 120px rgba(16,185,129,0.3), 0 0 200px rgba(16,185,129,0.15)",
          animation: "glowPulse 2s ease-in-out infinite",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <CloseIcon />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-full bg-[var(--emerald-subtle)] flex items-center justify-center mb-3">
            <CheckIcon className="w-7 h-7 text-[var(--emerald-primary)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            {notes.length > 1 ? "Notes Created" : "Note Created"}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {notes.length > 1
              ? `${notes.length} notes ready to share`
              : "Note ready to share"}
          </p>
        </div>

        <div className="space-y-2 mb-6">
          {notes.map((url, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] hover:border-[var(--emerald-primary)]/30 transition-all"
            >
              <span className="flex-1 min-w-0 text-xs text-[var(--text-secondary)] truncate font-mono">
                {url}
              </span>
              <button
                onClick={() => handleCopy(url, index)}
                className="shrink-0 p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--emerald-primary)] hover:border-[var(--emerald-primary)]/50 transition-all"
                title="Copy note link"
              >
                {copiedIndex === index ? (
                  <CheckIcon className="w-4 h-4 text-[var(--emerald-primary)]" />
                ) : (
                  <CopyIcon />
                )}
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-medium bg-[var(--emerald-primary)] text-[var(--bg-primary)] hover:bg-[var(--emerald-light)] transition-all"
        >
          Done
        </button>
      </div>
    </div>
  );
}