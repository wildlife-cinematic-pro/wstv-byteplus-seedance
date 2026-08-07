import { db } from '@/lib/db';
import Phase1Dashboard from '@/components/dashboard/phase1/phase1-dashboard';

export const dynamic = 'force-dynamic';

async function getPhase1Data() {
  try {
    const [settings, budget, tasks] = await Promise.all([
      db.dashboardSettings.findFirst(),
      db.budgetSetting.findFirst(),
      db.videoTask.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          status: true,
          modelType: true,
          resolution: true,
          duration: true,
          dryRunPassed: true,
          costEstimate: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      safeMode: settings?.safeMode ?? true,
      budget: budget
        ? {
            monthlyLimit: budget.monthlyLimit,
            spentThisMonth: budget.spentThisMonth,
            currency: budget.currency,
          }
        : {
            monthlyLimit: 50,
            spentThisMonth: 0,
            currency: 'USD',
          },
      tasks: tasks.map(task => ({
        ...task,
        createdAt: task.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error('Failed to fetch Phase 1 overview data:', error);
    return {
      safeMode: true,
      budget: {
        monthlyLimit: 50,
        spentThisMonth: 0,
        currency: 'USD',
      },
      tasks: [],
    };
  }
}

export default async function Phase1Page() {
  const initialData = await getPhase1Data();
  return <Phase1Dashboard initialData={initialData} />;
}
