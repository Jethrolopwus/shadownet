# ShadowNet

ShadowNet is a Solana-based receipt verification app with:

- A Next.js frontend for wallet connection, devnet SOL transfer, receipt issuance, and receipt re-verification.
- An Anchor program that stores receipts as PDAs and supports issue / verify / revoke flows.

The goal is to provide verifiable payment receipts while keeping the architecture simple enough for iterative product development.

## What Works Today

### Frontend (`frontend/`)

- Connect/disconnect injected Solana wallet (Phantom-compatible).
- Sign message from wallet.
- Send SOL on devnet and wait for confirmation.
- Issue receipt on-chain immediately after transfer confirmation by calling the Anchor `issue_receipt` instruction.
- Display issued receipt metadata (PDA, payload hash, instruction signature).
- Verify receipt PDA against on-chain data (issuer, recipient, payload hash, discriminator, owner, revoked flag).
- Re-verify older receipts from Receipt History.
- Persist receipt history and verification badge status in `localStorage`.

### Program (`contract/`)

Anchor program ID:

`BFBhJ97pvs6iFpBx8jjjrUteTeLjc6eag67ZbMRL25v7`

Instructions:

- `issue_receipt(payload_hash, recipient)`
- `verify_receipt(proof)` (mock proof logic for now)
- `revoke_receipt()`

Receipt account stores:

- issuer
- recipient
- payload_hash
- verified
- revoked
- timestamp
- bump

## Repository Structure

- `frontend/` — Next.js 15 app (Solana wallet UX + receipt flows)
- `contract/` — Anchor workspace and Solana program

## Prerequisites

### Frontend

- Node.js 20+
- npm
- Phantom (or compatible injected Solana wallet)

### Program

- Rust toolchain
- Solana CLI
- Anchor CLI (`0.32.x` recommended for this workspace)

## Quick Start

### 1) Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

Optional env config (`frontend/.env.local`):

```env
NEXT_PUBLIC_SOLANA_PROGRAM_ID=BFBhJ97pvs6iFpBx8jjjrUteTeLjc6eag67ZbMRL25v7
```

### 2) Build Program

```bash
cd contract
anchor build
```

### 3) Deploy Program (Devnet)

```bash
cd contract
solana config set --url https://api.devnet.solana.com
solana address
solana balance
solana airdrop 2
anchor deploy --provider.cluster devnet
```

If deploy fails with `insufficient funds`, airdrop more SOL and retry.

## End-to-End Flow (Current UX)

1. Connect wallet in the frontend.
2. Enter recipient and SOL amount.
3. Click `Send + Issue Receipt`.
4. Confirm transfer transaction.
5. Confirm receipt instruction transaction.
6. Review receipt details and explorer links.
7. Use `Verify Receipt PDA` (or per-row `Verify`) to confirm on-chain receipt fields.

## Development Notes

- Frontend verification decodes receipt accounts directly from devnet and validates expected fields.
- `verify_receipt` in the program currently uses mock proof logic; production proof verification is still to be integrated.
- Existing `contract/tests/contract.ts` is a scaffold and should be updated to match current program instructions.

## Intended Next Steps

- Replace mock proof route and mock verifier logic with real ZK proof verification.
- Add stronger integration tests for issue/verify/revoke instruction paths.
- Add backend persistence/indexing for receipts beyond browser `localStorage`.

## License

MIT
