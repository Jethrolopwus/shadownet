import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { invoiceId, amountSats, paymentRef, proofId, proofHash } = body || {};
  if (!invoiceId || !amountSats || !paymentRef || !proofId || !proofHash) {
    return new Response(JSON.stringify({ error: 'invoiceId, amountSats, paymentRef, proofId, proofHash required' }), { status: 400 });
  }


  const tokenId = Math.floor(Math.random() * 1_000_000);
  const txHash = `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`;

  return new Response(JSON.stringify({ ok: true, tokenId, txHash }), {
    headers: { 'content-type': 'application/json' },
  });
}


