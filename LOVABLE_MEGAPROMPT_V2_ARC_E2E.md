# LOVABLE MEGAPROMPT V2: Recreate ZkVaultService End-to-End (Arc Testnet, Split + Withdraw Working)

Use this prompt in Lovable to recreate the app end-to-end with the exact Arc contracts and a working user flow for deposit, split, and withdraw.

---

## Role

You are a senior full-stack Web3 engineer. Build a production-quality demo app named **ZkVaultService** using **Next.js + TypeScript** with server API routes.

The app must support:

1. Wallet connect on Arc testnet
2. EVVM balance top-up (admin/fisher endpoint)
3. Deposit into shielded pool
4. Local note storage + note links
5. Split note into 4 notes
6. Withdraw from note

Both **split** and **withdraw** must be wired for successful execution with the contract addresses below.

---

## Critical Network + Contract Configuration (MUST USE)

### Arc network

- Chain name: `Arc Testnet`
- Chain ID: `5042002`
- RPC URL: `https://rpc.testnet.arc.network`
- Explorer: `https://testnet.arcscan.app`
- Merkle scan default start block: `VITE_POOL_DEPLOY_BLOCK=40954131` (deployment block of active ShieldedPool)

### Core service addresses (active)

- `EVVM Core`: `0x8828A715795877dcfE0d12d190B21596bEDA8870`
- `USDC token`: `0x3600000000000000000000000000000000000000`
- `ShieldedPool (ZkVault)`: `0x81a7a109057202aCa2CD6415F63f3A0bb23a366a`
- `WithdrawFromPoolVerifier`: `0xa56abB55Bde03B9079db8Ca373580A376Df623FF`
- `SplitNoteVerifier`: `0xb1A14EC7a1744C4A05bb17f6595C0ab9caE7F79f`

Important: these verifier addresses are informational but the app must point to `ShieldedPool` above.

---

## Root-Cause Constraint from Prior Debugging

The app previously failed on split/withdraw because proof bytes produced by frontend prover did not match on-chain verifier expectation.

To avoid that regression:

- Keep prover/verifier toolchain alignment assumptions explicit
- Preserve backend error decoding for proof mismatch and custom errors
- Return actionable user error messages (not opaque revert signatures)

---

## Required Environment Variables

Create `.env.example`:

```bash
NEXT_PUBLIC_ZKVAULT_ADDRESS=0x81a7a109057202aCa2CD6415F63f3A0bb23a366a
NEXT_PUBLIC_EVVM_CORE_ADDRESS=0x8828A715795877dcfE0d12d190B21596bEDA8870
NEXT_PUBLIC_USDC_TOKEN_ADDRESS=0x3600000000000000000000000000000000000000
VITE_POOL_DEPLOY_BLOCK=40954131
FISHER_PRIVATE_KEY=
```

Do not expose `FISHER_PRIVATE_KEY` to the browser.

---

## Product Requirements

### 1) Header + Wallet

- RainbowKit/wagmi connect wallet
- Show short connected address
- Enforce Arc network; show mismatch guidance

### 2) System Status Row

Cards with copy button:

- Network
- ZkVault address
- EVVM Core address
- USDC address

### 3) Deposit Card

Features:

- EVVM balance read for connected user (`getBalance(user, token)`)
- Amount input (USDC, 6 decimals)
- `Fund EVVM Balance` button
- `Deposit USDc` button
- Last tx link (ArcScan)

Deposit flow:

1. Validate wallet + amount
2. Check EVVM balance
3. If insufficient: friendly message with requested vs available
4. Build note + commitment
5. Build and execute signed action through `/api/fisher`
6. Register root via `/api/shielded-pool/register-root`
7. Save note to local storage
8. Show success toast with explorer action

### 4) Notes Card

- Show saved notes
- Copy note links
- Open note via `?note=` URL param

### 5) Note Modal (must support real success path)

Two tabs/sections:

- Withdraw:
  - destination address input
  - generate proof
  - execute `withdraw`
- Split:
  - split into 4 equal-ish notes
  - generate proof
  - execute `split`
  - register roots for new notes
  - save new notes

---

## Required API Routes

### `POST /api/fisher`

Input:

```json
{ "signedAction": { "...": "..." } }
```

Behavior:

- Build server signer from `FISHER_PRIVATE_KEY`
- Execute EVVM action
- Return `{ success: true, data: txHash }`
- On error:
  - decode revert data when possible
  - map known selectors/errors into friendly messages
  - include proof-mismatch guidance if detected

### `POST /api/shielded-pool/register-root`

Input:

```json
{ "root": "0x..." }
```

Behavior:

- Use server signer
- Call `registerRoot(bytes32)` on ShieldedPool
- Return tx hash or normalized error

### `POST /api/evvm/fund-balance`

Input:

```json
{ "userAddress": "0x...", "amount": "5000000" }
```

Behavior:

- Validate address + amount
- Execute EVVM core `addBalance(user, token, quantity)`
- Return tx hash

---

## Technical Expectations

- Use strict TypeScript types for notes, proof payloads, signed actions, API responses
- Keep chain/service helpers under `lib/`
- Keep UI components modular
- Use toasts for async flows
- Include ArcScan link actions in success toasts
- Never leak private key to client

---

## Required UX Behavior for Successful Split/Withdraw

When user follows proper sequence, split and withdraw should succeed:

1. Connect wallet on Arc
2. Fund EVVM balance
3. Deposit fresh note on current pool
4. Use that fresh note for split/withdraw

Important:

- If pool address changes in future deployment, old notes become unusable (`unknown root`)
- Show clear message instructing user to create a fresh note after redeploy

---

## Error Messages (must be explicit)

Implement clear user messages for:

- network mismatch
- insufficient EVVM balance
- unknown root after redeploy
- proof mismatch between prover and verifier artifacts
- signature rejection
- server execution failure

Do not show raw stack traces in UI.

---

## Suggested File Layout

- `app/`
  - `page.tsx`
  - `api/fisher/route.ts`
  - `api/shielded-pool/register-root/route.ts`
  - `api/evvm/fund-balance/route.ts`
- `components/`
  - `Navbar`
  - `SystemStatus`
  - `DepositAction`
  - `NotesCard`
  - `NoteModal`
  - `NoteSuccessModal`
- `hooks/useEvvm.ts`
- `lib/chain/arcTestnet.ts`
- `lib/service/*`
- `lib/shielded/*`
- `types/*`

---

## Acceptance Criteria

1. `npm install && npm run dev` works
2. Wallet connect works on Arc
3. Funding EVVM returns tx hash and ArcScan link
4. Deposit succeeds and saves note
5. Split succeeds for fresh note
6. Withdraw succeeds for fresh note
7. Root registration succeeds for split-generated notes
8. Errors are normalized and actionable
9. No private key in client code
10. Typecheck/build pass

---

## Deliverables from Lovable

1. Full runnable codebase
2. `.env.example` prefilled with current Arc addresses (except private key)
3. README with setup + run + user journey (fund -> deposit -> split/withdraw)
4. Troubleshooting section for:
   - unknown root after redeploy
   - proof mismatch symptoms
   - network mismatch

