import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { action, mintUrl, amountMsat, ecashToken, bolt11 } = body || {};
  if (!action) return new Response(JSON.stringify({ error: 'action required' }), { status: 400 });

  // Mock actions
  if (action === 'mint-info') {
    return new Response(JSON.stringify({ mintUrl }), { headers: { 'content-type': 'application/json' } });
  }
  if (action === 'to-ecash') {
    if (!mintUrl || !amountMsat) return new Response(JSON.stringify({ error: 'mintUrl, amountMsat required' }), { status: 400 });
    return new Response(JSON.stringify({ ecashToken: `ecash_${Math.random().toString(36).slice(2)}` }), { headers: { 'content-type': 'application/json' } });
  }
  if (action === 'to-lightning') {
    if (!mintUrl || !ecashToken || !bolt11) return new Response(JSON.stringify({ error: 'mintUrl, ecashToken, bolt11 required' }), { status: 400 });
    return new Response(JSON.stringify({ settled: true, lnSettleId: `ln_settle_${Math.random().toString(36).slice(2)}` }), { headers: { 'content-type': 'application/json' } });
  }

  return new Response(JSON.stringify({ error: 'unknown action' }), { status: 400 });
}


