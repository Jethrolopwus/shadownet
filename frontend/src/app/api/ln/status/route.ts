import { NextRequest } from "next/server";

// In-memory store only for demo. Replace with database in real app.
const store: Record<string, { status: 'unpaid' | 'settled' | 'expired'; updatedAt: number }> = {};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const invoiceId = searchParams.get('invoiceId');
  if (!invoiceId) return new Response(JSON.stringify({ error: 'invoiceId required' }), { status: 400 });

  const state = store[invoiceId] || { status: 'unpaid', updatedAt: Date.now() };
  return new Response(JSON.stringify({ invoiceId, ...state }), { headers: { 'content-type': 'application/json' } });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { invoiceId, status } = body || {};
  if (!invoiceId || !status) return new Response(JSON.stringify({ error: 'invoiceId and status required' }), { status: 400 });
  if (!['unpaid', 'settled', 'expired'].includes(status)) return new Response(JSON.stringify({ error: 'invalid status' }), { status: 400 });

  store[invoiceId] = { status, updatedAt: Date.now() };
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
}


