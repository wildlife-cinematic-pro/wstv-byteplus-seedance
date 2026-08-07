import { db } from '@/lib/db';
import Phase2GenerateDashboardV2 from '@/components/dashboard/phase2/phase2-generate-dashboard-v2';

export const dynamic = 'force-dynamic';

async function getPhase2Data() {
  try {
    const [settings, budget] = await Promise.all([
      db.dashboardSettings.findFirst(),
      db.budgetSetting.findFirst(),
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
    };
  } catch (error) {
    console.error('Failed to fetch Phase 2 Generate data:', error);
    return {
      safeMode: true,
      budget: {
        monthlyLimit: 50,
        spentThisMonth: 0,
        currency: 'USD',
      },
    };
  }
}

export default async function Phase2Page() {
  const initialData = await getPhase2Data();
  return <Phase2GenerateDashboardV2 initialData={initialData} />;
}
