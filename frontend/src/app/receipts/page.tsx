"use client";

import { useState } from "react";
import { Contract, Provider } from "starknet";

const DEFAULT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x032999b94db176a3a4df1e6caa58e2ed4bf781a19c21e43b295eeac867d19bba";
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
            const provider = new Provider({ nodeUrl: process.env.NEXT_PUBLIC_STARKNET_RPC });
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
        <div className="min-h-screen flex items-center justify-center  px-4">
            <div className="w-full max-w-3xl bg-white rounded-2xl border mb-16 shadow-xl p-8 flex flex-col gap-6">
                <h2 className="text-3xl font-bold text-black text-center">Receipt Counter</h2>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contract Address
                    </label>
                    <input
                        type="text"
                        value={contractAddress}
                        onChange={e => setContractAddress(e.target.value)}
                        placeholder="Enter StarkNet contract address"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
                    />
                </div>
                <button
                    onClick={fetchCount}
                    disabled={loading || !contractAddress}
                    className="w-full py-3 bg-black text-white rounded-lg font-semibold text-lg hover:bg-black mt-6 transition disabled:opacity-60"
                >
                    {loading ? "Fetching..." : "Get Receipt Count"}
                </button>
                <div className="flex flex-col items-center mt-4 min-h-[48px]">
                    {error && (
                        <span className="text-red-600 text-center">{error}</span>
                    )}
                    {count !== null && !error && (
                        <span className="text-5xl font-extrabold text-blue-700 drop-shadow-lg">{count}</span>
                    )}
                </div>
            </div>
        </div>
    );
}