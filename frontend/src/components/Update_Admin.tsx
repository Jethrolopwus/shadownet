/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */

"use client";

import React, { useState, useCallback } from "react";
import { Contract, Account, Provider } from "starknet";
import toast from "react-hot-toast";

const contractAbi = [
    {
        name: "update_admin",
        type: "function",
        inputs: [
            {
                name: "new_admin",
                type: "core::starknet::contract_address::ContractAddress",
            },
        ],
        outputs: [],
        state_mutability: "external",
    },
];

const CONTRACT_ADDRESS =
    "0x032999b94db176a3a4df1e6caa58e2ed4bf781a19c21e43b295eeac867d19bba";

export function AdminUpdatePanel() {
    const [newAdminAddress, setNewAdminAddress] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [account, setAccount] = useState<Account | null>(null);


    const connectXverseWallet = useCallback(async (): Promise<Account | null> => {
        try {
            const wallet = (window as any).xverse || (window as any).starknet_xverse;

            if (!wallet) {
                toast.error("Xverse wallet not found. Please install it from https://www.xverse.app.");
                return null;
            }

            await wallet.enable({ showModal: true });
            const userAccount = wallet.account;

            if (!userAccount) {
                toast.error("Failed to connect Xverse wallet.");
                return null;
            }

            setAccount(userAccount);
            toast.success("✅ Xverse wallet connected!");
            return userAccount;
        } catch (err: any) {
            console.error("Wallet connection error:", err);
            toast.error("Failed to connect wallet.");
            return null;
        }
    }, []);

    const handleUpdateAdmin = useCallback(async () => {
        try {
            const activeAccount = account;
            if (!activeAccount) return;
            console.log(activeAccount)

            if (
                !newAdminAddress ||
                !/^(0x)?[0-9a-fA-F]{64}$/.test(newAdminAddress)
            ) {
                toast.error("Please enter a valid StarkNet contract address (64 hex characters).");
                return;
            }

            setIsSubmitting(true);
            const provider = new Provider();
            const contract = new Contract(contractAbi, CONTRACT_ADDRESS, activeAccount);

            const newAdmin = `0x${newAdminAddress.replace(/^0x/, "")}`;
            toast.loading("Submitting transaction...");

            const invocation = await contract.invoke("update_admin", [newAdmin]);
            const txHash = invocation.transaction_hash;

            toast.loading("Waiting for transaction confirmation...");
            const receipt: any = await provider.waitForTransaction(txHash);

            const statusValue =
                receipt.finality_status ||
                receipt.execution_status ||
                receipt.status ||
                "UNKNOWN";

            toast.dismiss();

            if (["ACCEPTED_ON_L2", "ACCEPTED_ON_L1"].includes(statusValue)) {
                toast.success("✅ Admin updated successfully!");
            } else {
                toast.error(`❌ Transaction failed: ${statusValue}`);
            }
        } catch (err: any) {
            console.error("update_admin error:", err);
            toast.dismiss();
            toast.error(err.message || "Failed to update admin");
        } finally {
            setIsSubmitting(false);
        }
    }, [account, newAdminAddress, connectXverseWallet]);

    return (
        <div className="space-y-6 p-6 border rounded-xl bg-white shadow-sm">
            <h2 className="text-2xl font-semibold">Admin Update</h2>

            <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                    <label htmlFor="newAdmin" className="text-sm text-gray-700">
                        new_admin Contract Address
                    </label>
                    <input
                        id="newAdmin"
                        type="text"
                        value={newAdminAddress}
                        onChange={(e) => setNewAdminAddress(e.target.value)}
                        placeholder="e.g. 0x123..."
                        className="p-2 border rounded-md w-full"
                    />
                </div>

                <button
                    onClick={handleUpdateAdmin}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400"
                >
                    {isSubmitting ? "Updating..." : "Update Admin"}
                </button>
            </div>
        </div>
    );
}
