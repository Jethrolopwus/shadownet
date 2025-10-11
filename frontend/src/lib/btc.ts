import { wallet } from "@/lib/sats";
import { getXverseOrThrow } from "@/lib/wallet";
import {
	request,
	BitcoinNetworkType,
	RpcErrorCode,
} from "sats-connect";

export async function signBitcoinPsbt(psbtBase64: string) {
	const provider = await getXverseOrThrow();
	const res = await wallet.request("signPsbt", {
		providerId: provider.id,
		psbt: psbtBase64
	} as any);
	return res as any;
}

export async function sendBitcoinTransfer(recipient: string, amountSats: number, feeRate?: number) {
	// const provider = await getXverseOrThrow();
	try {
		const response = await request("sendTransfer", {
			recipients: [
				{
					address: recipient,
					amount: Number(amountSats),
				},
			],
		});
		if (response.status === "success") {
			console.log(response)
			return response;
			// handle success
		} else {
			if (response.error.code === RpcErrorCode.USER_REJECTION) {
				console.log(response)
				alert("User rejected")
				// handle user cancellation error
			} else {
				console.log("Error", response)
				// handle error
			}
		}
	} catch (err) {
		console.log("Catch", err);
	}
	// const res = await wallet.request("sendTransfer", {
	// 	providerId: provider.id,
	// 	recipient,
	// 	amountSats,
	// 	feeRate
	// } as any);
	// return res as any;
}


