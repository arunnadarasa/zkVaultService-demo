"use client";

import { useState } from "react";
import { EncodedNote } from "@/types/encodedNote.types";
import { toast } from "sonner";
import { formatUnits } from "viem";
import { CloseIcon } from "@/components/Icons";
import { computeWithdrawCiphertext } from "@/lib/shielded/withdrawInputs";
import { useEvvm } from "@/hooks/useEvvm";
import { HexString } from "@evvm/evvm-js";
import { generateWithdrawProof, proveInBrowser } from "@/lib/noir/proving";
import { buildSplitInputs } from "@/lib/shielded/splitInputs";
import { createNotesFromSplit } from "@/lib/shielded/notes";
import { saveNote, buildNoteUrl } from "@/lib/shielded/storage";
import { NoteSuccessModal } from "@/components/NoteSuccessModal";

interface NoteModalProps {
  note: EncodedNote;
  onClose: () => void;
}

export function NoteModal({ note, onClose }: NoteModalProps) {
  const { core, zkVault } = useEvvm();
  const [address, setAddress] = useState("");
  const [createdNoteUrls, setCreatedNoteUrls] = useState<string[]>([]);

  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(address);

  const handleWithdraw = async () => {
    if (!isValidAddress || !core || !zkVault) return;
    toast.success(`Withdrawn to ${address.slice(0, 6)}...${address.slice(-4)}`);
    const notifId = toast.loading("Sending withdraw to ZkVaultService...");
    try {
      const ciphertext = computeWithdrawCiphertext(note, address as HexString);
      const nonce = await core.getAsyncNonce();

      const proof = await generateWithdrawProof(note, address as HexString);

      if (!proof) return toast.error("Error generating zk proof");

      const withdrawAction = await zkVault.withdraw({
        proof: proof.proof,
        publicInputs: proof.publicInputs,
        ciphertext,
        nonce,
        recipient: address as HexString,
      });

      const response = await fetch("/api/fisher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedAction: withdrawAction.toJSON() }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success("Withdraw sent successfully");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error in withdraw");
    } finally {
      toast.dismiss(notifId);
    }

    setTimeout(onClose, 2000);
  };

  const handleSplit = async () => {
    const amount = formatUnits(note.value, 6);
    toast.success(
      `Splitting note into 4 notes of ${(parseFloat(amount) / 4).toFixed(2)} USDc each...`,
    );

    if (!note) {
      toast.error("Choose a note to split.");
      return;
    }
    if (
      !note.merkleRoot ||
      !note.merkleProofIndices ||
      !note.merkleProofSiblings
    ) {
      toast.error(
        "This note doesn't have a Merkle proof. Make a new deposit from this app.",
      );
      return;
    }
    if (!core || !zkVault) {
      toast.error("EVVM not initialized. Connect your wallet.");
      return;
    }

    const notifId = toast.loading("Generating split proof...");
    try {
      const { inputs, outputs } = await buildSplitInputs(note);
      const proof = await proveInBrowser({
        circuitName: "SplitNote",
        inputs,
        mode: "browser",
      });
      toast.dismiss(notifId);

      const notifId2 = toast.loading("Enviando split al ZkVault...");
      const nonce = await core.getAsyncNonce();

      const splitAction = await zkVault.split({
        expectedRoot: inputs.expected_merkle_root,
        nullifierIn: inputs.nullifier_in,
        merkleProofLength: inputs.merkle_proof_length,
        newCommitment1: inputs.new_commitment_1,
        newCommitment2: inputs.new_commitment_2,
        newCommitment3: inputs.new_commitment_3,
        newCommitment4: inputs.new_commitment_4,
        proof: proof.proof,
        nonce,
      });

      let response = await fetch("/api/fisher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedAction: splitAction.toJSON() }),
      });

      let result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      toast.dismiss(notifId2);

      const notifId3 = toast.loading("Registering roots...");

      const newNotes = await createNotesFromSplit(outputs);

      for (const n of newNotes) {
        response = await fetch("/api/shielded-pool/register-root", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ root: n.merkleRoot }),
        });

        result = await response.json();
        if (!result.success) {
          throw new Error(result.error);
        }
      }

      newNotes.forEach(saveNote);

      toast.dismiss(notifId3);

      const urls = newNotes.map(buildNoteUrl);
      setCreatedNoteUrls(urls);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error in split");
    }
  };

  const displayAmount = () => {
    try {
      return formatUnits(note.value, 6);
    } catch {
      return "0";
    }
  };

  const noteAmount = parseFloat(formatUnits(note.value, 6));
  const splitAmounts = [
    (noteAmount / 4).toFixed(2),
    (noteAmount / 4).toFixed(2),
    (noteAmount / 4).toFixed(2),
    (noteAmount - (noteAmount / 4) * 3).toFixed(2),
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <div
          className="relative z-10 w-full max-w-2xl p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--emerald-primary)]/40"
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

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-[var(--text-primary)]">
                Withdraw
              </h3>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">
                  Destination Address
                </label>
                <input
                  type="text"
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] font-mono text-sm focus:outline-none focus:border-[var(--emerald-primary)]"
                />
              </div>
              <button
                onClick={handleWithdraw}
                disabled={!isValidAddress}
                className="w-full py-3 rounded-xl font-medium bg-[var(--emerald-primary)] text-[var(--bg-primary)] hover:bg-[var(--emerald-light)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Withdraw
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-[var(--text-primary)]">
                Split
              </h3>
              <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)]">
                <p className="text-sm text-[var(--text-secondary)] mb-3">
                  This note will be split into <span className="text-[var(--emerald-primary)] font-medium">4 notes</span>:
                </p>
                <div className="space-y-2">
                  {splitAmounts.map((amount, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm text-[var(--text-secondary)]">
                        Note {i + 1}
                      </span>
                      <span className="text-sm font-mono text-[var(--text-primary)]">
                        {amount} USDC
                      </span>
                    </div>
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
        </div>
      </div>

      {createdNoteUrls.length > 0 && (
        <NoteSuccessModal
          notes={createdNoteUrls}
          onClose={() => setCreatedNoteUrls([])}
        />
      )}
    </>
  );
}
