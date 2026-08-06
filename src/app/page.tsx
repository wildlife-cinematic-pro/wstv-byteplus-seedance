import { db } from '@/lib/db';
import DashboardClient from '@/components/dashboard/client';

export const dynamic = 'force-dynamic';

async function getInitialData() {
  try {
    const [settings, tasks, budget, costLedger] = await Promise.all([
      db.dashboardSettings.findFirst(),
      db.videoTask.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          status: true,
          prompt: true,
          costEstimate: true,
          createdAt: true,
          modelType: true,
          resolution: true,
          duration: true,
          dryRunPassed: true,
        },
      }),
      db.budgetSetting.findFirst(),
      db.costLedger.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Only tasks with an actual saved file are treated as a previewable video.
    // Simulated tasks complete with status 'succeeded' but no real video file,
    // so they must not surface here as a downloadable/previewable result.
    const latestVideo = await db.videoTask.findFirst({
      where: { status: 'succeeded', videoFileName: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { videoFileName: true, videoUrl: true, status: true, createdAt: true },
    });

    return {
      safeMode: settings?.safeMode ?? true,
      taskHistory: tasks.map(t => ({
        id: t.id,
        status: t.status,
        prompt: 'Private task',
        costEstimate: t.costEstimate,
        createdAt: t.createdAt.toISOString(),
        modelType: t.modelType,
        resolution: t.resolution,
        duration: t.duration,
        dryRunPassed: t.dryRunPassed,
      })),
      budget: budget ? {
        monthlyLimit: budget.monthlyLimit,
        spentThisMonth: budget.spentThisMonth,
        currency: budget.currency,
        alertThreshold: budget.alertThreshold,
      } : { monthlyLimit: 50, spentThisMonth: 0, currency: 'USD', alertThreshold: 0.8 },
      latestVideo: latestVideo ? {
        videoFileName: latestVideo.videoFileName ?? '',
        videoUrl: latestVideo.videoFileName ? `/api/video?name=${encodeURIComponent(latestVideo.videoFileName)}` : '',
        createdAt: latestVideo.createdAt.toISOString(),
        taskStatus: latestVideo.status,
      } : null,
    };
  } catch (err) {
    console.error('Failed to fetch initial data:', err);
    return {
      safeMode: true,
      taskHistory: [],
      budget: { monthlyLimit: 50, spentThisMonth: 0, currency: 'USD', alertThreshold: 0.8 },
      latestVideo: null,
    };
  }
}

export default async function Page() {
  const data = await getInitialData();
  return <DashboardClient initialData={data} />;
}
