/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */


export type XverseNetwork = 'testnet4' | 'signet' | 'mainnet';

function getBase(): string {
  return process.env.NEXT_PUBLIC_XVERSE_API_BASE || 'https://api-testnet4.secretkeylabs.io';
}

async function proxy<T>(path: string, init?: { method?: string; payload?: any }): Promise<T> {
  const res = await fetch('/api/xverse', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path, method: init?.method || 'GET', payload: init?.payload }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Xverse proxy error: ${res.status}`);
  return res.json();
}

export async function getTx(txid: string) {
  return proxy(`/bitcoin/tx/${txid}`);
}

export async function getAddressUtxos(address: string) {
  return proxy(`/bitcoin/address/${address}/utxos`);
}

export async function getFeeEstimate() {
  return proxy(`/bitcoin/fee-estimates`);
}


