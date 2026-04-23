"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { ReceiptMinting, ReceiptHistory, type ReceiptNFT } from "./ReceiptMinting";

type ReceiptRecord = ReceiptNFT;

type TransferRecord = {
  signature: string;
  slot: number | null;
  explorerUrl: string;
};

type OnChainReceipt = {
  txSignature: string;
  slot: number | null;
  explorerUrl: string;
  receiptPda: string;
  payloadHashHex: string;
  programId: string;
  expectedIssuer: string;
  expectedRecipient: string;
};

type LastIssuedReceiptContext = OnChainReceipt & {
  expectedIssuer: string;
  expectedRecipient: string;
  expectedPaymentSignature: string;
};

type ReceiptVerificationResult = {
  decoded: {
    receiptPda: string;
    issuer: string;
    recipient: string;
    payloadHashHex: string;
    verified: boolean;
    revoked: boolean;
    timestamp: number;
    bump: number;
  };
  checks: {
    accountDiscriminatorMatches: boolean;
    ownerMatchesProgram: boolean;
    issuerMatchesExpected?: boolean;
    recipientMatchesExpected?: boolean;
    payloadHashMatchesExpected?: boolean;
    revokedIsFalse: boolean;
  };
};

type PersistedVerification = {
  status: "pass" | "fail";
  message: string;
};

const RECEIPTS_STORAGE_KEY = "shadownet.receipts.v1";
const VERIFY_STORAGE_KEY = "shadownet.receipt-verification.v1";

