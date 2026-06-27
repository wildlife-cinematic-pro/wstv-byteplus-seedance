import { NextResponse } from 'next/server';
import { getArkConfigStatus } from '@/lib/seedance-config';

// Reports whether ARK_API_KEY is configured (server-side). Never returns the key.
export async function GET() {
  return NextResponse.json(getArkConfigStatus());
}
