import { db } from '@/lib/db';
import Phase3HistoryDashboard, { type Phase3Task } from '@/components/dashboard/phase3/phase3-history-dashboard';

export const dynamic = 'force-dynamic';

const TASK_SELECT = {
  id: true,
  status: true,
  modelType: true,
  modelId: true,
  resolution: true,
  duration: true,
  aspectRatio: true,
  dryRunPassed: true,
  safetyPassed: true,
  costEstimate: true,
  costActual: true,
  actualTokens: true,
  actualBillingStatus: true,
  createdAt: true,
  updatedAt: true,
  pollCount: true,
  lastCheckedAt: true,
} as const;

function serializeTasks(tasks: Array<Record<string, unknown>>): Phase3Task[] {
  return tasks.map(task => ({
    ...task,
    createdAt: (task.createdAt as Date).toISOString(),
    updatedAt: (task.updatedAt as Date).toISOString(),
    lastCheckedAt: task.lastCheckedAt ? (task.lastCheckedAt as Date).toISOString() : null,
  })) as Phase3Task[];
}

async function getPhase3Data() {
  try {
    const [settings, tasks] = await Promise.all([
      db.dashboardSettings.findFirst(),
      db.videoTask.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: TASK_SELECT,
      }),
    ]);

    return {
      safeMode: settings?.safeMode ?? true,
      tasks: serializeTasks(tasks as unknown as Array<Record<string, unknown>>),
    };
  } catch (error) {
    console.error('Failed to fetch Phase 3 History data:', error);
    return { safeMode: true, tasks: [] };
  }
}

export default async function Phase3Page() {
  const initialData = await getPhase3Data();
  return <Phase3HistoryDashboard initialData={initialData} />;
}
