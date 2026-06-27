import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const tasks = await db.videoTask.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Tasks GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      modelType,
      modelId,
      resolution,
      duration,
      aspectRatio,
      masterImageUrl,
      storyboardImageUrl,
      audioUrl1,
      audioUrl2,
      audioUrl3,
      videoUrl1,
      videoUrl2,
      videoUrl3,
      maxCostUsd,
      outputFilename,
    } = body;

    if (!prompt || !modelType || !resolution || !duration || !aspectRatio) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt, modelType, resolution, duration, aspectRatio' },
        { status: 400 }
      );
    }

    const task = await db.videoTask.create({
      data: {
        prompt,
        modelType,
        modelId: modelId || modelType,
        resolution,
        duration,
        aspectRatio,
        masterImageUrl: masterImageUrl || null,
        storyboardImageUrl: storyboardImageUrl || null,
        audioUrl1: audioUrl1 || null,
        audioUrl2: audioUrl2 || null,
        audioUrl3: audioUrl3 || null,
        videoUrl1: videoUrl1 || null,
        videoUrl2: videoUrl2 || null,
        videoUrl3: videoUrl3 || null,
        maxCostUsd: maxCostUsd || null,
        outputFilename: outputFilename || null,
        status: 'draft',
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Tasks POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
