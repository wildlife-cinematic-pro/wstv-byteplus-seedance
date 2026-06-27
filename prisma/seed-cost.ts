/**
 * WSTV Seedance Cost & Budget Tracker - Seed Data
 * 
 * Seeds:
 * - 3 Pricing Models (Seedance 2.0, Mini, Fast)
 * - 3 Subscription Plans (Light, Production, Premium)
 * - 1 Light Plan Purchase (2026-06-16, $30.10, 7M tokens, 90 days)
 * - 2 Existing Usage Records (15s 720p vertical, Seedance 2.0)
 * - 1 Exchange Rate Setting (USD→JPY)
 * - Dashboard Settings
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding WSTV Cost & Budget data...');

  // ─── Pricing Models ───
  
  const seedance20 = await prisma.pricingModel.upsert({
    where: { id: 'pricing-seedance-2-0' },
    update: {},
    create: {
      id: 'pricing-seedance-2-0',
      name: 'Seedance 2.0',
      modelId: 'dreamina-seedance-2-0-260128',
      userLabel: 'seedance2.0 260128',
      provider: 'byteplus',
      pricingMode: 'token-based',
      rate480p: 0.007,
      rate720p: 0.007,
      rate1080p: 0.0077,
      rate4k: 0.004,
      supports480p: true,
      supports720p: true,
      supports1080p: true,
      supports4k: true,
      minDurationSec: 4,
      maxDurationSec: 15,
      supportedModes: 'text-to-video,first-frame,first-and-last-frame,reference,extension',
      status: 'active',
      notes: 'Main Seedance 2.0 model via BytePlus/ByteDance/Dreamina',
    },
  });

  const seedanceMini = await prisma.pricingModel.upsert({
    where: { id: 'pricing-seedance-mini' },
    update: {},
    create: {
      id: 'pricing-seedance-mini',
      name: 'Seedance 2.0 Mini',
      modelId: 'seedance-2.0-mini',
      userLabel: 'seedance2.0 mini',
      provider: 'byteplus',
      pricingMode: 'token-based',
      rate480p: 0.0035,
      rate720p: 0.0035,
      rate1080p: 0,
      rate4k: 0,
      supports480p: true,
      supports720p: true,
      supports1080p: false,
      supports4k: false,
      minDurationSec: 4,
      maxDurationSec: 15,
      supportedModes: 'text-to-video,first-frame,reference',
      status: 'active',
      notes: 'Lightweight Seedance 2.0 Mini. 1080p and 4K not supported unless manually enabled.',
    },
  });

  const seedanceFast = await prisma.pricingModel.upsert({
    where: { id: 'pricing-seedance-fast' },
    update: {},
    create: {
      id: 'pricing-seedance-fast',
      name: 'Seedance 2.0 Fast',
      modelId: 'seedance-2.0-fast',
      userLabel: 'seedance2.0 fast',
      provider: 'byteplus',
      pricingMode: 'manual',
      rate480p: 0,
      rate720p: 0,
      rate1080p: 0,
      rate4k: 0,
      supports480p: true,
      supports720p: true,
      supports1080p: true,
      supports4k: false,
      minDurationSec: 4,
      maxDurationSec: 15,
      supportedModes: 'text-to-video,first-frame,reference',
      status: 'optional',
      notes: 'Fast model with unknown pricing. Use manual/per-video pricing mode. Edit rates in settings.',
    },
  });

  console.log('✅ Pricing models seeded:', seedance20.id, seedanceMini.id, seedanceFast.id);

  // ─── Subscription Plans ───
  
  const lightPlan = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-light' },
    update: {},
    create: {
      id: 'plan-light',
      name: 'Light Plan',
      priceUsd: 30.10,
      tokenAllowance: 7000000,
      validityDays: 90,
      provider: 'byteplus',
      description: 'Light resource pack — 7M tokens, 90 days validity',
      status: 'active',
    },
  });

  const productionPlan = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-production' },
    update: {},
    create: {
      id: 'plan-production',
      name: 'Production Plan',
      priceUsd: 43.00,
      tokenAllowance: 10000000,
      validityDays: 90,
      provider: 'byteplus',
      description: 'Production resource pack — 10M tokens, 90 days validity',
      status: 'active',
    },
  });

  const premiumPlan = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-premium' },
    update: {},
    create: {
      id: 'plan-premium',
      name: 'Premium Plan',
      priceUsd: 55.90,
      tokenAllowance: 13000000,
      validityDays: 90,
      provider: 'byteplus',
      description: 'Premium resource pack — 13M tokens, 90 days validity',
      status: 'active',
    },
  });

  console.log('✅ Subscription plans seeded:', lightPlan.id, productionPlan.id, premiumPlan.id);

  // ─── Subscription Purchase (Light Plan) ───
  // Purchase date: 2026-06-16, Validity: 90 days, Expiry: 2026-09-14
  
  const purchaseDate = new Date('2026-06-16T00:00:00.000Z');
  const expiryDate = new Date(purchaseDate);
  expiryDate.setDate(expiryDate.getDate() + 90); // 2026-09-14

  // Calculate tokens used from the 2 existing videos
  // Each: 720 * 1280 * 24 * 15 / 1024 = 324,000 tokens per video
  // Total: 648,000 tokens
  const tokensPerVideo = Math.round((720 * 1280 * 24 * 15) / 1024); // 324000
  const totalTokensUsed = tokensPerVideo * 2; // 648000

  const lightPurchase = await prisma.subscriptionPurchase.upsert({
    where: { id: 'purchase-light-001' },
    update: {},
    create: {
      id: 'purchase-light-001',
      planId: lightPlan.id,
      planName: 'Light Plan',
      priceUsd: 30.10,
      tokenAllowance: 7000000,
      tokensUsed: totalTokensUsed,
      purchaseDate: purchaseDate,
      expiryDate: expiryDate,
      manualExpiryOverride: false,
      validityDays: 90,
      provider: 'byteplus',
      billingCurrency: 'USD',
      status: 'active',
      notes: 'Bought Seedance 2.0 plan on June 16. 2 videos already generated.',
    },
  });

  console.log('✅ Subscription purchase seeded:', lightPurchase.id);
  console.log(`   Purchase: ${purchaseDate.toISOString().split('T')[0]}`);
  console.log(`   Expiry: ${expiryDate.toISOString().split('T')[0]}`);
  console.log(`   Tokens used: ${totalTokensUsed.toLocaleString()} of 7,000,000`);

  // ─── Usage Records (2 existing 15s 720p videos) ───
  
  const ratePerK = 0.007; // Seedance 2.0 720p rate
  const costPerVideo = (tokensPerVideo / 1000) * ratePerK; // $2.268

  const usage1 = await prisma.usageRecord.upsert({
    where: { id: 'usage-existing-001' },
    update: {},
    create: {
      id: 'usage-existing-001',
      purchaseId: lightPurchase.id,
      projectTitle: 'WSTV Wildlife Reel #1',
      animalStoryName: 'Tiger Hunt Sequence',
      pricingModelId: seedance20.id,
      modelId: 'dreamina-seedance-2-0-260128',
      modelName: 'Seedance 2.0',
      mode: 'text-to-video',
      width: 720,
      height: 1280,
      fps: 24,
      durationSeconds: 15,
      videoCount: 1,
      pricingMode: 'token-based',
      ratePerKTokens: ratePerK,
      estimatedTokens: tokensPerVideo,
      estimatedCostUsd: costPerVideo,
      actualTokens: tokensPerVideo,
      actualCostUsd: costPerVideo,
      status: 'generated-manually',
      notes: 'First WSTV test video — generated externally and recorded manually',
      generatedAt: new Date('2026-06-16T10:30:00.000Z'),
      createdAt: new Date('2026-06-16T10:30:00.000Z'),
    },
  });

  const usage2 = await prisma.usageRecord.upsert({
    where: { id: 'usage-existing-002' },
    update: {},
    create: {
      id: 'usage-existing-002',
      purchaseId: lightPurchase.id,
      projectTitle: 'WSTV Wildlife Reel #2',
      animalStoryName: 'Eagle Flight Sequence',
      pricingModelId: seedance20.id,
      modelId: 'dreamina-seedance-2-0-260128',
      modelName: 'Seedance 2.0',
      mode: 'text-to-video',
      width: 720,
      height: 1280,
      fps: 24,
      durationSeconds: 15,
      videoCount: 1,
      pricingMode: 'token-based',
      ratePerKTokens: ratePerK,
      estimatedTokens: tokensPerVideo,
      estimatedCostUsd: costPerVideo,
      actualTokens: tokensPerVideo,
      actualCostUsd: costPerVideo,
      status: 'generated-manually',
      notes: 'Second WSTV test video — generated externally and recorded manually',
      generatedAt: new Date('2026-06-16T14:20:00.000Z'),
      createdAt: new Date('2026-06-16T14:20:00.000Z'),
    },
  });

  console.log('✅ Usage records seeded:', usage1.id, usage2.id);
  console.log(`   Each video: ${tokensPerVideo.toLocaleString()} tokens = $${costPerVideo.toFixed(4)}`);

  // ─── Video Cost Estimates (for the 2 existing videos) ───
  
  await prisma.videoCostEstimate.upsert({
    where: { id: 'estimate-existing-001' },
    update: {},
    create: {
      id: 'estimate-existing-001',
      usageRecordId: usage1.id,
      pricingModelId: seedance20.id,
      modelId: 'dreamina-seedance-2-0-260128',
      modelName: 'Seedance 2.0',
      mode: 'text-to-video',
      width: 720,
      height: 1280,
      fps: 24,
      durationSeconds: 15,
      videoCount: 1,
      pricingMode: 'token-based',
      ratePerKTokens: ratePerK,
      estimatedTokens: tokensPerVideo,
      estimatedCostUsd: costPerVideo,
      actualTokens: tokensPerVideo,
      actualCostUsd: costPerVideo,
      jpyExchangeRate: 149.5,
      estimatedCostJpy: costPerVideo * 149.5,
      actualCostJpy: costPerVideo * 149.5,
      intelligentMode: false,
    },
  });

  await prisma.videoCostEstimate.upsert({
    where: { id: 'estimate-existing-002' },
    update: {},
    create: {
      id: 'estimate-existing-002',
      usageRecordId: usage2.id,
      pricingModelId: seedance20.id,
      modelId: 'dreamina-seedance-2-0-260128',
      modelName: 'Seedance 2.0',
      mode: 'text-to-video',
      width: 720,
      height: 1280,
      fps: 24,
      durationSeconds: 15,
      videoCount: 1,
      pricingMode: 'token-based',
      ratePerKTokens: ratePerK,
      estimatedTokens: tokensPerVideo,
      estimatedCostUsd: costPerVideo,
      actualTokens: tokensPerVideo,
      actualCostUsd: costPerVideo,
      jpyExchangeRate: 149.5,
      estimatedCostJpy: costPerVideo * 149.5,
      actualCostJpy: costPerVideo * 149.5,
      intelligentMode: false,
    },
  });

  console.log('✅ Video cost estimates seeded');

  // ─── Exchange Rate Setting ───
  
  const exchangeRate = await prisma.exchangeRateSetting.upsert({
    where: { id: 'exchange-rate-usd-jpy' },
    update: {},
    create: {
      id: 'exchange-rate-usd-jpy',
      fromCurrency: 'USD',
      toCurrency: 'JPY',
      rate: 149.5,
      source: 'manual',
    },
  });

  console.log('✅ Exchange rate seeded:', `${exchangeRate.fromCurrency}→${exchangeRate.toCurrency} @ ${exchangeRate.rate}`);

  // ─── Dashboard Settings (ensure exists) ───
  
  const existingSettings = await prisma.dashboardSettings.findFirst();
  if (!existingSettings) {
    await prisma.dashboardSettings.create({
      data: {
        safeMode: true,
        outputFolder: '/Users/acharyabimal/Movies/WSTV/SeedanceVideos',
        defaultFps: 24,
        defaultModel: 'seedance-2.0',
        defaultResolution: '720p',
        intelligentModeWarning: true,
      },
    });
    console.log('✅ Dashboard settings created');
  } else {
    console.log('ℹ️ Dashboard settings already exist, skipping');
  }

  // ─── Budget Setting (ensure exists) ───
  
  const existingBudget = await prisma.budgetSetting.findFirst();
  if (!existingBudget) {
    await prisma.budgetSetting.create({
      data: {
        monthlyLimit: 50,
        spentThisMonth: costPerVideo * 2,
        currency: 'USD',
        alertThreshold: 0.8,
      },
    });
    console.log('✅ Budget settings created');
  } else {
    console.log('ℹ️ Budget settings already exist, skipping');
  }

  console.log('\n🎉 Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Pricing Models: 3 (Seedance 2.0, Mini, Fast)`);
  console.log(`Subscription Plans: 3 (Light $30.10, Production $43.00, Premium $55.90)`);
  console.log(`Active Purchase: Light Plan @ $30.10 (7M tokens, 90 days)`);
  console.log(`  Purchase Date: 2026-06-16`);
  console.log(`  Expiry Date: ${expiryDate.toISOString().split('T')[0]}`);
  console.log(`  Tokens Used: ${totalTokensUsed.toLocaleString()} (2 videos × ${tokensPerVideo.toLocaleString()})`);
  console.log(`  Tokens Remaining: ${(7000000 - totalTokensUsed).toLocaleString()}`);
  console.log(`Usage Records: 2 (15s 720p vertical, Seedance 2.0)`);
  console.log(`Exchange Rate: 1 USD = 149.5 JPY`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
