# MEGAPROMPT: Recreate ZkVaultService Arc Demo From Prompt Only

You are an expert full-stack Web3 engineer. Build a production-quality MVP called **ZkVaultService** from scratch using **React + TypeScript** frontend and a lightweight backend API layer.

Your output must be a runnable app that matches the behavior, UX, and flow described below.

---

## 1) Product Objective

Build a private transaction demo on **Arc Testnet** where users can:

1. Connect wallet
2. See EVVM + ZkVault + token status
3. Fund EVVM balance (admin/fisher-assisted endpoint)
4. Deposit USDC into a shielded pool flow
5. Save generated note links locally
6. Open note links and prepare withdraw/split flows

Primary goal: a smooth end-to-end Arc testnet demo for **deposit + note management**, with working scaffolding for withdraw/split.

---

## 2) Stack + Constraints

### Frontend
- React + TypeScript
- Vite (or Next.js App Router if equivalent behavior is preserved)
- wagmi + viem + RainbowKit for wallet UX
- Tailwind or CSS system for dark neon UI
- Toast notifications for async state

### Backend/API
- Node runtime API routes (or Express server)
- Uses a private key (`FISHER_PRIVATE_KEY`) to submit server-side EVVM actions
- No secrets in client bundle

### Chain
- **Arc Testnet**
- Chain ID: `5042002`
- RPC: `https://rpc.testnet.arc.network`
- Explorer: `https://testnet.arcscan.app`
- Native ticker display: USDC

### Security / operational requirements
- Never expose private key to frontend
- Return normalized errors to user-friendly messages
- Include tx hashes in API success responses
- Make all successful tx toasts include ArcScan links

---

## 3) Required Environment Variables

Create `.env.example`:

```bash
NEXT_PUBLIC_ZKVAULT_ADDRESS=
NEXT_PUBLIC_EVVM_CORE_ADDRESS=
NEXT_PUBLIC_USDC_TOKEN_ADDRESS=0x3600000000000000000000000000000000000000
FISHER_PRIVATE_KEY=
```

If using Vite-style env vars, adapt names consistently (`VITE_...`) and keep same semantics.

---

## 4) Core Functional Requirements

## 4.1 Wallet + Network
- Connect wallet button in header
- If wrong network, prompt switch to Arc Testnet
- Show connected address short format in UI

## 4.2 System Status Panel
Display cards:
- Network (`Arc Testnet`)
- ZkVault address (short + copy)
- EVVM Core address (short + copy)
- USDC address (short + copy)

## 4.3 EVVM Balance + Deposit Card
Deposit card must include:
- EVVM balance readout for connected user using EVVM core `getBalance(user, token)`
- Amount input (USDC, 6 decimals)
- Button: `Deposit USDc`
- Button: `Fund EVVM Balance`
- Persistent section showing **Last transaction** ArcScan link if available

### Deposit behavior
On `Deposit USDc`:
1. Validate wallet + amount
2. Check EVVM balance first
3. If insufficient, show clear error with available/requested amounts
4. Build note commitment
5. Build EVVM `pay` signed action
6. Build ZkVault `deposit` signed action
7. POST to server `/api/fisher` to execute
8. On success, register merkle root via `/api/shielded-pool/register-root`
9. Save note link to localStorage
10. Show success toast + ArcScan tx action

### Fund EVVM Balance behavior
On `Fund EVVM Balance`:
1. Validate amount
2. Call backend `/api/evvm/fund-balance` with connected address + parsed amount
3. Backend executes core `addBalance(user, token, quantity)` from fisher signer
4. Return tx hash
5. Show success toast + ArcScan tx action
6. Update persistent last tx link

## 4.4 Notes Card
- Load notes from localStorage
- Show count and list
- Each item copy-to-clipboard
- Empty state when none

## 4.5 Note URL modal scaffolding
- Read `?note=` param
- Decode note data safely
- Open note modal automatically when present
- Prepare actions for withdraw/split flow (can be MVP scaffolding if full proof flow not ready)

---

## 5) Required API Endpoints

## 5.1 `POST /api/fisher`
Input:
```json
{ "signedAction": { ... } }
```

Behavior:
- Create server signer from `FISHER_PRIVATE_KEY`
- Execute EVVM action
- Return `{ success: true, data: txHash }`
- On failure, normalize known errors:
  - If revert selector `0xf4d678b8`, return user-friendly insufficient EVVM balance message

## 5.2 `POST /api/shielded-pool/register-root`
Input:
```json
{ "root": "0x..." }
```

Behavior:
- Use fisher key wallet client
- Call `registerRoot(bytes32)` on ZkVault
- Return tx hash

## 5.3 `POST /api/evvm/fund-balance`
Input:
```json
{ "userAddress": "0x...", "amount": "5000000" }
```

Behavior:
- Validate env and inputs
- Parse amount as bigint
- Call EVVM core `addBalance(user, token, quantity)`
- Return tx hash

---

## 6) UX Requirements

Design style: dark cyber/emerald theme.

Required UX details:
- Responsive two-column layout on desktop, stacked on mobile
- Inline loading toasts for long tx actions
- Success/failure toasts with actionable text
- ArcScan “View tx” action on successful tx toasts
- Persistent “Last transaction” link near action buttons
- Copy buttons for address cards

---

## 7) Error Handling Requirements

Implement explicit error handling for:
- Missing env vars
- User rejects signature
- API 500 responses
- Contract custom error selector not in ABI
- Insufficient EVVM balance
- Network mismatch

Normalize backend errors to clear user messages. Do not expose raw stack traces to UI.

---

## 8) Data & Utility Requirements

Implement utility modules for:
- Arc chain definition
- Address shortening + copy helpers
- USDC formatting (6 decimals)
- Note encode/decode (base64 json)
- Local note storage read/write

Use strict TypeScript types for note shape and API payloads.

---

## 9) File/Module Architecture (target)

You may adapt, but keep equivalent separation:

- `app/` or `src/pages/` for app shell
- `components/`
  - `Navbar`
  - `Hero/SystemStatus`
  - `DepositAction`
  - `UsdcBalance`
  - `NotesCard`
  - `NoteModal`
  - `NoteSuccessModal`
- `hooks/`
  - `useEvvm`
- `lib/`
  - `chain/arcTestnet`
  - `service/zkVaultService`
  - `shielded/*`
- `app/api/` or `server/routes/`
  - `fisher`
  - `shielded-pool/register-root`
  - `evvm/fund-balance`

---

## 10) Acceptance Criteria

App is accepted when all are true:

1. Runs locally with `npm install && npm run dev`
2. Wallet connects on Arc Testnet
3. System status shows configured addresses
4. `Fund EVVM Balance` endpoint returns tx hash and ArcScan link
5. Deposit flow fails gracefully on insufficient EVVM balance with clear message
6. Successful tx toasts include ArcScan links
7. Last transaction persistent link appears after success
8. Notes save/load works from localStorage
9. No private keys leak to client
10. Build passes without TypeScript errors

---

## 11) Non-Goals

- Full production hardening
- Advanced ZK circuit proving infra from scratch
- Multi-chain support beyond Arc Testnet

---

## 12) Developer Notes

- Prioritize deterministic, observable flows.
- Keep API contracts stable and typed.
- If an on-chain custom error cannot be ABI-decoded, still extract selector and map known selectors to friendly text.
- Maintain a clean separation between user wallet signing and server-side fisher execution.

---

## 13) Deliverables

Return:
1. Complete runnable codebase
2. `.env.example`
3. `README.md` with setup, env, run, and flow explanation
4. Short troubleshooting section for common Arc/EVVM errors

