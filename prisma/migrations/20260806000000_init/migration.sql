-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "VideoTask" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "modelType" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "resolution" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "aspectRatio" TEXT NOT NULL,
    "masterImageUrl" TEXT,
    "storyboardImageUrl" TEXT,
    "audioUrl1" TEXT,
    "audioUrl2" TEXT,
    "audioUrl3" TEXT,
    "videoUrl1" TEXT,
    "videoUrl2" TEXT,
    "videoUrl3" TEXT,
    "audioRiskAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "videoRiskAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "taskId" TEXT,
    "videoUrl" TEXT,
    "videoFileName" TEXT,
    "providerResultVideoUrl" TEXT,
    "providerLastFrameUrl" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "pollCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "costEstimate" DOUBLE PRECISION,
    "costActual" DOUBLE PRECISION,
    "actualTokens" INTEGER,
    "actualBillingStatus" TEXT,
    "safetyPassed" BOOLEAN NOT NULL DEFAULT false,
    "safetyWarnings" TEXT,
    "dryRunPassed" BOOLEAN NOT NULL DEFAULT false,
    "dryRunResult" TEXT,
    "paidConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "maxCostUsd" DOUBLE PRECISION,
    "outputFilename" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "promptFull" TEXT NOT NULL,
    "promptMini" TEXT NOT NULL,
    "hookText" TEXT,
    "animalType" TEXT,
    "biome" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetSetting" (
    "id" TEXT NOT NULL,
    "monthlyLimit" DOUBLE PRECISION NOT NULL,
    "spentThisMonth" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "alertThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostLedger" (
    "id" TEXT NOT NULL,
    "taskId" TEXT,
    "modelType" TEXT NOT NULL,
    "resolution" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "costUsd" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenPack" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokensTotal" INTEGER NOT NULL,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DOUBLE PRECISION NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'byteplus',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardSettings" (
    "id" TEXT NOT NULL,
    "safeMode" BOOLEAN NOT NULL DEFAULT true,
    "outputFolder" TEXT NOT NULL DEFAULT 'outputs',
    "defaultFps" INTEGER NOT NULL DEFAULT 24,
    "defaultModel" TEXT NOT NULL DEFAULT 'seedance-2.0',
    "defaultResolution" TEXT NOT NULL DEFAULT '720p',
    "intelligentModeWarning" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingModel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "userLabel" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'byteplus',
    "pricingMode" TEXT NOT NULL DEFAULT 'token-based',
    "rate480p" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rate720p" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rate1080p" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rate4k" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "perVideoCost" DOUBLE PRECISION,
    "supports480p" BOOLEAN NOT NULL DEFAULT true,
    "supports720p" BOOLEAN NOT NULL DEFAULT true,
    "supports1080p" BOOLEAN NOT NULL DEFAULT true,
    "supports4k" BOOLEAN NOT NULL DEFAULT false,
    "minDurationSec" INTEGER NOT NULL DEFAULT 4,
    "maxDurationSec" INTEGER NOT NULL DEFAULT 15,
    "supportedModes" TEXT NOT NULL DEFAULT 'text-to-video,first-frame,first-and-last-frame,reference,extension',
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceUsd" DOUBLE PRECISION NOT NULL,
    "tokenAllowance" INTEGER NOT NULL,
    "validityDays" INTEGER NOT NULL DEFAULT 90,
    "provider" TEXT NOT NULL DEFAULT 'byteplus',
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPurchase" (
    "id" TEXT NOT NULL,
    "planId" TEXT,
    "planName" TEXT NOT NULL,
    "priceUsd" DOUBLE PRECISION NOT NULL,
    "tokenAllowance" INTEGER NOT NULL,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "manualExpiryOverride" BOOLEAN NOT NULL DEFAULT false,
    "validityDays" INTEGER NOT NULL DEFAULT 90,
    "provider" TEXT NOT NULL DEFAULT 'byteplus',
    "billingCurrency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoCostEstimate" (
    "id" TEXT NOT NULL,
    "usageRecordId" TEXT,
    "pricingModelId" TEXT,
    "modelId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'text-to-video',
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "fps" INTEGER NOT NULL DEFAULT 24,
    "durationSeconds" INTEGER NOT NULL,
    "videoCount" INTEGER NOT NULL DEFAULT 1,
    "pricingMode" TEXT NOT NULL DEFAULT 'token-based',
    "ratePerKTokens" DOUBLE PRECISION NOT NULL,
    "estimatedTokens" INTEGER NOT NULL,
    "estimatedCostUsd" DOUBLE PRECISION NOT NULL,
    "actualTokens" INTEGER,
    "actualCostUsd" DOUBLE PRECISION,
    "jpyExchangeRate" DOUBLE PRECISION,
    "estimatedCostJpy" DOUBLE PRECISION,
    "actualCostJpy" DOUBLE PRECISION,
    "intelligentMode" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoCostEstimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageRecord" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT,
    "projectTitle" TEXT,
    "animalStoryName" TEXT,
    "pricingModelId" TEXT,
    "modelId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'text-to-video',
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "fps" INTEGER NOT NULL DEFAULT 24,
    "durationSeconds" INTEGER NOT NULL,
    "videoCount" INTEGER NOT NULL DEFAULT 1,
    "pricingMode" TEXT NOT NULL DEFAULT 'token-based',
    "ratePerKTokens" DOUBLE PRECISION NOT NULL,
    "estimatedTokens" INTEGER NOT NULL,
    "estimatedCostUsd" DOUBLE PRECISION NOT NULL,
    "actualTokens" INTEGER,
    "actualCostUsd" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "notes" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRateSetting" (
    "id" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL DEFAULT 'USD',
    "toCurrency" TEXT NOT NULL DEFAULT 'JPY',
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 149.5,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeRateSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WSTVPreset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '🎬',
    "category" TEXT NOT NULL DEFAULT 'wildlife',
    "promptTemplate" TEXT NOT NULL,
    "hookTemplate" TEXT,
    "structureNotes" TEXT,
    "safetyRules" TEXT,
    "captionStyle" TEXT,
    "hashtagStyle" TEXT,
    "defaultModel" TEXT NOT NULL DEFAULT 'seedance-2.0',
    "defaultResolution" TEXT NOT NULL DEFAULT '720p',
    "defaultDuration" INTEGER NOT NULL DEFAULT 15,
    "defaultFps" INTEGER NOT NULL DEFAULT 24,
    "animalType" TEXT,
    "biome" TEXT,
    "dangerType" TEXT,
    "emotionalBeat" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WSTVPreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptVersion" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "versionLabel" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "modelType" TEXT,
    "resolution" TEXT,
    "duration" INTEGER,
    "changeNote" TEXT,
    "performanceNote" TEXT,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "isRejected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationQA" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "habitatCorrect" BOOLEAN,
    "behaviorRealistic" BOOLEAN,
    "movementPossible" BOOLEAN,
    "scaleCorrect" BOOLEAN,
    "seasonBelievable" BOOLEAN,
    "predatorPreySafe" BOOLEAN,
    "babyAgeBelievable" BOOLEAN,
    "realismNotes" TEXT,
    "viralHookScore" INTEGER,
    "hookInstantDanger" BOOLEAN,
    "hookEmotionalClarity" BOOLEAN,
    "hookAnimalReadable" BOOLEAN,
    "hookUnusualMoment" BOOLEAN,
    "hookCuriosityGap" BOOLEAN,
    "hookNoConfusingSetup" BOOLEAN,
    "hookNoSlowOpening" BOOLEAN,
    "mobileReadabilityScore" INTEGER,
    "mobileSubjectSize" BOOLEAN,
    "mobileFullBodyVisible" BOOLEAN,
    "mobileFaceVisible" BOOLEAN,
    "mobileActionClear" BOOLEAN,
    "mobileNoTinyAnimals" BOOLEAN,
    "mobileVerticalFraming" BOOLEAN,
    "mobilePayoffReadable" BOOLEAN,
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "riskMultipleAnimals" BOOLEAN NOT NULL DEFAULT false,
    "riskFastMotion" BOOLEAN NOT NULL DEFAULT false,
    "riskWaterPhysics" BOOLEAN NOT NULL DEFAULT false,
    "riskRainStorm" BOOLEAN NOT NULL DEFAULT false,
    "riskSnow" BOOLEAN NOT NULL DEFAULT false,
    "riskFurRealism" BOOLEAN NOT NULL DEFAULT false,
    "riskBabyAnimalScale" BOOLEAN NOT NULL DEFAULT false,
    "riskPredatorPreyContact" BOOLEAN NOT NULL DEFAULT false,
    "riskComplexRescue" BOOLEAN NOT NULL DEFAULT false,
    "riskNotes" TEXT,
    "outputRating" INTEGER,
    "outputNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GenerationQA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetryStrategy" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "failureReason" TEXT NOT NULL,
    "suggestedFix" TEXT NOT NULL,
    "fixDetails" TEXT,
    "attempted" BOOLEAN NOT NULL DEFAULT false,
    "succeeded" BOOLEAN,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetryStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceAsset" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "assetType" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferenceAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostProduction" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "rawDownloaded" BOOLEAN NOT NULL DEFAULT false,
    "bestClipSelected" BOOLEAN NOT NULL DEFAULT false,
    "trimmed" BOOLEAN NOT NULL DEFAULT false,
    "coverFrameSelected" BOOLEAN NOT NULL DEFAULT false,
    "colorAdjusted" BOOLEAN NOT NULL DEFAULT false,
    "soundChecked" BOOLEAN NOT NULL DEFAULT false,
    "captionAdded" BOOLEAN NOT NULL DEFAULT false,
    "exported1080p" BOOLEAN NOT NULL DEFAULT false,
    "uploadedToFacebook" BOOLEAN NOT NULL DEFAULT false,
    "performanceReviewed" BOOLEAN NOT NULL DEFAULT false,
    "coverTimestamp" TEXT,
    "coverEmotion" TEXT,
    "coverAnimalFaceVisible" BOOLEAN,
    "coverDangerVisible" BOOLEAN,
    "coverNoBlur" BOOLEAN,
    "coverStrongThumbnail" BOOLEAN,
    "coverNotes" TEXT,
    "captionText" TEXT,
    "captionUnder150Chars" BOOLEAN,
    "captionAmericanEnglish" BOOLEAN,
    "captionEmotionallyStrong" BOOLEAN,
    "captionNoClickbait" BOOLEAN,
    "hashtags" TEXT,
    "hashtagCount5" BOOLEAN,
    "hashtagsUsaRelevant" BOOLEAN,
    "hashtagsNoRepeat" BOOLEAN,
    "browserModelUsed" TEXT,
    "browserPromptUsed" TEXT,
    "browserRefImagesUsed" TEXT,
    "browserEstimatedCost" DOUBLE PRECISION,
    "browserActualCost" DOUBLE PRECISION,
    "browserOutputRating" INTEGER,
    "browserVideoFileName" TEXT,
    "browserCapCutStatus" TEXT,
    "browserPostedUrl" TEXT,
    "plannedCost" DOUBLE PRECISION,
    "generationCost" DOUBLE PRECISION,
    "failedGenerationCost" DOUBLE PRECISION,
    "retryCost" DOUBLE PRECISION,
    "finalUsableVideoCost" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostProduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceRecord" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "views" INTEGER,
    "threeSecRetention" DOUBLE PRECISION,
    "avgWatchTime" DOUBLE PRECISION,
    "shares" INTEGER,
    "comments" INTEGER,
    "saves" INTEGER,
    "negativeComments" INTEGER,
    "bestComment" TEXT,
    "reasonWorked" TEXT,
    "reasonFailed" TEXT,
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ViralLearning" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "performanceScore" DOUBLE PRECISION,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "avgViews" DOUBLE PRECISION,
    "avgRetention" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ViralLearning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderComparison" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "rating" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderComparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentCalendar" (
    "id" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "projectTitle" TEXT,
    "animalStoryName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'idea',
    "presetId" TEXT,
    "promptVersionId" TEXT,
    "qaId" TEXT,
    "postProductionId" TEXT,
    "performanceId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuplicateCheck" (
    "id" TEXT NOT NULL,
    "newProjectTitle" TEXT NOT NULL,
    "newAnimal" TEXT,
    "newLocation" TEXT,
    "newDanger" TEXT,
    "newEnding" TEXT,
    "newEmotionalBeat" TEXT,
    "matchedProjectId" TEXT,
    "similarityScore" DOUBLE PRECISION,
    "warningMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DuplicateCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageTask" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'byteplus',
    "modelId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "referenceImageCount" INTEGER NOT NULL DEFAULT 0,
    "size" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "outputFormat" TEXT NOT NULL,
    "watermark" BOOLEAN NOT NULL DEFAULT false,
    "optimizeMode" TEXT NOT NULL,
    "estimatedInputCostUsd" DOUBLE PRECISION NOT NULL,
    "estimatedOutputCostUsd" DOUBLE PRECISION NOT NULL,
    "estimatedTotalCostUsd" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRY_RUN',
    "dryRunRequestJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageTask_pkey" PRIMARY KEY ("id")
);
