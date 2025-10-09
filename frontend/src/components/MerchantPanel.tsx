"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Contract, Account, Provider } from "starknet";
import { useXverse } from "@/hooks/useXverse";
import { listenForInvoiceSettlement, InvoiceSettlementData } from "@/lib/lightning";
import toast from "react-hot-toast";

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
];

const CONTRACT_ADDRESS =
  "0x032999b94db176a3a4df1e6caa58e2ed4bf781a19c21e43b295eeac867d19bba";

export interface InvoiceSettlementDataExtended extends InvoiceSettlementData {
  payer_hash: string;
  payee_hash: string;
  amount_sats: string | number;
  timestamp: number;
  proof_hash: string;
}

export function MerchantPanel() {
  const { connected, walletInfo, connect: connectXverse, disconnect } = useXverse();
  const [account, setAccount] = useState<Account | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);

  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initXverse = useCallback(async () => {
    try {
      await connectXverse();
      const wallet = (window as any).starknet;
      if (!wallet) {
        throw new Error("StarkNet wallet (Xverse) not found on window");
      }
      await wallet.enable({ showModal: false });
      const acct: Account = wallet.account;

      setAccount(acct);
      const rpcUrl = process.env.NEXT_PUBLIC_STARKNET_RPC;
      const p = rpcUrl ? new Provider({ nodeUrl: rpcUrl }) : new Provider();
      setProvider(p);

      setStatusMessage("Xverse wallet connected");
    } catch (err: any) {
      console.error("Error initializing Xverse:", err);
      setError(err.message || "Xverse initialization failed");
      toast.error(err.message || "Xverse initialization failed");
    }
  }, [connectXverse]);

  useEffect(() => {
    if (connected && !account) {
      initXverse();
    }
  }, [connected, account, initXverse]);

  function toFelt(value: string | number): string | bigint {
    if (typeof value === "number") return BigInt(value);
    if (typeof value === "bigint") return value;
    if (typeof value === "string") {
      if (/^0x[0-9a-fA-F]+$/.test(value) || /^\d+$/.test(value)) {
        return BigInt(value);
      }
      return value;
    }
    throw new Error("Unsupported value type for felt conversion");
  }

  const onInvoiceSettled = async (data: InvoiceSettlementDataExtended) => {
    if (!account || !provider) {
      setStatusMessage("Cannot submit receipt: wallet not connected");
      toast.error("Cannot submit receipt: wallet not connected");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setLastTxHash(null);
    setStatusMessage("Submitting receipt on-chain...");

    try {
      const contract = new Contract(receiptAbi, CONTRACT_ADDRESS, account);

      const payer = toFelt(data.payer_hash);
      const payee = toFelt(data.payee_hash);
      const amount = toFelt(data.amount_sats);
      const ts = toFelt(data.timestamp);
      const proof = toFelt(data.proof_hash);

      const invocation = await contract.invoke("submit_receipt", [
        payer,
        payee,
        amount,
        ts,
        proof,
      ]);

      const txHash = invocation.transaction_hash;
      setLastTxHash(txHash);
      setStatusMessage(`Transaction submitted: ${txHash}`);

      const receipt = await provider.waitForTransaction(txHash);
      console.log("Transaction receipt:", receipt);

      if (receipt.execution_status === "SUCCEEDED") {
        setStatusMessage("Receipt successfully recorded!");
        toast.success("Receipt recorded successfully!");
      } else {
        const msg = `Transaction failed: execution_status ${receipt.execution_status}`;
        setError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      console.error("submit_receipt error:", err);
      setError(err.message || "submit_receipt failed");
      setStatusMessage("Failed to submit receipt");
      toast.error(err.message || "Failed to submit receipt");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!account) return;

    const unsubscribe = listenForInvoiceSettlement((settlement) => {
      console.log("Invoice settled:", settlement);
      onInvoiceSettled(settlement as InvoiceSettlementDataExtended);
    });

    return () => {
      unsubscribe?.();
    };
  }, [account, provider]);

  return (
    <div className="min-h-screen space-y-6 p-6  bg-white">
      {!connected ? (
        <button
          onClick={connectXverse}
          className="px-4 py-2 bg-black text-white rounded-md hover:bg-black"
        >
          Connect Xverse Wallet
        </button>
      ) : (
        <p className="text-green-600">✅ Xverse connected</p>
      )}

      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p>Status: {statusMessage}</p>
        {isSubmitting && <p>Submitting to chain...</p>}
        {lastTxHash && (
          <p className="break-all">
            Tx Hash: <code>{lastTxHash}</code>
          </p>
        )}
        {error && <p className="text-red-600">Error: {error}</p>}
      </div>

      <div className="mt-4 text-sm text-gray-700">
        <p>
          Once a Lightning invoice is settled, your system will automatically call{" "}
          <code>submit_receipt</code> to record the receipt on-chain.
        </p>
      </div>
    </div>
  );
}
