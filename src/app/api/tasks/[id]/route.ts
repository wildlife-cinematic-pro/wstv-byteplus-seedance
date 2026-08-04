import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { privateJson, requireAuthenticatedUser, requireProtectedMutation } from '@/lib/auth/guards';

const optionalUrl = z.string().url().max(4_096).nullable().optional();
const optionalFilename = z.string().trim().min(1).max(240).regex(/^[^/\\]+$/u).nullable().optional();
const updateTaskSchema = z.object({
  prompt: z.string().trim().min(1).max(20_000).optional(),
  modelType: z.string().trim().min(1).max(120).optional(),
  modelId: z.string().trim().min(1).max(200).optional(),
  resolution: z.string().trim().min(1).max(40).optional(),
  duration: z.number().int().min(1).max(120).optional(),
  aspectRatio: z.string().trim().min(1).max(40).optional(),
  masterImageUrl: optionalUrl,
  storyboardImageUrl: optionalUrl,
  audioUrl1: optionalUrl,
  audioUrl2: optionalUrl,
  audioUrl3: optionalUrl,
  videoUrl1: optionalUrl,
  videoUrl2: optionalUrl,
  videoUrl3: optionalUrl,
  maxCostUsd: z.number().finite().positive().max(100_000).nullable().optional(),
  outputFilename: optionalFilename,
  audioRiskAcknowledged: z.boolean().optional(),
  videoRiskAcknowledged: z.boolean().optional(),
}).strict();

function taskDto(task: {
  id: string; status: string; modelType: string; modelId: string; resolution: string; duration: number;
  aspectRatio: string; maxCostUsd: number | null; outputFilename: string | null; dryRunPassed: boolean;
  costEstimate: number | null; createdAt: Date; updatedAt: Date;
}) {
  return {
    id: task.id, status: task.status, modelType: task.modelType, modelId: task.modelId,
    resolution: task.resolution, duration: task.duration, aspectRatio: task.aspectRatio,
    maxCostUsd: task.maxCostUsd, outputFilename: task.outputFilename, dryRunPassed: task.dryRunPassed,
    costEstimate: task.costEstimate, createdAt: task.createdAt, updatedAt: task.updatedAt,
  };
}

const taskSelect = {
  id: true, status: true, modelType: true, modelId: true, resolution: true, duration: true,
  aspectRatio: true, maxCostUsd: true, outputFilename: true, dryRunPassed: true, costEstimate: true,
  createdAt: true, updatedAt: true,
} as const;

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const guard = await requireAuthenticatedUser(request);
  if ('response' in guard) return guard.response;
  const { id } = await params;

  try {
    const task = await db.videoTask.findUnique({ where: { id }, select: taskSelect });
    if (!task) return privateJson({ error: 'Task not found' }, { status: 404 });
    return privateJson({ task: taskDto(task) });
  } catch {
    console.error('Task GET failed');
    return privateJson({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;
  const { id } = await params;
  const parsed = updateTaskSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return privateJson({ error: 'Invalid task update' }, { status: 400 });
  }

  try {
    const task = await db.videoTask.update({ where: { id }, data: parsed.data, select: taskSelect });
    return privateJson({ task: taskDto(task) });
  } catch {
    return privateJson({ error: 'Task not found' }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;
  const { id } = await params;
  try {
    await db.videoTask.delete({ where: { id } });
    return privateJson({ success: true });
  } catch {
    return privateJson({ error: 'Task not found' }, { status: 404 });
  }
}
