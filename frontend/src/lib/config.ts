export type BitcoinNetwork = "mainnet" | "testnet" | "regtest";
export type StacksNetwork = "mainnet" | "testnet";

export function getEnvNetworks(): { bitcoin?: BitcoinNetwork; stacks?: StacksNetwork } {
	const btc = process.env.NEXT_PUBLIC_BITCOIN_NETWORK as BitcoinNetwork | undefined;
	const stx = process.env.NEXT_PUBLIC_STACKS_NETWORK as StacksNetwork | undefined;
	const cfg: { bitcoin?: BitcoinNetwork; stacks?: StacksNetwork } = {};
	if (btc) cfg.bitcoin = btc;
	if (stx) cfg.stacks = stx;
	return cfg;
}


