"use client";

import { useState } from "react";
import { UsdcBalance } from "./UsdcBalance";
import { useEvvm } from "@/hooks/useEvvm";
import { toast } from "sonner";
import { parseUnits } from "viem";
import { HexString } from "@evvm/evvm-js";
import { createNote } from "@/lib/shielded/notes";
import { saveNote, buildNoteUrl } from "@/lib/shielded/storage";
import { PlusIcon } from "./Icons";
import { NoteSuccessModal } from "./NoteSuccessModal";

export function DepositAction() {
  const { core, zkVault } = useEvvm();
  const [amount, setAmount] = useState("");
  const [createdNoteUrl, setCreatedNoteUrl] = useState<string | null>(null);

  const onDeposit = async () => {
    if (!core || !zkVault) {
      toast.error("EVVM not initialized. Connect your wallet.");
      return;
    }

    try {
      const _amount = parseUnits(amount as `${number}`, 6);

      const note = await createNote(_amount);
      const commitment = note.commitment;
      const notifId = toast.loading("Creating deposit in EVVM...");
      const payNonce = await core.getAsyncNonce();
      const depositNonce = await core.getAsyncNonce();

      const payment = await core.pay({
        toAddress: zkVault.address,
        tokenAddress: process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS as HexString,
        amount: _amount,
        priorityFee: 0n,
        senderExecutor: zkVault.address,
        nonce: payNonce,
        isAsyncExec: true,
      });

      const depositAction = await zkVault.deposit({
        amount: _amount,
        commitment,
        nonce: depositNonce,
        paySignedAction: payment,
      });

      let response = await fetch("/api/fisher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedAction: depositAction.toJSON() }),
      });

      let result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      toast.success("Deposit sent successfully");

      response = await fetch("/api/shielded-pool/register-root", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ root: note.merkleRoot }),
      });

      result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success("Merkle root registered");
      toast.dismiss(notifId);
      saveNote(note);
      setCreatedNoteUrl(buildNoteUrl(note));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Deposit transaction failed",
      );
    }
  };

  return (
    <>
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

        <UsdcBalance />

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
          onClick={onDeposit}
          disabled={!amount.trim()}
          className="w-full py-3 px-6 rounded-xl font-medium bg-[var(--emerald-primary)] text-[var(--bg-primary)] hover:bg-[var(--emerald-light)] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
        >
          Deposit USDc
        </button>
      </div>

      {createdNoteUrl && (
        <NoteSuccessModal
          notes={[createdNoteUrl]}
          onClose={() => setCreatedNoteUrl(null)}
        />
      )}
    </>
  );
}
