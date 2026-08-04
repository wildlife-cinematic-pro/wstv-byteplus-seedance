export const LOGIN_RATE_LIMIT_MAX_FAILURES = 5;
export const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1_000;
export const LOGIN_RATE_LIMIT_MAX_CLIENTS = 1_000;

export interface RateLimitReservation {
  recordFailure(now?: number): boolean;
  recordSuccess(): void;
  release(): void;
}

type ClientRecord = {
  failedAt: number[];
  inFlight: number;
  lastSeenAt: number;
};

type ReservationState = 'pending' | 'failed' | 'succeeded' | 'released';

/**
 * Process-local protection for a single-server deployment. Multi-instance
 * production deployments must replace this with a shared, atomic rate-limit
 * store so attempts cannot be distributed across instances.
 */
export class InMemoryLoginRateLimiter {
  private readonly records = new Map<string, ClientRecord>();
  private readonly maxFailures: number;
  private readonly windowMs: number;
  private readonly maxClients: number;

  constructor(
    maxFailures = LOGIN_RATE_LIMIT_MAX_FAILURES,
    windowMs = LOGIN_RATE_LIMIT_WINDOW_MS,
    maxClients = LOGIN_RATE_LIMIT_MAX_CLIENTS,
  ) {
    if (!Number.isInteger(maxFailures) || maxFailures <= 0) {
      throw new RangeError('maxFailures must be a positive integer');
    }
    if (typeof windowMs !== 'number' || !Number.isFinite(windowMs) || windowMs <= 0) {
      throw new RangeError('windowMs must be a positive finite number');
    }
    if (!Number.isInteger(maxClients) || maxClients <= 0) {
      throw new RangeError('maxClients must be a positive integer');
    }

    this.maxFailures = maxFailures;
    this.windowMs = windowMs;
    this.maxClients = maxClients;
  }

  isLimited(clientKey: string, now = Date.now()): boolean {
    this.removeExpired(now);
    const record = this.records.get(clientKey);
    if (!record) return false;
    return record.failedAt.length + record.inFlight >= this.maxFailures;
  }

  tryReserve(clientKey: string, now = Date.now()): RateLimitReservation | null {
    this.removeExpired(now);

    let record = this.records.get(clientKey);
    const currentFailures = record?.failedAt.length ?? 0;
    const currentInFlight = record?.inFlight ?? 0;

    if (currentFailures + currentInFlight >= this.maxFailures) {
      return null;
    }

    if (!record) {
      if (!this.makeRoom()) {
        return null;
      }
      record = { failedAt: [], inFlight: 0, lastSeenAt: now };
      this.records.set(clientKey, record);
    }

    record.inFlight++;
    record.lastSeenAt = now;

    let state: ReservationState = 'pending';
    let cachedResult: boolean | undefined = undefined;

    const targetRecord = record;

    const cleanupCheck = () => {
      if (targetRecord.failedAt.length === 0 && targetRecord.inFlight <= 0) {
        targetRecord.inFlight = 0;
        if (this.records.get(clientKey) === targetRecord) {
          this.records.delete(clientKey);
        }
      }
    };

    return {
      recordFailure: (failTime = Date.now()): boolean => {
        if (state === 'failed') {
          return cachedResult!;
        }
        if (state === 'succeeded' || state === 'released') {
          return false;
        }

        state = 'failed';
        this.removeExpired(failTime);

        if (targetRecord.inFlight > 0) {
          targetRecord.inFlight--;
        }

        targetRecord.failedAt.push(failTime);
        if (targetRecord.failedAt.length > this.maxFailures) {
          targetRecord.failedAt = targetRecord.failedAt.slice(-this.maxFailures);
        }
        targetRecord.lastSeenAt = failTime;

        cachedResult = targetRecord.failedAt.length + targetRecord.inFlight >= this.maxFailures;
        cleanupCheck();
        return cachedResult;
      },

      recordSuccess: (): void => {
        if (state !== 'pending') return;
        state = 'succeeded';

        if (targetRecord.inFlight > 0) {
          targetRecord.inFlight--;
        }
        targetRecord.failedAt = [];
        cleanupCheck();
      },

      release: (): void => {
        if (state !== 'pending') return;
        state = 'released';

        if (targetRecord.inFlight > 0) {
          targetRecord.inFlight--;
        }
        cleanupCheck();
      },
    };
  }

  recordFailure(clientKey: string, now = Date.now()): boolean {
    this.removeExpired(now);
    let record = this.records.get(clientKey);
    if (!record) {
      if (!this.makeRoom()) {
        return false;
      }
      record = { failedAt: [], inFlight: 0, lastSeenAt: now };
      this.records.set(clientKey, record);
    }

    record.failedAt.push(now);
    if (record.failedAt.length > this.maxFailures) {
      record.failedAt = record.failedAt.slice(-this.maxFailures);
    }
    record.lastSeenAt = now;

    return record.failedAt.length + record.inFlight >= this.maxFailures;
  }

  getInFlightCount(clientKey: string): number {
    return this.records.get(clientKey)?.inFlight ?? 0;
  }

  getFailedCount(clientKey: string, now = Date.now()): number {
    this.removeExpired(now);
    return this.records.get(clientKey)?.failedAt.length ?? 0;
  }

  getClientCount(): number {
    return this.records.size;
  }

  private removeExpired(now: number): void {
    const cutoff = now - this.windowMs;
    for (const [clientKey, record] of this.records) {
      record.failedAt = record.failedAt.filter((failedAt) => failedAt > cutoff);
      if (record.failedAt.length === 0 && record.inFlight <= 0) {
        record.inFlight = 0;
        this.records.delete(clientKey);
      }
    }
  }

  private makeRoom(): boolean {
    if (this.records.size < this.maxClients) return true;

    let oldestKey: string | undefined;
    let oldestSeenAt = Number.POSITIVE_INFINITY;

    for (const [clientKey, record] of this.records) {
      if (record.inFlight > 0) continue;
      if (record.lastSeenAt < oldestSeenAt) {
        oldestKey = clientKey;
        oldestSeenAt = record.lastSeenAt;
      }
    }

    if (oldestKey) {
      this.records.delete(oldestKey);
      return true;
    }

    return false;
  }
}
