"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Account } from "starknet";

export function WalletConnectButton() {
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);

  const connectXverse = useCallback(async () => {
    try {
      setBusy(true);
      const wallet = (window as any).xverse || (window as any).starknet_xverse;

      if (!wallet) {
        toast.error("⚠️ Xverse wallet not found. Install it from https://www.xverse.app.");
        return;
      }

     
      await wallet.enable({ showModal: true });

      const userAccount = wallet.account;
      if (!userAccount) {
        toast.error("❌ Failed to connect to Xverse wallet.");
        return;
      }

      setAccount(userAccount);
      setConnected(true);
      toast.success("✅ Connected to Xverse!");
    } catch (err: any) {
      console.error("Wallet connection error:", err);
      toast.error("Failed to connect to Xverse wallet.");
    } finally {
      setBusy(false);
    }
  }, []);

  const disconnectXverse = useCallback(async () => {
    setBusy(true);
    try {
      
      setAccount(null);
      setConnected(false);
      toast("🔌 Disconnected from Xverse wallet.");
    } finally {
      setBusy(false);
    }
  }, []);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={() => run(connected ? disconnectXverse : connectXverse)}
      disabled={busy}
      className={`px-3 py-2 rounded-md text-sm font-medium ${
        connected
          ? "border text-gray-700 hover:bg-gray-100"
          : "bg-black text-white hover:bg-zinc-800"
      } disabled:opacity-60`}
    >
      {busy
        ? connected
          ? "Disconnecting..."
          : "Connecting..."
        : connected
        ? "Disconnect Xverse"
        : "Connect Xverse"}
    </button>
  );
}
