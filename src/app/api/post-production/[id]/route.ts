import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// PUT /api/post-production/[id] — Update a post-production record
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.postProduction.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Post-production record not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'projectId',
      'rawDownloaded', 'bestClipSelected', 'trimmed', 'coverFrameSelected',
      'colorAdjusted', 'soundChecked', 'captionAdded', 'exported1080p',
      'uploadedToFacebook', 'performanceReviewed',
      'coverTimestamp', 'coverEmotion', 'coverAnimalFaceVisible',
      'coverDangerVisible', 'coverNoBlur', 'coverStrongThumbnail', 'coverNotes',
      'captionText', 'captionUnder150Chars', 'captionAmericanEnglish',
      'captionEmotionallyStrong', 'captionNoClickbait',
      'hashtags', 'hashtagCount5', 'hashtagsUsaRelevant', 'hashtagsNoRepeat',
      'browserModelUsed', 'browserPromptUsed', 'browserRefImagesUsed',
      'browserEstimatedCost', 'browserActualCost', 'browserOutputRating',
      'browserVideoFileName', 'browserCapCutStatus', 'browserPostedUrl',
      'plannedCost', 'generationCost', 'failedGenerationCost',
      'retryCost', 'finalUsableVideoCost', 'notes',
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    const updated = await db.postProduction.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[POST_PRODUCTION_UPDATE]', error);
    return NextResponse.json(
      { error: 'Failed to update post-production record' },
      { status: 500 }
    );
  }
}
