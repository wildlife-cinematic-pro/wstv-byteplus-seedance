import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/prompt-versions — List prompt versions (optional: ?projectId=xxx)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;

    const promptVersions = await db.promptVersion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(promptVersions);
  } catch (error) {
    console.error('[PROMPT_VERSIONS_LIST]', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt versions' },
      { status: 500 }
    );
  }
}

// POST /api/prompt-versions — Create a prompt version
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      projectId,
      versionLabel,
      promptText,
      modelType,
      resolution,
      duration,
      changeNote,
      performanceNote,
      isFinal = false,
      isRejected = false,
    } = body;

    if (!versionLabel || !promptText) {
      return NextResponse.json(
        { error: 'versionLabel and promptText are required' },
        { status: 400 }
      );
    }

    const promptVersion = await db.promptVersion.create({
      data: {
        projectId,
        versionLabel,
        promptText,
        modelType,
        resolution,
        duration,
        changeNote,
        performanceNote,
        isFinal,
        isRejected,
      },
    });

    return NextResponse.json(promptVersion, { status: 201 });
  } catch (error) {
    console.error('[PROMPT_VERSIONS_CREATE]', error);
    return NextResponse.json(
      { error: 'Failed to create prompt version' },
      { status: 500 }
    );
  }
}
