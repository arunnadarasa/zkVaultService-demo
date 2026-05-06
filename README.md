# ZkVaultService Demo

A Next.js demo application for ZkVaultService - a private and compliant USDC transaction system on Arc Testnet using shielded pools and zero-knowledge proofs.

## Features

- **Deposit**: Convert USDC to private notes (shielded assets)
- **Withdraw**:Redeem private notes back to USDC on any address
- **Split**: Split notes into smaller denominations (4 notes)

## Prerequisites

- Node.js 18+
- npm or pnpm
- An Ethereum wallet (MetaMask, Rabby, etc.)

## Setup

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd zkVaultService-demo
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your deployment addresses:

   ```
   NEXT_PUBLIC_ZKVAULT_ADDRESS=0xab47C6B86B9BfE2E82Bc8aeB44c4a2Ce0581f2ad
   NEXT_PUBLIC_EVVM_CORE_ADDRESS=0x8828A715795877dcfE0d12d190B21596bEDA8870
   NEXT_PUBLIC_USDC_TOKEN_ADDRESS=0x3600000000000000000000000000000000000000
   FISHER_PRIVATE_KEY=<your-private-key>
   ```

4. **Run development server**

   ```bash
   npm run dev
   ```

5. **Open browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Connecting Wallet

1. Click "Connect Wallet" in the top right
2. Select your wallet provider (MetaMask, Rabby, etc.)
3. Approve the connection request
4. Ensure you're on Arc Testnet

### Depositing USDC

1. Enter the amount of USDC to deposit
2. Click "Deposit"
3. Approve the token approval transaction
4. Approve the deposit transaction
5. Wait for the note to be generated
6. Copy or save the note link shown

### Withdrawing USDC

1. Open a note link or click on a saved note
2. In the modal, enter the destination address
3. Click "Withdraw"
4. Approve the transaction
5. USDC will be sent to the destination

### Splitting Notes

1. Open a note link or click on a saved note
2. In the modal, the Split section shows the 4 resulting amounts
3. Click "Split Note"
4. Approve the transaction
5. 4 new notes will be generated and saved locally

## Architecture

```
app/
├── api/
│   ├── fisher/              # Off-chain prover endpoint
│   └── shielded-pool/       # Merkle tree root registration
├── providers.tsx          # Wallet providers
└── page.tsx               # Home page
components/
├── ActionCard.tsx         # Base action card
├── DepositAction.tsx      # USDC deposit form
├── Hero.tsx               # System status display
├── Icons.tsx              # Icon components
├── Navbar.tsx             # Navigation
├── NoteModal.tsx          # Withdraw/Split modal
├── NoteSuccessModal.tsx  # Success modal
├── NotesCard.tsx         # Saved notes display
└── UsdcBalance.tsx       # Token balance
lib/
├── noir/                 # ZK proof generation
├── service/              # Service client
└── shielded/           # Cryptographic operations
    ├── merkle.ts        # Merkle tree operations
    ├── notes.ts        # Note creation
    ├── poseidon.ts    # Hashing
    ├── splitInputs.ts  # Split proof inputs
    └── storage.ts    # Local storage
hooks/
└── useEvvm.ts          # EVM hooks
types/
└── encodedNote.types.ts # Note type definitions
util/
├── formatUsdcBalance.ts # Balance formatting
└── random.ts           # Random field generation
```

## Environment Variables

| Variable                         | Description                    |
| -------------------------------- | ------------------------------ |
| `NEXT_PUBLIC_ZKVAULT_ADDRESS`    | ZkVault contract address       |
| `NEXT_PUBLIC_EVVM_CORE_ADDRESS`  | EVVM Core contract address     |
| `NEXT_PUBLIC_USDC_TOKEN_ADDRESS` | USDC token address             |
| `FISHER_PRIVATE_KEY`             | Private key for fisher signing |

## Arc Testnet Configuration

The demo is configured for Arc testnet:

- **Network**: Arc Testnet (chainId: `5042002`)
- **RPC URL**: `https://rpc.testnet.arc.network`
- **USDC**: `0x3600000000000000000000000000000000000000`
- **Block Explorer**: https://testnet.arcscan.app
- **Faucet**: https://faucet.circle.com

## Deployed Contracts (Arc Testnet)

- **ShieldedPool (ZkVault)**: `0xab47C6B86B9BfE2E82Bc8aeB44c4a2Ce0581f2ad`
- **EVVM Core**: `0x8828A715795877dcfE0d12d190B21596bEDA8870`
- **Staking**: `0x0753A6702861B77e844Cb426Fbf102D3e9Dd7550`
- **WithdrawFromPoolVerifier**: `0xe54D1758301a09b3323903f17762Fba86FCFd5AB`
- **SplitNoteVerifier**: `0x51b83270BF60d203D43222fd5F6b81514aF0A647`

