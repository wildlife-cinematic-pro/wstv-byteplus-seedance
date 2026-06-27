import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/post-production — List post-production records
export async function GET() {
  try {
    const postProductionRecords = await db.postProduction.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(postProductionRecords);
  } catch (error) {
    console.error('[POST_PRODUCTION_LIST]', error);
    return NextResponse.json(
      { error: 'Failed to fetch post-production records' },
      { status: 500 }
    );
  }
}

// POST /api/post-production — Create a post-production record
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      projectId,
      rawDownloaded = false,
      bestClipSelected = false,
      trimmed = false,
      coverFrameSelected = false,
      colorAdjusted = false,
      soundChecked = false,
      captionAdded = false,
      exported1080p = false,
      uploadedToFacebook = false,
      performanceReviewed = false,
      coverTimestamp,
      coverEmotion,
      coverAnimalFaceVisible,
      coverDangerVisible,
      coverNoBlur,
      coverStrongThumbnail,
      coverNotes,
      captionText,
      captionUnder150Chars,
      captionAmericanEnglish,
      captionEmotionallyStrong,
      captionNoClickbait,
      hashtags,
      hashtagCount5,
      hashtagsUsaRelevant,
      hashtagsNoRepeat,
      browserModelUsed,
      browserPromptUsed,
      browserRefImagesUsed,
      browserEstimatedCost,
      browserActualCost,
      browserOutputRating,
      browserVideoFileName,
      browserCapCutStatus,
      browserPostedUrl,
      plannedCost,
      generationCost,
      failedGenerationCost,
      retryCost,
      finalUsableVideoCost,
      notes,
    } = body;

    const postProduction = await db.postProduction.create({
      data: {
        projectId,
        rawDownloaded,
        bestClipSelected,
        trimmed,
        coverFrameSelected,
        colorAdjusted,
        soundChecked,
        captionAdded,
        exported1080p,
        uploadedToFacebook,
        performanceReviewed,
        coverTimestamp,
        coverEmotion,
        coverAnimalFaceVisible,
        coverDangerVisible,
        coverNoBlur,
        coverStrongThumbnail,
        coverNotes,
        captionText,
        captionUnder150Chars,
        captionAmericanEnglish,
        captionEmotionallyStrong,
        captionNoClickbait,
        hashtags,
        hashtagCount5,
        hashtagsUsaRelevant,
        hashtagsNoRepeat,
        browserModelUsed,
        browserPromptUsed,
        browserRefImagesUsed,
        browserEstimatedCost,
        browserActualCost,
        browserOutputRating,
        browserVideoFileName,
        browserCapCutStatus,
        browserPostedUrl,
        plannedCost,
        generationCost,
        failedGenerationCost,
        retryCost,
        finalUsableVideoCost,
        notes,
      },
    });

    return NextResponse.json(postProduction, { status: 201 });
  } catch (error) {
    console.error('[POST_PRODUCTION_CREATE]', error);
    return NextResponse.json(
      { error: 'Failed to create post-production record' },
      { status: 500 }
    );
  }
}
