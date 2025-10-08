import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { path, method = 'GET', payload } = body || {};
  const base =  process.env.NEXT_PUBLIC_XVERSE_API_BASE;
  const apiKey = process.env.NEXT_PUBLIC_XVERSE_API_KEY;
  if (!base || !apiKey) return new Response(JSON.stringify({ error: 'Xverse API not configured' }), { status: 400 });
  if (!path) return new Response(JSON.stringify({ error: 'path required' }), { status: 400 });

  const url = `${base}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
    body: payload ? JSON.stringify(payload) : undefined,
    cache: 'no-store',
  });
  const text = await res.text();
  return new Response(text, { status: res.status, headers: { 'content-type': res.headers.get('content-type') || 'application/json' } });
}


