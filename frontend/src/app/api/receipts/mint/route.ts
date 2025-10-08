import { NextRequest } from "next/server";

// Mock server-side mint endpoint for PoC. Replace with real Starknet.js write.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { invoiceId, amountSats, paymentRef, proofId, proofHash, payerHash, payeeHash, metadataURI } = body || {};
  if (!invoiceId || !amountSats || !paymentRef || !proofId || !proofHash) {
    return new Response(JSON.stringify({ error: 'invoiceId, amountSats, paymentRef, proofId, proofHash required' }), { status: 400 });
  }

  // Simulate Starknet tx + tokenId
  const tokenId = Math.floor(Math.random() * 1_000_000);
  const txHash = `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`;

  // Return minimal details needed by UI
  return new Response(JSON.stringify({ ok: true, tokenId, txHash }), {
    headers: { 'content-type': 'application/json' },
  });
}


