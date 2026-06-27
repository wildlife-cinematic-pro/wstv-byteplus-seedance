import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// POST /api/duplicate-check — Check for duplicate ideas
// Accepts: animal, location, danger, ending, emotionalBeat
// Returns: similarity score and warnings
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      animal,
      location,
      danger,
      ending,
      emotionalBeat,
    } = body;

    if (!animal && !location && !danger && !ending && !emotionalBeat) {
      return NextResponse.json(
        { error: 'At least one of animal, location, danger, ending, or emotionalBeat is required' },
        { status: 400 }
      );
    }

    // Fetch existing calendar entries and presets to compare against
    const existingCalendar = await db.contentCalendar.findMany({
      select: {
        id: true,
        projectTitle: true,
        animalStoryName: true,
        notes: true,
        status: true,
      },
    });

    const existingPresets = await db.wSTVPreset.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        animalType: true,
        biome: true,
        dangerType: true,
        emotionalBeat: true,
      },
    });

    const warnings: string[] = [];
    let totalScore = 0;
    let matchCount = 0;

    // Check against presets
    for (const preset of existingPresets) {
      let presetScore = 0;
      const maxPoints = 5;

      if (animal && preset.animalType && animal.toLowerCase() === preset.animalType.toLowerCase()) {
        presetScore += 1;
      }
      if (location && preset.biome && location.toLowerCase() === preset.biome.toLowerCase()) {
        presetScore += 1;
      }
      if (danger && preset.dangerType && danger.toLowerCase() === preset.dangerType.toLowerCase()) {
        presetScore += 1;
      }
      if (emotionalBeat && preset.emotionalBeat && emotionalBeat.toLowerCase() === preset.emotionalBeat.toLowerCase()) {
        presetScore += 1;
      }
      if (ending && preset.emotionalBeat && ending.toLowerCase() === preset.emotionalBeat.toLowerCase()) {
        presetScore += 1;
      }

      const similarity = presetScore / maxPoints;
      if (similarity >= 0.6) {
        warnings.push(
          `Similar to preset "${preset.name}" (${preset.category}) — ${Math.round(similarity * 100)}% match`
        );
        totalScore += similarity;
        matchCount++;
      }
    }

    // Check against existing calendar entries
    for (const entry of existingCalendar) {
      const entryText = `${entry.projectTitle || ''} ${entry.animalStoryName || ''} ${entry.notes || ''}`.toLowerCase();
      let entryScore = 0;
      const maxPoints = 5;

      if (animal && entryText.includes(animal.toLowerCase())) {
        entryScore += 1;
      }
      if (location && entryText.includes(location.toLowerCase())) {
        entryScore += 1;
      }
      if (danger && entryText.includes(danger.toLowerCase())) {
        entryScore += 1;
      }
      if (ending && entryText.includes(ending.toLowerCase())) {
        entryScore += 1;
      }
      if (emotionalBeat && entryText.includes(emotionalBeat.toLowerCase())) {
        entryScore += 1;
      }

      const similarity = entryScore / maxPoints;
      if (similarity >= 0.6) {
        warnings.push(
          `Similar to scheduled "${entry.projectTitle || entry.animalStoryName}" (${entry.status}) — ${Math.round(similarity * 100)}% match`
        );
        totalScore += similarity;
        matchCount++;
      }
    }

    // Calculate overall similarity score (0-1)
    const similarityScore = matchCount > 0 ? Math.min(totalScore / matchCount, 1) : 0;

    // Add severity warning
    if (similarityScore >= 0.8) {
      warnings.unshift('⚠️ HIGH SIMILARITY — This idea may be too similar to existing content');
    } else if (similarityScore >= 0.6) {
      warnings.unshift('⚡ MODERATE SIMILARITY — Consider differentiating this idea more');
    }

    // Save the duplicate check record
    const duplicateCheck = await db.duplicateCheck.create({
      data: {
        newProjectTitle: `${animal || ''} ${location || ''} ${danger || ''} ${ending || ''}`.trim() || 'Untitled',
        newAnimal: animal ?? null,
        newLocation: location ?? null,
        newDanger: danger ?? null,
        newEnding: ending ?? null,
        newEmotionalBeat: emotionalBeat ?? null,
        similarityScore,
        warningMessage: warnings.length > 0 ? warnings.join('; ') : null,
      },
    });

    return NextResponse.json({
      similarityScore,
      warnings,
      matchCount,
      checkId: duplicateCheck.id,
    });
  } catch (error) {
    console.error('[DUPLICATE_CHECK]', error);
    return NextResponse.json(
      { error: 'Failed to check for duplicates' },
      { status: 500 }
    );
  }
}
