"use client";

import { useState } from "react";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";

export function WalletConnectButton() {
  const { connected, connect, disconnect } = useSolanaWallet();
  const [busy, setBusy] = useState(false);

  async function run<T>(fn: () => Promise<T>) {
    setBusy(true);
    try {
      return await fn();
    } finally {
      setBusy(false);
    }
  }

  if (!connected) {
    return (
      <button
        onClick={() => run(connect)}
        disabled={busy}
        className="px-4 py-2 rounded-lg text-sm font-medium bg-[#003B7A] text-white hover:bg-zinc-800 disabled:opacity-60 transition-all"
      >
        {busy ? "Connecting..." : "Connect Solana Wallet"}
      </button>
    );
  }

  return (
    <button
      onClick={() => run(disconnect)}
      disabled={busy}
      className="px-4 py-2 rounded-lg text-sm font-medium border hover:bg-gray-50 disabled:opacity-60 transition-all"
    >
      {busy ? "Disconnecting..." : "Disconnect"}
    </button>
  );
}
