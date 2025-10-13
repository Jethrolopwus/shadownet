/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */


import { wallet } from "@/lib/sats";
import { getXverseOrThrow } from "@/lib/wallet";

export async function getBitcoinAddresses() {
	const provider = await getXverseOrThrow();
    const res = await wallet.request("getAddresses", { providerId: provider.id } as any);
	return (res as any)?.addresses ?? [];
}

export async function getStacksAccounts() {
	const provider = await getXverseOrThrow();
    const res = await wallet.request("stx_getAccounts", { providerId: provider.id } as any);
	return (res as any)?.accounts ?? [];
}



