/* eslint-disable @typescript-eslint/no-explicit-any */


import { getProviders, getProviderById } from "sats-connect";

export async function detectXverse() {
	const byId = await getProviderById("xverse");
	if (byId) return byId;

	const providers = await getProviders();
	const found = providers.find(p => p.id === "xverse");
	return found ?? null;
}

export async function getXverseOrThrow() {
	const provider = await detectXverse();
	if (!provider) throw new Error("Xverse wallet not found. Please install or enable Xverse.");
	return provider;
}

export function getXverseProviderId(): string {

	return "xverse";
}

export async function subscribeWalletEvents(onEvent: (evt: any) => void) {
	const provider = await detectXverse();
	if (!(provider as any)?.on) return;

	(provider as any).on("accountsChanged", onEvent);
	(provider as any).on("networkChanged", onEvent);
	(provider as any).on("disconnect", onEvent);

	return () => {
		(provider as any).off?.("accountsChanged", onEvent);
		(provider as any).off?.("networkChanged", onEvent);
		(provider as any).off?.("disconnect", onEvent);
	};
}


