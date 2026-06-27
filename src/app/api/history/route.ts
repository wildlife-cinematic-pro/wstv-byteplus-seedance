import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const tasks = await db.videoTask.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        status: true,
        prompt: true,
        costEstimate: true,
        createdAt: true,
        modelType: true,
        resolution: true,
        duration: true,
        dryRunPassed: true,
      },
    });

    // Redact: no signed URLs, no API keys, truncate prompt
    const redacted = tasks.map(task => ({
      id: task.id,
      status: task.status,
      prompt: task.prompt.substring(0, 50) + (task.prompt.length > 50 ? '...' : ''),
      costEstimate: task.costEstimate,
      modelType: task.modelType,
      resolution: task.resolution,
      duration: task.duration,
      dryRunPassed: task.dryRunPassed,
      createdAt: task.createdAt,
    }));

    return NextResponse.json({ tasks: redacted });
  } catch (error) {
    console.error('History error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
