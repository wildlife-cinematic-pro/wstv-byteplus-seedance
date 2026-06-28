export interface AudioReference {
  url: string;
  label: string;
  duration: number;
}

export interface VideoReference {
  url: string;
  label: string;
  duration: number;
}

export interface DryRunResult {
  passed: boolean;
  characterCount: number;
  characterLimit: number;
  model: string;
  modelId: string;
  seedanceModelId?: string;
  generationMode?: 'reference_mode' | 'frame_mode';
  duration: number;
  frameCount: number;
  resolution: string;
  aspectRatio: string;
  referenceImageCount: number;
  referenceAudioCount: number;
  referenceVideoCount: number;
  totalReferenceDuration: number;
  estimatedCost: number;
  estimatedCostCny: number;
  estimatedTokens?: number;
  modelRateUsdPerMillionTokens?: number;
  pricingMode?: 'official_token_estimate_only';
  pricingEstimateOnly?: boolean;
  actualUsageRequiredForFinalBilling?: boolean;
  validationLog: string[];
  errors: string[];
  timestamp: string;
  requestPayload?: Record<string, unknown>;
  references?: {
    images: Array<{ role: string; url: string; label: string }>;
    videos: Array<{ role: string; url: string; label: string }>;
    audios: Array<{ role: string; url: string; label: string }>;
  };
}

export interface TaskHistory {
  id: string;
  status: string;
  prompt: string;
  costEstimate: number | null;
  modelType: string;
  resolution: string;
  duration: number;
  dryRunPassed: boolean;
  createdAt: string;
}

export interface BudgetInfo {
  monthlyLimit: number;
  spentThisMonth: number;
  currency: string;
  alertThreshold: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  promptFull: string;
  promptMini: string;
  hookText: string | null;
  animalType: string | null;
  biome: string | null;
  isFavorite: boolean;
}

export interface LatestVideo {
  videoFileName: string;
  videoUrl: string;
  createdAt: string;
  taskStatus: string;
}

export interface Gates {
  safeModeOff: boolean;
  dryRunPassed: boolean;
  promptWithinLimit: boolean;
  urlsValid: boolean;
  storyboardAcknowledged: boolean;
  audioRiskAcknowledged: boolean;
  videoRiskAcknowledged: boolean;
  budgetCheck: boolean;
  maxCostCheck: boolean;
  noDuplicate: boolean;
}

export type ModelType = 'full' | 'mini';

// ─── PHASE4: Official Seedance 2.0 model IDs ───
// These are the official BytePlus / ModelArk model IDs. The legacy
// ModelType ('full' | 'mini') is kept for backward compatibility with
// existing components; the new seedanceModelId is the canonical identifier
// used in payload validation and (future) real API calls.
export type SeedanceModelId =
  | 'dreamina-seedance-2-0-260128'        // Standard
  | 'dreamina-seedance-2-0-fast-260128'   // Fast
  | 'dreamina-seedance-2-0-mini-260615';  // Mini

// ─── PHASE4: Generation modes ───
// reference_mode: master image + storyboard + character/environment refs (WSTV default)
// frame_mode: exact first-frame / first+last-frame control (cannot mix with reference media)
export type GenerationMode = 'reference_mode' | 'frame_mode';

export interface PromptQualityScore {
  overall: number;
  structure: number;
  specificity: number;
  sensory: number;
  length: number;
  suggestions: string[];
}

export interface QuickPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  modelType: ModelType;
  resolution: string;
  duration: number;
  aspectRatio: string;
  promptTemplate: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface CostBreakdown {
  baseCost: number;
  resolutionMultiplier: number;
  durationCost: number;
  audioRefCost: number;
  videoRefCost: number;
  total: number;
  totalCny: number;
}

export interface VideoMetadata {
  filename: string;
  fileSize?: string;
  duration?: number;
  resolution?: string;
  codec?: string;
  createdAt: string;
}

// ─── Cost & Budget Types ───

