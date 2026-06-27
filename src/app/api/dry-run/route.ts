import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  isValidSeedanceDuration,
  isResolutionSupported,
  getSupportedResolutions,
  validateSeedancePayload,
  SEEDANCE_MODEL_IDS,
  MODEL_METADATA,
  VALID_DURATION_MIN,
  VALID_DURATION_MAX,
  AUTO_DURATION,
  type GenerationMode,
} from '@/lib/seedance-validation';

// Cost estimation table (USD per second) — legacy, kept for cost preview only
const COST_TABLE: Record<string, Record<string, number>> = {
  mini: {
    '480p': 0.02,
    '720p': 0.04,
  },
  full: {
    '480p': 0.03,
    '720p': 0.06,
    '1080p': 0.10,
    '4K': 0.18,
  },
};

// PHASE5.1: These are RECOMMENDED char ranges, not hard API limits.
// A prompt exceeding these shows a warning but does NOT hard-block Dry Run.
function getCharLimit(modelType: string) {
  return modelType === 'mini' ? 1500 : 2000;
}

function getCharLimitForSeedance(seedanceModelId: string): number {
  return MODEL_METADATA[seedanceModelId]?.charLimit ?? 2000;
}

function isValidAudioUrl(url: string) {
  return url.startsWith('https://') && /\.(mp3|wav|m4a)(\?|$)/i.test(url);
}

function isValidVideoUrl(url: string) {
  return url.startsWith('https://') && /\.(mp4|mov)(\?|$)/i.test(url);
}

function isValidImageUrl(url: string) {
  return url.startsWith('https://');
}

interface RefItem {
  role: string;
  url: string;
  label?: string;
}

