
// "use client";

// import { useState } from "react";
// import { ShadowNetContract, getProvider } from "@/lib/starknet";
// import { Contract, Account } from "starknet";

// interface VerificationResult {
//   id: string;
//   timestamp: string;
//   type: "receipt_nft" | "zk_proof" | "btc_transaction";
//   input: string;
//   status: "valid" | "invalid" | "pending" | "error";
//   details: {
//     contractAddress?: string;
//     tokenId?: string;
//     btcTxHash?: string;
//     blockHeight?: number;
//     amount?: number;
//     zkProofId?: string;
//     proofValid?: boolean;
//     nftExists?: boolean;
//     ownershipVerified?: boolean;
//   };
//   errorMessage?: string;
// }

// export function VerifierPanel() {
//   const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
//   const [isVerifying, setIsVerifying] = useState(false);
//   const [verificationInput, setVerificationInput] = useState("");
//   const [verificationType, setVerificationType] =
//     useState<"receipt_nft" | "zk_proof" | "btc_transaction">("receipt_nft");
//   const [account, setAccount] = useState<Account | null>(null);

//   function toFelt(value: string | number): string | bigint {
//     if (typeof value === "number") return BigInt(value);
//     if (typeof value === "bigint") return value;
//     if (typeof value === "string") {
//       if (/^0x[0-9a-fA-F]+$/.test(value) || /^\d+$/.test(value)) return BigInt(value);
//       return value;
//     }
//     throw new Error("Unsupported value type for felt conversion");
//   }

//   async function connectStarknetWallet(): Promise<Account | null> {
//     try {
//       const xverse = (window as any).xverse;
//       const argent = (window as any).starknet;
//       let wallet: any = argent || xverse;

//       if (!wallet) throw new Error("No StarkNet wallet detected (install Argent X or Xverse).");

//       await wallet.enable({ showModal: true });
//       return wallet.account;
//     } catch (err: any) {
//       console.error("Wallet connection failed:", err);
//       throw new Error(err?.message || "Wallet connection error");
//     }
//   }

//   const handleVerification = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!verificationInput.trim()) return;

//     setIsVerifying(true);

//     const result: VerificationResult = {
//       id: `VERIFY-${Date.now()}`,
//       timestamp: new Date().toISOString(),
//       type: verificationType,
//       input: verificationInput,
//       status: "pending",
//       details: {},
//     };

//     setVerificationResults((prev) => [result, ...prev]);

//     if (verificationType === "receipt_nft") {
//       try {
//         let currentAccount = account || (await connectStarknetWallet());
//         if (!currentAccount) throw new Error("Wallet not connected.");
//         setAccount(currentAccount);

//         const contract = new Contract(
//           [
//             {
//               name: "verify_receipt",
//               type: "function",
//               inputs: [{ name: "receipt_id", type: "core::felt252" }],
//               outputs: [],
//               state_mutability: "external",
//             },
//           ],
//           process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
//           currentAccount
//         );

//         const receiptId = toFelt(verificationInput);
//         console.log("Invoking verify_receipt with:", receiptId);

//         const tx = await contract.invoke("verify_receipt", [receiptId]);
//         console.log("Transaction sent:", tx);

//         const txReceipt = await currentAccount.waitForTransaction(tx.transaction_hash);
//         const statusValue =
//           (txReceipt as any).finality_status ||
//           (txReceipt as any).status ||
//           (txReceipt as any).execution_status ||
//           "";

//         let status: VerificationResult["status"] = "pending";
//         if (["ACCEPTED_ON_L2", "ACCEPTED_ONCHAIN"].includes(statusValue)) status = "valid";
//         else if (["REJECTED", "REVERTED"].includes(statusValue)) status = "invalid";

//         setVerificationResults((prev) =>
//           prev.map((r) =>
//             r.id === result.id
//               ? {
//                   ...r,
//                   status,
//                   details: {
//                     contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
//                     tokenId: verificationInput,
//                   },
//                   errorMessage:
//                     status === "valid"
//                       ? undefined
//                       : `Transaction not accepted: ${statusValue}`,
//                 }
//               : r
//           )
//         );
//       } catch (error: any) {
//         console.error("Verification failed:", error);
//         setVerificationResults((prev) =>
//           prev.map((r) =>
//             r.id === result.id
//               ? {
//                   ...r,
//                   status: "error",
//                   errorMessage: error?.message || "Verification failed",
//                 }
//               : r
//           )
//         );
//       } finally {
//         setIsVerifying(false);
//         setVerificationInput("");
//       }
//       return;
//     }

