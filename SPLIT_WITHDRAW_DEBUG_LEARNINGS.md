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

### Failed Experiment (rolled back)

- Tried changing proof generation settings to avoid forcing `verifierTarget: "evm"`.
- **Observed result:** proof length changed from `8384` to `16000`, which moved further away from expected `8640`.
- **Conclusion:** hypothesis rejected; reverted that experiment.

### Ongoing Alignment Attempt

- Downgraded `@noir-lang/noir_js` from beta.20 to beta.19 to better align with manifest/compiler lineage:
  - `zkVaultService-demo/package.json`
- Kept `verifierTarget: "evm"` active in proving paths.
- Awaiting final confirmation whether this dependency alignment yields `8640` proof length or successful transactions.

## Practical Conclusion

The root problem is contract/prover artifact incompatibility, not transaction flow logic.  
To fully fix, ensure frontend prover stack (`noir_js` + `bb.js` + circuit artifacts) exactly matches the verifier generation used by currently deployed `SplitNoteVerifier` and `WithdrawFromPoolVerifier`.

## Suggested Next Validation Check

After each change, verify these two numbers first:

- `proofByteLength` from client instrumentation
- `expectedLength` from verifier revert payload

If they match, on-chain verification should proceed past `ProofLengthWrongWithLogN`.