interface ReferencesPayload {
  images?: RefItem[];
  videos?: RefItem[];
  audios?: RefItem[];
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
      references: rawReferences,
      // Legacy fields for backward compatibility
      masterImageUrl,
      storyboardImageUrl,
      audioUrl1,
      audioUrl2,
      audioUrl3,
      videoUrl1,
      videoUrl2,
      videoUrl3,
      maxCostUsd,
      taskId,
      // ─── PHASE4: Official Seedance validation fields ───
      seedanceModelId: rawSeedanceModelId,
      generationMode: rawGenerationMode,
    } = body;

    // ─── PHASE4: Normalize Seedance model ID + generation mode ───
    const seedanceModelId: string = rawSeedanceModelId || SEEDANCE_MODEL_IDS.STANDARD;
    const generationMode: GenerationMode = rawGenerationMode === 'frame_mode' ? 'frame_mode' : 'reference_mode';
    const modelMeta = MODEL_METADATA[seedanceModelId] ?? MODEL_METADATA[SEEDANCE_MODEL_IDS.STANDARD];

    const validationLog: string[] = [];
    const errors: string[] = [];

    // Use the Seedance-model-specific char limit (falls back to legacy modelType)
    const charLimit = getCharLimitForSeedance(seedanceModelId) || getCharLimit(modelType || 'full');

    // 1. Validate prompt
    // PHASE5: Prompt length is a WARNING, not a hard error.
    // The official Seedance 2.0 char limit is a soft guideline, not a hard
    // API block. A 3500-character prompt should NOT hard-block Dry Run —
    // it should show a warning so the user knows it's over the recommended
    // limit but can still proceed.
    const characterCount = prompt?.length || 0;
    const wordCount = prompt ? prompt.trim().split(/\s+/).filter(Boolean).length : 0;
    if (!prompt || prompt.trim().length === 0) {
      errors.push('Prompt is required');
      validationLog.push('❌ Prompt: empty');
    } else if (characterCount > charLimit) {
      // Soft warning — does NOT add to errors array
      validationLog.push(`⚠️ Prompt: ${characterCount}/${charLimit} chars — OVER RECOMMENDED LIMIT (warning, not blocked)`);
      validationLog.push(`ℹ️ Prompt: ${wordCount} words`);
    } else {
      validationLog.push(`✅ Prompt: ${characterCount}/${charLimit} chars — OK`);
      validationLog.push(`ℹ️ Prompt: ${wordCount} words`);
    }

    // 2. Validate model (PHASE4: use Seedance model ID)
    validationLog.push(`✅ Model: ${modelMeta.label} (${seedanceModelId})`);

    // 3. Validate resolution (PHASE4: model-specific rules)
    if (!resolution || !isResolutionSupported(seedanceModelId, resolution)) {
      const supported = getSupportedResolutions(seedanceModelId);
      if (seedanceModelId === SEEDANCE_MODEL_IDS.FAST || seedanceModelId === SEEDANCE_MODEL_IDS.MINI) {
        errors.push(`1080p/4k is only supported by Seedance 2.0 Standard. Fast and Mini support 480p/720p only. (Supported: ${supported.join(', ')})`);
      } else {
        errors.push(`Invalid resolution for ${modelMeta.label}. Supported: ${supported.join(', ')}`);
      }
      validationLog.push(`❌ Resolution: ${resolution || 'none'} — invalid for ${modelMeta.shortLabel}`);
    } else {
      validationLog.push(`✅ Resolution: ${resolution} (supported by ${modelMeta.shortLabel})`);
    }

    // 4. Validate duration (PHASE4: integer 4–15 or -1 for auto)
    if (!isValidSeedanceDuration(duration)) {
      errors.push(`Invalid Seedance duration. Use an integer from ${VALID_DURATION_MIN} to ${VALID_DURATION_MAX} seconds, or -1 for auto duration.`);
      validationLog.push(`❌ Duration: ${duration} — invalid (must be ${VALID_DURATION_MIN}–${VALID_DURATION_MAX} or ${AUTO_DURATION})`);
    } else {
      if (duration === AUTO_DURATION) {
        validationLog.push(`✅ Duration: auto (-1) — model will choose duration`);
      } else {
        validationLog.push(`✅ Duration: ${duration}s (valid range ${VALID_DURATION_MIN}–${VALID_DURATION_MAX})`);
      }
    }

    // 5. Validate aspect ratio
    const validRatios = ['9:16', '16:9', '1:1'];
    if (!aspectRatio || !validRatios.includes(aspectRatio)) {
      errors.push('Invalid aspect ratio');
      validationLog.push(`❌ Aspect ratio: ${aspectRatio || 'none'} — invalid`);
    } else {
      validationLog.push(`✅ Aspect ratio: ${aspectRatio}`);
    }

    // 5b. PHASE4: Validate generation mode + mode conflict
    validationLog.push(`✅ Generation mode: ${generationMode}`);
    if (generationMode === 'frame_mode') {
      validationLog.push(`ℹ️ Frame mode: only first_frame / last_frame image roles allowed`);
    } else {
      validationLog.push(`ℹ️ Reference mode: first_frame / last_frame not allowed`);
    }

    // ─── 6. Validate references (new unified format) ───
    const references: ReferencesPayload = rawReferences || { images: [], videos: [], audios: [] };

    // Fallback: if no new-format references, build from legacy fields
    if (!rawReferences) {
      const legacyImages: RefItem[] = [];
      if (masterImageUrl) legacyImages.push({ role: 'main_identity', url: masterImageUrl });
      if (storyboardImageUrl) legacyImages.push({ role: 'first_frame', url: storyboardImageUrl });
      references.images = legacyImages;

      const legacyAudios: RefItem[] = [];
      if (audioUrl1) legacyAudios.push({ role: 'audio_ambient', url: audioUrl1 });
      if (audioUrl2) legacyAudios.push({ role: 'audio_music', url: audioUrl2 });
      if (audioUrl3) legacyAudios.push({ role: 'audio_voice', url: audioUrl3 });
      references.audios = legacyAudios;

      const legacyVideos: RefItem[] = [];
      if (videoUrl1) legacyVideos.push({ role: 'video_motion', url: videoUrl1 });
      if (videoUrl2) legacyVideos.push({ role: 'video_pacing', url: videoUrl2 });
      if (videoUrl3) legacyVideos.push({ role: 'video_camera', url: videoUrl3 });
      references.videos = legacyVideos;
    }

    // Validate image references (up to 9)
    let referenceImageCount = 0;
    const imageRefs = (references.images || []).filter((r: RefItem) => r.url?.trim());
    referenceImageCount = imageRefs.length;

    for (const ref of imageRefs) {
      if (!isValidImageUrl(ref.url)) {
        errors.push(`Image reference "${ref.role}" URL must be HTTPS`);
        validationLog.push(`❌ Image [${ref.role}]: not HTTPS — ${ref.url.substring(0, 50)}`);
      } else {
        validationLog.push(`✅ Image [${ref.role}]: valid HTTPS`);
      }
    }

    if (referenceImageCount === 0) {
      validationLog.push('ℹ️ Image references: none provided');
    }
    if (referenceImageCount > 9) {
      errors.push(`Too many image references (${referenceImageCount}/9 max)`);
      validationLog.push(`❌ Image references: ${referenceImageCount}/9 — OVER LIMIT`);
    } else if (referenceImageCount > 0) {
      validationLog.push(`✅ Image references: ${referenceImageCount}/9 — OK`);
    }

    // Validate audio references (up to 3)
    let referenceAudioCount = 0;
    const audioRefs = (references.audios || []).filter((r: RefItem) => r.url?.trim());
    referenceAudioCount = audioRefs.length;

    for (const ref of audioRefs) {
      if (!isValidAudioUrl(ref.url)) {
        errors.push(`Audio reference "${ref.role}" must be HTTPS with .mp3/.wav/.m4a extension`);
        validationLog.push(`❌ Audio [${ref.role}]: invalid format — must be HTTPS with .mp3/.wav/.m4a`);
      } else {
        validationLog.push(`✅ Audio [${ref.role}]: valid HTTPS audio`);
      }
    }

    if (referenceAudioCount === 0) {
      validationLog.push('ℹ️ Audio references: none provided');
    }
    if (referenceAudioCount > 3) {
      errors.push(`Too many audio references (${referenceAudioCount}/3 max)`);
      validationLog.push(`❌ Audio references: ${referenceAudioCount}/3 — OVER LIMIT`);
    } else if (referenceAudioCount > 0) {
      validationLog.push(`✅ Audio references: ${referenceAudioCount}/3 — OK`);
    }

    // Validate video references (up to 3)
    let referenceVideoCount = 0;
    const videoRefs = (references.videos || []).filter((r: RefItem) => r.url?.trim());
    referenceVideoCount = videoRefs.length;

    for (const ref of videoRefs) {
      if (!isValidVideoUrl(ref.url)) {
        errors.push(`Video reference "${ref.role}" must be HTTPS with .mp4/.mov extension`);
        validationLog.push(`❌ Video [${ref.role}]: invalid format — must be HTTPS with .mp4/.mov`);
      } else {
        validationLog.push(`✅ Video [${ref.role}]: valid HTTPS video`);
      }
    }

    if (referenceVideoCount === 0) {
      validationLog.push('ℹ️ Video references: none provided');
    }
    if (referenceVideoCount > 3) {
      errors.push(`Too many video references (${referenceVideoCount}/3 max)`);
      validationLog.push(`❌ Video references: ${referenceVideoCount}/3 — OVER LIMIT`);
    } else if (referenceVideoCount > 0) {
      validationLog.push(`✅ Video references: ${referenceVideoCount}/3 — OK`);
    }

    const totalReferenceDuration = 0; // In dry-run mode, we don't have actual durations

    // 9. Estimate cost (PHASE4: handle -1 auto duration — cost unknown)
    const costPerSecond = COST_TABLE[modelType]?.[resolution] || 0;
    const estimatedCost = duration === AUTO_DURATION ? 0 : costPerSecond * duration;
    if (duration === AUTO_DURATION) {
      validationLog.push(`💰 Estimated cost: unknown (auto duration — model will choose)`);
    } else {
      validationLog.push(`💰 Estimated cost: $${estimatedCost.toFixed(2)} USD`);
    }

    // 10. Check max cost cap (skip if auto duration — cost unknown)
    if (maxCostUsd && duration !== AUTO_DURATION && estimatedCost > maxCostUsd) {
      errors.push(`Estimated cost ($${estimatedCost.toFixed(2)}) exceeds max cost cap ($${maxCostUsd})`);
      validationLog.push(`❌ Cost cap: $${estimatedCost.toFixed(2)} > $${maxCostUsd} — EXCEEDED`);
    } else if (maxCostUsd && duration !== AUTO_DURATION) {
      validationLog.push(`✅ Cost cap: $${estimatedCost.toFixed(2)} ≤ $${maxCostUsd} — OK`);
    } else if (duration === AUTO_DURATION && maxCostUsd) {
      validationLog.push(`ℹ️ Cost cap: skipped (auto duration — actual cost unknown until generation)`);
    }

    // 11. Budget check (skip if auto duration — cost unknown)
    const budget = await db.budgetSetting.findFirst();
    if (budget && duration !== AUTO_DURATION) {
      const remaining = budget.monthlyLimit - budget.spentThisMonth;
      if (estimatedCost > remaining) {
        errors.push(`Estimated cost exceeds remaining monthly budget ($${remaining.toFixed(2)})`);
        validationLog.push(`❌ Budget: $${estimatedCost.toFixed(2)} > $${remaining.toFixed(2)} remaining — EXCEEDED`);
      } else {
        validationLog.push(`✅ Budget: $${estimatedCost.toFixed(2)} ≤ $${remaining.toFixed(2)} remaining — OK`);
      }
    } else if (budget && duration === AUTO_DURATION) {
      validationLog.push(`ℹ️ Budget: skipped (auto duration — actual cost unknown until generation)`);
    }

    // ─── 12. PHASE4: Full Seedance payload validation ───
    // Run the comprehensive validation from src/lib/seedance-validation.ts
    // This catches: mode conflicts, audio-alone, last_frame without first_frame,
    // reference counts, URL format, etc.
    const seedanceValidation = validateSeedancePayload({
      modelId: seedanceModelId,
      prompt: prompt || '',
      ratio: aspectRatio,
      duration,
      resolution,
      generationMode,
      references: {
        images: imageRefs,
        videos: videoRefs,
        audios: audioRefs,
      },
    });
    for (const e of seedanceValidation.errors) {
      if (!errors.includes(e)) {
        errors.push(e);
        validationLog.push(`❌ ${e}`);
      }
    }
    for (const w of seedanceValidation.warnings) {
      validationLog.push(`⚠️ ${w}`);
    }

    const passed = errors.length === 0;
    const frameCount = duration === AUTO_DURATION ? 0 : (duration || 0) * 24;

    const dryRunResult = {
      passed,
      characterCount,
      characterLimit: charLimit,
      model: modelType === 'full' ? 'Seedance 2.0 Full' : 'Seedance 2.0 Mini',
      modelId: modelId || modelType,
      duration: duration || 0,
      frameCount,
      resolution,
      aspectRatio,
      referenceImageCount,
      referenceAudioCount,
      referenceVideoCount,
      totalReferenceDuration,
      estimatedCost,
      estimatedCostCny: estimatedCost * 7.25,
      validationLog,
      errors,
      timestamp: new Date().toISOString(),
      references: {
        images: imageRefs.map((r: RefItem) => ({ role: r.role, url: r.url, label: r.label || r.role })),
        videos: videoRefs.map((r: RefItem) => ({ role: r.role, url: r.url, label: r.label || r.role })),
        audios: audioRefs.map((r: RefItem) => ({ role: r.role, url: r.url, label: r.label || r.role })),
      },
    };

    // Update task if taskId provided
    if (taskId) {
      await db.videoTask.update({
        where: { id: taskId },
        data: {
          dryRunPassed: passed,
          dryRunResult: JSON.stringify(dryRunResult),
          status: passed ? 'dry_run_passed' : 'dry_run_failed',
          costEstimate: estimatedCost,
          safetyPassed: passed,
        },
      });
    }

    return NextResponse.json(dryRunResult);
  } catch (error) {
    console.error('Dry run error:', error);
    return NextResponse.json(
      { passed: false, errors: ['Internal server error'], validationLog: ['❌ Internal server error'] },
      { status: 500 }
    );
  }
}
