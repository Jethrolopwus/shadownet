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
        <main className="min-h-screen flex flex-col items-center bg-white px-4 py-10 sm:py-16">
            <section className="w-full max-w-lg bg-white shadow-2xl rounded-2xl border border-gray-200 p-6 sm:p-8 flex flex-col gap-6 transition-all">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center">
                    Receipt Counter
                </h2>

                <div className="flex flex-col gap-2">
                    <label
                        htmlFor="contract"
                        className="text-sm font-medium text-gray-700 tracking-wide"
                    >
                        Contract Address
                    </label>
                    <input
                        id="contract"
                        type="text"
                        value={contractAddress}
                        onChange={(e) => setContractAddress(e.target.value)}
                        placeholder="Enter StarkNet contract address"
                        className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg font-mono text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                    />
                </div>
                <button
                    onClick={fetchCount}
                    disabled={loading || !contractAddress}
                    className="w-full sm:w-3/4 mx-auto py-2.5 sm:py-3 bg-black text-white rounded-lg font-semibold text-base sm:text-lg hover:bg-gray-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {loading ? "Fetching..." : "Get Receipt Count"}
                </button>

                <div className="flex flex-col items-center justify-center mt-4 min-h-[56px] sm:min-h-[64px]">
                    {error && (
                        <span className="text-red-600 text-sm sm:text-base text-center px-2">
                            {error}
                        </span>
                    )}
                    {count !== null && !error && (
                        <span className="text-4xl sm:text-5xl font-extrabold text-blue-700 drop-shadow-md mt-2">
                            {count}
                        </span>
                    )}
                </div>
            </section>
        </main>
    );
}
