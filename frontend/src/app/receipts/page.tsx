"use client";

import { useState } from "react";
import { Contract, Provider } from "starknet";

const DEFAULT_CONTRACT_ADDRESS =
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
    "0x032999b94db176a3a4df1e6caa58e2ed4bf781a19c21e43b295eeac867d19bba";

const ABI = [
    {
        name: "get_receipt_count",
        type: "function",
        inputs: [],
        outputs: [{ name: "count", type: "core::felt252" }],
        state_mutability: "view",
    },
];

export default function ReceiptsPage() {
    const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT_ADDRESS);
    const [count, setCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function fetchCount() {
        setLoading(true);
        setError(null);
        setCount(null);

        try {
            const provider = new Provider({
                nodeUrl: process.env.NEXT_PUBLIC_STARKNET_RPC,
            });
            const contract = new Contract(ABI, contractAddress, provider);
            const res = await contract.call("get_receipt_count", []);
            const value = Array.isArray(res) ? res[0] : Object.values(res)[0];
            setCount(Number(BigInt(value)));
        } catch (err: any) {
            setError(err.message || "Failed to fetch receipt count");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen flex flex-col  items-center  bg-white/95  backdrop-blur-sm px-4 py-10">
            <section className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl border border-gray-200 p-8 sm:p-10 flex flex-col gap-6">
                <div className="text-center mb-2">
                    <h2 className="text-3xl sm:text-4xl font-bold text-[#003B7A] mb-2">
                        Receipt Counter
                    </h2>
                    <p className="text-sm text-gray-600">
                        Query the total number of receipts stored on-chain
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <label
                        htmlFor="contract"
                        className="text-sm font-semibold text-gray-700"
                    >
                        Contract Address
                    </label>
                    <input
                        id="contract"
                        type="text"
                        value={contractAddress}
                        onChange={(e) => setContractAddress(e.target.value)}
                        placeholder="Enter StarkNet contract address"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#003B7A] focus:border-transparent focus:bg-white transition-all placeholder:text-gray-400"
                    />
                </div>

                <button
                    onClick={fetchCount}
                    disabled={loading || !contractAddress}
                    className="w-full py-3.5 bg-[#003B7A] text-white rounded-lg font-semibold text-lg hover:bg-[#002855] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Fetching...
                        </span>
                    ) : (
                        "Get Receipt Count"
                    )}
                </button>

                <div className="flex flex-col items-center justify-center mt-2 min-h-[100px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-6">
                    {error && (
                        <div className="flex items-center gap-2 text-red-600 text-sm sm:text-base text-center px-4 bg-red-50 rounded-lg p-4 border border-red-200">
                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}
                    
                    {count !== null && !error && (
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                                Total Receipts
                            </span>
                            <span className="text-6xl sm:text-7xl font-extrabold text-[#003B7A] drop-shadow-lg">
                                {count.toLocaleString()}
                            </span>
                        </div>
                    )}
                    
                    {!error && count === null && !loading && (
                        <span className="text-gray-400 text-sm">
                            Enter a contract address and click the button above
                        </span>
                    )}
                </div>
            </section>
        </main>
    );
}