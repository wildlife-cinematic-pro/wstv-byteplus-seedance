import { describe, it } from 'node:test';
import strictAssert from 'node:assert/strict';
import { InMemoryLoginRateLimiter } from './login-rate-limit';

describe('InMemoryLoginRateLimiter', () => {
  it('rejects invalid constructor parameters with RangeError', () => {
    strictAssert.throws(() => new InMemoryLoginRateLimiter(0, 1000, 10), RangeError);
    strictAssert.throws(() => new InMemoryLoginRateLimiter(-1, 1000, 10), RangeError);
    strictAssert.throws(() => new InMemoryLoginRateLimiter(1.5, 1000, 10), RangeError);

    strictAssert.throws(() => new InMemoryLoginRateLimiter(5, 0, 10), RangeError);
    strictAssert.throws(() => new InMemoryLoginRateLimiter(5, -100, 10), RangeError);
    strictAssert.throws(() => new InMemoryLoginRateLimiter(5, Number.POSITIVE_INFINITY, 10), RangeError);

    strictAssert.throws(() => new InMemoryLoginRateLimiter(5, 1000, 0), RangeError);
    strictAssert.throws(() => new InMemoryLoginRateLimiter(5, 1000, -5), RangeError);
    strictAssert.throws(() => new InMemoryLoginRateLimiter(5, 1000, 2.5), RangeError);
  });

  it('verifies unsafe methods (reserve, clear, releaseReservation) do not exist on prototype', () => {
    const limiter = new InMemoryLoginRateLimiter();
    strictAssert.equal((limiter as unknown as Record<string, unknown>).reserve, undefined);
    strictAssert.equal((limiter as unknown as Record<string, unknown>).clear, undefined);
    strictAssert.equal((limiter as unknown as Record<string, unknown>).releaseReservation, undefined);
  });

  it('allows normal attempts below configured threshold', () => {
    const limiter = new InMemoryLoginRateLimiter(3, 1000, 10);
    const client = 'client-normal';

    const r1 = limiter.tryReserve(client, 100);
    strictAssert.notEqual(r1, null);
    strictAssert.equal(limiter.getInFlightCount(client), 1);
    r1?.recordFailure(100);

    const r2 = limiter.tryReserve(client, 101);
    strictAssert.notEqual(r2, null);
    strictAssert.equal(limiter.getInFlightCount(client), 1);
    r2?.recordFailure(101);

    strictAssert.equal(limiter.getFailedCount(client, 102), 2);
    strictAssert.equal(limiter.isLimited(client, 102), false);
  });

  it('rejects attempt after reaching configured threshold', () => {
    const limiter = new InMemoryLoginRateLimiter(3, 1000, 10);
    const client = 'client-threshold';

    for (let i = 0; i < 3; i++) {
      const r = limiter.tryReserve(client, 100 + i);
      strictAssert.notEqual(r, null);
      r?.recordFailure(100 + i);
    }

    strictAssert.equal(limiter.isLimited(client, 105), true);

    const r4 = limiter.tryReserve(client, 105);
    strictAssert.equal(r4, null);
  });

  it('cleans up expired timestamps outside window', () => {
    const limiter = new InMemoryLoginRateLimiter(2, 1000, 10);
    const client = 'client-expiry';

    const r1 = limiter.tryReserve(client, 100);
    r1?.recordFailure(100);

    const r2 = limiter.tryReserve(client, 200);
    r2?.recordFailure(200);

    strictAssert.equal(limiter.isLimited(client, 300), true);

    strictAssert.equal(limiter.getFailedCount(client, 1105), 1);
    strictAssert.equal(limiter.isLimited(client, 1105), false);

    strictAssert.equal(limiter.getFailedCount(client, 1205), 0);
    strictAssert.equal(limiter.getClientCount(), 0);
  });

  it('releases reservation when error is thrown in try-finally block', async () => {
    const limiter = new InMemoryLoginRateLimiter(2, 1000, 10);
    const client = 'client-error';

    async function attemptWithFailure() {
      const res = limiter.tryReserve(client, 100);
      strictAssert.notEqual(res, null);
      try {
        throw new Error('Password hash failed unexpectedly');
      } finally {
        res?.release();
      }
    }

    await strictAssert.rejects(attemptWithFailure(), { message: 'Password hash failed unexpectedly' });

    strictAssert.equal(limiter.getInFlightCount(client), 0);
    strictAssert.equal(limiter.getFailedCount(client, 100), 0);
    strictAssert.equal(limiter.getClientCount(), 0);
  });

  it('ensures stored timestamp count never exceeds hard bound', () => {
    const limiter = new InMemoryLoginRateLimiter(5, 1000, 10);
    const client = 'client-bound';

    for (let i = 0; i < 50; i++) {
      limiter.recordFailure(client, 100 + i);
    }

    strictAssert.equal(limiter.getFailedCount(client, 200), 5);
  });

  it('enforces client-map cleanup and maximum bound with inactive clients', () => {
    const maxClients = 3;
    const limiter = new InMemoryLoginRateLimiter(5, 1000, maxClients);

    for (let i = 0; i < 10; i++) {
      limiter.recordFailure(`client-${i}`, 100 + i);
      strictAssert.ok(limiter.getClientCount() <= maxClients);
    }

    strictAssert.equal(limiter.getClientCount(), maxClients);
  });

  it('handles 5 active reservations, one succeeds: 4 remaining, 1 new allowed, next rejected', () => {
    const limiter = new InMemoryLoginRateLimiter(5, 1000, 10);
    const client = 'client-concurrency-success';

    const r1 = limiter.tryReserve(client, 100);
    const r2 = limiter.tryReserve(client, 100);
    const r3 = limiter.tryReserve(client, 100);
    const r4 = limiter.tryReserve(client, 100);
    const r5 = limiter.tryReserve(client, 100);

    strictAssert.notEqual(r1, null);
    strictAssert.notEqual(r2, null);
    strictAssert.notEqual(r3, null);
    strictAssert.notEqual(r4, null);
    strictAssert.notEqual(r5, null);
    strictAssert.equal(limiter.getInFlightCount(client), 5);

    const r6 = limiter.tryReserve(client, 100);
    strictAssert.equal(r6, null);

    r1?.recordSuccess();

    strictAssert.equal(limiter.getInFlightCount(client), 4);
    strictAssert.equal(limiter.getFailedCount(client, 100), 0);

    const rNew1 = limiter.tryReserve(client, 101);
    strictAssert.notEqual(rNew1, null);
    strictAssert.equal(limiter.getInFlightCount(client), 5);

    const rNew2 = limiter.tryReserve(client, 101);
    strictAssert.equal(rNew2, null);

    r2?.release();
    r3?.release();
    r4?.release();
    r5?.release();
    rNew1?.release();
    strictAssert.equal(limiter.getInFlightCount(client), 0);
  });

  it('rejects new reservation when client map is full with all records active', () => {
    const limiter = new InMemoryLoginRateLimiter(5, 1000, 3);

    const r1 = limiter.tryReserve('client-1', 100);
    const r2 = limiter.tryReserve('client-2', 100);
    const r3 = limiter.tryReserve('client-3', 100);

    strictAssert.notEqual(r1, null);
    strictAssert.notEqual(r2, null);
    strictAssert.notEqual(r3, null);
    strictAssert.equal(limiter.getClientCount(), 3);

    const r4 = limiter.tryReserve('client-4', 100);
    strictAssert.equal(r4, null);

    strictAssert.equal(limiter.getClientCount(), 3);

    r1?.recordSuccess();
    strictAssert.equal(limiter.getClientCount(), 2);

    const r4Retry = limiter.tryReserve('client-4', 100);
    strictAssert.notEqual(r4Retry, null);

    r2?.release();
    r3?.release();
    r4Retry?.release();
  });

  it('standalone recordFailure while another reservation is active does not decrease inFlight count', () => {
    const limiter = new InMemoryLoginRateLimiter(5, 1000, 10);
    const client = 'client-standalone-fail';

    const r1 = limiter.tryReserve(client, 100);
    strictAssert.notEqual(r1, null);
    strictAssert.equal(limiter.getInFlightCount(client), 1);

    const isLim = limiter.recordFailure(client, 101);
    strictAssert.equal(isLim, false);

    strictAssert.equal(limiter.getInFlightCount(client), 1);
    strictAssert.equal(limiter.getFailedCount(client, 101), 1);

    r1?.release();
    strictAssert.equal(limiter.getInFlightCount(client), 0);
  });

  it('handles recordSuccess() followed by recordFailure(): no timestamp added, returns false, preserves other reservations', () => {
    const limiter = new InMemoryLoginRateLimiter(5, 1000, 10);
    const client = 'client-success-then-fail';

    const r1 = limiter.tryReserve(client, 100);
    const r2 = limiter.tryReserve(client, 100);

    strictAssert.notEqual(r1, null);
    strictAssert.notEqual(r2, null);
    strictAssert.equal(limiter.getInFlightCount(client), 2);

    r1?.recordSuccess();
    strictAssert.equal(limiter.getInFlightCount(client), 1);
    strictAssert.equal(limiter.getFailedCount(client, 100), 0);

    const failResult = r1?.recordFailure(105);
    strictAssert.equal(failResult, false);
    strictAssert.equal(limiter.getFailedCount(client, 105), 0);
    strictAssert.equal(limiter.getInFlightCount(client), 1);

    r2?.release();
    strictAssert.equal(limiter.getInFlightCount(client), 0);
  });

  it('handles release() followed by recordFailure(): no timestamp added, returns false', () => {
    const limiter = new InMemoryLoginRateLimiter(5, 1000, 10);
    const client = 'client-release-then-fail';

    const r1 = limiter.tryReserve(client, 100);
    strictAssert.notEqual(r1, null);

    r1?.release();
    strictAssert.equal(limiter.getInFlightCount(client), 0);
    strictAssert.equal(limiter.getFailedCount(client, 100), 0);

    const failResult = r1?.recordFailure(105);
    strictAssert.equal(failResult, false);
    strictAssert.equal(limiter.getFailedCount(client, 105), 0);
    strictAssert.equal(limiter.getInFlightCount(client), 0);
  });

  it('handles failed reservation called repeatedly: returns same cached boolean and stores one timestamp only', () => {
    const limiter = new InMemoryLoginRateLimiter(3, 1000, 10);
    const client = 'client-repeat-fail';

    const r1 = limiter.tryReserve(client, 100);
    const r2 = limiter.tryReserve(client, 100);
    const r3 = limiter.tryReserve(client, 100);

    strictAssert.notEqual(r1, null);
    strictAssert.notEqual(r2, null);
    strictAssert.notEqual(r3, null);

    const res1 = r1?.recordFailure(100);
    strictAssert.equal(res1, true);

    const res1Again = r1?.recordFailure(200);
    strictAssert.equal(res1Again, true);
    strictAssert.equal(limiter.getFailedCount(client, 200), 1);

    r2?.release();
    r3?.release();
    strictAssert.equal(limiter.getInFlightCount(client), 0);
  });
});
