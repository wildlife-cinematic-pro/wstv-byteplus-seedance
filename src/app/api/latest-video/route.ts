import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { privateJson, requireAuthenticatedUser } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
  const guard = await requireAuthenticatedUser(request);
  if ('response' in guard) return guard.response;

  try {
    const latestTask = await db.videoTask.findFirst({
      where: { status: 'succeeded', videoFileName: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { videoFileName: true, createdAt: true, status: true },
    });
    if (!latestTask?.videoFileName) return privateJson({ video: null });

    return privateJson({
      video: {
        videoFileName: latestTask.videoFileName,
        videoUrl: `/api/video?name=${encodeURIComponent(latestTask.videoFileName)}`,
        createdAt: latestTask.createdAt,
        taskStatus: latestTask.status,
      },
    });
  } catch {
    console.error('Latest video failed');
    return privateJson({ video: null, error: 'Failed to fetch latest video' }, { status: 500 });
  }
}
