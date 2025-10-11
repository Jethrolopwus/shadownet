"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Contract, Account, Provider } from "starknet";
import { useXverse } from "@/hooks/useXverse";
import { InvoiceSettlementData } from "@/lib/lightning";
import toast from "react-hot-toast";
import { FadeLoader } from "react-spinners";
import { sendBitcoinTransfer } from "@/lib/btc";
import { getProofHashForTxid } from "@/lib/proofs";

const receiptAbi = [
  {
    name: "submit_receipt",
    type: "function",
    inputs: [
      { name: "payer_hash", type: "core::felt252" },
      { name: "payee_hash", type: "core::felt252" },
      { name: "amount_sats", type: "core::felt252" },
      { name: "timestamp", type: "core::felt252" },
      { name: "proof_hash", type: "core::felt252" },
    ],
    outputs: [],
    state_mutability: "external",
  },
] as const;

const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x03c0748541a202e2898ffb6b23a2957d4c12fa0e6b7b975827f30f1bd6c82713";

export interface InvoiceSettlementDataExtended extends InvoiceSettlementData {
  payer_hash: string;
  payee_hash: string;
  amount_sats: string | number;
  timestamp: number;
  proof_hash: string;
}

export function MerchantPanel() {
  const { connected, connect: connectXverse } = useXverse();
  const [account, setAccount] = useState<Account | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState<number>(0);

  const initXverse = useCallback(async () => {
    try {
      await connectXverse();

      const wallet = (window as any).starknet;
      if (!wallet) throw new Error("StarkNet wallet (Xverse) not found on window");

      await wallet.enable({ showModal: false });
      const acct: Account = wallet.account;

      const rpcUrl = process.env.NEXT_PUBLIC_STARKNET_RPC;
      const p = rpcUrl ? new Provider({ nodeUrl: rpcUrl }) : new Provider();

      setAccount(acct);
      setProvider(p);
      setStatusMessage("Xverse wallet connected ✅");
    } catch (err: any) {
      console.error("Error initializing Xverse:", err);
      const msg = err.message || "Xverse initialization failed";
      setError(msg);
      toast.error(msg);
    }
  }, [connectXverse]);

  useEffect(() => {
    if (connected && !account) initXverse();
  }, [connected, account, initXverse]);

  function toFelt(value: string | number | bigint): bigint {
    if (typeof value === "number") return BigInt(value);
    if (typeof value === "bigint") return value;
    if (typeof value === "string") {
      if (/^0x[0-9a-fA-F]+$/.test(value) || /^\d+$/.test(value)) return BigInt(value);
      return BigInt("0x" + Buffer.from(value).toString("hex"));
    }
    throw new Error("Unsupported value type for felt conversion");
  }

  const handlePaymentAndReceipt = useCallback(async () => {
    try {
      setError(null);

      if (!connected) await connectXverse();
      if (!account) await initXverse();
      if (!account || !provider) throw new Error("Starknet account/provider not available");

      if (!recipient) return toast.error("Recipient required");
      if (!amount || amount <= 0) return toast.error("Invalid amount");

      setIsSubmitting(true);
      setModalOpen(false);
      setStatusMessage("Sending Bitcoin via Xverse...");
      const res = await sendBitcoinTransfer(recipient, amount);

      const txid =
        (res as any)?.txid ||
        (res as any)?.txId ||
        (res as any)?.hash ||
        (res as any)?.transactionId ||
        (res as any)?.tx?.txid ||
        res?.result?.txid ||
        (res as any)?.result?.txHash ||
        (res as any)?.data?.result?.txid;

      if (!txid) {
        console.error("Wallet response:", res);
        throw new Error("Could not find txid in wallet response");
      }

      toast.success("Bitcoin TX sent");
      setStatusMessage(`Bitcoin tx submitted: ${txid}`);

      const proofBigInt = getProofHashForTxid(String(txid));
      const contract = new Contract(receiptAbi, CONTRACT_ADDRESS, account);

      const payer_hash = toFelt((account as any).address ?? "");
      const payee_hash = toFelt(CONTRACT_ADDRESS);
      const amount_felt = toFelt(amount);
      const ts = toFelt(Math.floor(Date.now() / 1000));
      const proof_felt = toFelt(proofBigInt);

      setStatusMessage("Submitting receipt to StarkNet...");
      const invocation = await contract.invoke("submit_receipt", [
        payer_hash,
        payee_hash,
        amount_felt,
        ts,
        proof_felt,
      ]);

      const starkTxHash = invocation.transaction_hash;
      setLastTxHash(starkTxHash);
      setStatusMessage(`StarkNet tx submitted: ${starkTxHash}`);

      const receipt: any = await provider.waitForTransaction(starkTxHash);
      const statusVal =
        receipt.finality_status ||
        receipt.status ||
        receipt.execution_status ||
        receipt.executionResult;

      if (["ACCEPTED_ON_L2", "ACCEPTED_ON_L1", "SUCCEEDED"].includes(statusVal)) {
        toast.success("Receipt recorded successfully!");
        setStatusMessage("✅ Receipt successfully recorded on StarkNet");
      } else {
        const msg = `❌ StarkNet TX failed: ${String(statusVal)}`;
        setError(msg);
        toast.error(msg);
      }
      
      setRecipient("");
      setAmount(0);
    } catch (err: any) {
      console.error("handlePaymentAndReceipt error:", err);
      const msg = err?.message || "Payment + receipt flow failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [connected, connectXverse, account, provider, initXverse, recipient, amount]);

  const onInvoiceSettled = useCallback(
    async (data: InvoiceSettlementDataExtended) => {
      if (!account || !provider) {
        setStatusMessage("Cannot submit receipt: wallet not connected");
        return toast.error("Cannot submit receipt: wallet not connected");
      }

      setIsSubmitting(true);
      setError(null);
      setStatusMessage("Submitting receipt on-chain...");

      try {
        const contract = new Contract(receiptAbi, CONTRACT_ADDRESS, account);

        const invocation = await contract.invoke("submit_receipt", [
          toFelt(data.payer_hash),
          toFelt(data.payee_hash),
          toFelt(data.amount_sats),
          toFelt(data.timestamp),
          toFelt(data.proof_hash),
        ]);

        const txHash = invocation.transaction_hash;
        setLastTxHash(txHash);
        setStatusMessage(`Transaction submitted: ${txHash}`);

        const receipt: any = await provider.waitForTransaction(txHash);
        const status =
          receipt.execution_status ||
          receipt.executionResult ||
          receipt.finality_status;

        if (["SUCCEEDED", "ACCEPTED_ON_L2", "ACCEPTED_ON_L1"].includes(status)) {
          toast.success("Receipt recorded successfully!");
          setStatusMessage("✅ Receipt recorded!");
        } else {
          const msg = `Transaction failed: ${status}`;
          setError(msg);
          toast.error(msg);
        }
      } catch (err: any) {
        console.error("submit_receipt error:", err);
        setError(err.message || "submit_receipt failed");
        setStatusMessage("Failed to submit receipt");
        toast.error(err.message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [account, provider]
  );

  return (
    <div className="w-full bg-white/95 min-h-screen flex mt-2 backdrop-blur-sm rounded-2xl shadow-2xl p-8 relative">
      {isSubmitting && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-2xl z-50">
          <div className="flex flex-col items-center">
            <FadeLoader color="#003B7A" />
            <p className="mt-3 text-[#003B7A] font-semibold">
              Submitting to StarkNet...
            </p>
          </div>
        </div>
      )}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-40 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6 text-[#003B7A] text-center">
              Send Bitcoin Payment
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Address
                </label>
                <input
                  type="text"
                  placeholder="Enter BTC recipient address"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-[#003B7A] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (Satoshis)
                </label>
                <input
                  type="number"
                  placeholder="Amount in Satoshis"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-[#003B7A] focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handlePaymentAndReceipt}
                className="bg-[#003B7A] text-white px-6 py-3 rounded-lg hover:bg-[#002855] transition-colors flex-1 font-semibold"
              >
                Send Payment
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {!connected ? (
            <button
              onClick={connectXverse}
              className="w-full sm:w-auto px-6 py-3 bg-[#003B7A] text-white rounded-lg hover:bg-[#002855] transition-colors font-semibold shadow-lg"
            >
              Connect Xverse Wallet
            </button>
          ) : (
            <div className="flex items-center gap-2 text-green-600 font-semibold bg-green-50 px-4 py-2 rounded-lg">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Xverse Connected
            </div>
          )}

          <button
            onClick={() => setModalOpen(true)}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 bg-[#003B7A] text-white rounded-lg hover:bg-[#002855] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
          >
            Pay with Xverse (BTC)
          </button>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl shadow-inner border border-gray-200">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-gray-700 min-w-[60px]">Status:</span>
              <span className="text-gray-900">{statusMessage || "Ready to process payments"}</span>
            </div>
            {lastTxHash && (
              <div className="flex items-start gap-2">
                <span className="font-semibold text-gray-700 min-w-[60px]">Tx Hash:</span>
                <code className="text-xs bg-white px-3 py-2 rounded border border-gray-200 break-all flex-1">
                  {lastTxHash}
                </code>
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2">
                <span className="font-semibold text-red-600 min-w-[60px]">Error:</span>
                <span className="text-red-600">{error}</span>
              </div>
            )}
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            <span className="font-semibold text-[#003B7A]">ℹ️ How it works:</span> Once a Lightning invoice is settled, the system automatically calls{" "}
            <code className="bg-white px-2 py-1 rounded text-[#003B7A] font-mono text-xs">
              submit_receipt
            </code>{" "}
            to record the proof on StarkNet.
          </p>
        </div>
      </div>
    </div>
  );
}