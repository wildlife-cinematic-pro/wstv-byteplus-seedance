import { getArkApiKey } from './seedance-config';

function isFlagTrue(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true';
}

export function isDryRunMode(): boolean {
  return (process.env.DRY_RUN ?? 'true').trim().toLowerCase() !== 'false';
}

export function isRealApiAllowed(): boolean {
  return (
    !isDryRunMode() &&
    isFlagTrue(process.env.ENABLE_REAL_API) &&
    isFlagTrue(process.env.ALLOW_PAID_CALLS) &&
    getArkApiKey().length > 0
  );
}

export function assertRealApiAllowed(): void {
  if (!isRealApiAllowed()) {
    throw new Error(
      'Real BytePlus API calls are blocked. Require DRY_RUN=false, ENABLE_REAL_API=true, ALLOW_PAID_CALLS=true, and server-side ARK_API_KEY.'
    );
  }
}
