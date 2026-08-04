import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db, } from '@/lib/db';
import { privateJson, requireAuthenticatedUser, requireProtectedMutation } from '@/lib/auth/guards';

const projectIdSchema = z.string().trim().min(1).max(120).nullable().optional();
const assetSchema = z.object({
  dbId: z.string().trim().min(1).max(120).optional(),
  assetType: z.enum(['image', 'video', 'audio']),
  role: z.string().trim().min(1).max(120),
  url: z.string().trim().min(1).max(4_096),
  label: z.string().trim().max(240).nullable().optional(),
  notes: z.string().trim().max(4_000).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
}).strict();
const bulkSchema = z.object({
  projectId: projectIdSchema,
  assets: z.array(assetSchema).max(15),
}).strict();
const updateSchema = z.object({
  projectId: projectIdSchema,
  id: z.string().trim().min(1).max(120),
  assetType: z.enum(['image', 'video', 'audio']).optional(),
  role: z.string().trim().min(1).max(120).optional(),
  url: z.string().trim().min(1).max(4_096).optional(),
  label: z.string().trim().max(240).nullable().optional(),
  notes: z.string().trim().max(4_000).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
}).strict();
const deleteSchema = z.object({
  projectId: projectIdSchema,
  ids: z.array(z.string().trim().min(1).max(120)).min(1).max(15),
}).strict();

function scopedProjectId(value: string | null | undefined): string | null {
  return value ?? null;
}

function validateAssetCounts(assets: Array<z.infer<typeof assetSchema>>): string | null {
  const count = (type: string) => assets.filter(asset => asset.assetType === type).length;
  if (count('image') > 9) return 'Too many image references';
  if (count('video') > 3) return 'Too many video references';
  if (count('audio') > 3) return 'Too many audio references';
  return null;
}

export async function GET(request: NextRequest) {
  const guard = await requireAuthenticatedUser(request);
  if ('response' in guard) return guard.response;
  const projectId = scopedProjectId(new URL(request.url).searchParams.get('projectId'));
  const assetType = new URL(request.url).searchParams.get('assetType');
  if (assetType && !['image', 'video', 'audio'].includes(assetType)) {
    return privateJson({ error: 'Invalid asset type' }, { status: 400 });
  }

  try {
    const assets = await db.referenceAsset.findMany({
      where: { projectId, ...(assetType ? { assetType } : {}) },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return privateJson({ assets });
  } catch {
    console.error('Reference assets list failed');
    return privateJson({ error: 'Failed to fetch reference assets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;
  const parsed = bulkSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return privateJson({ error: 'Invalid reference assets input' }, { status: 400 });
  const countError = validateAssetCounts(parsed.data.assets);
  if (countError) return privateJson({ error: countError }, { status: 400 });
  const projectId = scopedProjectId(parsed.data.projectId);

  try {
    const assets = await db.$transaction(async transaction => {
      const existing = await transaction.referenceAsset.findMany({ where: { projectId }, select: { id: true } });
      const existingIds = new Set(existing.map(asset => asset.id));
      const submittedIds = new Set(parsed.data.assets.flatMap(asset => asset.dbId && existingIds.has(asset.dbId) ? [asset.dbId] : []));

      await transaction.referenceAsset.deleteMany({
        where: { projectId, id: { notIn: [...submittedIds] } },
      });

      for (const asset of parsed.data.assets) {
        const data = {
          assetType: asset.assetType,
          role: asset.role,
          url: asset.url,
          label: asset.label ?? null,
          notes: asset.notes ?? null,
          isActive: asset.isActive ?? true,
          sortOrder: asset.sortOrder ?? 0,
          projectId,
        };
        if (asset.dbId && existingIds.has(asset.dbId)) {
          await transaction.referenceAsset.update({ where: { id: asset.dbId }, data });
        } else {
          await transaction.referenceAsset.create({ data });
        }
      }

      return transaction.referenceAsset.findMany({
        where: { projectId },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      });
    });
    return privateJson({ assets });
  } catch {
    console.error('Reference assets bulk save failed');
    return privateJson({ error: 'Failed to save reference assets' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return privateJson({ error: 'Invalid reference asset update' }, { status: 400 });
  const { id, projectId: rawProjectId, ...data } = parsed.data;
  const projectId = scopedProjectId(rawProjectId);

  try {
    const existing = await db.referenceAsset.findFirst({ where: { id, projectId } });
    if (!existing) return privateJson({ error: 'Reference asset not found' }, { status: 404 });
    const updated = await db.referenceAsset.update({ where: { id }, data });
    return privateJson({ asset: updated });
  } catch {
    console.error('Reference asset update failed');
    return privateJson({ error: 'Failed to update reference asset' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;
  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return privateJson({ error: 'Invalid reference asset deletion' }, { status: 400 });
  const projectId = scopedProjectId(parsed.data.projectId);

  try {
    const result = await db.referenceAsset.deleteMany({
      where: { projectId, id: { in: parsed.data.ids } },
    });
    return privateJson({ deleted: result.count });
  } catch {
    console.error('Reference asset deletion failed');
    return privateJson({ error: 'Failed to delete reference assets' }, { status: 500 });
  }
}
