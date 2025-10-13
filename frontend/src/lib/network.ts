/* eslint-disable @typescript-eslint/no-explicit-any */

import { wallet } from "@/lib/sats";

export type BitcoinNetwork = "mainnet" | "testnet" | "regtest";
export type StacksNetwork = "mainnet" | "testnet";

export async function getWalletNetwork() {
	await ensureProvider();
	const res = await wallet.request("wallet_getNetwork", {} as any);
	return res as any;
}

export async function changeWalletNetwork(target: {
	bitcoin?: BitcoinNetwork;
	stacks?: StacksNetwork;
}) {
	await ensureProvider();
	const res = await wallet.request("wallet_changeNetwork", target as any);
	return res as any;
}

async function ensureProvider() {
	try {
		await wallet.selectProvider();
	} catch {
		// ignore if already selected
	}
}


