import { db } from '@/lib/db';
import { Prisma, type ReferenceAsset } from '@prisma/client';
import { NextResponse } from 'next/server';

interface ReferenceAssetPayload {
  dbId?: string;
  id?: string;
  assetType?: string;
  role?: string;
  url?: string;
  label?: string | null;
  notes?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  projectId?: string | null;
}

// GET /api/reference-assets — List reference assets (optional: ?projectId=xxx, ?assetType=image)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const assetType = searchParams.get('assetType');

    const where: Prisma.ReferenceAssetWhereInput = {};
    if (projectId) where.projectId = projectId;
    if (assetType) where.assetType = assetType;

    const referenceAssets = await db.referenceAsset.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ assets: referenceAssets });
  } catch (error) {
    console.error('[REFERENCE_ASSETS_LIST]', error);
    return NextResponse.json(
      { error: 'Failed to fetch reference assets' },
      { status: 500 }
    );
  }
}

// POST /api/reference-assets — Bulk save/update/delete references
// Accepts: { assets: [{ id?, assetType, role, url, label?, notes?, isActive?, sortOrder? }] }
// - If asset has a dbId (real DB id), update it
// - If asset has no dbId, create it
// - Existing DB assets not in the payload will be deleted
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { assets } = body as { assets?: ReferenceAssetPayload[] };

    if (!Array.isArray(assets)) {
      return NextResponse.json(
        { error: 'assets array is required' },
        { status: 400 }
      );
    }

    // Validate limits
    const imageCount = assets.filter((a) => a.assetType === 'image' && a.url?.trim()).length;
    const videoCount = assets.filter((a) => a.assetType === 'video' && a.url?.trim()).length;
    const audioCount = assets.filter((a) => a.assetType === 'audio' && a.url?.trim()).length;

    if (imageCount > 9) return NextResponse.json({ error: `Too many image references (${imageCount}/9 max)` }, { status: 400 });
    if (videoCount > 3) return NextResponse.json({ error: `Too many video references (${videoCount}/3 max)` }, { status: 400 });
    if (audioCount > 3) return NextResponse.json({ error: `Too many audio references (${audioCount}/3 max)` }, { status: 400 });

    // Get all existing DB assets for comparison
    const existingAssets = await db.referenceAsset.findMany();
    const existingIds = new Set(existingAssets.map(a => a.id));

    // Determine which assets to create, update, or delete
    const assetDbIds = new Set<string>();
    const toCreate: Prisma.ReferenceAssetCreateInput[] = [];
    const toUpdate: Array<{ id: string; data: Prisma.ReferenceAssetUpdateInput }> = [];

    for (const asset of assets) {
      const { dbId, assetType, role, url, label, notes, isActive, sortOrder, projectId } = asset;

      // Validate required fields
      if (!assetType) continue;

      if (dbId && existingIds.has(dbId)) {
        // Update existing
        assetDbIds.add(dbId);
        toUpdate.push({
          id: dbId,
          data: {
            assetType,
            role: role || '',
            url: url || '',
            label: label || null,
            notes: notes || null,
            isActive: isActive !== undefined ? isActive : true,
            sortOrder: sortOrder || 0,
            projectId: projectId || null,
          },
        });
      } else {
        // Create new
        toCreate.push({
          assetType,
          role: role || '',
          url: url || '',
          label: label || null,
          notes: notes || null,
          isActive: isActive !== undefined ? isActive : true,
          sortOrder: sortOrder || 0,
          projectId: projectId || null,
        });
      }
    }

    // Delete assets not in the payload
    const toDelete = existingAssets.filter(a => !assetDbIds.has(a.id));
    for (const asset of toDelete) {
      await db.referenceAsset.delete({ where: { id: asset.id } });
    }

    // Update existing
    for (const { id, data } of toUpdate) {
      await db.referenceAsset.update({ where: { id }, data });
    }

    // Create new
    const created: ReferenceAsset[] = [];
    for (const data of toCreate) {
      const asset = await db.referenceAsset.create({ data });
      created.push(asset);
    }

    // Return all current assets
    const allAssets = await db.referenceAsset.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      assets: allAssets,
      summary: {
        created: created.length,
        updated: toUpdate.length,
        deleted: toDelete.length,
        total: allAssets.length,
      },
    });
  } catch (error) {
    console.error('[REFERENCE_ASSETS_BULK_SAVE]', error);
    return NextResponse.json(
      { error: 'Failed to save reference assets' },
      { status: 500 }
    );
  }
}

// PUT /api/reference-assets — Single asset update (convenience endpoint)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, assetType, role, url, label, notes, isActive, sortOrder, projectId } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required for update' }, { status: 400 });
    }

    const existing = await db.referenceAsset.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Reference asset not found' }, { status: 404 });
    }

    const updated = await db.referenceAsset.update({
      where: { id },
      data: {
        ...(assetType !== undefined && { assetType }),
        ...(role !== undefined && { role }),
        ...(url !== undefined && { url }),
        ...(label !== undefined && { label }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(projectId !== undefined && { projectId }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[REFERENCE_ASSETS_UPDATE]', error);
    return NextResponse.json({ error: 'Failed to update reference asset' }, { status: 500 });
  }
}

// DELETE /api/reference-assets — Bulk delete (accepts { ids: [...] } or { assetType: 'image' } to delete all of type)
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { ids, assetType } = body;

    if (ids && Array.isArray(ids)) {
      // Delete specific assets by ID
      const result = await db.referenceAsset.deleteMany({
        where: { id: { in: ids } },
      });
      return NextResponse.json({ deleted: result.count });
    }

    if (assetType) {
      // Delete all assets of a type
      const result = await db.referenceAsset.deleteMany({
        where: { assetType },
      });
      return NextResponse.json({ deleted: result.count, assetType });
    }

    return NextResponse.json({ error: 'Provide ids array or assetType to delete' }, { status: 400 });
  } catch (error) {
    console.error('[REFERENCE_ASSETS_DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete reference assets' }, { status: 500 });
  }
}
