import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { privateJson, requireAuthenticatedUser } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
  const guard = await requireAuthenticatedUser(request);
  if ('response' in guard) return guard.response;
  try {
    const tasks = await db.videoTask.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true, status: true, costEstimate: true, createdAt: true,
        modelType: true, resolution: true, duration: true, dryRunPassed: true,
      },
    });
    return privateJson({
      tasks: tasks.map(task => ({ ...task, prompt: 'Private task' })),
    });
  } catch {
    console.error('History failed');
    return privateJson({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
