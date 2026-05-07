# Split & Withdraw Debug Learnings

Date: 2026-05-07  
Project: `zkVaultService-demo`  
Scope: Note `withdraw` and `split` failures on Arc Testnet

## Initial Symptoms

- Both actions (`Withdraw` and `Split Note`) failed from the UI.
- Proof generation succeeded in-browser, but transaction execution via `/api/fisher` returned HTTP 500.
- Viem surfaced unknown revert selector `0x59895a53`.

## Debug Approach Used

- Added runtime instrumentation across:
  - `components/NoteModal.tsx` (`handleWithdraw`, `handleSplit`)
  - `app/api/fisher/route.ts`
- Captured:
  - precondition checks
  - proof generation status and proof lengths
  - signed action build status
  - fisher execution phase and normalized errors
- Iterated hypotheses only with runtime evidence from `.cursor/debug-c3dc23.log`.

## Hypotheses and Outcomes

### H1: Missing note/Merkle data causes failure
- **Result:** Rejected
- **Evidence:** Logs showed `hasMerkleRoot=true`, `hasMerkleProofIndices=true`, `hasMerkleProofSiblings=true` for failing runs.

### H2: EVVM core / zkVault not initialized
- **Result:** Rejected
- **Evidence:** Logs showed `hasCore=true`, `hasZkVault=true`.

### H3: Proof generation fails
- **Result:** Rejected
- **Evidence:** Both flows produced proofs successfully and emitted "Proof generated and verified".

### H4: Signed action build/signature path fails
- **Result:** Rejected
- **Evidence:** Logs showed signed actions were built and posted to `/api/fisher`.

### H5: On-chain verifier/proof incompatibility
- **Result:** Confirmed
- **Evidence:**
  - Both methods reverted with same selector `0x59895a53`.
  - Raw revert payload decoded to `ProofLengthWrongWithLogN(uint256,uint256,uint256)`.
  - Extracted values:
    - `logN = 15`
    - `actualLength = 0x20c0 = 8384`
    - `expectedLength = 0x21c0 = 8640`

## Key Findings

- The issue is **not** UI logic or note validity.
- The issue is a **proof format/version mismatch** between:
  - frontend prover output (8384-byte proof), and
  - deployed verifier expectation (8640-byte proof).
- Failure is deterministic for both withdraw and split because both rely on the same proving stack compatibility assumptions.

## Changes Attempted

### Successful Improvements (diagnostic)

- Added robust instrumentation and normalization messages in:
  - `zkVaultService-demo/components/NoteModal.tsx`
  - `zkVaultService-demo/app/api/fisher/route.ts`
- Added verifier error entries to app ABI for better diagnosis:
  - `zkVaultService-demo/lib/service/zkVaultABI.json`
- Added user-facing normalized error explaining prover/verifier mismatch.
- Kept ABI-based revert decoding in `fisher` so unknown selectors are translated to actionable messages.

### Failed Experiment (rolled back)

- Tried changing proof generation settings to avoid forcing `verifierTarget: "evm"`.
- **Observed result:** proof length changed from `8384` to `16000`, which moved further away from expected `8640`.
- **Conclusion:** hypothesis rejected; reverted that experiment.

### Alignment Attempts (what failed first, then what worked)

#### Attempt A (Failed): redeploy with mismatched Barretenberg CLI

- We redeployed verifiers/contracts, but the local CLI used to generate Solidity verifiers was still a different Barretenberg version than the frontend prover stack.
- Runtime still showed the same deterministic mismatch:
  - `actualLength = 8384`
  - `expectedLength = 8640`
- **Conclusion:** redeploying alone is insufficient if verifier generation toolchain version is not aligned.

#### Attempt B (Success): align Barretenberg versions end-to-end

- Frontend was using `@aztec/bb.js@4.2.0`.
- Local `bb` CLI used for verifier generation was `4.0.0-nightly...` (mismatch).
- Updated local CLI to `bb 4.2.0`, regenerated verifiers, and redeployed:
  - `WithdrawFromPoolVerifier`: `0xa56abB55Bde03B9079db8Ca373580A376Df623FF`
  - `SplitNoteVerifier`: `0xb1A14EC7a1744C4A05bb17f6595C0ab9caE7F79f`
  - `ShieldedPool`: `0x81a7a109057202aCa2CD6415F63f3A0bb23a366a`
- Updated demo env address:
  - `NEXT_PUBLIC_ZKVAULT_ADDRESS=0x81a7a109057202aCa2CD6415F63f3A0bb23a366a`
- User confirmed the issue was fixed after this alignment.

## Practical Conclusion

The root problem was contract/prover artifact incompatibility caused by a **Barretenberg version mismatch** across verifier generation and frontend proof generation, not transaction flow logic.  
To fully fix, ensure frontend prover stack (`noir_js` + `bb.js` + circuit artifacts) exactly matches the verifier generation stack (especially `bb` CLI version) used by currently deployed `SplitNoteVerifier` and `WithdrawFromPoolVerifier`.

## Final Cleanup

- Removed temporary debug instrumentation blocks from:
  - `zkVaultService-demo/components/NoteModal.tsx`
  - `zkVaultService-demo/app/api/fisher/route.ts`
- Kept improved error decoding/normalization behavior in `fisher`.

## Reusable Validation Checklist

For future regressions, compare these first:

- `proofByteLength` emitted by the prover path
- `expectedLength` returned by `ProofLengthWrongWithLogN`
- `bb` CLI version used for verifier generation vs `@aztec/bb.js` version used in app/runtime

If proof lengths differ, treat it as a prover/verifier artifact mismatch before investigating app logic.