export interface PricingModelData {
  id: string;
  name: string;
  modelId: string;
  userLabel: string | null;
  provider: string;
  pricingMode: string;
  rate480p: number;
  rate720p: number;
  rate1080p: number;
  rate4k: number;
  perVideoCost: number | null;
  supports480p: boolean;
  supports720p: boolean;
  supports1080p: boolean;
  supports4k: boolean;
  minDurationSec: number;
  maxDurationSec: number;
  supportedModes: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlanData {
  id: string;
  name: string;
  priceUsd: number;
  tokenAllowance: number;
  validityDays: number;
  provider: string;
  description: string | null;
  status: string;
  notes: string | null;
}

export interface SubscriptionPurchaseData {
  id: string;
  planId: string | null;
  planName: string;
  priceUsd: number;
  tokenAllowance: number;
  tokensUsed: number;
  purchaseDate: string;
  expiryDate: string;
  manualExpiryOverride: boolean;
  validityDays: number;
  provider: string;
  billingCurrency: string;
  status: string;
  notes: string | null;
}

export interface UsageRecordData {
  id: string;
  purchaseId: string | null;
  projectTitle: string | null;
  animalStoryName: string | null;
  pricingModelId: string | null;
  modelId: string;
  modelName: string;
  mode: string;
  width: number;
  height: number;
  fps: number;
  durationSeconds: number;
  videoCount: number;
  pricingMode: string;
  ratePerKTokens: number;
  estimatedTokens: number;
  estimatedCostUsd: number;
  actualTokens: number | null;
  actualCostUsd: number | null;
  status: string;
  notes: string | null;
  generatedAt: string | null;
  createdAt: string;
}

export interface ExchangeRateData {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  source: string;
  lastUpdated: string;
}

/** Single capacity entry — used in the Remaining Video Capacity grid. */
export interface CapacityEntryData {
  tokensPerVideo: number;
  videosRemaining: number;
  costUsdPerVideo: number;
  costJpyPerVideo: number | null;
  isEstimated: boolean;
  pricingNote: string;
  rateSource: string;
}

export interface BudgetSnapshotData {
  activePurchaseId: string | null;
  planName: string;
  priceUsd: number;
  tokenAllowance: number;
  tokensUsed: number;
  tokensRemaining: number;
  usdRemaining: number;
  purchaseDate: string;
  expiryDate: string;
  daysSincePurchase: number;
  daysUntilExpiry: number;
  totalDays: number;
  elapsedPct: number;
  dailyTokenPace: number;
  dailyUsdPace: number;
  monthlyUsdPace: number;
  safeDailyTokenBudget: number;
  safeDailyUsdBudget: number;
  estimatedVideosRemaining10s: number;
  estimatedVideosRemaining12s: number;
  estimatedVideosRemaining15s: number;
  estimatedVideosRemaining15s1080: number;
  // Extended capacity grid (3 resolutions × 3 durations)
  estimatedCapacity720p10s:  CapacityEntryData;
  estimatedCapacity720p12s:  CapacityEntryData;
  estimatedCapacity720p15s:  CapacityEntryData;
  estimatedCapacity1080p10s: CapacityEntryData;
  estimatedCapacity1080p12s: CapacityEntryData;
  estimatedCapacity1080p15s: CapacityEntryData;
  estimatedCapacity4k10s:    CapacityEntryData;
  estimatedCapacity4k12s:    CapacityEntryData;
  estimatedCapacity4k15s:    CapacityEntryData;
  paceWarning: boolean;
  budgetBadge: 'green' | 'yellow' | 'red';
  today: string;
  isExpired: boolean;
}

export interface DashboardSettingsData {
  safeMode: boolean;
  outputFolder: string;
  defaultFps: number;
  defaultModel: string;
  defaultResolution: string;
  intelligentModeWarning: boolean;
}

export type BudgetBadge = 'green' | 'yellow' | 'red';

// ─── Production Workflow Types ───

export interface WSTVPresetData {
  id: string;
  name: string;
  icon: string;
  category: string;
  promptTemplate: string;
  hookTemplate: string | null;
  structureNotes: string | null;
  safetyRules: string | null;
  captionStyle: string | null;
  hashtagStyle: string | null;
  defaultModel: string;
  defaultResolution: string;
  defaultDuration: number;
  defaultFps: number;
  animalType: string | null;
  biome: string | null;
  dangerType: string | null;
  emotionalBeat: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface PromptVersionData {
  id: string;
  projectId: string | null;
  versionLabel: string;
  promptText: string;
  modelType: string | null;
  resolution: string | null;
  duration: number | null;
  changeNote: string | null;
  performanceNote: string | null;
  isFinal: boolean;
  isRejected: boolean;
  createdAt: string;
}

export interface GenerationQAData {
  id: string;
  projectId: string | null;
  habitatCorrect: boolean | null;
  behaviorRealistic: boolean | null;
  movementPossible: boolean | null;
  scaleCorrect: boolean | null;
  seasonBelievable: boolean | null;
  predatorPreySafe: boolean | null;
  babyAgeBelievable: boolean | null;
  realismNotes: string | null;
  viralHookScore: number | null;
  mobileReadabilityScore: number | null;
  riskLevel: string;
  outputRating: number | null;
  outputNotes: string | null;
}

export interface RetryStrategyData {
  id: string;
  projectId: string | null;
  failureReason: string;
  suggestedFix: string;
  fixDetails: string | null;
  attempted: boolean;
  succeeded: boolean | null;
  notes: string | null;
}

// ─── Reference Asset Types ───

export interface ReferenceAssetData {
  id: string;
  projectId: string | null;
  assetType: string; // image, video, audio
  role: string;
  url: string;
  label: string | null;
  notes: string | null;
  isActive: boolean;
  sortOrder: number;
}

// ─── Unified Reference Entry (used in Generate tab, Workflow tab, and dry-run) ───

export interface ReferenceEntry {
  id: string;           // local temp ID (e.g., "img-0-1709...") or DB ID
  assetType: 'image' | 'video' | 'audio';
  role: string;         // main_identity, mother_animal, video_motion, audio_ambient, etc.
  url: string;
  label: string;
  notes: string;
  isActive: boolean;
  sortOrder: number;
  dbId?: string;        // if saved to DB, stores the real DB ID
}

/** Create an empty reference entry with defaults */
export function createEmptyReference(type: 'image' | 'video' | 'audio', index: number): ReferenceEntry {
  const roles = REFERENCE_ROLES[type];
  const defaultRole = roles[0]?.value ?? '';
  return {
    id: `${type}-${index}-${Date.now()}`,
    assetType: type,
    role: defaultRole,
    url: '',
    label: '',
    notes: '',
    isActive: true,
    sortOrder: index,
  };
}

/**
 * Remap image reference roles to match the active generation mode.
 *
 * Frame mode only accepts first_frame / last_frame image roles; reference mode
 * only accepts the reference-style roles (main_identity, etc.). Switching modes
 * used to leave roles untouched, which left images with a role that the target
 * mode rejects — so the payload builder silently dropped them (text-only output)
 * and the role dropdown rendered blank. This realigns image roles on every mode
 * switch so the payload always carries the image.
 *
 * Video/audio references are left untouched (they are hidden in frame mode and
 * surface again unchanged when reference mode is restored).
 */
export function remapReferenceRolesForMode(refs: ReferenceEntry[], mode: GenerationMode): ReferenceEntry[] {
  if (mode === 'frame_mode') {
    // First image → first_frame, every subsequent image → last_frame.
    let imageIndex = 0;
    return refs.map(r => {
      if (r.assetType !== 'image') return r;
      const desired = imageIndex === 0 ? 'first_frame' : 'last_frame';
      imageIndex += 1;
      return r.role === desired ? r : { ...r, role: desired };
    });
  }
  // reference_mode: any leftover frame role becomes the default reference role.
  const defaultImageRole = REFERENCE_ROLES.image[0]?.value ?? 'main_identity';
  return refs.map(r =>
    r.assetType === 'image' && FRAME_MODE_ROLES.has(r.role)
      ? { ...r, role: defaultImageRole }
      : r
  );
}

/** Derive active references grouped by type for dry-run payload */
export function groupReferencesByType(refs: ReferenceEntry[]) {
  const active = refs.filter(r => r.url.trim() !== '');
  return {
    images: active.filter(r => r.assetType === 'image').map(r => ({ role: r.role, url: r.url, label: r.label || r.role })),
    videos: active.filter(r => r.assetType === 'video').map(r => ({ role: r.role, url: r.url, label: r.label || r.role })),
    audios: active.filter(r => r.assetType === 'audio').map(r => ({ role: r.role, url: r.url, label: r.label || r.role })),
  };
}

export const REFERENCE_ROLES = {
  image: [
    // ─── Reference mode roles (WSTV default) ───
    // All of these map to "reference_image" in the official Seedance API payload.
    { value: 'main_identity', label: 'Main Identity Reference' },
    { value: 'mother_animal', label: 'Mother Animal Reference' },
    { value: 'baby_animal', label: 'Baby Animal Reference' },
    { value: 'environment', label: 'Environment Reference' },
    { value: 'camera_framing', label: 'Camera/Framing Reference' },
    { value: 'lighting_mood', label: 'Lighting/Mood Reference' },
    { value: 'extra_style', label: 'Extra Style/Scene Reference' },
    // ─── Frame mode roles (exact frame control) ───
    // These map to "first_frame" / "last_frame" in the official Seedance API payload.
    // Frame mode and reference mode CANNOT be mixed in one request.
    { value: 'first_frame', label: 'First Frame (Frame Mode)' },
    { value: 'last_frame', label: 'Last Frame (Frame Mode)' },
  ],
  video: [
    { value: 'video_motion', label: 'Motion/Style Reference' },
    { value: 'video_pacing', label: 'Pacing Reference' },
    { value: 'video_camera', label: 'Camera Movement Reference' },
  ],
  audio: [
    { value: 'audio_ambient', label: 'Ambient Sound Reference' },
    { value: 'audio_music', label: 'Music/Mood Reference' },
    { value: 'audio_voice', label: 'Voice/Narration Reference' },
  ],
} as const;

// ─── PHASE4: Frame-mode role set ───
// Roles that are ONLY allowed in frame_mode. Used for mode-conflict detection.
export const FRAME_MODE_ROLES = new Set(['first_frame', 'last_frame']);

// ─── PHASE4: Reference-mode role set ───
// Roles that are ONLY allowed in reference_mode. Used for mode-conflict detection.
// (WSTV internal roles like 'main_identity' all map to reference_image in the API.)
export const REFERENCE_MODE_INTERNAL_ROLES = new Set([
  'main_identity', 'mother_animal', 'baby_animal', 'environment',
  'camera_framing', 'lighting_mood', 'extra_style',
  'video_motion', 'video_pacing', 'video_camera',
  'audio_ambient', 'audio_music', 'audio_voice',
]);

/** Limits for each reference type */
export const REFERENCE_LIMITS = {
  image: 9,
  video: 3,
  audio: 3,
} as const;

// ─── Post-Production Types ───

export interface PostProductionData {
  id: string;
  projectId: string | null;
  rawDownloaded: boolean;
  bestClipSelected: boolean;
  trimmed: boolean;
  coverFrameSelected: boolean;
  colorAdjusted: boolean;
  soundChecked: boolean;
  captionAdded: boolean;
  exported1080p: boolean;
  uploadedToFacebook: boolean;
  performanceReviewed: boolean;
  coverTimestamp: string | null;
  coverEmotion: string | null;
  captionText: string | null;
  hashtags: string | null;
  browserModelUsed: string | null;
  browserOutputRating: number | null;
  browserVideoFileName: string | null;
  browserPostedUrl: string | null;
  plannedCost: number | null;
  generationCost: number | null;
  failedGenerationCost: number | null;
  retryCost: number | null;
  finalUsableVideoCost: number | null;
  notes: string | null;
}

export interface PerformanceRecordData {
  id: string;
  projectId: string | null;
  views: number | null;
  threeSecRetention: number | null;
  avgWatchTime: number | null;
  shares: number | null;
  comments: number | null;
  saves: number | null;
  negativeComments: number | null;
  bestComment: string | null;
  reasonWorked: string | null;
  reasonFailed: string | null;
  postedAt: string | null;
}

export interface ViralLearningData {
  id: string;
  category: string;
  value: string;
  performanceScore: number | null;
  occurrenceCount: number;
  avgViews: number | null;
  avgRetention: number | null;
  notes: string | null;
}

export interface ProviderComparisonData {
  id: string;
  provider: string;
  category: string;
  rating: number | null;
  notes: string | null;
}

export interface ContentCalendarData {
  id: string;
  scheduledDate: string;
  projectTitle: string | null;
  animalStoryName: string | null;
  status: string;
  presetId: string | null;
  notes: string | null;
}

export interface DuplicateCheckData {
  id: string;
  newProjectTitle: string;
  newAnimal: string | null;
  newLocation: string | null;
  newDanger: string | null;
  newEnding: string | null;
  newEmotionalBeat: string | null;
  matchedProjectId: string | null;
  similarityScore: number | null;
  warningMessage: string | null;
}

// ─── Constants ───

export const CALENDAR_STATUSES = [
  { value: 'idea', label: 'Idea', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  { value: 'master_image', label: 'Master Image', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'storyboard', label: 'Storyboard', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'prompted', label: 'Prompted', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'generated', label: 'Generated', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'capcut_edit', label: 'CapCut Edit', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { value: 'posted', label: 'Posted', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'reviewed', label: 'Reviewed', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
] as const;

export const FAILURE_REASONS = [
  { value: 'identity_drift', label: 'Identity Drift' },
  { value: 'wrong_animal', label: 'Wrong Animal' },
  { value: 'bad_anatomy', label: 'Bad Anatomy' },
  { value: 'unreadable_action', label: 'Unreadable Action' },
  { value: 'too_much_violence', label: 'Too Much Violence' },
  { value: 'camera_confusion', label: 'Camera Confusion' },
  { value: 'bad_ending', label: 'Bad Ending' },
  { value: 'wrong_environment', label: 'Wrong Environment' },
  { value: 'storyboard_ignored', label: 'Storyboard Ignored' },
] as const;

export const RETRY_FIXES = [
  { value: 'simplify_prompt', label: 'Simplify Prompt' },
  { value: 'reduce_animal_contact', label: 'Reduce Animal Contact' },
  { value: 'strengthen_identity_lock', label: 'Strengthen Identity Lock' },
  { value: 'change_camera_angle', label: 'Change Camera Angle' },
  { value: 'use_master_image_only', label: 'Use Master Image Only' },
  { value: 'use_storyboard_only', label: 'Use Storyboard Only' },
  { value: 'split_10s_5s', label: 'Split into 10s + 5s' },
] as const;

export const OUTPUT_RATINGS = [
  { value: 1, label: '1 - Unusable', color: 'text-red-400' },
  { value: 2, label: '2 - Bad', color: 'text-red-300' },
  { value: 3, label: '3 - Needs Edit', color: 'text-amber-400' },
  { value: 4, label: '4 - Usable', color: 'text-emerald-400' },
  { value: 5, label: '5 - Strong', color: 'text-emerald-300' },
  { value: 6, label: '6 - Viral Candidate', color: 'text-green-300' },
] as const;
