'use client';

import { useMemo, useState } from 'react';
import { CreditCard, AlertTriangle, CheckCircle2, Info, ChevronDown, ChevronRight, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  WSTV_ACTIVE_PACK,
  RESOURCE_PACK_BILLING_RULES,
  SEEDANCE_MODEL_IDS,
  MODEL_METADATA,
  getDeductionRatio,
  estimateResourcePackTokensDeducted,
  checkPackCompatibility,
} from '@/lib/seedance-validation';
import { calculateTokens } from '@/lib/pricing';

interface ResourcePackBillingPanelProps {
  seedanceModelId: string;
  resolution: string;
  duration: number;
  references: { videos: { url: string }[] };
}

export function ResourcePackBillingPanel({
  seedanceModelId,
  resolution,
  duration,
  references,
}: ResourcePackBillingPanelProps) {
  const [showRules, setShowRules] = useState(false);
  const [showDeduction, setShowDeduction] = useState(false);

  const hasVideoInput = references.videos.some(r => r.url.trim());
  const modelMeta = MODEL_METADATA[seedanceModelId] ?? MODEL_METADATA[SEEDANCE_MODEL_IDS.STANDARD];

  // Resolution → width/height mapping for 9:16 vertical
  const resToWH: Record<string, { w: number; h: number }> = {
    '480p':  { w: 480,  h: 854  },
    '720p':  { w: 720,  h: 1280 },
    '1080p': { w: 1080, h: 1920 },
    '4k':    { w: 2160, h: 3840 },
  };
  const wh = resToWH[resolution.toLowerCase()] ?? resToWH['720p'];

  // Compute estimated model tokens (skip if auto duration)
  const estimatedModelTokens = duration === -1 ? 0 : calculateTokens(wh.w, wh.h, 24, duration, 1);

  // Compute deduction
  const deduction = useMemo(() => estimateResourcePackTokensDeducted({
    estimatedModelTokens,
    modelId: seedanceModelId,
    resolution,
    hasVideoInput,
  }), [estimatedModelTokens, seedanceModelId, resolution, hasVideoInput]);

  // Check pack compatibility
  const compatibility = useMemo(() => checkPackCompatibility({
    packModelTier: WSTV_ACTIVE_PACK.modelTier,
    selectedModelId: seedanceModelId,
  }), [seedanceModelId]);

  return (
    <Card className="bg-[oklch(0.18_0.03_155)] border-blue-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          <CreditCard className="w-5 h-5 text-blue-400" />
          Official Resource Pack Billing / Deduction Rules
        </CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400 bg-blue-500/10">
            PHASE5 — Billing reference
          </Badge>
          <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
            Official BytePlus deduction ratios
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* WSTV Active Pack card */}
        <div className="p-4 rounded-lg bg-[oklch(0.15_0.02_155)] border border-emerald-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-emerald-400">WSTV Active Pack</p>
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
              {WSTV_ACTIVE_PACK.packType}
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-gray-500 text-[10px]">Model pack</p>
              <p className="text-gray-300">{WSTV_ACTIVE_PACK.packName}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px]">Purchased</p>
              <p className="text-gray-300">{WSTV_ACTIVE_PACK.purchasedPacks} × 1M token packs</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px]">Total quota</p>
              <p className="text-emerald-400 font-mono">{WSTV_ACTIVE_PACK.totalQuota.toLocaleString()} tokens</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px]">Paid</p>
              <p className="text-gray-300">${WSTV_ACTIVE_PACK.paidUsd.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px]">Purchase date</p>
              <p className="text-gray-300">{WSTV_ACTIVE_PACK.purchaseDate}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px]">Expiry date</p>
              <p className="text-gray-300">{WSTV_ACTIVE_PACK.expiryDate}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px]">Validity</p>
              <p className="text-gray-300">{WSTV_ACTIVE_PACK.validityDays} days</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px]">Pack type</p>
              <p className="text-gray-300">{WSTV_ACTIVE_PACK.packType}</p>
            </div>
          </div>
          {/* Standard pack warning */}
          <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/30">
            <p className="text-[11px] text-amber-400 flex items-start gap-1.5">
              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
              <span>Your current 7M pack is Standard Seedance 2.0 pack. Do not assume this quota deducts Fast or Mini usage.</span>
            </p>
          </div>
        </div>

        {/* Billing rules (collapsible) */}
        <Collapsible open={showRules} onOpenChange={setShowRules}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between px-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/5">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span className="text-sm font-medium">Billing Rules (8 items)</span>
              </span>
              {showRules ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="space-y-1">
              {RESOURCE_PACK_BILLING_RULES.map((rule, i) => (
                <div key={i} className="flex items-start gap-2 p-1.5 rounded bg-[oklch(0.15_0.02_155)] border border-blue-500/10">
                  <span className="text-blue-400 font-mono text-[10px] shrink-0">{i + 1}.</span>
                  <span className="text-xs text-gray-300">{rule}</span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Deduction calculator (collapsible) */}
        <Collapsible open={showDeduction} onOpenChange={setShowDeduction}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between px-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/5">
              <span className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                <span className="text-sm font-medium">Deduction Calculator (current settings)</span>
              </span>
              {showDeduction ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="p-3 rounded-md bg-[oklch(0.15_0.02_155)] border border-emerald-500/10 space-y-3">
              {/* Current settings summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <p className="text-gray-500 text-[10px]">Selected model</p>
                  <p className="text-gray-300">{modelMeta.shortLabel}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px]">Resolution</p>
                  <p className="text-gray-300">{resolution}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px]">Duration</p>
                  <p className="text-gray-300">{duration === -1 ? 'auto (-1)' : `${duration}s`}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px]">Video input</p>
                  <p className={hasVideoInput ? 'text-emerald-400' : 'text-amber-400'}>
                    {hasVideoInput ? 'Yes — official video-input ratio' : 'No — higher no-video deduction ratio may apply'}
                  </p>
                </div>
              </div>

              {/* Deduction breakdown */}
              {duration !== -1 ? (
                <>
                  <div className="space-y-1.5 text-xs border-t border-gray-700/40 pt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">estimated_model_tokens <span className="text-gray-600">(local estimate)</span></span>
                      <span className="text-gray-300 font-mono">{estimatedModelTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">deduction_ratio <span className="text-gray-600">(official)</span></span>
                      <span className="text-blue-400 font-mono">{deduction.ratio.toFixed(4)}×</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">unit price <span className="text-gray-600">(official USD / K tokens)</span></span>
                      <span className="text-blue-400 font-mono">${deduction.unitPriceUsdPerKTokens.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">estimated_resource_pack_tokens_deducted</span>
                      <span className="text-emerald-400 font-mono font-semibold">{deduction.deductedTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">video input included?</span>
                      <span className={hasVideoInput ? 'text-emerald-400' : 'text-amber-400'}>{hasVideoInput ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">pack type</span>
                      <span className="text-gray-300">{WSTV_ACTIVE_PACK.modelTier}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-600 italic">{deduction.note}</p>
                  <p className="text-[10px] text-gray-600 mt-1">
                    <span className="text-gray-500">Note:</span> Model-token count is a local estimate (width × height × fps × duration ÷ 1024). Only the deduction ratio is official. Actual tokens are returned by the API in <code className="text-gray-400">usage.total_tokens</code> after real generation.
                  </p>
                </>
              ) : (
                <p className="text-xs text-amber-400">Duration is auto (-1) — token estimate unavailable until model chooses duration.</p>
              )}

              {/* Pack compatibility */}
              <div className={`p-2 rounded-md border ${compatibility.compatible ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <div className="flex items-start gap-2">
                  {compatibility.compatible
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    : <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />}
                  <div>
                    <p className={`text-xs font-medium ${compatibility.compatible ? 'text-emerald-400' : 'text-red-400'}`}>
                      {compatibility.compatible ? 'Pack compatible' : 'Pack incompatible — pay-as-you-go risk'}
                    </p>
                    {compatibility.warning && (
                      <p className="text-[11px] text-red-300 mt-0.5">{compatibility.warning}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Pay-as-you-go risk note */}
              {!compatibility.compatible && (
                <div className="p-2 rounded-md bg-red-500/10 border border-red-500/30">
                  <p className="text-[11px] text-red-400 flex items-start gap-1.5">
                    <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                    <span><strong>Pay-as-you-go risk:</strong> Your Standard pack will NOT cover {modelMeta.shortLabel} usage. Each video will be billed at pay-as-you-go rates, which are typically higher than pack rates. Switch to Standard model or purchase a {modelMeta.shortLabel} resource pack.</span>
                  </p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
