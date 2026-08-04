export type PublicDashboardSettings = {
  safeMode: boolean;
  defaultFps: number;
  defaultModel: string;
  defaultResolution: string;
  intelligentModeWarning: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Safely reads the deliberately limited `{ settings: {} }` API response. */
export function readPublicDashboardSettings(value: unknown): PublicDashboardSettings | null {
  if (!isRecord(value) || !isRecord(value.settings)) return null;
  const settings = value.settings;
  if (
    typeof settings.safeMode !== 'boolean' ||
    typeof settings.defaultFps !== 'number' ||
    typeof settings.defaultModel !== 'string' ||
    typeof settings.defaultResolution !== 'string' ||
    typeof settings.intelligentModeWarning !== 'boolean'
  ) {
    return null;
  }
  return {
    safeMode: settings.safeMode,
    defaultFps: settings.defaultFps,
    defaultModel: settings.defaultModel,
    defaultResolution: settings.defaultResolution,
    intelligentModeWarning: settings.intelligentModeWarning,
  };
}
