import { useCallback, useState } from "react";
import { wallet } from "@/lib/sats";
import { getXverseProviderId } from "@/lib/wallet";

export type XverseConnection = {
	connected: boolean;
	walletInfo: any | null;
	connect: () => Promise<void>;
	disconnect: () => Promise<void>;
};

export function useXverse(): XverseConnection {
	const [connected, setConnected] = useState(false);
	const [walletInfo, setWalletInfo] = useState<any | null>(null);

	const connect = useCallback(async () => {
    // Request a lightweight capability to prompt Xverse directly, bypassing selector
    try {
      await wallet.request("getAddresses", { providerId: getXverseProviderId() } as any);
    } catch (e) {
      // ignore; this is just to trigger provider linkage; user may reject
    }
    setWalletInfo({ selected: true });
		setConnected(true);
	}, []);

	const disconnect = useCallback(async () => {
    await wallet.disconnect();
		setConnected(false);
		setWalletInfo(null);
	}, []);

	return { connected, walletInfo, connect, disconnect };
}


