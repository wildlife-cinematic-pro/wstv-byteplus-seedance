import { NextRequest } from 'next/server';
import { privateJson, requireAuthenticatedUser } from '@/lib/auth/guards';
import { getArkConfigStatus } from '@/lib/seedance-config';

// Reports whether ARK_API_KEY is configured (server-side). Never returns the key.
export async function GET(request: NextRequest) {
  const guard = await requireAuthenticatedUser(request);
  if ('response' in guard) return guard.response;
  return privateJson(getArkConfigStatus());
}
