// Minimal Cashu client stubs for PoC.
// Replace with real Cashu SDK (e.g., @cashu/cashu) when ready.

export type MintInfo = { mintUrl: string };

export async function getMintInfo(mintUrl: string): Promise<MintInfo> {
  // Mock fetch
  await new Promise((r) => setTimeout(r, 300));
  return { mintUrl };
}

export async function lightningToEcash(params: { mintUrl: string; amountMsat: number }): Promise<{ ecashToken: string }>
{
  await new Promise((r) => setTimeout(r, 800));
  return { ecashToken: `ecash_${Math.random().toString(36).slice(2)}` };
}

export async function ecashToLightning(params: { mintUrl: string; ecashToken: string; bolt11: string }): Promise<{ settled: boolean; lnSettleId: string }>
{
  await new Promise((r) => setTimeout(r, 800));
  return { settled: true, lnSettleId: `ln_settle_${Math.random().toString(36).slice(2)}` };
}


