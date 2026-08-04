import { NextRequest } from 'next/server';
import { execFile } from 'node:child_process';
import { copyFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { z } from 'zod';
import { privateJson, requireProtectedMutation } from '@/lib/auth/guards';
import { getCollectionRoot, getOutputRoot, isLoopbackRequest } from '@/lib/security/local-request';

export const runtime = 'nodejs';
const execFileAsync = promisify(execFile);
const allowedExtensions = new Set(['.mp4', '.webm', '.mov', '.m4v', '.ogv']);
const bodySchema = z.object({ filename: z.string().trim().min(1).max(240).nullable().optional() }).strict();

function safeVideoBasename(value: string): string | null {
  const base = path.basename(value);
  if (!base || base !== value || base.includes('..') || !allowedExtensions.has(path.extname(base).toLowerCase())) return null;
  return base;
}

async function openDirectory(directory: string) {
  if (process.platform === 'darwin') return execFileAsync('open', [directory]);
  if (process.platform === 'win32') return execFileAsync('explorer', [directory]);
  return execFileAsync('xdg-open', [directory]);
}

export async function POST(request: NextRequest) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;
  if (!isLoopbackRequest(request)) return privateJson({ error: 'Local request required' }, { status: 403 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return privateJson({ error: 'Invalid request' }, { status: 400 });

  try {
    const collection = getCollectionRoot();
    await mkdir(collection, { recursive: true });
    let copied = false;
    const filename = parsed.data.filename ? safeVideoBasename(parsed.data.filename) : null;
    if (filename) {
      const source = path.resolve(getOutputRoot(), filename);
      const destination = path.resolve(collection, filename);
      if (source.startsWith(`${getOutputRoot()}${path.sep}`) && destination.startsWith(`${collection}${path.sep}`)) {
        const info = await stat(source);
        if (info.isFile()) {
          await copyFile(source, destination);
          copied = true;
        }
      }
    }
    await openDirectory(collection);
    return privateJson({ success: true, copied, message: copied ? 'Video saved to collection' : 'Collection folder opened' });
  } catch {
    console.error('Open video folder failed');
    return privateJson({ success: false, error: 'Failed to open video folder' }, { status: 500 });
  }
}
