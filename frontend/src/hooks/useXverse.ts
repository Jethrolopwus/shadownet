/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */


import { useCallback, useState } from "react";
import { wallet } from "@/lib/sats";
import { getXverseProviderId } from "@/lib/wallet";
import { request, AddressPurpose, RpcErrorCode } from "sats-connect";

export type XverseConnection = {
	connected: boolean;
	walletInfo: any | null;
	connect: () => Promise<void>;
	disconnect: () => Promise<void>;
};

export function useXverse(): XverseConnection {
	const [connected, setConnected] = useState(false);
	const [walletInfo, setWalletInfo] = useState<any | null>(null);

	const connect2 = useCallback(async () => {
		try {
			await wallet.request("getAddresses", { providerId: getXverseProviderId() } as any);
		} catch (e) {
			console.log(e)
		}
		setWalletInfo({ selected: true });
		setConnected(true);
	}, []);

	const connect = useCallback(async () => {
		try {
			const response = await request('wallet_connect', null);
			if (response.status === 'success') {
				const paymentAddressItem = response.result.addresses.find(
					(address) => address.purpose === AddressPurpose.Payment
				);
				const ordinalsAddressItem = response.result.addresses.find(
					(address) => address.purpose === AddressPurpose.Ordinals
				);
				const stacksAddressItem = response.result.addresses.find(
					(address) => address.purpose === AddressPurpose.Stacks
				);
				console.log(paymentAddressItem, ordinalsAddressItem, stacksAddressItem)
				setWalletInfo({ selected: true });
				setConnected(true);
			} else {
				if (response.error.code === RpcErrorCode.USER_REJECTION) {
				
				} else {
					
				}
			}
		} catch (err) {
			alert(err);
		}
	}, []);

	const disconnect = useCallback(async () => {
		await wallet.disconnect();
		setConnected(false);
		setWalletInfo(null);
	}, []);

	return { connected, walletInfo, connect, disconnect };
}

