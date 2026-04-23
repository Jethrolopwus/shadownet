"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { ReceiptNFT } from "@/components/ReceiptMinting";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";

const RECEIPTS_STORAGE_KEY = "shadownet.receipts.v1";

export function VerifierPanel() {
  const { connected, publicKey, verifyReceiptOnDevnet, verifyReceiptPdaOnDevnet } = useSolanaWallet();
  const [receipts, setReceipts] = useState<ReceiptNFT[]>([]);
  const [receiptPda, setReceiptPda] = useState("");
  const [paymentSignature, setPaymentSignature] = useState("");
  const [expectedIssuer, setExpectedIssuer] = useState("");
  const [expectedRecipient, setExpectedRecipient] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState("");
  const [lastVerificationTx, setLastVerificationTx] = useState<{ signature: string; explorerUrl: string } | null>(null);
  const [lastDecodedState, setLastDecodedState] = useState<Awaited<
    ReturnType<typeof verifyReceiptPdaOnDevnet>
  > | null>(null);

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

  const selectableReceipts = useMemo(
    () => receipts.filter((receipt) => receipt.receiptPda && receipt.paymentSignature),
    [receipts]
  );

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
    if (!selected) return;

    setReceiptPda(selected.receiptPda ?? "");
    setPaymentSignature(selected.paymentSignature);
    setExpectedIssuer(selected.expectedIssuer ?? "");
    setExpectedRecipient(selected.expectedRecipient ?? "");
    setLastVerificationTx(null);
    setLastDecodedState(null);
  };

  const handleVerify = () => {
    void run(async () => {
      if (!connected || !publicKey) {
        toast.error("Connect your Solana wallet first.");
        return;
      }

      if (!receiptPda.trim() || !paymentSignature.trim()) {
        toast.error("Receipt PDA and payment signature are required.");
        return;
      }

      toast.loading("Submitting verify_receipt...", { id: "verify-on-chain" });
      const tx = await verifyReceiptOnDevnet(receiptPda.trim(), paymentSignature.trim());
      toast.success("Receipt verified on-chain.", { id: "verify-on-chain" });
      setLastVerificationTx({ signature: tx.signature, explorerUrl: tx.explorerUrl });

      const decoded = await verifyReceiptPdaOnDevnet({
        receiptPda: receiptPda.trim(),
        expectedIssuer: expectedIssuer.trim() || undefined,
        expectedRecipient: expectedRecipient.trim() || undefined,
        expectedPaymentSignature: paymentSignature.trim(),
      });
      setLastDecodedState(decoded);
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
      const message = err instanceof Error ? err.message : "Verification failed.";
      toast.error(message, { id: "verify-on-chain" });
    });
  };

  return (
    <div className="space-y-4 p-6 border rounded-xl bg-white shadow-sm">
      <div>
        <h2 className="text-2xl font-semibold text-[#003B7A]">Proof Verifier</h2>
        <p className="text-sm text-gray-600 mt-1">
          Submit the contract&apos;s `verify_receipt` instruction, then immediately read the PDA back to confirm the
          receipt is marked verified on devnet.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 border rounded-lg bg-gray-50/60">
          <div className="text-sm font-medium mb-1">Verifier Wallet</div>
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">Receipt PDA</label>
          <input
            value={receiptPda}
            onChange={(e) => setReceiptPda(e.target.value)}
            placeholder="Receipt PDA"
            className="w-full px-3 py-2 border rounded bg-white text-sm font-mono"
            disabled={busy}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs text-gray-600 mb-1">Payment Signature Used To Build Proof</label>
          <input
            value={paymentSignature}
            onChange={(e) => setPaymentSignature(e.target.value)}
            placeholder="Confirmed transfer signature"
            className="w-full px-3 py-2 border rounded bg-white text-sm font-mono"
            disabled={busy}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Expected Issuer</label>
          <input
            value={expectedIssuer}
            onChange={(e) => setExpectedIssuer(e.target.value)}
            placeholder="Optional issuer pubkey"
            className="w-full px-3 py-2 border rounded bg-white text-sm font-mono"
            disabled={busy}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Expected Recipient</label>
          <input
            value={expectedRecipient}
            onChange={(e) => setExpectedRecipient(e.target.value)}
            placeholder="Optional recipient pubkey"
            className="w-full px-3 py-2 border rounded bg-white text-sm font-mono"
            disabled={busy}
          />
        </div>
      </div>

      <button
        onClick={handleVerify}
        disabled={busy || !connected}
        className="px-4 py-2 border rounded bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 disabled:opacity-60"
      >
        {busy ? "Verifying..." : "Verify Receipt On-Chain"}
      </button>

      {lastVerificationTx && (
        <div className="p-4 border rounded-lg bg-gray-50/60 space-y-2">
          <div className="text-sm font-medium">Last Verification Transaction</div>
          <div className="text-xs font-mono break-all">{lastVerificationTx.signature}</div>
          <a href={lastVerificationTx.explorerUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-700 underline">
            View Verification Transaction
          </a>
        </div>
      )}

      {lastDecodedState && (
        <div className="p-4 border rounded-lg bg-gray-50/60 space-y-2 text-xs">
          <div className="text-sm font-medium text-black">Decoded Receipt State</div>
          <div>verified={String(lastDecodedState.decoded.verified)}</div>
          <div>revoked={String(lastDecodedState.decoded.revoked)}</div>
          <div>
            issuer=<span className="font-mono break-all">{lastDecodedState.decoded.issuer}</span>
          </div>
          <div>
            recipient=<span className="font-mono break-all">{lastDecodedState.decoded.recipient}</span>
          </div>
          <div>
            payload_hash=<span className="font-mono break-all">{lastDecodedState.decoded.payloadHashHex}</span>
          </div>
          <div>owner matches program: {String(lastDecodedState.checks.ownerMatchesProgram)}</div>
          <div>discriminator matches: {String(lastDecodedState.checks.accountDiscriminatorMatches)}</div>
          <div>issuer matches expected: {String(lastDecodedState.checks.issuerMatchesExpected ?? "n/a")}</div>
          <div>recipient matches expected: {String(lastDecodedState.checks.recipientMatchesExpected ?? "n/a")}</div>
          <div>payload hash matches expected: {String(lastDecodedState.checks.payloadHashMatchesExpected ?? "n/a")}</div>
        </div>
      )}
    </div>
  );
}
