/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { useEffect, useState } from "react";
import { useXverse } from "@/hooks/useXverse";
import { getBitcoinAddresses, getStacksAccounts } from "@/lib/addresses";
import { signBitcoinMessage, signStacksMessage } from "@/lib/signing";
import { sendBitcoinTransfer } from "@/lib/btc";
import { transferStx } from "@/lib/stx";
import { changeWalletNetwork, getWalletNetwork } from "@/lib/network";
import { subscribeWalletEvents } from "@/lib/wallet";
import { getEnvNetworks } from "@/lib/config";
import { ReceiptMinting, ReceiptHistory } from "./ReceiptMinting";

export function WalletPanel() {
	const { connected, connect, disconnect } = useXverse();
	const [btcAddresses, setBtcAddresses] = useState<any[]>([]);
	const [stxAccounts, setStxAccounts] = useState<any[]>([]);
	const [networkInfo, setNetworkInfo] = useState<any | null>(null);
	const [busy, setBusy] = useState(false);
	const [activeMinting, setActiveMinting] = useState<string | null>(null);
	const [receipts, setReceipts] = useState<any[]>([]);
	
	useEffect(() => {
		let dispose: (() => void) | undefined;
		subscribeWalletEvents((evt) => {
			console.log("wallet event", evt);
			
			void getWalletNetwork().then(setNetworkInfo).catch(() => { });
		}).then((d) => {
			dispose = d;
		});
		return () => {
			dispose?.();
		};
	}, []);

	async function run<T>(fn: () => Promise<T>) {
		setBusy(true);
		try {
			return await fn();
		} finally {
			setBusy(false);
		}
	}

	function extractAddress(item: any): string {
		if (!item) return "";
		if (typeof item === "string") return item;
		return (
			item.address ||
			item.stxAddress ||
			item.btcAddress ||
			item.p2tr ||
			item.nativeSegwit ||
			item.taproot ||
			""
		);
	}

	const handleMintingComplete = (receipt: any) => {
		setReceipts(prev => [receipt, ...prev]);
		setActiveMinting(null);
	};

	const simulateReceiptMinting = () => {
		const mockInvoiceId = `INV-${Date.now()}`;
		const mockAmount = Math.floor(Math.random() * 100000000); // Random amount in sats
		const mockTxHash = `mock_tx_${Math.random().toString(36).substring(2, 15)}`;

		setActiveMinting(mockInvoiceId);
	};

	return (
		<div className="space-y-6 p-6 border rounded-xl bg-white shadow-sm">

			<div className="flex flex-wrap gap-2">
				<button
					disabled={!connected || busy}
					onClick={() => run(async () => setBtcAddresses(await getBitcoinAddresses()))}
					className="px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-60"
				>
					Load BTC Addresses
				</button>
				<button
					disabled={!connected || busy}
					onClick={() => run(async () => setStxAccounts(await getStacksAccounts()))}
					className="px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-60"
				>
					Load STX Accounts
				</button>
				<button
					disabled={!connected || busy}
					onClick={() => run(async () => {
						const res = await signBitcoinMessage("Hello from ShadowNet");
						console.log("BTC signature", res);
					})}
					className="px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-60"
				>
					Sign BTC Message
				</button>
				<button
					disabled={!connected || busy}
					onClick={() => run(async () => {
						const res = await signStacksMessage("Hello from ShadowNet");
						console.log("STX signature", res);
					})}
					className="px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-60"
				>
					Sign STX Message
				</button>
				<button
					disabled={!connected || busy}
					onClick={() => run(async () => {
						const to = prompt("BTC recipient address");
						const amt = prompt("Amount in sats");
						if (!to || !amt) return;
						const res = await sendBitcoinTransfer(to, Number(amt));
						console.log("BTC transfer", res);
					})}
					className="px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-60"
				>
					Send BTC
				</button>
				<button
					disabled={!connected || busy}
					onClick={() => run(async () => {
						const to = prompt("STX recipient address");
						const amt = prompt("Amount in microstx (1 STX = 1e6)");
						if (!to || !amt) return;
						const res = await transferStx(to, amt);
						console.log("STX transfer", res);
					})}
					className="px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-60"
				>
					Transfer STX
				</button>
				<button
					disabled={!connected || busy}
					onClick={() => run(async () => setNetworkInfo(await getWalletNetwork()))}
					className="px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-60"
				>
					Get Network
				</button>
				<button
					disabled={!connected || busy}
					onClick={() => run(async () => {
						const target = getEnvNetworks();
						const res = await changeWalletNetwork(target);
						console.log("Applied env networks", target, res);
						setNetworkInfo(await getWalletNetwork());
					})}
					className="px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-60"
				>
					Apply Env Networks
				</button>
				<button
					disabled={!connected || busy}
					onClick={() => run(async () => {
						const target = prompt("Target network (bitcoin: mainnet|testnet; stacks: mainnet|testnet). Example: bitcoin=testnet,stacks=testnet");
						if (!target) return;
						const parts = target.split(",");
						const payload: any = {};
						for (const p of parts) {
							const [k, v] = p.split("=");
							if (k && v) payload[k.trim()] = v.trim();
						}
						const res = await changeWalletNetwork(payload);
						console.log("Change network", res);
					})}
					className="px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-60"
				>
					Change Network
				</button>
				<button
					onClick={simulateReceiptMinting}
					className="px-3 py-2 border rounded hover:bg-gray-50 bg-blue-50 text-blue-700 border-blue-200"
				>
					Simulate Receipt Minting
				</button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="p-4 border rounded-lg bg-gray-50/60">
					<div className="text-sm font-medium mb-2">BTC Addresses</div>
					{btcAddresses.length === 0 ? (
						<div className="text-sm text-gray-500">No addresses loaded</div>
					) : (
						<ul className="text-sm space-y-1 list-disc pl-4">
							{btcAddresses.slice(0, 5).map((a: any, i: number) => (
								<li key={i} className="break-all">{extractAddress(a) || "address unavailable"}</li>
							))}
							{btcAddresses.length > 5 && (
								<li className="text-gray-500">+{btcAddresses.length - 5} more…</li>
							)}
						</ul>
					)}
				</div>
				<div className="p-4 border rounded-lg bg-gray-50/60">
					<div className="text-sm font-medium mb-2">Stacks Accounts</div>
					{stxAccounts.length === 0 ? (
						<div className="text-sm text-gray-500">No accounts loaded</div>
					) : (
						<ul className="text-sm space-y-1 list-disc pl-4">
							{stxAccounts.slice(0, 5).map((a: any, i: number) => (
								<li key={i} className="break-all">{extractAddress(a) || "address unavailable"}</li>
							))}
							{stxAccounts.length > 5 && (
								<li className="text-gray-500">+{stxAccounts.length - 5} more…</li>
							)}
						</ul>
					)}
				</div>
				<div className="p-4 border rounded-lg bg-gray-50/60">
					<div className="text-sm font-medium mb-2">Network</div>
					{!networkInfo ? (
						<div className="text-sm text-gray-500">Not loaded</div>
					) : (
						<div className="text-sm space-y-1">
							<div>Bitcoin: <span className="font-mono">{networkInfo.bitcoinNetwork ?? "-"}</span></div>
							<div>Stacks: <span className="font-mono">{networkInfo.stacksNetwork ?? "-"}</span></div>
						</div>
					)}
				</div>
			</div>

			
			{activeMinting && (
				<div className="mt-6">
					<ReceiptMinting
						invoiceId={activeMinting}
						amount={Math.floor(Math.random() * 100000000)}
						btcTxHash={`mock_tx_${Math.random().toString(36).substring(2, 15)}`}
						onMintingComplete={handleMintingComplete}
					/>
				</div>
			)}

			{/* Receipt History */}
			{receipts.length > 0 && (
				<div className="mt-8">
					<ReceiptHistory receipts={receipts} />
				</div>
			)}
		</div>
	);
}


