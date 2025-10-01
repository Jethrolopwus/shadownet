import { wallet } from "@/lib/sats";
import { getXverseOrThrow } from "@/lib/wallet";

export async function signBitcoinPsbt(psbtBase64: string) {
	const provider = await getXverseOrThrow();
	const res = await wallet.request("signPsbt", {
		providerId: provider.id,
		psbt: psbtBase64
	} as any);
	return res as any;
}

export async function sendBitcoinTransfer(recipient: string, amountSats: number, feeRate?: number) {
	const provider = await getXverseOrThrow();
	const res = await wallet.request("sendTransfer", {
		providerId: provider.id,
		recipient,
		amountSats,
		feeRate
	} as any);
	return res as any;
}


