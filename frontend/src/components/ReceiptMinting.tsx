/* eslint-disable react-hooks/exhaustive-deps */

"use client";

import { useState, useEffect } from "react";

export interface ReceiptNFT {
  id: string;
  invoiceId: string;
  amount: number;
  paymentSignature: string;
  blockHeight: number;
  timestamp: string;
  status: "minting" | "minted" | "failed";
  contractAddress?: string;
  tokenId?: string;
  zkProofId?: string;
  zkProofHash?: string;
  receiptTxSignature?: string;
  receiptExplorerUrl?: string;
  receiptPda?: string;
  payloadHashHex?: string;
  expectedIssuer?: string;
  expectedRecipient?: string;
}

interface OnChainReceiptData {
  txSignature: string;
  slot: number | null;
  explorerUrl: string;
  receiptPda: string;
  payloadHashHex: string;
  programId: string;
  expectedIssuer: string;
  expectedRecipient: string;
}

interface ReceiptMintingProps {
  invoiceId: string;
  amount: number;
  paymentSignature: string;
  onChainReceipt: OnChainReceiptData;
  onMintingComplete?: (receipt: ReceiptNFT) => void;
}

type ReceiptVerificationRow = {
  status: "pass" | "fail";
  message: string;
};

export function ReceiptMinting({
  invoiceId,
  amount,
  paymentSignature,
  onChainReceipt,
  onMintingComplete,
}: ReceiptMintingProps) {
  const [receipt, setReceipt] = useState<ReceiptNFT>({
    id: `RECEIPT-${Date.now()}`,
    invoiceId,
    amount,
    paymentSignature,
    blockHeight: onChainReceipt.slot ?? 0,
    timestamp: new Date().toISOString(),
    status: "minting",
    contractAddress: onChainReceipt.programId,
    receiptTxSignature: onChainReceipt.txSignature,
    receiptExplorerUrl: onChainReceipt.explorerUrl,
    receiptPda: onChainReceipt.receiptPda,
    payloadHashHex: onChainReceipt.payloadHashHex,
    expectedIssuer: onChainReceipt.expectedIssuer,
    expectedRecipient: onChainReceipt.expectedRecipient,
  });

  const [mintingProgress, setMintingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");

  useEffect(() => {
    const steps = [
      "Transfer confirmed on devnet...",
      "Generating zk proof...",
      "Anchor receipt instruction confirmed...",
      "Finalizing receipt metadata...",
      "Receipt complete...",
    ];

    let stepIndex = 0;
    const interval = setInterval(async () => {
      if (stepIndex < steps.length) {
        setCurrentStep(steps[stepIndex]);
        setMintingProgress((stepIndex + 1) * 20);
        if (steps[stepIndex] === "Generating zk proof...") {
          try {
            const res = await fetch("/api/proofs/generate", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ invoiceId, paymentRef: paymentSignature, amount }),
            }).then((r) => r.json());
            if (res?.proofId) {
              setReceipt((prev) => ({ ...prev, zkProofId: res.proofId, zkProofHash: res.proofHash }));
            }
          } catch {
            // no-op
          }
        }
        stepIndex += 1;
      } else {
        const completedReceipt: ReceiptNFT = {
          ...receipt,
          status: "minted",
          tokenId: onChainReceipt.receiptPda,
        };
        setReceipt(completedReceipt);
        onMintingComplete?.(completedReceipt);
        clearInterval(interval);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const formatAmount = (lamports: number) => {
    return (lamports / 1_000_000_000).toFixed(6);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "minted":
        return "text-green-600 bg-green-50";
      case "failed":
        return "text-red-600 bg-red-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Receipt Minting</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(receipt.status)}`}>
          {receipt.status.toUpperCase()}
        </span>
      </div>

      {receipt.status === "minting" && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-600">{mintingProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${mintingProgress}%` }} />
          </div>
          <div className="mt-2 text-sm text-gray-600">{currentStep}</div>
        </div>
      )}

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Invoice ID:</span>
            <div className="font-mono">{receipt.invoiceId}</div>
          </div>
          <div>
            <span className="font-medium text-gray-600">Amount:</span>
            <div className="font-mono">{formatAmount(receipt.amount)} SOL</div>
          </div>
        </div>

        <div>
          <span className="font-medium text-gray-600">Transfer Signature:</span>
          <div className="font-mono text-xs break-all bg-gray-100 p-2 rounded mt-1">{receipt.paymentSignature}</div>
        </div>

        <div>
          <span className="font-medium text-gray-600">Receipt PDA:</span>
          <div className="font-mono text-xs break-all bg-gray-100 p-2 rounded mt-1">{receipt.receiptPda}</div>
        </div>

        <div>
          <span className="font-medium text-gray-600">Payload Hash:</span>
          <div className="font-mono text-xs break-all bg-gray-100 p-2 rounded mt-1">{receipt.payloadHashHex}</div>
        </div>

        <div>
          <span className="font-medium text-gray-600">Receipt Instruction Signature:</span>
          <div className="font-mono text-xs break-all bg-gray-100 p-2 rounded mt-1">{receipt.receiptTxSignature}</div>
        </div>

        {receipt.receiptExplorerUrl && (
          <a
            href={receipt.receiptExplorerUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-700 underline"
          >
            View Receipt Instruction on Solana Explorer
          </a>
        )}

        {receipt.status === "minted" && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Program:</span>
                <div className="font-mono text-xs break-all">{receipt.contractAddress}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Receipt ID:</span>
                <div className="font-mono break-all">{receipt.tokenId}</div>
              </div>
            </div>

            <div>
              <span className="font-medium text-gray-600">zk Proof ID:</span>
              <div className="font-mono text-xs break-all bg-green-100 p-2 rounded mt-1">{receipt.zkProofId || "pending"}</div>
            </div>
            {receipt.zkProofHash && (
              <div>
                <span className="font-medium text-gray-600">zk Proof Hash:</span>
                <div className="font-mono text-xs break-all bg-green-50 p-2 rounded mt-1">{receipt.zkProofHash}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {receipt.status === "minted" && (
        <div className="flex gap-3 mt-4">
          <a
            href={receipt.receiptExplorerUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            View On Explorer
          </a>
          <button className="px-4 py-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50 text-sm">Share Receipt</button>
          <button className="px-4 py-2 border rounded-md hover:bg-gray-50 text-sm">Download PDF</button>
        </div>
      )}
    </div>
  );
}

export function ReceiptHistory({
  receipts,
  onVerifyReceipt,
  verifyingReceiptId,
  verificationByReceiptId,
}: {
  receipts: ReceiptNFT[];
  onVerifyReceipt?: (receipt: ReceiptNFT) => void;
  verifyingReceiptId?: string | null;
  verificationByReceiptId?: Record<string, ReceiptVerificationRow>;
}) {
  const formatAmount = (lamports: number) => {
    return (lamports / 1_000_000_000).toFixed(6);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "minted":
        return "text-green-600 bg-green-50";
      case "failed":
        return "text-red-600 bg-red-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  const getVerificationBadgeClass = (status: "pass" | "fail") =>
    status === "pass"
      ? "text-green-700 bg-green-100 border-green-200"
      : "text-red-700 bg-red-100 border-red-200";

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Receipt History</h3>
      {receipts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No receipts minted yet.</div>
      ) : (
        <div className="space-y-3">
          {receipts.map((receipt) => (
            <div key={receipt.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{receipt.id}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(receipt.status)}`}>
                    {receipt.status.toUpperCase()}
                  </span>
                  {verificationByReceiptId?.[receipt.id] && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getVerificationBadgeClass(
                        verificationByReceiptId[receipt.id].status
                      )}`}
                    >
                      {verificationByReceiptId[receipt.id].status === "pass" ? "Verified" : "Verify Failed"}
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold">{formatAmount(receipt.amount)} SOL</span>
              </div>

              <div className="text-sm text-gray-600 mb-2">Invoice: {receipt.invoiceId}</div>

              {receipt.status === "minted" && (
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div>
                    <span className="font-medium">Receipt PDA:</span>
                    <div className="font-mono break-all">{receipt.receiptPda}</div>
                  </div>
                  <div>
                    <span className="font-medium">Instruction Tx:</span>
                    <div className="font-mono break-all">{receipt.receiptTxSignature}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onVerifyReceipt?.(receipt)}
                      disabled={!receipt.receiptPda || verifyingReceiptId === receipt.id}
                      className="px-2 py-1 border rounded bg-emerald-50 text-emerald-700 border-emerald-200 disabled:opacity-60"
                    >
                      {verifyingReceiptId === receipt.id ? "Verifying..." : "Verify"}
                    </button>
                    {verificationByReceiptId?.[receipt.id] && (
                      <span
                        className={
                          verificationByReceiptId[receipt.id].status === "pass" ? "text-green-700" : "text-red-700"
                        }
                      >
                        {verificationByReceiptId[receipt.id].message}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-2 text-xs text-gray-500">{new Date(receipt.timestamp).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
