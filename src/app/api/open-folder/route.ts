import { NextRequest } from 'next/server';
import { execFile } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { promisify } from 'node:util';
import { privateJson, requireProtectedMutation } from '@/lib/auth/guards';
import { getOutputRoot, isLoopbackRequest } from '@/lib/security/local-request';

export const runtime = 'nodejs';
const execFileAsync = promisify(execFile);

async function openDirectory(directory: string) {
  if (process.platform === 'darwin') return execFileAsync('open', [directory]);
  if (process.platform === 'win32') return execFileAsync('explorer', [directory]);
  return execFileAsync('xdg-open', [directory]);
}

export async function POST(request: NextRequest) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;
  if (!isLoopbackRequest(request)) return privateJson({ error: 'Local request required' }, { status: 403 });

  try {
    const folder = getOutputRoot();
    await mkdir(folder, { recursive: true });
    await openDirectory(folder);
    return privateJson({ success: true, message: 'Opened output folder' });
  } catch {
    console.error('Open folder failed');
    return privateJson({ success: false, error: 'Failed to open output folder' }, { status: 500 });
  }
}