function shortKey(key: string | null): string {
  if (!key) return "-";
  if (key.length <= 12) return key;
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export function WalletPanel() {
  const {
    connected,
    publicKey,
    walletName,
    supportsSignMessage,
    supportsSendTransaction,
    signMessage,
    sendDevnetTransfer,
    issueReceiptOnDevnet,
    verifyReceiptPdaOnDevnet,
    programId,
  } = useSolanaWallet();

  const [busy, setBusy] = useState(false);
  const [lastMessageSignature, setLastMessageSignature] = useState<string | null>(null);
  const [lastTransfer, setLastTransfer] = useState<TransferRecord | null>(null);

  const [recipient, setRecipient] = useState("");
  const [amountSol, setAmountSol] = useState("0.001");

  const [activeMinting, setActiveMinting] = useState<string | null>(null);
  const [activeAmount, setActiveAmount] = useState<number>(0);
  const [activePaymentSignature, setActivePaymentSignature] = useState<string>("");
  const [activeOnChainReceipt, setActiveOnChainReceipt] = useState<OnChainReceipt | null>(null);
  const [lastIssuedReceipt, setLastIssuedReceipt] = useState<LastIssuedReceiptContext | null>(null);
  const [receiptVerification, setReceiptVerification] = useState<ReceiptVerificationResult | null>(null);
  const [verifyingReceiptId, setVerifyingReceiptId] = useState<string | null>(null);
  const [verificationByReceiptId, setVerificationByReceiptId] = useState<Record<string, PersistedVerification>>({});
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    try {
      const rawReceipts = localStorage.getItem(RECEIPTS_STORAGE_KEY);
      if (rawReceipts) {
        const parsed = JSON.parse(rawReceipts);
        if (Array.isArray(parsed)) {
          setReceipts(parsed as ReceiptRecord[]);
        }
      }

      const rawVerification = localStorage.getItem(VERIFY_STORAGE_KEY);
      if (rawVerification) {
        const parsed = JSON.parse(rawVerification);
        if (parsed && typeof parsed === "object") {
          setVerificationByReceiptId(parsed as Record<string, PersistedVerification>);
        }
      }
    } catch {
      // Ignore malformed local storage values.
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(receipts));
  }, [receipts, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(VERIFY_STORAGE_KEY, JSON.stringify(verificationByReceiptId));
  }, [storageReady, verificationByReceiptId]);

  async function run<T>(fn: () => Promise<T>) {
    setBusy(true);
    try {
      return await fn();
    } finally {
      setBusy(false);
    }
  }

  const handleMintingComplete = (receipt: ReceiptRecord) => {
    setReceipts((prev) => [receipt, ...prev]);
    setActiveMinting(null);
    setActiveOnChainReceipt(null);
  };

  const handleSendOnDevnet = () => {
    void run(async () => {
      if (!connected || !publicKey) {
        toast.error("Connect your Solana wallet first.");
        return;
      }

      const to = recipient.trim();
      if (!to) {
        toast.error("Recipient address is required.");
        return;
      }

      if (to === publicKey) {
        toast.error("Recipient must be different from sender.");
        return;
      }

      const parsedAmount = Number(amountSol);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        toast.error("Enter a valid SOL amount.");
        return;
      }

      const lamports = Math.round(parsedAmount * 1_000_000_000);

      toast.loading("Sending devnet transfer...", { id: "tx" });
      const sent = await sendDevnetTransfer(to, lamports);
      toast.success("Transfer confirmed.", { id: "tx" });
      setLastTransfer(sent);

      toast.loading("Issuing on-chain receipt...", { id: "receipt" });
      const receiptIx = await issueReceiptOnDevnet(sent.signature, to);
      toast.success("Receipt issued on-chain.", { id: "receipt" });

      const invoiceId = `INV-${Date.now()}`;
      setActiveMinting(invoiceId);
      setActiveAmount(lamports);
      setActivePaymentSignature(sent.signature);
      setActiveOnChainReceipt({
        txSignature: receiptIx.signature,
        slot: receiptIx.slot,
        explorerUrl: receiptIx.explorerUrl,
        receiptPda: receiptIx.receiptPda,
        payloadHashHex: receiptIx.payloadHashHex,
        programId: receiptIx.programId,
        expectedIssuer: publicKey,
        expectedRecipient: to,
      });
      setLastIssuedReceipt({
        txSignature: receiptIx.signature,
        slot: receiptIx.slot,
        explorerUrl: receiptIx.explorerUrl,
        receiptPda: receiptIx.receiptPda,
        payloadHashHex: receiptIx.payloadHashHex,
        programId: receiptIx.programId,
        expectedIssuer: publicKey,
        expectedRecipient: to,
        expectedPaymentSignature: sent.signature,
      });
      setReceiptVerification(null);
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : "Transfer failed.";
      toast.error(message, { id: "tx" });
      toast.error(message, { id: "receipt" });
    });
  };

  const handleVerifyHistoryReceipt = (receipt: ReceiptRecord) => {
    if (!receipt.receiptPda) {
      toast.error("This receipt has no PDA to verify.");
      return;
    }
    const receiptPda = receipt.receiptPda;

    setVerifyingReceiptId(receipt.id);
    void run(async () => {
      const result = await verifyReceiptPdaOnDevnet({
        receiptPda,
        expectedIssuer: receipt.expectedIssuer,
        expectedRecipient: receipt.expectedRecipient,
        expectedPaymentSignature: receipt.paymentSignature,
      });

      const checks = result.checks;
      const passed =
        checks.accountDiscriminatorMatches &&
        checks.ownerMatchesProgram &&
        checks.issuerMatchesExpected !== false &&
        checks.recipientMatchesExpected !== false &&
        checks.payloadHashMatchesExpected !== false &&
        checks.revokedIsFalse;

      setVerificationByReceiptId((prev) => ({
        ...prev,
        [receipt.id]: {
          status: passed ? "pass" : "fail",
          message: passed ? "Verified on-chain" : "Checks failed",
        },
      }));
      setReceipts((prev) =>
        prev.map((item) =>
          item.id === receipt.id
            ? {
                ...item,
                verifiedOnChain: passed ? result.decoded.verified : item.verifiedOnChain,
                revokedOnChain: result.decoded.revoked,
              }
            : item
        )
      );
      if (passed) {
        toast.success("Receipt verified.");
      } else {
        toast.error("Receipt loaded but checks failed.");
      }
    })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Verification failed.";
        setVerificationByReceiptId((prev) => ({
          ...prev,
          [receipt.id]: {
            status: "fail",
            message,
          },
        }));
        toast.error(message);
      })
      .finally(() => setVerifyingReceiptId(null));
  };

  const handleVerifyReceiptPda = () => {
    if (!lastIssuedReceipt) {
      toast.error("No issued receipt found to verify.");
      return;
    }

    void run(async () => {
      toast.loading("Verifying receipt PDA...", { id: "verify" });
      const result = await verifyReceiptPdaOnDevnet({
        receiptPda: lastIssuedReceipt.receiptPda,
        expectedIssuer: lastIssuedReceipt.expectedIssuer,
        expectedRecipient: lastIssuedReceipt.expectedRecipient,
        expectedPaymentSignature: lastIssuedReceipt.expectedPaymentSignature,
      });
      setReceiptVerification(result);

      const checks = result.checks;
      const passed =
        checks.accountDiscriminatorMatches &&
        checks.ownerMatchesProgram &&
        checks.issuerMatchesExpected !== false &&
        checks.recipientMatchesExpected !== false &&
        checks.payloadHashMatchesExpected !== false &&
        checks.revokedIsFalse;

      if (passed) {
        toast.success("Receipt PDA verified successfully.", { id: "verify" });
      } else {
        toast.error("Receipt PDA loaded, but one or more checks failed.", { id: "verify" });
      }
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : "Verification failed.";
      toast.error(message, { id: "verify" });
    });
  };

  return (
    <div className="space-y-6 p-6 border rounded-xl bg-white shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg bg-gray-50/60">
          <div className="text-sm font-medium mb-2">Wallet</div>
          <div className="text-sm text-gray-700">{walletName}</div>
          <div className="text-sm text-gray-700 mt-1">
            Status: <span className="font-mono">{connected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>
        <div className="p-4 border rounded-lg bg-gray-50/60 md:col-span-2">
          <div className="text-sm font-medium mb-2">Public Key</div>
          <div className="text-sm font-mono break-all">{publicKey ?? "No wallet connected"}</div>
          <div className="text-xs text-gray-600 mt-2">Program: {programId}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          disabled={!connected || !supportsSignMessage || busy}
          onClick={() =>
            run(async () => {
              const signature = await signMessage("ShadowNet Solana wallet verification");
              setLastMessageSignature(signature);
              toast.success("Message signed.");
            })
          }
          className="px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-60"
        >
          Sign Message
        </button>

        <button
          disabled={!connected || busy}
          onClick={() => {
            if (!publicKey) return;
            void navigator.clipboard.writeText(publicKey);
            toast.success("Address copied.");
          }}
          className="px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-60"
        >
          Copy Address ({shortKey(publicKey)})
        </button>
      </div>

      <div className="p-4 border rounded-lg bg-gray-50/60 space-y-4">
        <div className="text-sm font-medium">Send SOL On Devnet + Confirm + Issue Anchor Receipt</div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Recipient Address</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Recipient devnet address"
              className="w-full px-3 py-2 border rounded bg-white text-sm font-mono"
              disabled={!connected || busy}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Amount (SOL)</label>
            <input
              type="number"
              min="0"
              step="0.000001"
              value={amountSol}
              onChange={(e) => setAmountSol(e.target.value)}
              className="w-full px-3 py-2 border rounded bg-white text-sm"
              disabled={!connected || busy}
            />
          </div>
        </div>

        <button
          disabled={!connected || !supportsSendTransaction || busy}
          onClick={handleSendOnDevnet}
          className="px-3 py-2 border rounded hover:bg-gray-50 bg-blue-50 text-blue-700 border-blue-200 disabled:opacity-60"
        >
          Send + Issue Receipt
        </button>
      </div>

      {lastMessageSignature && (
        <div className="p-4 border rounded-lg bg-gray-50/60">
          <div className="text-sm font-medium mb-2">Last Message Signature</div>
          <div className="text-xs font-mono break-all">{lastMessageSignature}</div>
        </div>
      )}

      {lastTransfer && (
        <div className="p-4 border rounded-lg bg-gray-50/60 space-y-2">
          <div className="text-sm font-medium">Last Confirmed Transfer</div>
          <div className="text-xs font-mono break-all">Signature: {lastTransfer.signature}</div>
          <div className="text-xs">Slot: {lastTransfer.slot ?? "-"}</div>
          <a
            href={lastTransfer.explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-700 underline"
          >
            View Transfer on Solana Explorer (Devnet)
          </a>
        </div>
      )}

      {lastIssuedReceipt && (
        <div className="p-4 border rounded-lg bg-gray-50/60 space-y-3">
          <div className="text-sm font-medium">Verify Receipt PDA</div>
          <div className="text-xs">
            PDA: <span className="font-mono break-all">{lastIssuedReceipt.receiptPda}</span>
          </div>
          <button
            disabled={busy}
            onClick={handleVerifyReceiptPda}
            className="px-3 py-2 border rounded hover:bg-gray-50 bg-emerald-50 text-emerald-700 border-emerald-200 disabled:opacity-60"
          >
            Verify Receipt PDA
          </button>

          {receiptVerification && (
            <div className="text-xs space-y-1 border rounded p-3 bg-white">
              <div>
                `discriminator`: {receiptVerification.checks.accountDiscriminatorMatches ? "ok" : "failed"}
              </div>
              <div>`owner`: {receiptVerification.checks.ownerMatchesProgram ? "ok" : "failed"}</div>
              <div>`issuer`: {String(receiptVerification.checks.issuerMatchesExpected ?? "n/a")}</div>
              <div>`recipient`: {String(receiptVerification.checks.recipientMatchesExpected ?? "n/a")}</div>
              <div>`payload_hash`: {String(receiptVerification.checks.payloadHashMatchesExpected ?? "n/a")}</div>
              <div>`revoked=false`: {receiptVerification.checks.revokedIsFalse ? "ok" : "failed"}</div>
              <div>
                Decoded: issuer=<span className="font-mono break-all">{receiptVerification.decoded.issuer}</span>
              </div>
              <div>
                recipient=<span className="font-mono break-all">{receiptVerification.decoded.recipient}</span>
              </div>
              <div>
                payload_hash=<span className="font-mono break-all">{receiptVerification.decoded.payloadHashHex}</span>
              </div>
              <div>
                verified={String(receiptVerification.decoded.verified)} revoked={String(receiptVerification.decoded.revoked)}
                {" "}timestamp={receiptVerification.decoded.timestamp} bump={receiptVerification.decoded.bump}
              </div>
            </div>
          )}
        </div>
      )}

      {activeMinting && activeOnChainReceipt && (
        <div className="mt-6">
          <ReceiptMinting
            invoiceId={activeMinting}
            amount={activeAmount}
            paymentSignature={activePaymentSignature}
            onChainReceipt={activeOnChainReceipt}
            onMintingComplete={handleMintingComplete}
          />
        </div>
      )}

      {receipts.length > 0 && (
        <div className="mt-8">
          <ReceiptHistory
            receipts={receipts}
            onVerifyReceipt={handleVerifyHistoryReceipt}
            verifyingReceiptId={verifyingReceiptId}
            verificationByReceiptId={verificationByReceiptId}
          />
        </div>
      )}
    </div>
  );
}
