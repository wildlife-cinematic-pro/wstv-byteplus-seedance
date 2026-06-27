/**
 * Seedance 2.0 Official API Validation + Payload Builder
 * ============================================
 *
 * PHASE4 — Validation rules and payload preview ONLY.
 * No real API calls. No API keys. No paid submissions.
 *
 * Official endpoints (for FUTURE integration — NOT called now):
 *   POST   https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks
 *   GET    https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks/{id}
 *   GET    https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks
 *   DELETE https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks/{id}
 *
 * Official headers (for FUTURE integration — NOT used in PHASE4):
 *   Content-Type: application/json
 *   Authorization: Bearer <ARK_API_KEY>   (placeholder — no real key is stored or loaded in PHASE4)
 *
 * References:
 *   - BytePlus / ModelArk Seedance 2.0 documentation
 *   - WSTV production workflow notes
 */

// ─── Duration constants ───

export const VALID_DURATION_MIN = 4;
export const VALID_DURATION_MAX = 15;
export const AUTO_DURATION = -1; // model-chosen auto duration

// ─── Official Model IDs ───

export const SEEDANCE_MODEL_IDS = {
  STANDARD: 'dreamina-seedance-2-0-260128',
  FAST: 'dreamina-seedance-2-0-fast-260128',
  MINI: 'dreamina-seedance-2-0-mini-260615',
} as const;

export type SeedanceModelId = (typeof SEEDANCE_MODEL_IDS)[keyof typeof SEEDANCE_MODEL_IDS];

// ─── Model-specific resolution rules ───
// Standard supports 480p / 720p / 1080p / 4k
// Fast supports 480p / 720p only
// Mini supports 480p / 720p only

export const MODEL_RESOLUTION_RULES: Record<string, string[]> = {
  [SEEDANCE_MODEL_IDS.STANDARD]: ['480p', '720p', '1080p', '4k'],
  [SEEDANCE_MODEL_IDS.FAST]: ['480p', '720p'],
  [SEEDANCE_MODEL_IDS.MINI]: ['480p', '720p'],
};

// ─── Model display metadata ───
// PHASE5.1: charLimit is a RECOMMENDED range, not a hard API limit.
// A prompt exceeding charLimit shows a warning but does NOT hard-block Dry Run.

export const MODEL_METADATA: Record<string, { label: string; shortLabel: string; description: string; charLimit: number }> = {
  [SEEDANCE_MODEL_IDS.STANDARD]: {
    label: 'Seedance 2.0 Standard',
    shortLabel: 'Standard',
    description: 'Full quality · 480p/720p/1080p/4k · 4–15s',
    charLimit: 2000,
  },
  [SEEDANCE_MODEL_IDS.FAST]: {
    label: 'Seedance 2.0 Fast',
    shortLabel: 'Fast',
    description: 'Faster generation · 480p/720p only · 4–15s',
    charLimit: 1500,
  },
  [SEEDANCE_MODEL_IDS.MINI]: {
    label: 'Seedance 2.0 Mini',
    shortLabel: 'Mini',
    description: 'Lightweight · 480p/720p only · 4–15s',
    charLimit: 1500,
  },
};

// ─── Generation modes ───

export type GenerationMode = 'reference_mode' | 'frame_mode';

export const GENERATION_MODE_METADATA: Record<GenerationMode, { label: string; description: string; allowedRoles: string[] }> = {
  reference_mode: {
    label: 'Reference Mode',
    description: 'Master image + storyboard + character/environment references. WSTV default.',
    allowedRoles: ['reference_image', 'reference_video', 'reference_audio'],
  },
  frame_mode: {
    label: 'Frame Mode',
    description: 'Exact first-frame or first+last-frame control. Cannot mix with reference media.',
    allowedRoles: ['first_frame', 'last_frame'],
  },
};

// ─── Reference limits (official) ───

export const REFERENCE_LIMITS_SEEDANCE = {
  reference_image: 9,   // 0–9
  reference_video: 3,   // 0–3
  reference_audio: 3,   // 0–3
  first_frame: 1,
  last_frame: 1,
} as const;

// ─── Reference role mapping ───
// Maps WSTV internal role names to official Seedance API roles.
// In reference_mode, ALL image references become "reference_image".
// In frame_mode, the first_frame / last_frame roles are preserved.

