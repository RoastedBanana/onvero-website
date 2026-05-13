import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('onvero_session');
  response.cookies.delete('onvero_user');
  return response;
}
