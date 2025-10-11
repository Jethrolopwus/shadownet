"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Contract, Account, Provider } from "starknet";
import { useXverse } from "@/hooks/useXverse";
import { listenForInvoiceSettlement, InvoiceSettlementData } from "@/lib/lightning";
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
  "0x032999b94db176a3a4df1e6caa58e2ed4bf781a19c21e43b295eeac867d19bba";

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
        res?.txid ||
        res?.txId ||
        res?.hash ||
        res?.transactionId ||
        res?.tx?.txid ||
        res?.result?.txid ||
        res?.result?.txHash ||
        res?.data?.result?.txid;

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
    <div className="min-h-screen space-y-6 p-6 bg-white relative">
      {isSubmitting && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-50">
          <div className="flex flex-col items-center">
            <FadeLoader color="#000" />
            <p className="mt-3 text-gray-800 font-medium">
              Submitting to StarkNet...
            </p>
          </div>
        </div>
      )}

    
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-40">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Send Bitcoin Payment</h2>
            <input
              type="text"
              placeholder="Enter BTC recipient address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="border p-2 rounded w-full mb-3"
            />
            <input
              type="number"
              placeholder="Amount in Satoshis"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="border p-2 rounded w-full mb-3"
            />
            <div className="flex gap-3">
              <button
                onClick={handlePaymentAndReceipt}
                className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-900 flex-1"
              >
                Send Payment
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="bg-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        {!connected ? (
          <button
            onClick={connectXverse}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900"
          >
            Connect Xverse Wallet
          </button>
        ) : (
          <p className="text-green-600 font-medium">Xverse Connected ✅</p>
        )}

        <button
          onClick={() => setModalOpen(true)}
          disabled={isSubmitting}
          className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-900 disabled:opacity-60"
        >
          Pay with Xverse (BTC)
        </button>
      </div>

      <div className="mt-4 p-4 bg-gray-100 rounded-lg shadow-inner">
        <p>Status: {statusMessage}</p>
        {lastTxHash && (
          <p className="break-all text-sm mt-2">
            Tx Hash: <code>{lastTxHash}</code>
          </p>
        )}
        {error && <p className="text-red-600 mt-2">Error: {error}</p>}
      </div>

      <div className="ml-8 text-sm text-gray-700">
        <p>
          Once a Lightning invoice is settled, your system automatically calls{" "}
          <code>submit_receipt</code> to record the proof on StarkNet.
        </p>
      </div>
    </div>
  );
}