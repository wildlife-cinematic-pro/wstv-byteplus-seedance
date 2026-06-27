import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const latestTask = await db.videoTask.findFirst({
      where: { status: 'succeeded' },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestTask || !latestTask.videoFileName) {
      return NextResponse.json({ video: null });
    }

    return NextResponse.json({
      video: {
        videoFileName: latestTask.videoFileName,
        videoUrl: `/api/video?name=${encodeURIComponent(latestTask.videoFileName)}`,
        createdAt: latestTask.createdAt,
        taskStatus: latestTask.status,
      },
    });
  } catch (error) {
    console.error('Latest video error:', error);
    return NextResponse.json(
      { video: null, error: 'Failed to fetch latest video' },
      { status: 500 }
    );
  }
}
