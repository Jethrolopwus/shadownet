"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { ReceiptNFT } from "@/components/ReceiptMinting";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";

const RECEIPTS_STORAGE_KEY = "shadownet.receipts.v1";

export function AdminUpdatePanel() {
  const { connected, publicKey, revokeReceiptOnDevnet, verifyReceiptPdaOnDevnet } = useSolanaWallet();
  const [receipts, setReceipts] = useState<ReceiptNFT[]>([]);
  const [selectedReceiptId, setSelectedReceiptId] = useState("");
  const [receiptPda, setReceiptPda] = useState("");
  const [busy, setBusy] = useState(false);
  const [revokeTx, setRevokeTx] = useState<{ signature: string; explorerUrl: string } | null>(null);
  const [decodedState, setDecodedState] = useState<Awaited<ReturnType<typeof verifyReceiptPdaOnDevnet>> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECEIPTS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setReceipts(parsed as ReceiptNFT[]);
      }
    } catch {
      // Ignore malformed local storage.
    }
  }, []);

  const selectableReceipts = useMemo(() => receipts.filter((receipt) => !!receipt.receiptPda), [receipts]);

  async function run<T>(fn: () => Promise<T>) {
    setBusy(true);
    try {
      return await fn();
    } finally {
      setBusy(false);
    }
  }

  const handleSelectReceipt = (receiptId: string) => {
    setSelectedReceiptId(receiptId);
    const selected = selectableReceipts.find((receipt) => receipt.id === receiptId);
    setReceiptPda(selected?.receiptPda ?? "");
    setRevokeTx(null);
    setDecodedState(null);
  };

  const handleRevoke = () => {
    void run(async () => {
      if (!connected || !publicKey) {
        toast.error("Connect the issuer wallet first.");
        return;
      }

      if (!receiptPda.trim()) {
        toast.error("Receipt PDA is required.");
        return;
      }

      toast.loading("Submitting revoke_receipt...", { id: "revoke" });
      const tx = await revokeReceiptOnDevnet(receiptPda.trim());
      toast.success("Receipt revoked on-chain.", { id: "revoke" });
      setRevokeTx({ signature: tx.signature, explorerUrl: tx.explorerUrl });

      const decoded = await verifyReceiptPdaOnDevnet({ receiptPda: receiptPda.trim() });
      setDecodedState(decoded);
      setReceipts((prev) => {
        const next = prev.map((receipt) =>
          receipt.receiptPda === receiptPda.trim()
            ? {
                ...receipt,
                verifiedOnChain: decoded.decoded.verified,
                revokedOnChain: decoded.decoded.revoked,
              }
            : receipt
        );
        localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : "Revoke failed.";
      toast.error(message, { id: "revoke" });
    });
  };

  return (
    <div className="space-y-4 p-6 border rounded-xl bg-white shadow-sm">
      <div>
        <h2 className="text-2xl font-semibold text-[#003B7A]">Admin Receipt Controls</h2>
        <p className="text-sm text-gray-600 mt-1">
          Revoke a receipt with the issuer wallet, then read the PDA back to confirm the receipt now shows
          `revoked=true`.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 border rounded-lg bg-gray-50/60">
          <div className="text-sm font-medium mb-1">Issuer Wallet</div>
          <div className="text-sm text-gray-700">{connected ? publicKey : "No wallet connected"}</div>
        </div>

        <div className="p-4 border rounded-lg bg-gray-50/60">
          <label className="block text-xs text-gray-600 mb-1">Load Receipt From Local History</label>
          <select
            value={selectedReceiptId}
            onChange={(e) => handleSelectReceipt(e.target.value)}
            className="w-full px-3 py-2 border rounded bg-white text-sm"
          >
            <option value="">Select a receipt</option>
            {selectableReceipts.map((receipt) => (
              <option key={receipt.id} value={receipt.id}>
                {receipt.invoiceId} | {receipt.receiptPda}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Receipt PDA</label>
        <input
          value={receiptPda}
          onChange={(e) => setReceiptPda(e.target.value)}
          placeholder="Receipt PDA"
          className="w-full px-3 py-2 border rounded bg-white text-sm font-mono"
          disabled={busy}
        />
      </div>

      <button
        onClick={handleRevoke}
        disabled={busy || !connected}
        className="px-4 py-2 border rounded bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 disabled:opacity-60"
      >
        {busy ? "Revoking..." : "Revoke Receipt"}
      </button>

      {revokeTx && (
        <div className="p-4 border rounded-lg bg-gray-50/60 space-y-2">
          <div className="text-sm font-medium">Last Revoke Transaction</div>
          <div className="text-xs font-mono break-all">{revokeTx.signature}</div>
          <a href={revokeTx.explorerUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-700 underline">
            View Revoke Transaction
          </a>
        </div>
      )}

      {decodedState && (
        <div className="p-4 border rounded-lg bg-gray-50/60 space-y-2 text-xs">
          <div className="text-sm font-medium text-black">Decoded Receipt State</div>
          <div>verified={String(decodedState.decoded.verified)}</div>
          <div>revoked={String(decodedState.decoded.revoked)}</div>
          <div>
            issuer=<span className="font-mono break-all">{decodedState.decoded.issuer}</span>
          </div>
          <div>
            recipient=<span className="font-mono break-all">{decodedState.decoded.recipient}</span>
          </div>
        </div>
      )}
    </div>
  );
}
