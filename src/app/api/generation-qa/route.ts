import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/generation-qa — List QA records (optional: ?projectId=xxx)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;

    const qaRecords = await db.generationQA.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(qaRecords);
  } catch (error) {
    console.error('[GENERATION_QA_LIST]', error);
    return NextResponse.json(
      { error: 'Failed to fetch QA records' },
      { status: 500 }
    );
  }
}

// POST /api/generation-qa — Create or update a QA record
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // If an id is provided, update existing; otherwise create new
    if (body.id) {
      const existing = await db.generationQA.findUnique({ where: { id: body.id } });
      if (!existing) {
        return NextResponse.json(
          { error: 'QA record not found' },
          { status: 404 }
        );
      }

      const updateData: Record<string, unknown> = {};
      const allowedFields = [
        'projectId', 'habitatCorrect', 'behaviorRealistic', 'movementPossible',
        'scaleCorrect', 'seasonBelievable', 'predatorPreySafe', 'babyAgeBelievable',
        'realismNotes', 'viralHookScore', 'hookInstantDanger', 'hookEmotionalClarity',
        'hookAnimalReadable', 'hookUnusualMoment', 'hookCuriosityGap',
        'hookNoConfusingSetup', 'hookNoSlowOpening', 'mobileReadabilityScore',
        'mobileSubjectSize', 'mobileFullBodyVisible', 'mobileFaceVisible',
        'mobileActionClear', 'mobileNoTinyAnimals', 'mobileVerticalFraming',
        'mobilePayoffReadable', 'riskLevel', 'riskMultipleAnimals',
        'riskFastMotion', 'riskWaterPhysics', 'riskRainStorm', 'riskSnow',
        'riskFurRealism', 'riskBabyAnimalScale', 'riskPredatorPreyContact',
        'riskComplexRescue', 'riskNotes', 'outputRating', 'outputNotes',
      ];

      for (const field of allowedFields) {
        if (field in body) {
          updateData[field] = body[field];
        }
      }

      const updated = await db.generationQA.update({
        where: { id: body.id },
        data: updateData,
      });

      return NextResponse.json(updated);
    }

    // Create new record
    const {
      projectId,
      habitatCorrect, behaviorRealistic, movementPossible, scaleCorrect,
      seasonBelievable, predatorPreySafe, babyAgeBelievable, realismNotes,
      viralHookScore, hookInstantDanger, hookEmotionalClarity, hookAnimalReadable,
      hookUnusualMoment, hookCuriosityGap, hookNoConfusingSetup, hookNoSlowOpening,
      mobileReadabilityScore, mobileSubjectSize, mobileFullBodyVisible,
      mobileFaceVisible, mobileActionClear, mobileNoTinyAnimals,
      mobileVerticalFraming, mobilePayoffReadable,
      riskLevel = 'low', riskMultipleAnimals = false, riskFastMotion = false,
      riskWaterPhysics = false, riskRainStorm = false, riskSnow = false,
      riskFurRealism = false, riskBabyAnimalScale = false,
      riskPredatorPreyContact = false, riskComplexRescue = false,
      riskNotes, outputRating, outputNotes,
    } = body;

    const qaRecord = await db.generationQA.create({
      data: {
        projectId,
        habitatCorrect, behaviorRealistic, movementPossible, scaleCorrect,
        seasonBelievable, predatorPreySafe, babyAgeBelievable, realismNotes,
        viralHookScore, hookInstantDanger, hookEmotionalClarity, hookAnimalReadable,
        hookUnusualMoment, hookCuriosityGap, hookNoConfusingSetup, hookNoSlowOpening,
        mobileReadabilityScore, mobileSubjectSize, mobileFullBodyVisible,
        mobileFaceVisible, mobileActionClear, mobileNoTinyAnimals,
        mobileVerticalFraming, mobilePayoffReadable,
        riskLevel, riskMultipleAnimals, riskFastMotion,
        riskWaterPhysics, riskRainStorm, riskSnow,
        riskFurRealism, riskBabyAnimalScale,
        riskPredatorPreyContact, riskComplexRescue,
        riskNotes, outputRating, outputNotes,
      },
    });

    return NextResponse.json(qaRecord, { status: 201 });
  } catch (error) {
    console.error('[GENERATION_QA_CREATE]', error);
    return NextResponse.json(
      { error: 'Failed to create/update QA record' },
      { status: 500 }
    );
  }
}
