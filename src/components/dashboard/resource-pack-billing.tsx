'use client';

import { useMemo, useState } from 'react';
import { CreditCard, AlertTriangle, CheckCircle2, Info, ChevronDown, ChevronRight, Calculator } from 'lucide-react';
import { StepShell } from './shared';
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
    <StepShell
      icon={<CreditCard className="w-5 h-5" />}
      title="Official Resource Pack Billing / Deduction Rules"
      cardClassName="border-blue-500/30"
      defaultOpen={false}
    >
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400 bg-blue-500/10">
            PHASE5 — Billing reference
          </Badge>
          <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
            Official BytePlus deduction ratios
          </Badge>
        </div>
        {/* WSTV Active Pack card */}
        <div className="p-4 rounded-lg bg-muted/30 border border-emerald-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-emerald-400">WSTV Active Pack</p>
            <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
              {WSTV_ACTIVE_PACK.packType}
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground text-xs">Model pack</p>
              <p className="text-gray-300">{WSTV_ACTIVE_PACK.packName}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Purchased</p>
              <p className="text-gray-300">{WSTV_ACTIVE_PACK.purchasedPacks} × 1M token packs</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Total quota</p>
              <p className="text-emerald-400 font-mono">{WSTV_ACTIVE_PACK.totalQuota.toLocaleString()} tokens</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Paid</p>
              <p className="text-gray-300">${WSTV_ACTIVE_PACK.paidUsd.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Purchase date</p>
              <p className="text-gray-300">{WSTV_ACTIVE_PACK.purchaseDate}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Expiry date</p>
              <p className="text-gray-300">{WSTV_ACTIVE_PACK.expiryDate}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Validity</p>
              <p className="text-gray-300">{WSTV_ACTIVE_PACK.validityDays} days</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Pack type</p>
              <p className="text-gray-300">{WSTV_ACTIVE_PACK.packType}</p>
            </div>
          </div>
          {/* Standard pack warning */}
          <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/30">
            <p className="text-xs text-amber-400 flex items-start gap-1.5">
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
                <div key={i} className="flex items-start gap-2 p-1.5 rounded bg-muted/30 border border-blue-500/10">
                  <span className="text-blue-400 font-mono text-xs shrink-0">{i + 1}.</span>
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
            <div className="p-3 rounded-md bg-muted/30 border border-emerald-500/30 space-y-3">
              {/* Current settings summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground text-xs">Selected model</p>
                  <p className="text-gray-300">{modelMeta.shortLabel}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Resolution</p>
                  <p className="text-gray-300">{resolution}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Duration</p>
                  <p className="text-gray-300">{duration === -1 ? 'auto (-1)' : `${duration}s`}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Video input</p>
                  <p className={hasVideoInput ? 'text-emerald-400' : 'text-amber-400'}>
                    {hasVideoInput ? 'Yes — official video-input ratio' : 'No — higher no-video deduction ratio may apply'}
                  </p>
                </div>
              </div>

              {/* Deduction breakdown */}
              {duration !== -1 ? (
                <>
                  <div className="space-y-1.5 text-xs border-t border-border pt-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">estimated_model_tokens <span className="text-muted-foreground">(local estimate)</span></span>
                      <span className="text-gray-300 font-mono">{estimatedModelTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">deduction_ratio <span className="text-muted-foreground">(official)</span></span>
                      <span className="text-blue-400 font-mono">{deduction.ratio.toFixed(4)}×</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">unit price <span className="text-muted-foreground">(official USD / K tokens)</span></span>
                      <span className="text-blue-400 font-mono">${deduction.unitPriceUsdPerKTokens.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">estimated_resource_pack_tokens_deducted</span>
                      <span className="text-emerald-400 font-mono font-semibold">{deduction.deductedTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">video input included?</span>
                      <span className={hasVideoInput ? 'text-emerald-400' : 'text-amber-400'}>{hasVideoInput ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">pack type</span>
                      <span className="text-gray-300">{WSTV_ACTIVE_PACK.modelTier}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic">{deduction.note}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="text-muted-foreground">Note:</span> Model-token count is a local estimate (width × height × fps × duration ÷ 1024). Only the deduction ratio is official. Actual tokens are returned by the API in <code className="text-gray-400">usage.total_tokens</code> after real generation.
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
                      <p className="text-xs text-red-300 mt-0.5">{compatibility.warning}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Pay-as-you-go risk note */}
              {!compatibility.compatible && (
                <div className="p-2 rounded-md bg-red-500/10 border border-red-500/30">
                  <p className="text-xs text-red-400 flex items-start gap-1.5">
                    <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                    <span><strong>Pay-as-you-go risk:</strong> Your Standard pack will NOT cover {modelMeta.shortLabel} usage. Each video will be billed at pay-as-you-go rates, which are typically higher than pack rates. Switch to Standard model or purchase a {modelMeta.shortLabel} resource pack.</span>
                  </p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
    </StepShell>
  );
}
