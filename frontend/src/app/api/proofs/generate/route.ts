import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { invoiceId, paymentRef, amount } = body || {};
  if (!invoiceId || !paymentRef || !amount) {
    return new Response(JSON.stringify({ error: 'invoiceId, paymentRef, amount required' }), { status: 400 });
  }
  // Mock proof generation
  const proofId = `proof_${Math.random().toString(36).slice(2)}`;
  const proofHash = `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`;
  return new Response(JSON.stringify({ proofId, proofHash }), { headers: { 'content-type': 'application/json' } });
}


