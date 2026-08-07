import { db } from '@/lib/db';
import Phase4ContentCalendar from '@/components/dashboard/phase4/phase4-content-calendar';

export const dynamic = 'force-dynamic';

async function getPhase4Data() {
  try {
    const settings = await db.dashboardSettings.findFirst();
    return { safeMode: settings?.safeMode ?? true };
  } catch (error) {
    console.error('Failed to fetch Phase 4 Content Calendar data:', error);
    return { safeMode: true };
  }
}

export default async function Phase4Page() {
  const { safeMode } = await getPhase4Data();
  return <Phase4ContentCalendar initialSafeMode={safeMode} />;
}