export function mapRoleToSeedance(role: string, mode: GenerationMode): string {
  if (mode === 'frame_mode') {
    if (role === 'first_frame') return 'first_frame';
    if (role === 'last_frame') return 'last_frame';
    return 'first_frame'; // default in frame mode
  }
  // reference_mode: all images/videos/audios become reference_*
  return 'reference_image'; // for images; videos/audios handled separately by caller
}

// ─── Aspect ratio validation ───
// Official Seedance 2.0 ratios. WSTV defaults to 9:16, but preview
// validation keeps the complete documented set available.

export const VALID_RATIOS = ['9:16', '16:9', '4:3', '1:1', '3:4', '21:9', 'adaptive'] as const;

// ─── Duration validation ───
// Official rule: any integer from 4 to 15, OR -1 for auto duration.

export function isValidSeedanceDuration(duration: number): boolean {
  if (duration === AUTO_DURATION) return true;
  return Number.isInteger(duration) && duration >= VALID_DURATION_MIN && duration <= VALID_DURATION_MAX;
}

// ─── Resolution validation ───

export function getSupportedResolutions(modelId: string): string[] {
  return MODEL_RESOLUTION_RULES[modelId] ?? MODEL_RESOLUTION_RULES[SEEDANCE_MODEL_IDS.STANDARD];
}

export function isResolutionSupported(modelId: string, resolution: string): boolean {
  const supported = getSupportedResolutions(modelId);
  // Normalize: "4K" and "4k" are equivalent
  const norm = (r: string) => r.toLowerCase();
  return supported.some(r => norm(r) === norm(resolution));
}

// ─── Reference item type ───

export interface SeedanceReferenceItem {
  role: string;
  url: string;
  label?: string;
}

export interface SeedanceReferences {
  images: SeedanceReferenceItem[];
  videos: SeedanceReferenceItem[];
  audios: SeedanceReferenceItem[];
}

// ─── Payload builder input ───

export interface SeedancePayloadInput {
  modelId: string;
  prompt: string;
  ratio: string;
  duration: number; // 4–15 or -1
  resolution: string;
  generationMode: GenerationMode;
  references: SeedanceReferences;
  watermark?: boolean;
  generateAudio?: boolean;
  returnLastFrame?: boolean;
  callbackUrl?: string;
}

// ─── Content block builders ───
// Official Seedance 2.0 content block shapes:

export function buildImageBlock(url: string, role: string) {
  return {
    type: 'image_url',
    image_url: { url },
    role,
  };
}

export function buildVideoBlock(url: string, role: string) {
  return {
    type: 'video_url',
    video_url: { url },
    role,
  };
}

export function buildAudioBlock(url: string, role: string) {
  return {
    type: 'audio_url',
    audio_url: { url },
    role,
  };
}

export function buildTextBlock(text: string) {
  return {
    type: 'text',
    text,
  };
}

// ─── Build the full payload (preview only — never sent) ───

export function buildSeedancePayload(input: SeedancePayloadInput): Record<string, unknown> {
  const {
    modelId,
    prompt,
    ratio,
    duration,
    resolution,
    generationMode,
    references,
    watermark = false,
    generateAudio = true,
    returnLastFrame = true,
    callbackUrl,
  } = input;

  // Build content array
  const content: unknown[] = [];

  // Add text prompt first (if provided)
  if (prompt && prompt.trim()) {
    content.push(buildTextBlock(prompt.trim()));
  }

  if (generationMode === 'frame_mode') {
    // Frame mode: only first_frame / last_frame images
    const firstFrame = references.images.find(r => r.role === 'first_frame' && r.url.trim());
    const lastFrame = references.images.find(r => r.role === 'last_frame' && r.url.trim());
    if (firstFrame) content.push(buildImageBlock(firstFrame.url, 'first_frame'));
    if (lastFrame) content.push(buildImageBlock(lastFrame.url, 'last_frame'));
  } else {
    // Reference mode: all images become reference_image, videos become reference_video, audios become reference_audio
    for (const img of references.images.filter(r => r.url.trim())) {
      content.push(buildImageBlock(img.url, 'reference_image'));
    }
    for (const vid of references.videos.filter(r => r.url.trim())) {
      content.push(buildVideoBlock(vid.url, 'reference_video'));
    }
    for (const aud of references.audios.filter(r => r.url.trim())) {
      content.push(buildAudioBlock(aud.url, 'reference_audio'));
    }
  }

  const payload: Record<string, unknown> = {
    model: modelId,
    content,
    ratio,
    duration,
    resolution,
    watermark,
    generate_audio: generateAudio,
    return_last_frame: returnLastFrame,
  };

  if (callbackUrl) {
    payload.callback_url = callbackUrl;
  }

  return payload;
}

