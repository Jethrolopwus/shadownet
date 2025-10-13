/* eslint-disable @typescript-eslint/no-explicit-any */

import { wallet } from "@/lib/sats";
import { getXverseOrThrow } from "@/lib/wallet";

export async function transferStx(recipient: string, amountMicroStx: string) {
	const provider = await getXverseOrThrow();
	const res = await wallet.request("stx_transferStx", {
		providerId: provider.id,
		recipient,
		amount: amountMicroStx
	} as any);
	return res as any;
}

export async function callStacksContract(opts: {
	contractAddress: string;
	contractName: string;
	functionName: string;
	functionArgs: any[];
	postConditionMode?: number;
}) {
	const provider = await getXverseOrThrow();
	const res = await wallet.request("stx_callContract", {
		providerId: provider.id,
		...opts
	} as any);
	return res as any;
}


