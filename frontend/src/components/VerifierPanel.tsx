
"use client";
import { useState } from "react";
import { Contract, Account, Provider, GetTransactionReceiptResponse } from "starknet";
import toast from "react-hot-toast";

interface VerificationResult {
  id: string;
  timestamp: string;
  type: "receipt_nft" | "zk_proof" | "btc_transaction";
  input: string;
  status: "valid" | "invalid" | "pending" | "error";
  details: Record<string, any>;
  errorMessage?: string;
}

const ABI = [
  {
    name: "verify_receipt",
    type: "function",
    inputs: [{ name: "receipt_id", type: "core::felt252" }],
    outputs: [],
    state_mutability: "external",
  },
];

export function VerifierPanel() {
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationInput, setVerificationInput] = useState("");
  const [verificationType, setVerificationType] =
    useState<"receipt_nft" | "zk_proof" | "btc_transaction">("receipt_nft");
  const [account, setAccount] = useState<Account | null>(null);


  const provider = new Provider({
    nodeUrl:
      process.env.NEXT_PUBLIC_STARKNET_RPC_URL ||
      "https://starknet-sepolia.public.blastapi.io/rpc/v0_7",
  });

  const CONTRACT_ADDRESS =
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
    "0x032999b94db176a3a4df1e6caa58e2ed4bf781a19c21e43b295eeac867d19bba";


  function toFelt(value: string | number): bigint {
    if (typeof value === "number") return BigInt(value);
    if (/^0x[0-9a-fA-F]+$/.test(value) || /^\d+$/.test(value)) return BigInt(value);
    throw new Error("Invalid value type for felt conversion");
  }

  async function connectStarknetWallet(): Promise<Account | null> {
    try {
      const argent = (window as any).starknet;
      if (!argent) throw new Error("Please install Argent X to continue.");

      await argent.enable();
      toast.success("Wallet connected!");
      return argent.account;
    } catch (err: any) {
      console.error("Wallet connection failed:", err);
      toast.error(err?.message || "Wallet connection error");
      return null;
    }
  }

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationInput.trim()) return;

    setIsVerifying(true);
    const resultId = `VERIFY-${Date.now()}`;
    setVerificationResults((prev) => [
      {
        id: resultId,
        timestamp: new Date().toISOString(),
        type: verificationType,
        input: verificationInput,
        status: "pending",
        details: {},
      },
      ...prev,
    ]);

    try {
      if (verificationType === "receipt_nft") {
        let currentAccount = account || (await connectStarknetWallet());
        if (!currentAccount) throw new Error("Wallet not connected");
        setAccount(currentAccount);

        const contract = new Contract(ABI, CONTRACT_ADDRESS, currentAccount);
        const receiptId = toFelt(verificationInput);

        toast.loading("Submitting verification...");

        const tx = await contract.invoke("verify_receipt", [receiptId]);
        const receipt: GetTransactionReceiptResponse =
          await provider.waitForTransaction(tx.transaction_hash);

        const statusValue =
          (receipt as any)?.finality_status ||
          (receipt as any)?.status ||
          (receipt as any)?.execution_status ||
          "";

        const status: VerificationResult["status"] =
          ["ACCEPTED_ON_L2", "ACCEPTED_ONCHAIN"].includes(statusValue)
            ? "valid"
            : ["REJECTED", "REVERTED"].includes(statusValue)
            ? "invalid"
            : "pending";

        toast.dismiss();
        toast[status === "valid" ? "success" : "error"](
          status === "valid" ? "Verification successful!" : "Verification failed"
        );

        setVerificationResults((prev) =>
          prev.map((r) =>
            r.id === resultId
              ? {
                  ...r,
                  status,
                  details: { contractAddress: CONTRACT_ADDRESS, receiptId: verificationInput },
                  errorMessage:
                    status === "invalid" ? `Transaction not accepted: ${statusValue}` : undefined,
                }
              : r
          )
        );
      } else {
        await new Promise((res) => setTimeout(res, 1500));
        const isValid = Math.random() > 0.3;

        setVerificationResults((prev) =>
          prev.map((r) =>
            r.id === resultId
              ? {
                  ...r,
                  status: isValid ? "valid" : "invalid",
                  details: { mockType: verificationType, input: verificationInput },
                  errorMessage: isValid ? undefined : "Mock verification failed",
                }
              : r
          )
        );

        toast[isValid ? "success" : "error"](
          isValid ? "Mock verification successful!" : "Mock verification failed"
        );
      }
    } catch (error: any) {
      console.error(error);
      toast.dismiss();
      toast.error(error?.message || "Verification failed");

      setVerificationResults((prev) =>
        prev.map((r) =>
          r.id === resultId ? { ...r, status: "error", errorMessage: error?.message } : r
        )
      );
    } finally {
      setIsVerifying(false);
      setVerificationInput("");
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid":
        return "text-green-600 bg-green-50 border-green-200";
      case "invalid":
        return "text-red-600 bg-red-50 border-red-200";
      case "error":
        return "text-orange-600 bg-orange-50 border-orange-200";
      default:
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  return (
    <div className="space-y-6 p-6 border rounded-xl bg-white shadow-sm">
      <p className="text-sm text-gray-600">
        Verify receipts, proofs, and BTC transactions
      </p>

      <form onSubmit={handleVerification} className="border rounded-lg p-6 bg-gray-50 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Verification Type</label>
          <select
            value={verificationType}
            onChange={(e) => setVerificationType(e.target.value as any)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-black"
          >
            <option value="receipt_nft">Receipt NFT (Token ID or Contract Address)</option>
            <option value="zk_proof">zkProof ID</option>
            <option value="btc_transaction">BTC Transaction Hash</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Verification Input</label>
          <input
            type="text"
            value={verificationInput}
            onChange={(e) => setVerificationInput(e.target.value)}
            placeholder="Enter proof ID, token ID or BTC tx hash..."
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-black"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isVerifying}
          className="w-full px-4 py-2 bg-black text-white rounded-md hover:bg-zinc-800 disabled:opacity-60"
        >
          {isVerifying ? "Verifying..." : "Verify Proof"}
        </button>
      </form>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Verification Results</h3>

        {verificationResults.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No verifications performed yet.
          </div>
        ) : (
          verificationResults.map((result) => (
            <div
              key={result.id}
              className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-medium">{result.id}</span>
                  <span
                    className={`ml-3 text-xs px-2 py-1 rounded-full ${getStatusColor(
                      result.status
                    )}`}
                  >
                    {result.status.toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {new Date(result.timestamp).toLocaleString()}
                </span>
              </div>

              <div className="font-mono text-xs break-all bg-white/50 p-2 rounded mb-2">
                {result.input}
              </div>

              {result.status === "valid" && (
                <div className="text-green-800 text-sm">✅ Verification successful</div>
              )}
              {result.status === "invalid" && (
                <div className="text-red-800 text-sm">
                  ❌ Verification failed: {result.errorMessage || "Invalid data"}
                </div>
              )}
              {result.status === "error" && (
                <div className="text-orange-800 text-sm">
                  ⚠️ Error: {result.errorMessage}
                </div>
              )}
              {result.status === "pending" && (
                <div className="text-blue-800 text-sm flex items-center gap-2">
                  ⏳ Verifying...
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