// ─── Full payload validation ───

export interface SeedanceValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateSeedancePayload(input: SeedancePayloadInput): SeedanceValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Duration validation: integer 4–15 or -1
  if (!isValidSeedanceDuration(input.duration)) {
    errors.push(
      `Invalid Seedance duration. Use an integer from ${VALID_DURATION_MIN} to ${VALID_DURATION_MAX} seconds, or -1 for auto duration.`
    );
  }

  // 2. Model-specific resolution validation
  if (!isResolutionSupported(input.modelId, input.resolution)) {
    const supported = getSupportedResolutions(input.modelId);
    if (input.modelId === SEEDANCE_MODEL_IDS.FAST || input.modelId === SEEDANCE_MODEL_IDS.MINI) {
      errors.push(
        `1080p/4k is only supported by Seedance 2.0 Standard. Fast and Mini support 480p/720p only. (Supported: ${supported.join(', ')})`
      );
    } else {
      errors.push(`Resolution ${input.resolution} is not supported by model ${input.modelId}. Supported: ${supported.join(', ')}`);
    }
  }

  // 3. Aspect ratio validation
  if (!VALID_RATIOS.includes(input.ratio as (typeof VALID_RATIOS)[number])) {
    errors.push(`Invalid ratio ${input.ratio}. Supported: ${VALID_RATIOS.join(', ')}`);
  }

  // 4. Mode conflict detection
  const hasFrameRoles =
    referencesHasRole(input.references, 'first_frame') ||
    referencesHasRole(input.references, 'last_frame');
  const hasReferenceRoles =
    referencesHasRole(input.references, 'reference_image') ||
    referencesHasRole(input.references, 'reference_video') ||
    referencesHasRole(input.references, 'reference_audio') ||
    // Also detect WSTV internal roles that map to reference_*
    referencesHasAnyRole(input.references, [
      'main_identity', 'mother_animal', 'baby_animal', 'environment',
      'camera_framing', 'lighting_mood', 'extra_style',
      'video_motion', 'video_pacing', 'video_camera',
      'audio_ambient', 'audio_music', 'audio_voice',
    ]);

  if (hasFrameRoles && hasReferenceRoles) {
    errors.push(
      'Seedance mode conflict: first_frame/last_frame cannot be mixed with reference_image/reference_video/reference_audio.'
    );
  }

  // 5. Frame mode specific rules
  if (input.generationMode === 'frame_mode') {
    // last_frame requires first_frame
    const hasLastFrame = referencesHasRole(input.references, 'last_frame');
    const hasFirstFrame = referencesHasRole(input.references, 'first_frame');
    if (hasLastFrame && !hasFirstFrame) {
      errors.push('In frame mode, last_frame requires first_frame to also be provided.');
    }
    // Frame mode cannot include reference media
    if (hasReferenceRoles) {
      errors.push('Frame mode cannot include reference_image/reference_video/reference_audio. Use reference mode for storyboard/reference media.');
    }
  }

  // 6. Reference mode specific rules
  if (input.generationMode === 'reference_mode') {
    // Reference mode cannot include first_frame / last_frame
    if (hasFrameRoles) {
      errors.push('Reference mode cannot include first_frame/last_frame. Use frame mode for exact frame control.');
    }
  }

  // 7. Image count limit (0–9)
  const imageCount = countActiveRefs(input.references.images);
  if (imageCount > REFERENCE_LIMITS_SEEDANCE.reference_image) {
    errors.push(`Too many image references: ${imageCount} (max ${REFERENCE_LIMITS_SEEDANCE.reference_image}).`);
  }

  // 8. Video count limit (0–3)
  const videoCount = countActiveRefs(input.references.videos);
  if (videoCount > REFERENCE_LIMITS_SEEDANCE.reference_video) {
    errors.push(`Too many video references: ${videoCount} (max ${REFERENCE_LIMITS_SEEDANCE.reference_video}).`);
  }

  // 9. Audio count limit (0–3)
  const audioCount = countActiveRefs(input.references.audios);
  if (audioCount > REFERENCE_LIMITS_SEEDANCE.reference_audio) {
    errors.push(`Too many audio references: ${audioCount} (max ${REFERENCE_LIMITS_SEEDANCE.reference_audio}).`);
  }

  // 10. Audio cannot be submitted alone — require at least one image or video
  if (audioCount > 0 && imageCount === 0 && videoCount === 0) {
    errors.push('Reference audio requires at least one reference image or reference video.');
  }

  // 11. Prompt recommended (warning, not error) for multimodal reference
  if (input.generationMode === 'reference_mode' && (!input.prompt || !input.prompt.trim()) && (imageCount > 0 || videoCount > 0)) {
    warnings.push('Text prompt is optional for multimodal reference, but WSTV recommends including one for best results.');
  }

  // 12. URL format validation (HTTPS required)
  const allRefs = [
    ...input.references.images,
    ...input.references.videos,
    ...input.references.audios,
  ].filter(r => r.url.trim());
  for (const ref of allRefs) {
    if (!ref.url.startsWith('https://') && !ref.url.startsWith('asset://') && !ref.url.startsWith('data:')) {
      warnings.push(`Reference URL should be HTTPS, asset://, or Base64 data URI: ${ref.url.substring(0, 50)}...`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ─── Helpers ───

function referencesHasRole(refs: SeedanceReferences, role: string): boolean {
  return (
    refs.images.some(r => r.role === role && r.url.trim()) ||
    refs.videos.some(r => r.role === role && r.url.trim()) ||
    refs.audios.some(r => r.role === role && r.url.trim())
  );
}

function referencesHasAnyRole(refs: SeedanceReferences, roles: string[]): boolean {
  const roleSet = new Set(roles);
  return (
    refs.images.some(r => roleSet.has(r.role) && r.url.trim()) ||
    refs.videos.some(r => roleSet.has(r.role) && r.url.trim()) ||
    refs.audios.some(r => roleSet.has(r.role) && r.url.trim())
  );
}

function countActiveRefs(items: SeedanceReferenceItem[]): number {
  return items.filter(r => r.url && r.url.trim()).length;
}

// ─── Official task statuses (for future real API lifecycle) ───

export const SEEDANCE_TASK_STATUSES = [
  'queued',
  'running',
  'cancelled',
  'succeeded',
  'failed',
  'expired',
] as const;

export type SeedanceTaskStatus = (typeof SEEDANCE_TASK_STATUSES)[number];

// ─── Cancel/delete rules (for future real API) ───

export const CANCEL_DELETE_RULES: Record<SeedanceTaskStatus, { canCancel: boolean; canDelete: boolean }> = {
  queued:    { canCancel: true,  canDelete: false },
  running:   { canCancel: false, canDelete: false },
  cancelled: { canCancel: false, canDelete: false },
  succeeded: { canCancel: false, canDelete: true  },
  failed:    { canCancel: false, canDelete: true  },
  expired:   { canCancel: false, canDelete: true  },
};

// ─── WSTV defaults ───

export const WSTV_DEFAULTS = {
  modelId: SEEDANCE_MODEL_IDS.STANDARD,
  generationMode: 'reference_mode' as GenerationMode,
  ratio: '9:16',
  duration: 15,
  resolution: '720p',
  watermark: false,
  generateAudio: true,
  returnLastFrame: true,
} as const;

// ─── Media input planning labels (for UI hints) ───

export const MEDIA_INPUT_LABELS = {
  image: ['public URL', 'Base64', 'asset://<ASSET_ID>'],
  video: ['public URL', 'asset ID'],
  audio: ['public URL', 'asset ID'],
} as const;

// ─── Media size/duration limits (for UI warnings) ───

export const MEDIA_LIMITS = {
  image: {
    maxSingleSizeMB: 30,
    maxTotalRequestMB: 64,
    note: 'Prefer public URL or asset ID over Base64 for large media. BytePlus TOS public-read storage is recommended for future real calls.',
  },
  video: {
    formats: ['mp4', 'mov'],
    minDurationSec: 2,
    maxDurationSec: 15,
    maxCount: 3,
    maxTotalDurationSec: 15,
    note: 'Use public URLs or asset IDs for future real calls. Total reference video duration should not exceed 15 seconds.',
  },
  audio: {
    formats: ['mp3', 'wav'],
    minDurationSec: 2,
    maxDurationSec: 15,
    maxCount: 3,
    maxTotalDurationSec: 15,
    note: 'Audio reference must be paired with at least one image or video reference. Do not submit audio alone.',
  },
} as const;

// ─── Human-face warning (UI only, no detection) ───

export const HUMAN_FACE_WARNING =
  'Seedance 2.0 does not support direct upload of reference images/videos containing real human faces in normal reference mode. WSTV wildlife scenes are okay; avoid human-face references unless using the official portrait workflow.';

// ─── Frames parameter note ───

export const FRAMES_NOT_SUPPORTED_NOTE =
  'Frames parameter is not supported for Seedance 2.0. Do not add a frames control to the Seedance 2.0 payload builder.';

// ─── Seed / camera_fixed notes (NOT active controls) ───

export const SEED_NOT_SUPPORTED_NOTE =
  'Seed is documented for some video generation flows, but WSTV keeps it inactive in PHASE5.1 preview. Evaluate in PHASE6 before adding it to the payload.';

export const CAMERA_FIXED_NOT_SUPPORTED_NOTE =
  'camera_fixed is documented for some video generation flows, but WSTV keeps it inactive in PHASE5.1 preview. Evaluate in PHASE6 before adding it to the payload.';

// ═══════════════════════════════════════════════════════════════════════
// PHASE5: Resource Pack Billing / Deduction Rules
// ═══════════════════════════════════════════════════════════════════════
// Official BytePlus ModelArk resource pack billing rules:
//   - Resource packs are prepaid
//   - Non-refundable
//   - Expire after 90 days
//   - Resource pack > pay-as-you-go deduction priority
//   - If quota expires or is exhausted, excess usage may automatically
//     switch to pay-as-you-go billing
//   - Standard pack deducts Standard usage only
//   - Fast pack deducts Fast usage only
//   - Mini pack deducts Mini usage only
//
// The deduction ratio converts "model tokens" (computed from
// width × height × fps × duration) to "resource pack tokens" (the tokens
// actually deducted from the prepaid pack). Higher resolutions and video
// input have higher multipliers.
//
// IMPORTANT: The ratios below are ESTIMATED based on typical BytePlus
// billing patterns. They are NOT official numbers. The UI labels them
// as "estimated" so the user knows to verify actual billing in the
// BytePlus console.

// ─── WSTV active pack ───
export const WSTV_ACTIVE_PACK = {
  packName: 'Dreamina Seedance 2.0 Standard',
  modelTier: 'Standard' as const,
  modelId: SEEDANCE_MODEL_IDS.STANDARD,
  purchasedPacks: 7,           // 7 × 1M token packs
  tokensPerPack: 1_000_000,
  totalQuota: 7_000_000,       // 7,000,000 resource-pack tokens
  paidUsd: 30.10,
  purchaseDate: '2026-06-16',
  expiryDate: '2026-09-14',
  validityDays: 90,
  packType: 'Standard only' as const,
} as const;

// ─── Billing rules (official) ───
export const RESOURCE_PACK_BILLING_RULES = [
  'Resource packs are prepaid',
  'Non-refundable',
  'Expire after 90 days',
  'Resource pack > pay-as-you-go deduction priority',
  'If quota expires or is exhausted, excess usage may automatically switch to pay-as-you-go billing',
  'Standard pack deducts Standard usage only',
  'Fast pack deducts Fast usage only',
  'Mini pack deducts Mini usage only',
] as const;

// ─── Official BytePlus resource pack deduction ratios ───
// Source: Official BytePlus ModelArk Seedance 2.0 resource pack billing docs.
// These are OFFICIAL ratios — not estimates.
//
// Structure: OFFICIAL_DEDUCTION_RATIOS[modelId][resolutionKey][videoInputKey]
//   - resolutionKey: '480p_720p' (480p and 720p share the same row),
//                    '1080p', '4k'
//   - videoInputKey: 'with_video' (video input included) |
//                    'without_video' (video input not included)
//
// Each entry has:
//   - unitPriceUsdPerKTokens: official USD per 1,000 tokens
//   - ratio: official deduction ratio (multiplier from model tokens to
//            resource-pack tokens deducted)
//
// Note: For 480p and 720p, the same row is used (official docs group them).
// Fast and Mini only support 480p/720p, so they only have the '480p_720p' key.

interface OfficialDeductionEntry {
  unitPriceUsdPerKTokens: number;
  ratio: number;
}

type VideoInputKey = 'with_video' | 'without_video';
type ResolutionKey = '480p_720p' | '1080p' | '4k';

const OFFICIAL_DEDUCTION_RATIOS: Record<string, Partial<Record<ResolutionKey, Record<VideoInputKey, OfficialDeductionEntry>>>> = {
  // ─── Standard / dreamina-seedance-2-0-260128 ───
  [SEEDANCE_MODEL_IDS.STANDARD]: {
    '480p_720p': {
      with_video:    { unitPriceUsdPerKTokens: 0.0043, ratio: 1.0000 },
      without_video: { unitPriceUsdPerKTokens: 0.0070, ratio: 1.6279 },
    },
    '1080p': {
      with_video:    { unitPriceUsdPerKTokens: 0.0047, ratio: 1.0930 },
      without_video: { unitPriceUsdPerKTokens: 0.0077, ratio: 1.7907 },
    },
    '4k': {
      with_video:    { unitPriceUsdPerKTokens: 0.0024, ratio: 0.5581 },
      without_video: { unitPriceUsdPerKTokens: 0.0040, ratio: 0.9302 },
    },
  },
  // ─── Fast / dreamina-seedance-2-0-fast-260128 ───
  // Fast only supports 480p/720p
  [SEEDANCE_MODEL_IDS.FAST]: {
    '480p_720p': {
      with_video:    { unitPriceUsdPerKTokens: 0.0033, ratio: 1.0000 },
      without_video: { unitPriceUsdPerKTokens: 0.0056, ratio: 1.6970 },
    },
  },
  // ─── Mini / dreamina-seedance-2-0-mini-260615 ───
  // Mini only supports 480p/720p
  [SEEDANCE_MODEL_IDS.MINI]: {
    '480p_720p': {
      with_video:    { unitPriceUsdPerKTokens: 0.0021, ratio: 1.0000 },
      without_video: { unitPriceUsdPerKTokens: 0.0035, ratio: 1.6667 },
    },
  },
};

/**
 * Maps a resolution string to the official resolution key.
 * 480p and 720p share the same row ('480p_720p').
 * 1080p → '1080p', 4k → '4k'.
 * Returns null for unsupported resolutions.
 */
function resolutionToKey(resolution: string): ResolutionKey | null {
  const norm = resolution.toLowerCase();
  if (norm === '480p' || norm === '720p') return '480p_720p';
  if (norm === '1080p') return '1080p';
  if (norm === '4k') return '4k';
  return null;
}

/**
 * getDeductionRatio — returns the OFFICIAL BytePlus resource pack
 * deduction ratio based on modelId, resolution, and whether video
 * input is included.
 *
 * Returns:
 *   - ratio: official deduction multiplier (model tokens → pack tokens)
 *   - unitPriceUsdPerKTokens: official USD per 1K tokens
 *   - isOfficial: true (these are official ratios, not estimates)
 *   - note: human-readable explanation
 *
 * If the model/resolution combo is invalid (e.g. Fast + 1080p),
 * returns a safe fallback with ratio=1.0 and a warning note —
 * does NOT crash.
 */
export function getDeductionRatio(params: {
  modelId: string;
  resolution: string;
  hasVideoInput: boolean;
}): { ratio: number; unitPriceUsdPerKTokens: number; isOfficial: boolean; note: string } {
  const { modelId, resolution, hasVideoInput } = params;
  const resKey = resolutionToKey(resolution);
  const videoKey: VideoInputKey = hasVideoInput ? 'with_video' : 'without_video';

  const modelTable = OFFICIAL_DEDUCTION_RATIOS[modelId];
  if (!modelTable || !resKey) {
    // Invalid combo — return safe fallback
    return {
      ratio: 1.0,
      unitPriceUsdPerKTokens: 0,
      isOfficial: false,
      note: `Warning: no official ratio for model ${modelId} at resolution ${resolution}. Using fallback ratio 1.0×. Verify in BytePlus console.`,
    };
  }

  const resTable = modelTable[resKey];
  if (!resTable) {
    // Resolution not supported by this model (e.g. Fast + 1080p)
    return {
      ratio: 1.0,
      unitPriceUsdPerKTokens: 0,
      isOfficial: false,
      note: `Warning: ${resolution} is not supported by this model. Using fallback ratio 1.0×.`,
    };
  }

  const entry = resTable[videoKey];
  if (!entry) {
    return {
      ratio: 1.0,
      unitPriceUsdPerKTokens: 0,
      isOfficial: false,
      note: `Warning: no official ratio for this combination. Using fallback 1.0×.`,
    };
  }

  const videoLabel = hasVideoInput ? 'video input included' : 'video input not included';
  const note = `Official BytePlus ratio: ${modelId} · ${resolution} · ${videoLabel} = ${entry.ratio.toFixed(4)}× (unit price $${entry.unitPriceUsdPerKTokens.toFixed(4)}/K tokens)`;

  return {
    ratio: entry.ratio,
    unitPriceUsdPerKTokens: entry.unitPriceUsdPerKTokens,
    isOfficial: true,
    note,
  };
}

/**
 * estimateResourcePackTokensDeducted — converts model tokens to
 * resource-pack tokens using the OFFICIAL deduction ratio.
 *
 * modelTokens = calculateTokens(width, height, fps, duration) — LOCAL ESTIMATE
 * resourcePackTokens = modelTokens × officialDeductionRatio
 *
 * IMPORTANT: The model-token count is a LOCAL ESTIMATE (based on
 * width × height × fps × duration). Only the deduction RATIO is official.
 * Actual token consumption is returned by the API in usage.total_tokens
 * after a real generation. The UI must label the model-token count as
 * "local estimate" and only the ratio as "official".
 *
 * If the user's active pack is Standard and they selected Fast/Mini,
 * the Standard pack will NOT deduct their usage — pay-as-you-go risk.
 * The caller should check packModelTier vs modelId via checkPackCompatibility().
 */
export function estimateResourcePackTokensDeducted(params: {
  estimatedModelTokens: number;
  modelId: string;
  resolution: string;
  hasVideoInput: boolean;
}): { deductedTokens: number; ratio: number; unitPriceUsdPerKTokens: number; isOfficial: boolean; note: string } {
  const { estimatedModelTokens, modelId, resolution, hasVideoInput } = params;
  const { ratio, unitPriceUsdPerKTokens, isOfficial, note } = getDeductionRatio({ modelId, resolution, hasVideoInput });
  const deductedTokens = Math.round(estimatedModelTokens * ratio);
  return { deductedTokens, ratio, unitPriceUsdPerKTokens, isOfficial, note };
}

/**
 * checkPackCompatibility — checks whether the user's active pack
 * is compatible with the selected model. If the pack is Standard
 * and the user selected Fast/Mini, the pack will NOT deduct their
 * usage — this creates a pay-as-you-go risk.
 *
 * Returns { compatible, riskLevel, warning }.
 */
export function checkPackCompatibility(params: {
  packModelTier: string;  // 'Standard' | 'Fast' | 'Mini'
  selectedModelId: string;
}): { compatible: boolean; riskLevel: 'none' | 'medium' | 'high'; warning: string } {
  const { packModelTier, selectedModelId } = params;
  const selectedTier = selectedModelId === SEEDANCE_MODEL_IDS.STANDARD
    ? 'Standard'
    : selectedModelId === SEEDANCE_MODEL_IDS.FAST
    ? 'Fast'
    : 'Mini';

  if (packModelTier === selectedTier) {
    return {
      compatible: true,
      riskLevel: 'none',
      warning: '',
    };
  }

  return {
    compatible: false,
    riskLevel: 'high',
    warning: `Your current ${packModelTier} pack will NOT deduct ${selectedTier} model usage. ${selectedTier} usage will be billed at pay-as-you-go rates. Purchase a ${selectedTier} resource pack to avoid pay-as-you-go charges.`,
  };
}
