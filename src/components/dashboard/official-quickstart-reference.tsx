'use client';

import { useState } from 'react';
import { BookOpen, ShieldAlert, CheckCircle2, AlertTriangle, Info, ChevronDown, ChevronRight, Lock, KeyRound, Cloud, Clock } from 'lucide-react';
import { StepShell } from './shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

/**
 * OfficialQuickstartReference — PHASE5.1 documentation panel.
 *
 * This panel summarizes the official BytePlus ModelArk Seedance 2.0 quickstart
 * package for reference only. It does NOT execute any demo scripts, does NOT
 * call the real API, and does NOT require any API key.
 *
 * The official quickstart package (modelark_seedance2.0_quickstart_package.zip)
 * is not bundled with this checkout. This panel summarizes official docs and
 * prior WSTV reference notes only; no demo scripts are executed here.
 *
 * Safety: demo_standard.py can create REAL PAID generation tasks if
 * ARK_API_KEY is configured. It must NOT be executed while WSTV is in
 * Safe Mode / Dry Run Mode.
 */
export function OfficialQuickstartReference() {
  const [showChecklist, setShowChecklist] = useState(false);
  const [showPhase6, setShowPhase6] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);

  const quickstartChecklist = [
    { icon: '👤', text: 'BytePlus account required', detail: 'Active BytePlus account with ModelArk access' },
    { icon: '🔑', text: 'ARK_API_KEY required later', detail: 'Server-side only — never in frontend or GitHub' },
    { icon: '⚡', text: 'Model activation required', detail: 'Activate Seedance 2.0 models in the console before calling' },
    { icon: '💳', text: 'Prepaid Seedance 2.0 resource package required', detail: 'Purchase a prepaid resource package before creating tasks' },
    { icon: '🔗', text: 'API-ready media URIs required', detail: 'Use public HTTPS URLs, asset:// IDs, or supported Base64 where allowed' },
    { icon: '☁️', text: 'BytePlus TOS public-read storage recommended', detail: 'Use TOS or another public CDN for reference media' },
    { icon: '🆔', text: 'Create task returns provider task ID', detail: 'POST /api/v3/contents/generations/tasks → task_id' },
    { icon: '🔄', text: 'Poll status every 10–30 seconds', detail: 'GET /api/v3/contents/generations/tasks/{id} — poll until succeeded/failed' },
    { icon: '🎬', text: 'On success, save content.video_url immediately', detail: 'Provider URLs expire after 24 hours' },
    { icon: '🖼️', text: 'If return_last_frame=true, save content.last_frame_url immediately', detail: 'Last-frame URL also expires after 24 hours' },
    { icon: '📊', text: 'Save usage.total_tokens / usage.completion_tokens', detail: 'For actual cost calculation and tracking' },
    { icon: '🔒', text: 'API key must stay server-side only', detail: 'Never commit to GitHub, never paste in browser code' },
  ];

  const phase6Checklist = [
    'Store ARK_API_KEY server-side only in .env.local',
    'Create server-side Next.js API route (e.g., /api/seedance/create-task)',
    'Never expose API key in frontend',
    'POST create task from backend only',
    'Save provider_task_id to database',
    'Poll GET task every 10–30 seconds',
    'Save status: queued / running / succeeded / failed / expired / cancelled',
    'On succeeded, save content.video_url',
    'Save content.last_frame_url if returned',
    'Copy provider video_url to permanent storage quickly (expires in 24h)',
    'Copy last_frame_url to permanent storage quickly (expires in 24h)',
    'Save usage.total_tokens / usage.completion_tokens',
    'Calculate actual cost',
    'Store raw request/response JSON',
    'Add retry/error handling',
    'Add clear final confirmation before any paid task',
  ];

  return (
    <StepShell
      icon={<BookOpen className="w-5 h-5" />}
      title="Official Seedance 2.0 Quickstart Reference — PHASE5.1 Only"
      cardClassName="border-amber-500/30"
      defaultOpen={false}
    >
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-400 bg-amber-500/10">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Reference only — do not run the official Python demo from this dashboard
          </Badge>
          <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
            Safe Mode / Dry Run / Planning Mode
          </Badge>
        </div>
        {/* Main description */}
        <div className="p-3 rounded-md bg-muted/30 border border-amber-500/20">
          <p className="text-xs text-gray-300 leading-relaxed">
            This quickstart package is official BytePlus ModelArk reference for future real API integration.
            It should not be executed while WSTV is in Safe Mode / Dry Run Mode.
            <code className="text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded text-xs mx-1">demo_standard.py</code>
            can create real paid generation tasks if <code className="text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded text-xs">ARK_API_KEY</code> is configured.
          </p>
        </div>

        {/* Official model IDs confirmation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="bg-muted/30 rounded-lg p-3 border border-emerald-500/20">
            <p className="text-xs font-bold text-emerald-400">Standard</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">dreamina-seedance-2-0-260128</p>
            <p className="text-xs text-gray-400 mt-1">Highest quality · 480p/720p/1080p/4k</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 border border-amber-500/20">
            <p className="text-xs font-bold text-amber-400">Fast</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">dreamina-seedance-2-0-fast-260128</p>
            <p className="text-xs text-gray-400 mt-1">Speed/cost balance · 480p/720p</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 border border-blue-500/20">
            <p className="text-xs font-bold text-blue-400">Mini</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">dreamina-seedance-2-0-mini-260615</p>
            <p className="text-xs text-gray-400 mt-1">Cheapest/testing · 480p/720p</p>
          </div>
        </div>

        {/* WSTV defaults */}
        <div className="p-3 rounded-md bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-xs text-emerald-400 font-medium mb-2">WSTV Defaults (confirmed)</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div><span className="text-muted-foreground">Model:</span> <span className="text-gray-300">Standard</span></div>
            <div><span className="text-muted-foreground">Mode:</span> <span className="text-gray-300">reference_mode</span></div>
            <div><span className="text-muted-foreground">Ratio:</span> <span className="text-gray-300">9:16</span></div>
            <div><span className="text-muted-foreground">Duration:</span> <span className="text-gray-300">15s</span></div>
            <div><span className="text-muted-foreground">Resolution:</span> <span className="text-gray-300">720p</span></div>
            <div><span className="text-muted-foreground">generate_audio:</span> <span className="text-gray-300">true</span></div>
            <div><span className="text-muted-foreground">watermark:</span> <span className="text-gray-300">false</span></div>
            <div><span className="text-muted-foreground">return_last_frame:</span> <span className="text-gray-300">true</span></div>
          </div>
        </div>

        {/* 4k warning */}
        <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/30">
          <p className="text-xs text-amber-400 flex items-start gap-1.5">
            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
            <span>4k is Standard-only and may have lower concurrency / higher cost. Use 720p for normal WSTV testing.</span>
          </p>
        </div>

        {/* Quickstart safety checklist (collapsible) */}
        <Collapsible open={showChecklist} onOpenChange={setShowChecklist}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between px-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/5">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">Quickstart Safety Checklist (12 items)</span>
              </span>
              {showChecklist ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="space-y-1.5">
              {quickstartChecklist.map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-muted/30 border border-emerald-500/30">
                  <span className="text-sm shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300 font-medium">{i + 1}. {item.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                  </div>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500/50 shrink-0 mt-0.5" />
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Safety warnings (collapsible) */}
        <Collapsible open={showWarnings} onOpenChange={setShowWarnings}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between px-2 text-gray-400 hover:text-red-400 hover:bg-red-500/5">
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                <span className="text-sm font-medium">Safety Warnings</span>
              </span>
              {showWarnings ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            <div className="p-2 rounded-md bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-red-400 flex items-start gap-1.5">
                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                <span><strong>Demo warning:</strong> Do not run official Python demo from inside the dashboard. It can create real paid ModelArk generation tasks.</span>
              </p>
            </div>
            <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/30">
              <p className="text-xs text-amber-400 flex items-start gap-1.5">
                <Cloud className="w-3 h-3 shrink-0 mt-0.5" />
                <span><strong>Media URI warning:</strong> Future real API requires API-ready media URIs. Use public HTTPS URLs, asset:// IDs, or supported Base64 where allowed. Do not use private local file paths.</span>
              </p>
            </div>
            <div className="p-2 rounded-md bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-red-400 flex items-start gap-1.5">
                <KeyRound className="w-3 h-3 shrink-0 mt-0.5" />
                <span><strong>API key warning:</strong> ARK_API_KEY must never be committed to GitHub, shown in frontend, pasted into browser code, or stored in public files.</span>
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Future PHASE6 Real API Integration Checklist (collapsible) */}
        <Collapsible open={showPhase6} onOpenChange={setShowPhase6}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between px-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/5">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Future PHASE6 Real API Integration Checklist (16 items)</span>
              </span>
              {showPhase6 ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="p-3 rounded-md bg-muted/30 border border-emerald-500/30 space-y-1">
              {phase6Checklist.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="text-emerald-400 font-mono shrink-0 w-6">{i + 1}.</span>
                  <span className="text-gray-300">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 italic">
              PHASE6 is future work. PHASE5.1 is only official documentation/safety alignment. No real API calls are made in this phase.
            </p>
          </CollapsibleContent>
        </Collapsible>

        {/* Official endpoint reference (documentation only) */}
        <div className="p-3 rounded-md bg-muted/30 border border-border">
          <p className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" /> Official Endpoints (future PHASE6 reference — NOT called in PHASE5.1)
          </p>
          <div className="space-y-1 text-xs font-mono text-muted-foreground">
            <div><span className="text-emerald-400">POST</span> https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks</div>
            <div><span className="text-blue-400">GET</span>  https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks/{'{id}'}</div>
            <div><span className="text-blue-400">GET</span>  https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks</div>
            <div><span className="text-red-400">DELETE</span> https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks/{'{id}'}</div>
          </div>
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <span className="text-gray-400">Headers (future):</span> Content-Type: application/json · Authorization: Bearer &lt;ARK_API_KEY&gt;
            </p>
            <p className="text-xs text-red-400 mt-1">
              ⚠ No ARK_API_KEY is stored, loaded, or used in PHASE5.1. The endpoint URLs above are documentation only.
            </p>
          </div>
        </div>
    </StepShell>
  );
}
