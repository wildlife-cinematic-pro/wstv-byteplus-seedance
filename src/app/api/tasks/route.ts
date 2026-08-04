import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { privateJson, requireAuthenticatedUser, requireProtectedMutation } from '@/lib/auth/guards';

const optionalUrl = z.string().url().max(4_096).nullable().optional();
const optionalFilename = z.string().trim().min(1).max(240).regex(/^[^/\\]+$/u).nullable().optional();
const taskFields = {
  prompt: z.string().trim().min(1).max(20_000),
  modelType: z.string().trim().min(1).max(120),
  modelId: z.string().trim().min(1).max(200).optional(),
  resolution: z.string().trim().min(1).max(40),
  duration: z.number().int().min(1).max(120),
  aspectRatio: z.string().trim().min(1).max(40),
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
};

const createTaskSchema = z.object(taskFields).strict();

function taskDto(task: {
  id: string;
  status: string;
  modelType: string;
  modelId: string;
  resolution: string;
  duration: number;
  aspectRatio: string;
  maxCostUsd: number | null;
  outputFilename: string | null;
  dryRunPassed: boolean;
  costEstimate: number | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: task.id,
    status: task.status,
    modelType: task.modelType,
    modelId: task.modelId,
    resolution: task.resolution,
    duration: task.duration,
    aspectRatio: task.aspectRatio,
    maxCostUsd: task.maxCostUsd,
    outputFilename: task.outputFilename,
    dryRunPassed: task.dryRunPassed,
    costEstimate: task.costEstimate,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

const taskSelect = {
  id: true,
  status: true,
  modelType: true,
  modelId: true,
  resolution: true,
  duration: true,
  aspectRatio: true,
  maxCostUsd: true,
  outputFilename: true,
  dryRunPassed: true,
  costEstimate: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function GET(request: NextRequest) {
  const guard = await requireAuthenticatedUser(request);
  if ('response' in guard) return guard.response;

  try {
    const tasks = await db.videoTask.findMany({ orderBy: { createdAt: 'desc' }, select: taskSelect });
    return privateJson({ tasks: tasks.map(taskDto) });
  } catch {
    console.error('Tasks GET failed');
    return privateJson({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;

  const parsed = createTaskSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return privateJson({ error: 'Invalid task input' }, { status: 400 });

  try {
    const input = parsed.data;
    const task = await db.videoTask.create({
      data: {
        prompt: input.prompt,
        modelType: input.modelType,
        modelId: input.modelId || input.modelType,
        resolution: input.resolution,
        duration: input.duration,
        aspectRatio: input.aspectRatio,
        masterImageUrl: input.masterImageUrl ?? null,
        storyboardImageUrl: input.storyboardImageUrl ?? null,
        audioUrl1: input.audioUrl1 ?? null,
        audioUrl2: input.audioUrl2 ?? null,
        audioUrl3: input.audioUrl3 ?? null,
        videoUrl1: input.videoUrl1 ?? null,
        videoUrl2: input.videoUrl2 ?? null,
        videoUrl3: input.videoUrl3 ?? null,
        maxCostUsd: input.maxCostUsd ?? null,
        outputFilename: input.outputFilename ?? null,
        status: 'draft',
      },
      select: taskSelect,
    });
    return privateJson({ task: taskDto(task) }, { status: 201 });
  } catch {
    console.error('Tasks POST failed');
    return privateJson({ error: 'Failed to create task' }, { status: 500 });
  }
}
