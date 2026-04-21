"use client";

import { useCallback, useSyncExternalStore, useState, useRef } from "react";
import { getNotes } from "@/lib/shielded/storage";
import { toast } from "sonner";

export function NotesCard() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const cachedRef = useRef<string[]>([]);

  const subscribe = useCallback((onStoreChange: () => void) => {
    const interval = setInterval(onStoreChange, 3000);
    return () => clearInterval(interval);
  }, []);

  const getSnapshot = () => {
    const notes = getNotes();
    if (cachedRef.current.length === notes.length) return cachedRef.current;
    cachedRef.current = notes;
    return notes;
  };

  const notes = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

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
    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--emerald-primary)]/50 shadow-[0_0_40px_rgba(16,185,129,0.08)] hover:shadow-[0_0_60px_rgba(16,185,129,0.2)] transition-all duration-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-[var(--emerald-subtle)] flex items-center justify-center text-[var(--emerald-light)]">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-[var(--text-primary)]">
            Stored Notes
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {notes.length} {notes.length === 1 ? "note" : "notes"} saved locally
          </p>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-3 text-[var(--text-secondary)]">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            No notes saved yet
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1 opacity-60">
            Deposits will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {notes.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] hover:border-[var(--emerald-primary)]/30 transition-all group"
            >
              <p className="flex-1 min-w-0 text-xs text-[var(--text-secondary)] truncate font-mono">
                {url}
              </p>
              <button
                onClick={() => handleCopy(url, index)}
                className="shrink-0 p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--emerald-primary)] hover:border-[var(--emerald-primary)]/50 transition-all opacity-0 group-hover:opacity-100"
                title="Copy note link"
              >
                {copiedIndex === index ? (
                  <svg
                    className="w-4 h-4 text-[var(--emerald-primary)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
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
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}