//     setTimeout(async () => {
//       const mockResult = await generateMockVerificationResult(verificationType, verificationInput);
     
//       setIsVerifying(false);
//       setVerificationInput("");
//     }, 2000);
//   };

//   const generateMockVerificationResult = async (type: string, input: string) => {
//     try {
//       if (type === "zk_proof") {
//         const provider = getProvider();
//         const contract = new ShadowNetContract(provider, process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "");
//         const isValid = await contract.verifyProof(input, input);

//         return {
//           status: isValid ? "valid" : "invalid",
//           details: {
//             zkProofId: input,
//             proofValid: isValid,
//             btcTxHash: isValid ? `mock_tx_${Math.random().toString(36).substring(2, 15)}` : undefined,
//             amount: isValid ? Math.floor(Math.random() * 100000000) : undefined,
//           },
//           errorMessage: isValid ? undefined : "Invalid or expired proof",
//         };
//       }

//       const isSuccess = Math.random() > 0.3;
//       return {
//         status: isSuccess ? "valid" : "invalid",
//         details: {
//           btcTxHash: input,
//           blockHeight: isSuccess ? Math.floor(Math.random() * 800000) + 700000 : undefined,
//           amount: isSuccess ? Math.floor(Math.random() * 100000000) : undefined,
//         },
//         errorMessage: isSuccess ? undefined : "Transaction not found or invalid",
//       };
//     } catch (error: any) {
//       return {
//         status: "error" as const,
//         errorMessage: error?.message || "Verification failed",
//       };
//     }
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "valid":
//         return "text-green-600 bg-green-50 border-green-200";
//       case "invalid":
//         return "text-red-600 bg-red-50 border-red-200";
//       case "error":
//         return "text-orange-600 bg-orange-50 border-orange-200";
//       default:
//         return "text-blue-600 bg-blue-50 border-blue-200";
//     }
//   };

//   const formatAmount = (sats: number) => (sats / 100000000).toFixed(8);

//   return (
//     <div className="space-y-6 p-6 border rounded-xl bg-white shadow-sm">
//       <div className="flex items-center justify-between">
//         <h2 className="text-2xl font-semibold">Proof Verifier</h2>
//         <p className="text-sm text-gray-600">Verify receipts, proofs, and BTC transactions</p>
//       </div>


//       <form onSubmit={handleVerification} className="border rounded-lg p-6 bg-gray-50 space-y-4">
//         <div>
//           <label className="block text-sm font-medium mb-2">Verification Type</label>
//           <select
//             value={verificationType}
//             onChange={(e) => setVerificationType(e.target.value as any)}
//             className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-black"
//           >
//             <option value="receipt_nft">Receipt NFT (Token ID or Contract Address)</option>
//             <option value="zk_proof">zkProof ID</option>
//             <option value="btc_transaction">BTC Transaction Hash</option>
//           </select>
//         </div>

//         <div>
//           <label className="block text-sm font-medium mb-2">Verification Input</label>
//           <input
//             type="text"
//             value={verificationInput}
//             onChange={(e) => setVerificationInput(e.target.value)}
//             placeholder="Enter proof ID, token ID, or BTC tx hash..."
//             className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-black"
//             required
//           />
//         </div>

//         <button
//           type="submit"
//           disabled={isVerifying}
//           className="w-full px-4 py-2 bg-black text-white rounded-md hover:bg-zinc-800 disabled:opacity-60"
//         >
//           {isVerifying ? "Verifying..." : "Verify Proof"}
//         </button>
//       </form>

