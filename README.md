# ShadowNet – Xverse (Bitcoin + Stacks) Demo + Cairo Contracts

ShadowNet is a dual-stack repository that contains:

- A Next.js (TypeScript) frontend that integrates Xverse via Sats Connect for Bitcoin and Stacks
- A Cairo/StarkNet contracts workspace (Scarb) with sample receipt/verifier contracts and tests

This project demonstrates how to connect to the Xverse wallet, fetch addresses, sign messages, send Bitcoin, transfer STX, and read/change wallet networks, while also keeping a StarkNet contracts workspace alongside.

## Contents

- `frontend/` – Next.js 15 + TypeScript app with Xverse integration via `sats-connect`
- `contract/` – Cairo contracts managed with Scarb and Foundry for StarkNet

## Prerequisites

- Node.js 18+ and npm
- Xverse Wallet browser extension (Chrome/Brave/Edge or Firefox)
- (Contracts) Scarb and StarkNet Foundry installed if you want to build/test Cairo contracts

## Quick Start (Frontend)

1) Install deps

```bash
cd frontend
npm install
```

2) Run the dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

3) Install and unlock Xverse
- Install Xverse extension and create/import a wallet
- Unlock it and ensure site access is allowed for `localhost`

4) Connect & try actions
- Click "Connect Xverse" (a provider selector will appear; choose Xverse)
- Use the buttons to:
  - Load BTC Addresses
  - Load STX Accounts
  - Sign BTC Message / Sign STX Message
  - Send BTC (enter recipient + sats)
  - Transfer STX (enter recipient + microstx)
  - Get Network / Change Network / Apply Env Networks

### Env-based Network Toggle
Create `frontend/.env.local`:

```
NEXT_PUBLIC_BITCOIN_NETWORK=testnet
NEXT_PUBLIC_STACKS_NETWORK=testnet
```

Then in the UI, click "Apply Env Networks" to request switches.

## Xverse / Sats Connect Notes

- Library: `sats-connect`
- We use the library’s default wallet client under the hood and invoke methods such as:
  - Bitcoin: `getAddresses`, `signMessage`, `signPsbt`, `sendTransfer`
  - Stacks: `stx_getAccounts`, `stx_signMessage`, `stx_transferStx`, `stx_callContract`
  - Wallet: `wallet_getNetwork`, `wallet_changeNetwork`
- Reference documentation: `https://docs.xverse.app/sats-connect`

## App Structure (Frontend)

- `src/components/WalletPanel.tsx` – Main UI to connect wallet and trigger actions
- `src/hooks/useXverse.ts` – Connection state management
- `src/lib/wallet.ts` – Provider detection, event subscription helpers
- `src/lib/addresses.ts` – `getBitcoinAddresses`, `getStacksAccounts`
- `src/lib/signing.ts` – `signBitcoinMessage`, `signStacksMessage`
- `src/lib/btc.ts` – `signBitcoinPsbt`, `sendBitcoinTransfer`
- `src/lib/stx.ts` – `transferStx`, `callStacksContract`
- `src/lib/network.ts` – `getWalletNetwork`, `changeWalletNetwork`
- `src/lib/config.ts` – Reads env network choices

## Cairo Contracts (contract/)

This workspace includes sample receipt/verifier contracts. Useful files:

- `src/lib.cairo` – entry
- `src/interfaces.cairo` – interfaces
- `src/receipt.cairo`, `src/simple_receipt.cairo` – sample receipts
- `src/verifier.cairo`, `src/mock_zk_verifier.cairo` – verifiers
- `tests/test_shadownet.cairo` – tests

### Build

```bash
cd contract
scarb build
```

### Test

```bash
scarb test
```


How to run locally:

```bash
cd contract
scarb build
scarb test
```

Adapting to a real verifier:
- Replace `mock_zk_verifier.cairo` with bindings to an on-chain verifier contract that can verify proofs from your chosen proving system
- Keep the same interface so the rest of the contracts remain compatible

## Common Issues & Tips

- If the provider selector appears but extension doesn’t pop, ensure Xverse is unlocked and site access is allowed. Reload the page.
- For Bitcoin sends on testnet, fund your address first (use a testnet faucet).
- For STX transfers on testnet, fund your STX address via a faucet.
- Message signing is best used with a server-side nonce verification flow for real auth.

## License

MIT
