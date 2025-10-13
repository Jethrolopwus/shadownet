/* eslint-disable @typescript-eslint/no-explicit-any */


import { wallet } from "@/lib/sats";
import { getXverseOrThrow } from "@/lib/wallet";

export async function signBitcoinMessage(message: string) {
	const provider = await getXverseOrThrow();
	const res = await wallet.request("signMessage", {
		providerId: provider.id,
		message
	} as any);
	return res as any;
}

export async function signStacksMessage(message: string) {
	const provider = await getXverseOrThrow();
	const res = await wallet.request("stx_signMessage", {
		providerId: provider.id,
		message
	} as any);
	return res as any;
}