//       <div className="space-y-4">
//         <h3 className="text-lg font-medium">Verification Results</h3>
//         {verificationResults.length === 0 ? (
//           <div className="text-center py-8 text-gray-500">
//             No verifications performed yet.
//           </div>
//         ) : (
//           verificationResults.map((result) => (
//             <div
//               key={result.id}
//               className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
//             >
//               <div className="flex justify-between items-center mb-2">
//                 <div>
//                   <span className="font-medium">{result.id}</span>
//                   <span className={`ml-3 text-xs px-2 py-1 rounded-full ${getStatusColor(result.status)}`}>
//                     {result.status.toUpperCase()}
//                   </span>
//                 </div>
//                 <span className="text-sm text-gray-600">
//                   {new Date(result.timestamp).toLocaleString()}
//                 </span>
//               </div>

//               <div className="font-mono text-xs break-all bg-white/50 p-2 rounded mb-2">
//                 {result.input}
//               </div>

//               {result.status === "valid" && (
//                 <div className="text-green-800 text-sm">
//                   ✅ Verification successful
//                   {result.details.amount && (
//                     <div>Amount: {formatAmount(result.details.amount)} BTC</div>
//                   )}
//                 </div>
//               )}

//               {result.status === "invalid" && (
//                 <div className="text-red-800 text-sm">
//                   ❌ Verification failed: {result.errorMessage}
//                 </div>
//               )}

//               {result.status === "error" && (
//                 <div className="text-orange-800 text-sm">
//                   ⚠️ Error: {result.errorMessage}
//                 </div>
//               )}

//               {result.status === "pending" && (
//                 <div className="text-blue-800 text-sm flex items-center gap-2">
//                   ⏳ Verifying...
//                   <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
//                 </div>
//               )}
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }



"use client";

import { useState } from "react";
import { ShadowNetContract, getProvider } from "@/lib/starknet";
import { Contract, Account } from "starknet";
import toast from "react-hot-toast";

interface VerificationResult {
  id: string;
  timestamp: string;
  type: "receipt_nft" | "zk_proof" | "btc_transaction";
  input: string;
  status: "valid" | "invalid" | "pending" | "error";
  details: {
    contractAddress?: string;
    tokenId?: string;
    btcTxHash?: string;
    blockHeight?: number;
    amount?: number;
    zkProofId?: string;
    proofValid?: boolean;
    nftExists?: boolean;
    ownershipVerified?: boolean;
  };
  errorMessage?: string;
}

