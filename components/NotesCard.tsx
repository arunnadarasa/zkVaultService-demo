"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { getNotes, parseEncodedNote } from "@/lib/shielded/storage";
import { toast } from "sonner";
import { formatUnits } from "viem";
import { CopyIcon, CheckIcon, DocumentIcon } from "@/components/Icons";

type DecodedNote = {
  url: string;
  value?: bigint;
};

export function NotesCard() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [notes, setNotes] = useState<DecodedNote[]>([]);
  const cachedRef = useRef<DecodedNote[]>([]);

  const loadNotes = useCallback(() => {
    const fresh = getNotes();
    const decoded: DecodedNote[] = fresh.map((url) => {
      const noteParam = url.split("?note=")[1];
      const decoded = noteParam ? parseEncodedNote(noteParam) : null;
      return { url, value: decoded?.value };
    });
    if (
      decoded.length !== cachedRef.current.length ||
      decoded.some((n, i) => n.url !== cachedRef.current[i].url)
    ) {
      cachedRef.current = decoded;
      setNotes(decoded);
    }
  }, []);

  useEffect(() => {
    loadNotes();
    const interval = setInterval(loadNotes, 3000);
    return () => clearInterval(interval);
  }, [loadNotes]);

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
          <DocumentIcon />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-[var(--text-primary)]">
            Notes
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {notes.length} {notes.length === 1 ? "note" : "notes"} saved locally
          </p>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-3 text-[var(--text-secondary)]">
            <DocumentIcon />
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
          {notes.map(({ url, value }, index) => (
            <div
              key={`${url}-${index}`}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] hover:border-[var(--emerald-primary)]/30 transition-all group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {value !== undefined && (
                  <span className="shrink-0 px-2 py-1 text-xs font-medium rounded-md bg-[var(--emerald-primary)]/20 text-[var(--emerald-light)] border border-[var(--emerald-primary)]/30">
                    {formatUnits(value, 6)} USDC
                  </span>
                )}
                <p className="text-xs text-[var(--text-secondary)] truncate font-mono">
                  {url}
                </p>
              </div>
              <button
                onClick={() => handleCopy(url, index)}
                className="shrink-0 p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--emerald-primary)] hover:border-[var(--emerald-primary)]/50 transition-all opacity-0 group-hover:opacity-100"
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
      )}
    </div>
  );
}

