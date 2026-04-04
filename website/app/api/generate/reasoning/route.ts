import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch('https://n8n.srv1223027.hstgr.cloud/webhook/lead-reasoning', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-onvero-secret': 'onvero-internal-2024',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data);
}