export function VerifierPanel() {
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationInput, setVerificationInput] = useState("");
  const [verificationType, setVerificationType] =
    useState<"receipt_nft" | "zk_proof" | "btc_transaction">("receipt_nft");
  const [account, setAccount] = useState<Account | null>(null);

  function toFelt(value: string | number): string | bigint {
    if (typeof value === "number") return BigInt(value);
    if (typeof value === "bigint") return value;
    if (typeof value === "string") {
      if (/^0x[0-9a-fA-F]+$/.test(value) || /^\d+$/.test(value)) return BigInt(value);
      return value;
    }
    throw new Error("Unsupported value type for felt conversion");
  }

  async function connectStarknetWallet(): Promise<Account | null> {
    try {
      const xverse = (window as any).xverse;
      const argent = (window as any).starknet;
      let wallet: any = argent || xverse;

      if (!wallet) throw new Error("No StarkNet wallet detected (install Argent X or Xverse).");

      await wallet.enable({ showModal: true });
      toast.success("Wallet connected successfully!");
      return wallet.account;
    } catch (err: any) {
      console.error("Wallet connection failed:", err);
      toast.error(err?.message || "Wallet connection error");
      throw new Error(err?.message || "Wallet connection error");
    }
  }

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationInput.trim()) return;

    setIsVerifying(true);

    const result: VerificationResult = {
      id: `VERIFY-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: verificationType,
      input: verificationInput,
      status: "pending",
      details: {},
    };

    setVerificationResults((prev) => [result, ...prev]);

    if (verificationType === "receipt_nft") {
      try {
        let currentAccount = account || (await connectStarknetWallet());
        if (!currentAccount) throw new Error("Wallet not connected.");
        setAccount(currentAccount);

        const contract = new Contract(
          [
            {
              name: "verify_receipt",
              type: "function",
              inputs: [{ name: "receipt_id", type: "core::felt252" }],
              outputs: [],
              state_mutability: "external",
            },
          ],
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "",
          currentAccount
        );

        const receiptId = toFelt(verificationInput);
        console.log("Invoking verify_receipt with:", receiptId);

        const tx = await contract.invoke("verify_receipt", [receiptId]);
        console.log("Transaction sent:", tx);

        const txReceipt = await currentAccount.waitForTransaction(tx.transaction_hash);
        const statusValue =
          (txReceipt as any).finality_status ||
          (txReceipt as any).status ||
          (txReceipt as any).execution_status ||
          "";

        let status: VerificationResult["status"] = "pending";
        if (["ACCEPTED_ON_L2", "ACCEPTED_ONCHAIN"].includes(statusValue)) status = "valid";
        else if (["REJECTED", "REVERTED"].includes(statusValue)) status = "invalid";

        setVerificationResults((prev) =>
          prev.map((r) =>
            r.id === result.id
              ? {
                  ...r,
                  status,
                  details: {
                    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
                    tokenId: verificationInput,
                  },
                  errorMessage:
                    status === "valid"
                      ? undefined
                      : `Transaction not accepted: ${statusValue}`,
                }
              : r
          )
        );

        if (status === "valid") {
          toast.success("Verification successful!");
        } else {
          toast.error(`Verification failed: ${statusValue}`);
        }
      } catch (error: any) {
        console.error("Verification failed:", error);
        toast.error(error?.message || "Verification failed");
        setVerificationResults((prev) =>
          prev.map((r) =>
            r.id === result.id
              ? {
                  ...r,
                  status: "error",
                  errorMessage: error?.message || "Verification failed",
                }
              : r
          )
        );
      } finally {
        setIsVerifying(false);
        setVerificationInput("");
      }
      return;
    }

    setTimeout(async () => {
      const mockResult = await generateMockVerificationResult(verificationType, verificationInput);
      setIsVerifying(false);
      setVerificationInput("");

      if (mockResult.status === "valid") {
        toast.success("Verification successful!");
      } else if (mockResult.status === "invalid") {
        toast.error(mockResult.errorMessage || "Verification failed");
      } else if (mockResult.status === "error") {
        toast.error(mockResult.errorMessage || "Verification error");
      }
    }, 2000);
  };

  const generateMockVerificationResult = async (type: string, input: string) => {
    try {
      if (type === "zk_proof") {
        const provider = getProvider();
        const contract = new ShadowNetContract(provider, process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "");
        const isValid = await contract.verifyProof(input, input);

        return {
          status: isValid ? "valid" : "invalid",
          details: {
            zkProofId: input,
            proofValid: isValid,
            btcTxHash: isValid ? `mock_tx_${Math.random().toString(36).substring(2, 15)}` : undefined,
            amount: isValid ? Math.floor(Math.random() * 100000000) : undefined,
          },
          errorMessage: isValid ? undefined : "Invalid or expired proof",
        };
      }

      const isSuccess = Math.random() > 0.3;
      return {
        status: isSuccess ? "valid" : "invalid",
        details: {
          btcTxHash: input,
          blockHeight: isSuccess ? Math.floor(Math.random() * 800000) + 700000 : undefined,
          amount: isSuccess ? Math.floor(Math.random() * 100000000) : undefined,
        },
        errorMessage: isSuccess ? undefined : "Transaction not found or invalid",
      };
    } catch (error: any) {
      return {
        status: "error" as const,
        errorMessage: error?.message || "Verification failed",
      };
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

  const formatAmount = (sats: number) => (sats / 100000000).toFixed(8);

  return (
    <div className="space-y-6 p-6 border rounded-xl bg-white shadow-sm">
        <p className="text-sm text-gray-600">Verify receipts, proofs, and BTC transactions</p>
     

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
            placeholder="Enter proof ID, token ID, or BTC tx hash..."
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
                    className={`ml-3 text-xs px-2 py-1 rounded-full ${getStatusColor(result.status)}`}
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
                <div className="text-green-800 text-sm">
                  ✅ Verification successful
                  {result.details.amount && (
                    <div>Amount: {formatAmount(result.details.amount)} BTC</div>
                  )}
                </div>
              )}

              {result.status === "invalid" && (
                <div className="text-red-800 text-sm">
                  ❌ Verification failed: {result.errorMessage}
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
