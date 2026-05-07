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
      // #region agent log
      fetch("http://127.0.0.1:7524/ingest/f043a085-d893-4493-9c8f-6fec9495a1cd", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c3dc23" },
        body: JSON.stringify({
          sessionId: "c3dc23",
          runId: "withdraw-pre",
          hypothesisId: "W1",
          location: "NoteModal.tsx:handleWithdraw:entry",
          message: "Withdraw started",
          data: {
            isValidAddress,
            addressPrefix: typeof address === "string" ? address.slice(0, 10) : null,
            noteValue: note?.value?.toString?.(),
            hasMerkleRoot: Boolean(note?.merkleRoot),
            hasMerkleProofIndices: Boolean(note?.merkleProofIndices),
            hasMerkleProofSiblings: Boolean(note?.merkleProofSiblings),
            hasCore: Boolean(core),
            hasZkVault: Boolean(zkVault),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      const ciphertext = computeWithdrawCiphertext(note, address as HexString);
      const nonce = await core.getAsyncNonce();

      const proof = await generateWithdrawProof(note, address as HexString);

      if (!proof) return toast.error("Error generating zk proof");

      // #region agent log
      fetch("http://127.0.0.1:7524/ingest/f043a085-d893-4493-9c8f-6fec9495a1cd", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c3dc23" },
        body: JSON.stringify({
          sessionId: "c3dc23",
          runId: "withdraw-pre",
          hypothesisId: "W2",
          location: "NoteModal.tsx:handleWithdraw:proof",
          message: "Generated withdraw proof",
          data: {
            nonce: nonce?.toString?.(),
            proofBytes: (proof?.proof as unknown as string | undefined)?.length ?? null,
            proofByteLength:
              typeof proof?.proof === "string" && proof.proof.startsWith("0x")
                ? (proof.proof.length - 2) / 2
                : null,
            publicInputsLen: Array.isArray((proof as any)?.publicInputs)
              ? (proof as any).publicInputs.length
              : null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

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
      // #region agent log
      fetch("http://127.0.0.1:7524/ingest/f043a085-d893-4493-9c8f-6fec9495a1cd", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c3dc23" },
        body: JSON.stringify({
          sessionId: "c3dc23",
          runId: "withdraw-pre",
          hypothesisId: "W3",
          location: "NoteModal.tsx:handleWithdraw:fisherResponse",
          message: "Fisher responded to withdraw",
          data: {
            httpOk: response.ok,
            httpStatus: response.status,
            success: Boolean(result?.success),
            error: typeof result?.error === "string" ? result.error.slice(0, 200) : null,
            txHashPrefix: typeof result?.data === "string" ? result.data.slice(0, 10) : null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success("Withdraw sent successfully");
    } catch (e) {
      // #region agent log
      fetch("http://127.0.0.1:7524/ingest/f043a085-d893-4493-9c8f-6fec9495a1cd", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c3dc23" },
        body: JSON.stringify({
          sessionId: "c3dc23",
          runId: "withdraw-pre",
          hypothesisId: "WZ",
          location: "NoteModal.tsx:handleWithdraw:catch",
          message: "Withdraw failed (catch)",
          data: {
            name: e instanceof Error ? e.name : typeof e,
            message: e instanceof Error ? e.message.slice(0, 250) : String(e).slice(0, 250),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
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

    // #region agent log
    fetch("http://127.0.0.1:7524/ingest/f043a085-d893-4493-9c8f-6fec9495a1cd", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c3dc23" },
      body: JSON.stringify({
        sessionId: "c3dc23",
        runId: "split-pre",
        hypothesisId: "A",
        location: "NoteModal.tsx:handleSplit:entry",
        message: "Split started",
        data: {
          noteValue: note?.value?.toString?.(),
          hasMerkleRoot: Boolean(note?.merkleRoot),
          hasMerkleProofIndices: Boolean(note?.merkleProofIndices),
          hasMerkleProofSiblings: Boolean(note?.merkleProofSiblings),
          hasCore: Boolean(core),
          hasZkVault: Boolean(zkVault),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (!note) {
      toast.error("Choose a note to split.");
      return;
    }
    if (
      !note.merkleRoot ||
      !note.merkleProofIndices ||
      !note.merkleProofSiblings
    ) {
      // #region agent log
      fetch("http://127.0.0.1:7524/ingest/f043a085-d893-4493-9c8f-6fec9495a1cd", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c3dc23" },
        body: JSON.stringify({
          sessionId: "c3dc23",
          runId: "split-pre",
          hypothesisId: "A",
          location: "NoteModal.tsx:handleSplit:missingMerkle",
          message: "Split blocked: missing merkle proof data",
          data: {
            hasMerkleRoot: Boolean(note?.merkleRoot),
            hasMerkleProofIndices: Boolean(note?.merkleProofIndices),
            hasMerkleProofSiblings: Boolean(note?.merkleProofSiblings),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      toast.error(
        "This note doesn't have a Merkle proof. Make a new deposit from this app.",
      );
      return;
    }
    if (!core || !zkVault) {
      // #region agent log
      fetch("http://127.0.0.1:7524/ingest/f043a085-d893-4493-9c8f-6fec9495a1cd", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c3dc23" },
        body: JSON.stringify({
          sessionId: "c3dc23",
          runId: "split-pre",
          hypothesisId: "B",
          location: "NoteModal.tsx:handleSplit:notInitialized",
          message: "Split blocked: EVVM not initialized",
          data: { hasCore: Boolean(core), hasZkVault: Boolean(zkVault) },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      toast.error("EVVM not initialized. Connect your wallet.");
      return;
    }

    const notifId = toast.loading("Generating split proof...");
    try {
      const { inputs, outputs } = await buildSplitInputs(note);
      // #region agent log
      fetch("http://127.0.0.1:7524/ingest/f043a085-d893-4493-9c8f-6fec9495a1cd", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c3dc23" },
        body: JSON.stringify({
          sessionId: "c3dc23",
          runId: "split-pre",
          hypothesisId: "C",
          location: "NoteModal.tsx:handleSplit:builtInputs",
          message: "Built split inputs",
          data: {
            expectedRoot: inputs.expected_merkle_root,
            merkleProofLength: inputs.merkle_proof_length,
            nullifierInPrefix: String(inputs.nullifier_in).slice(0, 10),
            commitmentsPrefix: [
              String(inputs.new_commitment_1).slice(0, 10),
              String(inputs.new_commitment_2).slice(0, 10),
              String(inputs.new_commitment_3).slice(0, 10),
              String(inputs.new_commitment_4).slice(0, 10),
            ],
            outputsCount: outputs?.length,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      const proof = await proveInBrowser({
        circuitName: "SplitNote",
        inputs,
        mode: "browser",
      });
      // #region agent log
      fetch("http://127.0.0.1:7524/ingest/f043a085-d893-4493-9c8f-6fec9495a1cd", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c3dc23" },
        body: JSON.stringify({
          sessionId: "c3dc23",
          runId: "split-pre",
          hypothesisId: "C",
          location: "NoteModal.tsx:handleSplit:proved",
          message: "Generated split proof",
          data: {
            proofBytes: (proof?.proof as unknown as string | undefined)?.length ?? null,
            proofByteLength:
              typeof proof?.proof === "string" && proof.proof.startsWith("0x")
                ? (proof.proof.length - 2) / 2
                : null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      toast.dismiss(notifId);

      const notifId2 = toast.loading("Enviando split al ZkVault...");
      const nonce = await core.getAsyncNonce();
      // #region agent log
      fetch("http://127.0.0.1:7524/ingest/f043a085-d893-4493-9c8f-6fec9495a1cd", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c3dc23" },
        body: JSON.stringify({
          sessionId: "c3dc23",
          runId: "split-pre",
          hypothesisId: "D",
          location: "NoteModal.tsx:handleSplit:nonce",
          message: "Fetched nonce for split",
          data: { nonce: nonce?.toString?.() },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

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
      // #region agent log
      fetch("http://127.0.0.1:7524/ingest/f043a085-d893-4493-9c8f-6fec9495a1cd", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c3dc23" },
        body: JSON.stringify({
          sessionId: "c3dc23",
          runId: "split-pre",
          hypothesisId: "D",
          location: "NoteModal.tsx:handleSplit:builtAction",
          message: "Built split signed action",
          data: { hasSignedAction: Boolean(splitAction), actionType: (splitAction as any)?.type ?? null },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      let response = await fetch("/api/fisher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedAction: splitAction.toJSON() }),
      });

      let result = await response.json();
      // #region agent log
      fetch("http://127.0.0.1:7524/ingest/f043a085-d893-4493-9c8f-6fec9495a1cd", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c3dc23" },
        body: JSON.stringify({
          sessionId: "c3dc23",
          runId: "split-pre",
          hypothesisId: "E",
          location: "NoteModal.tsx:handleSplit:fisherResponse",
          message: "Fisher responded to split",
          data: {
            httpOk: response.ok,
            httpStatus: response.status,
            success: Boolean(result?.success),
            error: typeof result?.error === "string" ? result.error.slice(0, 200) : null,
            txHashPrefix: typeof result?.data === "string" ? result.data.slice(0, 10) : null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
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
      // #region agent log
      fetch("http://127.0.0.1:7524/ingest/f043a085-d893-4493-9c8f-6fec9495a1cd", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c3dc23" },
        body: JSON.stringify({
          sessionId: "c3dc23",
          runId: "split-pre",
          hypothesisId: "Z",
          location: "NoteModal.tsx:handleSplit:catch",
          message: "Split failed (catch)",
          data: {
            name: e instanceof Error ? e.name : typeof e,
            message: e instanceof Error ? e.message.slice(0, 250) : String(e).slice(0, 250),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
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
