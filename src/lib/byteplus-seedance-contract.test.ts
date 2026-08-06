import { describe, it } from 'node:test';
import strictAssert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  createBytePlusSeedanceTask,
  getBytePlusSeedanceTaskStatus,
  downloadVideoToOutputFolder,
  safeVideoFilename,
  BytePlusProviderError,
} from './byteplus-seedance-real';
import {
  getArkEndpoints,
  getArkConfigStatus,
  requireArkApiKey,
} from './seedance-config';
import {
  buildSeedancePayload,
  validateSeedancePayload,
  SEEDANCE_MODEL_IDS,
  REFERENCE_LIMITS_SEEDANCE,
  type SeedanceReferences,
} from './seedance-validation';

// ═════════════════════════════════════════════════════════════════════════
// BytePlus / ModelArk contract readiness tests (offline, zero-spend).
//
// The only "API key" used here is a clearly fake test fixture. No real key is
// ever read, printed, or sent. All provider interactions go through the
// injected fetch transport seam — no network request is made.
// ═════════════════════════════════════════════════════════════════════════

const FAKE_ARK_KEY = 'test-only-fake-ark-key-0-do-not-use';
const DEFAULT_CREATE_URL = 'https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks';

// ─── Test helpers ───

function withEnv<T>(changes: Record<string, string | undefined>, fn: () => T | Promise<T>): Promise<T> {
  const saved: Record<string, string | undefined> = {};
  for (const key of Object.keys(changes)) saved[key] = process.env[key];
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return Promise.resolve().then(fn).finally(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

function withFakeArkEnv<T>(fn: () => T | Promise<T>): Promise<T> {
  return withEnv({
    ARK_API_KEY: FAKE_ARK_KEY,
    ARK_BASE_URL: undefined,
    ARK_ALLOW_CUSTOM_HOST: undefined,
    DRY_RUN: 'false',
    ENABLE_REAL_API: 'true',
    ALLOW_PAID_CALLS: 'true',
  }, fn);
}

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

type CapturedCall = { url: string; init: RequestInit };

function captureFetch(
  calls: CapturedCall[],
  responder: (url: string, init: RequestInit) => Response | Promise<Response>,
): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    calls.push({ url, init: init ?? {} });
    return responder(url, init ?? {});
  };
}

function hangFetch(): typeof fetch {
  return (async (_input: RequestInfo | URL, init?: RequestInit) => {
    return await new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        reject(new DOMException('The operation was aborted.', 'AbortError'));
      });
    });
  }) as typeof fetch;
}

const SAMPLE_PAYLOAD = {
  model: SEEDANCE_MODEL_IDS.STANDARD,
  content: [{ type: 'text', text: 'lioness in grass' }],
  ratio: '9:16',
  duration: 15,
  resolution: '720p',
  watermark: false,
  generate_audio: true,
  return_last_frame: true,
};

const EMPTY_REFS: SeedanceReferences = { images: [], videos: [], audios: [] };

function readRoute(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');
}

const realGenerateSource = readRoute('../app/api/real-generate/route.ts');
const realTaskStatusSource = readRoute('../app/api/real-task-status/route.ts');
const providerSource = readRoute('./byteplus-seedance-real.ts');

function sourceIndex(source: string, needle: string): number {
  const index = source.indexOf(needle);
  strictAssert.ok(index !== -1, `expected source to contain: ${needle}`);
  return index;
}

// ═════════════════════════════════════════════════════════════════════════
// REQUEST CONTRACT — endpoints, regions, HTTPS, auth, payload
// ═════════════════════════════════════════════════════════════════════════

describe('BytePlus endpoint construction', () => {
  it('defaults to the official ap-southeast-1 base URL and /api/v3 paths', () => {
    strictAssert.equal(
      getArkEndpoints().createTask,
      'https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks',
    );
    strictAssert.equal(
      getArkEndpoints().getTask('cgt-1'),
      'https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks/cgt-1',
    );
  });

  it('accepts the official eu-west-1 regional host', async () => {
    await withEnv({ ARK_BASE_URL: 'https://ark.eu-west.bytepluses.com' }, () => {
      strictAssert.equal(
        getArkEndpoints().createTask,
        'https://ark.eu-west.bytepluses.com/api/v3/contents/generations/tasks',
      );
    });
  });

  it('rejects unsupported hosts by default', async () => {
    await withEnv({ ARK_BASE_URL: 'https://evil.example.com' }, () => {
      strictAssert.throws(() => getArkEndpoints(), /not an approved BytePlus ModelArk host/);
    });
  });

  it('enforces HTTPS even on an approved host', async () => {
    await withEnv({ ARK_BASE_URL: 'http://ark.ap-southeast.bytepluses.com' }, () => {
      strictAssert.throws(() => getArkEndpoints(), /must use HTTPS/);
    });
  });

  it('allows a custom host only with explicit opt-in', async () => {
    await withEnv({ ARK_BASE_URL: 'https://my-proxy.example.com', ARK_ALLOW_CUSTOM_HOST: 'true' }, () => {
      strictAssert.ok(getArkEndpoints().createTask.startsWith('https://my-proxy.example.com'));
    });
  });

  it('rejects a malformed base URL', async () => {
    await withEnv({ ARK_BASE_URL: 'not a url' }, () => {
      strictAssert.throws(() => getArkEndpoints(), /not a valid URL/);
    });
  });

  it('getArkConfigStatus never exposes the API key', async () => {
    await withFakeArkEnv(() => {
      const config = getArkConfigStatus();
      strictAssert.equal(config.configured, true);
      strictAssert.doesNotMatch(JSON.stringify(config), new RegExp(FAKE_ARK_KEY));
    });
  });

  it('requireArkApiKey fails closed when unset and returns the value when set', () => {
    const saved = process.env.ARK_API_KEY;
    delete process.env.ARK_API_KEY;
    try {
      strictAssert.throws(() => requireArkApiKey(), /ARK_API_KEY is not configured/);
    } finally {
      if (saved === undefined) delete process.env.ARK_API_KEY;
      else process.env.ARK_API_KEY = saved;
    }
    process.env.ARK_API_KEY = FAKE_ARK_KEY;
    try {
      strictAssert.equal(requireArkApiKey(), FAKE_ARK_KEY);
    } finally {
      if (saved === undefined) delete process.env.ARK_API_KEY;
      else process.env.ARK_API_KEY = saved;
    }
  });
});

describe('BytePlus create-task request contract', () => {
  it('forms the Authorization header server-side and posts to the verified endpoint', async () => {
    await withFakeArkEnv(async () => {
      const calls: CapturedCall[] = [];
      const fetchImpl = captureFetch(calls, () => jsonResponse(200, { id: 'cgt-1' }));
      await createBytePlusSeedanceTask(SAMPLE_PAYLOAD, { fetchImpl });

      strictAssert.equal(calls.length, 1);
      strictAssert.equal(calls[0].url, DEFAULT_CREATE_URL);
      strictAssert.equal(calls[0].init.method, 'POST');
      const headers = calls[0].init.headers as Record<string, unknown>;
      strictAssert.equal(headers.Authorization, `Bearer ${FAKE_ARK_KEY}`);
      strictAssert.equal(headers['Content-Type'], 'application/json');
    });
  });

  it('forwards the exact built payload as the request body', async () => {
    await withFakeArkEnv(async () => {
      const calls: CapturedCall[] = [];
      const fetchImpl = captureFetch(calls, () => jsonResponse(200, { id: 'cgt-1' }));
      await createBytePlusSeedanceTask(SAMPLE_PAYLOAD, { fetchImpl });
      strictAssert.deepEqual(JSON.parse(calls[0].init.body as string), SAMPLE_PAYLOAD);
    });
  });

  it('never includes the API key in the returned structure', async () => {
    await withFakeArkEnv(async () => {
      const fetchImpl = captureFetch([], () => jsonResponse(200, { id: 'cgt-1' }));
      const result = await createBytePlusSeedanceTask(SAMPLE_PAYLOAD, { fetchImpl });
      strictAssert.doesNotMatch(JSON.stringify(result), new RegExp(FAKE_ARK_KEY));
    });
  });

  it('provider is never called when the activation gates fail (missing key)', async () => {
    await withEnv({ ARK_API_KEY: undefined, DRY_RUN: 'false', ENABLE_REAL_API: 'true', ALLOW_PAID_CALLS: 'true' }, async () => {
      const calls: CapturedCall[] = [];
      const fetchImpl = captureFetch(calls, () => jsonResponse(200, { id: 'cgt-1' }));
      await strictAssert.rejects(
        createBytePlusSeedanceTask(SAMPLE_PAYLOAD, { fetchImpl }),
        /server-side API key is missing/,
      );
      strictAssert.equal(calls.length, 0);
    });
  });

  it('provider is never called when DRY_RUN is true', async () => {
    await withEnv({ ARK_API_KEY: FAKE_ARK_KEY, DRY_RUN: 'true', ENABLE_REAL_API: 'true', ALLOW_PAID_CALLS: 'true' }, async () => {
      const calls: CapturedCall[] = [];
      const fetchImpl = captureFetch(calls, () => jsonResponse(200, { id: 'cgt-1' }));
      await strictAssert.rejects(createBytePlusSeedanceTask(SAMPLE_PAYLOAD, { fetchImpl }), /DRY_RUN/);
      strictAssert.equal(calls.length, 0);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════
// TASK CREATION RESPONSES
// ═════════════════════════════════════════════════════════════════════════

describe('BytePlus create-task response parsing', () => {
  it('accepts the official { id } response shape', async () => {
    await withFakeArkEnv(async () => {
      const fetchImpl = captureFetch([], () => jsonResponse(200, { id: 'cgt-20260806-abc123' }));
      const result = await createBytePlusSeedanceTask(SAMPLE_PAYLOAD, { fetchImpl });
      strictAssert.deepEqual(result, { providerTaskId: 'cgt-20260806-abc123' });
    });
  });

  it('accepts the legacy { task_id } shape', async () => {
    await withFakeArkEnv(async () => {
      const fetchImpl = captureFetch([], () => jsonResponse(200, { task_id: 'cgt-legacy' }));
      const result = await createBytePlusSeedanceTask(SAMPLE_PAYLOAD, { fetchImpl });
      strictAssert.deepEqual(result, { providerTaskId: 'cgt-legacy' });
    });
  });

  it('rejects malformed JSON bodies', async () => {
    await withFakeArkEnv(async () => {
      const fetchImpl = captureFetch([], () => new Response('not-json', { status: 200 }));
      await strictAssert.rejects(
        createBytePlusSeedanceTask(SAMPLE_PAYLOAD, { fetchImpl }),
        /did not include a valid task id/,
      );
    });
  });

  it('rejects responses with no task id', async () => {
    await withFakeArkEnv(async () => {
      const fetchImpl = captureFetch([], () => jsonResponse(200, { status: 'queued' }));
      await strictAssert.rejects(createBytePlusSeedanceTask(SAMPLE_PAYLOAD, { fetchImpl }), /valid task id/);
    });
  });

  it('rejects empty task ids', async () => {
    await withFakeArkEnv(async () => {
      const fetchImpl = captureFetch([], () => jsonResponse(200, { id: '  ' }));
      await strictAssert.rejects(createBytePlusSeedanceTask(SAMPLE_PAYLOAD, { fetchImpl }), /valid task id/);
    });
  });

  it('rejects unexpected data shapes', async () => {
    await withFakeArkEnv(async () => {
      const arrayFetch = captureFetch([], () => jsonResponse(200, [1, 2, 3]));
      await strictAssert.rejects(createBytePlusSeedanceTask(SAMPLE_PAYLOAD, { fetchImpl: arrayFetch }), /valid task id/);
    });
  });

  it('throws a sanitized BytePlusProviderError on HTTP 400', async () => {
    await withFakeArkEnv(async () => {
      const body = { error: { code: 'InvalidParameter', message: 'ratio unsupported', internal_note: 'SECRET_INTERNAL_MARKER' } };
      const fetchImpl = captureFetch([], () => jsonResponse(400, body));
      let caught: unknown;
      try {
        await createBytePlusSeedanceTask(SAMPLE_PAYLOAD, { fetchImpl });
      } catch (error) {
        caught = error;
      }
      strictAssert.ok(caught instanceof BytePlusProviderError);
      strictAssert.equal((caught as BytePlusProviderError).statusCode, 400);
      strictAssert.equal((caught as BytePlusProviderError).providerCode, 'InvalidParameter');
      strictAssert.match((caught as Error).message, /HTTP 400/);
      strictAssert.match((caught as Error).message, /code=InvalidParameter/);
      strictAssert.match((caught as Error).message, /ratio unsupported/);
      // Raw provider body must not be exposed, and the key must never appear.
      strictAssert.doesNotMatch((caught as Error).message, /SECRET_INTERNAL_MARKER/);
      strictAssert.doesNotMatch((caught as Error).message, new RegExp(FAKE_ARK_KEY));
    });
  });

  for (const status of [401, 403, 404, 409, 500, 502, 503]) {
    it(`throws on HTTP ${status} without retrying`, async () => {
      await withFakeArkEnv(async () => {
        const calls: CapturedCall[] = [];
        const fetchImpl = captureFetch(calls, () => jsonResponse(status, { error: { code: 'ProviderError', message: 'nope' } }));
        let caught: unknown;
        try {
          await createBytePlusSeedanceTask(SAMPLE_PAYLOAD, { fetchImpl });
        } catch (error) {
          caught = error;
        }
        strictAssert.ok(caught instanceof BytePlusProviderError);
        strictAssert.equal((caught as BytePlusProviderError).statusCode, status);
        strictAssert.match((caught as Error).message, new RegExp(`HTTP ${status}`));
        strictAssert.equal(calls.length, 1);
      });
    });
  }

  it('preserves Retry-After on HTTP 429', async () => {
    await withFakeArkEnv(async () => {
      const fetchImpl = captureFetch([], () => jsonResponse(429, { error: { code: 'RateLimitExceeded', message: 'slow down' } }, { 'retry-after': '30' }));
      let caught: unknown;
      try {
        await createBytePlusSeedanceTask(SAMPLE_PAYLOAD, { fetchImpl });
      } catch (error) {
        caught = error;
      }
      strictAssert.ok(caught instanceof BytePlusProviderError);
      strictAssert.equal((caught as BytePlusProviderError).statusCode, 429);
      strictAssert.equal((caught as BytePlusProviderError).retryAfterSeconds, 30);
      strictAssert.match((caught as Error).message, /retry-after=30s/);
    });
  });

  it('times out instead of hanging forever', async () => {
    await withFakeArkEnv(async () => {
      await strictAssert.rejects(
        createBytePlusSeedanceTask(SAMPLE_PAYLOAD, { fetchImpl: hangFetch(), timeoutMs: 50 }),
        /timed out after 50ms/,
      );
    });
  });

  it('propagates network failures as ambiguous transport errors (no retry)', async () => {
    await withFakeArkEnv(async () => {
      const failingFetch = (async () => { throw new TypeError('fetch failed'); }) as typeof fetch;
      await strictAssert.rejects(
        createBytePlusSeedanceTask(SAMPLE_PAYLOAD, { fetchImpl: failingFetch }),
        TypeError,
      );
    });
  });

  it('never retries a failed create automatically', async () => {
    await withFakeArkEnv(async () => {
      const calls: CapturedCall[] = [];
      const fetchImpl = captureFetch(calls, () => jsonResponse(503, { error: { code: 'ServiceUnavailable', message: 'busy' } }));
      await strictAssert.rejects(createBytePlusSeedanceTask(SAMPLE_PAYLOAD, { fetchImpl }));
      strictAssert.equal(calls.length, 1);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════
// STATUS RESPONSES
// ═════════════════════════════════════════════════════════════════════════

describe('BytePlus status response parsing', () => {
  const cases: Array<{ raw: string; expected: string }> = [
    { raw: 'queued', expected: 'queued' },
    { raw: 'running', expected: 'running' },
    { raw: 'cancelled', expected: 'cancelled' },
    { raw: 'succeeded', expected: 'succeeded' },
    { raw: 'failed', expected: 'failed' },
    { raw: 'expired', expected: 'expired' },
  ];
  for (const { raw, expected } of cases) {
    it(`maps official status "${raw}" to "${expected}"`, async () => {
      await withFakeArkEnv(async () => {
        const fetchImpl = captureFetch([], () => jsonResponse(200, { id: 'cgt-1', status: raw }));
        const result = await getBytePlusSeedanceTaskStatus('cgt-1', { fetchImpl });
        strictAssert.equal(result.status, expected);
        strictAssert.equal(result.rawStatus, raw);
      });
    });
  }

  it('maps an unknown status to "unknown", never "submitted"', async () => {
    await withFakeArkEnv(async () => {
      const fetchImpl = captureFetch([], () => jsonResponse(200, { id: 'cgt-1', status: 'weird_new_state' }));
      const result = await getBytePlusSeedanceTaskStatus('cgt-1', { fetchImpl });
      strictAssert.equal(result.status, 'unknown');
      strictAssert.equal(result.rawStatus, 'weird_new_state');
      strictAssert.notEqual(result.status, 'submitted');
      strictAssert.notEqual(result.status, 'succeeded');
    });
  });

  it('maps a missing status to "unknown"', async () => {
    await withFakeArkEnv(async () => {
      const fetchImpl = captureFetch([], () => jsonResponse(200, { id: 'cgt-1' }));
      const result = await getBytePlusSeedanceTaskStatus('cgt-1', { fetchImpl });
      strictAssert.equal(result.status, 'unknown');
    });
  });

  it('extracts content.video_url and content.last_frame_url on success', async () => {
    await withFakeArkEnv(async () => {
      const fetchImpl = captureFetch([], () => jsonResponse(200, {
        id: 'cgt-1',
        status: 'succeeded',
        content: { video_url: 'https://cdn.bytepluses.com/out/v.mp4', last_frame_url: 'https://cdn.bytepluses.com/out/last.png' },
      }));
      const result = await getBytePlusSeedanceTaskStatus('cgt-1', { fetchImpl });
      strictAssert.equal(result.status, 'succeeded');
      strictAssert.equal(result.videoUrl, 'https://cdn.bytepluses.com/out/v.mp4');
      strictAssert.equal(result.lastFrameUrl, 'https://cdn.bytepluses.com/out/last.png');
    });
  });

  it('extracts error.code and error.message on failure', async () => {
    await withFakeArkEnv(async () => {
      const fetchImpl = captureFetch([], () => jsonResponse(200, {
        id: 'cgt-1',
        status: 'failed',
        error: { code: 'ContentModeration', message: 'Content was filtered' },
      }));
      const result = await getBytePlusSeedanceTaskStatus('cgt-1', { fetchImpl });
      strictAssert.equal(result.status, 'failed');
      strictAssert.equal(result.errorCode, 'ContentModeration');
      strictAssert.equal(result.errorMessage, 'Content was filtered');
    });
  });

  it('never claims success without an official succeeded state', async () => {
    await withFakeArkEnv(async () => {
      for (const status of ['weird', 'queued', 'running']) {
        const fetchImpl = captureFetch([], () => jsonResponse(200, { id: 'cgt-1', status }));
        const result = await getBytePlusSeedanceTaskStatus('cgt-1', { fetchImpl });
        strictAssert.notEqual(result.status, 'succeeded');
        strictAssert.equal(result.videoUrl, null);
      }
    });
  });

  it('returns null videoUrl when succeeded without an output URL', async () => {
    await withFakeArkEnv(async () => {
      const fetchImpl = captureFetch([], () => jsonResponse(200, { id: 'cgt-1', status: 'succeeded', content: {} }));
      const result = await getBytePlusSeedanceTaskStatus('cgt-1', { fetchImpl });
      strictAssert.equal(result.status, 'succeeded');
      strictAssert.equal(result.videoUrl, null);
    });
  });

  it('ignores undocumented content fields (defensive parsing)', async () => {
    await withFakeArkEnv(async () => {
      const fetchImpl = captureFetch([], () => jsonResponse(200, {
        id: 'cgt-1',
        status: 'succeeded',
        content: { video_url: 'https://cdn.bytepluses.com/out/v.mp4', extra_thing: 'IGNORED_FIELD' },
        unexpected: 'IGNORED_TOP',
      }));
      const result = await getBytePlusSeedanceTaskStatus('cgt-1', { fetchImpl });
      strictAssert.equal(result.videoUrl, 'https://cdn.bytepluses.com/out/v.mp4');
      strictAssert.doesNotMatch(JSON.stringify(result), /IGNORED_FIELD|IGNORED_TOP/);
    });
  });

  it('parses usage.completion_tokens and usage.total_tokens', async () => {
    await withFakeArkEnv(async () => {
      const fetchImpl = captureFetch([], () => jsonResponse(200, {
        id: 'cgt-1', status: 'succeeded', content: { video_url: 'https://cdn.bytepluses.com/out/v.mp4' },
        usage: { total_tokens: 324900, completion_tokens: 324900 },
      }));
      const result = await getBytePlusSeedanceTaskStatus('cgt-1', { fetchImpl });
      strictAssert.equal(result.completionTokens, 324900);
      strictAssert.equal(result.totalTokens, 324900);
    });
  });

  it('treats non-numeric usage as null', async () => {
    await withFakeArkEnv(async () => {
      const fetchImpl = captureFetch([], () => jsonResponse(200, {
        id: 'cgt-1', status: 'succeeded',
        usage: { total_tokens: 'lots', completion_tokens: 'many' },
      }));
      const result = await getBytePlusSeedanceTaskStatus('cgt-1', { fetchImpl });
      strictAssert.equal(result.completionTokens, null);
      strictAssert.equal(result.totalTokens, null);
    });
  });

  it('status polling uses GET, sends no body, and never creates a generation', async () => {
    await withFakeArkEnv(async () => {
      const calls: CapturedCall[] = [];
      const fetchImpl = captureFetch(calls, () => jsonResponse(200, { id: 'cgt-1', status: 'queued' }));
      await getBytePlusSeedanceTaskStatus('cgt-1', { fetchImpl });
      strictAssert.equal(calls.length, 1);
      strictAssert.equal(calls[0].init.method, 'GET');
      strictAssert.equal(calls[0].url, `${DEFAULT_CREATE_URL}/cgt-1`);
      strictAssert.equal(calls[0].init.body, undefined);
      const headers = calls[0].init.headers as Record<string, unknown>;
      strictAssert.equal(headers.Authorization, `Bearer ${FAKE_ARK_KEY}`);
    });
  });

  it('does not leak the API key into the serialized status', async () => {
    await withFakeArkEnv(async () => {
      const fetchImpl = captureFetch([], () => jsonResponse(200, { id: 'cgt-1', status: 'queued' }));
      const result = await getBytePlusSeedanceTaskStatus('cgt-1', { fetchImpl });
      strictAssert.doesNotMatch(JSON.stringify(result), new RegExp(FAKE_ARK_KEY));
    });
  });

  it('throws a clear auth error on status HTTP 401/403', async () => {
    await withFakeArkEnv(async () => {
      for (const status of [401, 403]) {
        const fetchImpl = captureFetch([], () => jsonResponse(status, { error: { code: 'AuthenticationError', message: 'bad key' } }));
        await strictAssert.rejects(
          getBytePlusSeedanceTaskStatus('cgt-1', { fetchImpl }),
          /authentication failed/i,
        );
      }
    });
  });

  it('throws a task-not-found error on status HTTP 404', async () => {
    await withFakeArkEnv(async () => {
      const fetchImpl = captureFetch([], () => jsonResponse(404, { error: { code: 'TaskNotFound', message: 'gone' } }));
      await strictAssert.rejects(getBytePlusSeedanceTaskStatus('cgt-1', { fetchImpl }), /task not found/i);
    });
  });

  it('preserves Retry-After on status HTTP 429', async () => {
    await withFakeArkEnv(async () => {
      const fetchImpl = captureFetch([], () => jsonResponse(429, { error: { code: 'EndpointRPMExceeded', message: 'limit' } }, { 'retry-after': '15' }));
      let caught: unknown;
      try {
        await getBytePlusSeedanceTaskStatus('cgt-1', { fetchImpl });
      } catch (error) {
        caught = error;
      }
      strictAssert.ok(caught instanceof BytePlusProviderError);
      strictAssert.equal((caught as BytePlusProviderError).retryAfterSeconds, 15);
    });
  });

  it('sanitizes provider error messages from status responses', async () => {
    await withFakeArkEnv(async () => {
      const fetchImpl = captureFetch([], () => jsonResponse(200, {
        id: 'cgt-1', status: 'failed',
        error: { code: 'GenerationFailed', message: 'Something failed\n\nwith control\u0000chars', internal: 'RAW_SECRET_XYZ' },
      }));
      const result = await getBytePlusSeedanceTaskStatus('cgt-1', { fetchImpl });
      strictAssert.equal(result.errorMessage, 'Something failed with control chars');
      strictAssert.doesNotMatch(result.errorMessage ?? '', /RAW_SECRET_XYZ/);
      strictAssert.doesNotMatch(JSON.stringify(result), new RegExp(FAKE_ARK_KEY));
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════
// OUTPUT DOWNLOAD CONTRACT
// ═════════════════════════════════════════════════════════════════════════

describe('BytePlus output download safety', () => {
  it('rejects non-HTTPS output URLs before any fetch', async () => {
    const calls: CapturedCall[] = [];
    const fetchImpl = captureFetch(calls, () => jsonResponse(200, {}));
    await strictAssert.rejects(
      downloadVideoToOutputFolder(
        { videoUrl: 'http://cdn.example.com/v.mp4', outputFolder: '/tmp/ark-test-out', filename: 'v.mp4' },
        { fetchImpl },
      ),
      /must be HTTPS/,
    );
    strictAssert.equal(calls.length, 0);
  });

  it('rejects malformed output URLs', async () => {
    const calls: CapturedCall[] = [];
    const fetchImpl = captureFetch(calls, () => jsonResponse(200, {}));
    await strictAssert.rejects(
      downloadVideoToOutputFolder(
        { videoUrl: 'not a url', outputFolder: '/tmp/ark-test-out', filename: 'v.mp4' },
        { fetchImpl },
      ),
      /invalid video URL/,
    );
    strictAssert.equal(calls.length, 0);
  });

  it('times out on a stalled download', async () => {
    await strictAssert.rejects(
      downloadVideoToOutputFolder(
        { videoUrl: 'https://cdn.bytepluses.com/out/v.mp4', outputFolder: '/tmp/ark-test-out', filename: 'v.mp4' },
        { fetchImpl: hangFetch(), timeoutMs: 50 },
      ),
      /timed out after 50ms/,
    );
  });

  it('sanitizes filenames against path traversal', () => {
    strictAssert.equal(safeVideoFilename('../evil.mp4', 'seedance-real'), 'evil.mp4');
    strictAssert.equal(safeVideoFilename('../../etc/passwd', 'seedance-real'), 'passwd.mp4');
    strictAssert.equal(safeVideoFilename('dir/clip', 'seedance-real'), 'clip.mp4');
  });

  it('downloads an HTTPS output to the output folder and verifies content', async () => {
    const outputDir = await mkdtemp(path.join(tmpdir(), 'ark-contract-'));
    try {
      const bytes = new TextEncoder().encode('fake-mp4-bytes');
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(bytes);
          controller.close();
        },
      });
      const fetchImpl = captureFetch([], () => new Response(body, { status: 200 }));
      const saved = await downloadVideoToOutputFolder(
        { videoUrl: 'https://cdn.bytepluses.com/out/v.mp4', outputFolder: outputDir, filename: 'clip.mp4' },
        { fetchImpl },
      );
      strictAssert.equal(saved.filename, 'clip.mp4');
      strictAssert.ok(saved.filePath.startsWith(path.resolve(outputDir)));
      const content = await readFile(saved.filePath);
      strictAssert.deepEqual(new TextDecoder().decode(content), 'fake-mp4-bytes');
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════
// ROUTE GATE ORDERING — provider is only reachable after every gate passes
// ═════════════════════════════════════════════════════════════════════════

describe('Real-generation route gate ordering (source contract)', () => {
  it('still uses requireProtectedMutation', () => {
    strictAssert.match(realGenerateSource, /requireProtectedMutation\(request\)/);
  });

  it('activation gates precede the provider call', () => {
    strictAssert.ok(sourceIndex(realGenerateSource, 'getRealApiBlockReason()') < sourceIndex(realGenerateSource, 'createBytePlusSeedanceTask(payload)'));
  });

  it('Safe Mode gate precedes the provider call', () => {
    strictAssert.ok(sourceIndex(realGenerateSource, "settings?.safeMode !== false") < sourceIndex(realGenerateSource, 'createBytePlusSeedanceTask(payload)'));
  });

  it('budget / max-cost check precedes the provider call', () => {
    strictAssert.ok(sourceIndex(realGenerateSource, 'budget.monthlyLimit - budget.spentThisMonth') < sourceIndex(realGenerateSource, 'createBytePlusSeedanceTask(payload)'));
    strictAssert.ok(sourceIndex(realGenerateSource, 'estimate.estimatedCostUsd > task.maxCostUsd') < sourceIndex(realGenerateSource, 'createBytePlusSeedanceTask(payload)'));
  });

  it('confirmation nonce verification precedes the provider call', () => {
    strictAssert.ok(sourceIndex(realGenerateSource, 'verifyPaidConfirmationNonce') < sourceIndex(realGenerateSource, 'createBytePlusSeedanceTask(payload)'));
  });

  it('duplicate-submission prevention precedes the provider call', () => {
    strictAssert.ok(sourceIndex(realGenerateSource, 'A matching paid submission is already active') < sourceIndex(realGenerateSource, 'createBytePlusSeedanceTask(payload)'));
  });

  it('payload validation precedes the provider call', () => {
    strictAssert.ok(sourceIndex(realGenerateSource, 'validateSeedancePayload') < sourceIndex(realGenerateSource, 'createBytePlusSeedanceTask(payload)'));
  });

  it('atomic claim precedes the provider call', () => {
    strictAssert.ok(sourceIndex(realGenerateSource, 'updateMany') < sourceIndex(realGenerateSource, 'createBytePlusSeedanceTask(payload)'));
  });

  it('has no automatic retry loop', () => {
    strictAssert.doesNotMatch(realGenerateSource, /\.retry\(/);
    strictAssert.doesNotMatch(realGenerateSource, /for \(let attempt/);
  });

  it('the status route never submits a new generation', () => {
    strictAssert.doesNotMatch(realTaskStatusSource, /createBytePlusSeedanceTask/);
    strictAssert.match(realTaskStatusSource, /getBytePlusSeedanceTaskStatus/);
  });

  it('the provider layer itself has no create retry loop', () => {
    strictAssert.doesNotMatch(providerSource, /for \(let attempt/);
    strictAssert.doesNotMatch(providerSource, /\.retry\(/);
    strictAssert.match(providerSource, /AbortController/);
  });

  it('provider responses are only read via documented fields (no raw body exposure)', () => {
    strictAssert.doesNotMatch(providerSource, /response\.text\(\)/);
    strictAssert.match(providerSource, /sanitizeProviderMessage/);
  });
});

// ═════════════════════════════════════════════════════════════════════════
// REQUEST SCHEMA — official field names validated before any transport
// ═════════════════════════════════════════════════════════════════════════

describe('Seedance payload schema (pre-transport validation)', () => {
  it('builds the payload with official field names', () => {
    const payload = buildSeedancePayload({
      modelId: SEEDANCE_MODEL_IDS.STANDARD,
      prompt: 'lioness in grass',
      ratio: '9:16',
      duration: 15,
      resolution: '720p',
      generationMode: 'reference_mode',
      references: { images: [{ role: 'reference_image', url: 'https://x.example.com/i.png' }], videos: [], audios: [] },
      watermark: false,
      generateAudio: true,
      returnLastFrame: true,
    });
    strictAssert.equal(payload.model, SEEDANCE_MODEL_IDS.STANDARD);
    strictAssert.equal(payload.ratio, '9:16');
    strictAssert.equal(payload.duration, 15);
    strictAssert.equal(payload.resolution, '720p');
    strictAssert.equal(payload.watermark, false);
    strictAssert.equal(payload.generate_audio, true);
    strictAssert.equal(payload.return_last_frame, true);
    const blocks = payload.content as Array<Record<string, unknown>>;
    strictAssert.equal(blocks[0].type, 'text');
    strictAssert.equal(blocks[1].type, 'image_url');
    strictAssert.equal((blocks[1].image_url as { url: string }).url, 'https://x.example.com/i.png');
    strictAssert.equal(blocks[1].role, 'reference_image');
  });

  it('rejects Fast + 1080p before transport', () => {
    const result = validateSeedancePayload({
      modelId: SEEDANCE_MODEL_IDS.FAST,
      prompt: 'x', ratio: '9:16', duration: 10, resolution: '1080p',
      generationMode: 'reference_mode', references: EMPTY_REFS,
    });
    strictAssert.equal(result.valid, false);
    strictAssert.ok(result.errors.some(e => /Fast and Mini support 480p\/720p only/.test(e)));
  });

  it('rejects frame_mode mixed with reference media before transport', () => {
    const result = validateSeedancePayload({
      modelId: SEEDANCE_MODEL_IDS.STANDARD,
      prompt: 'x', ratio: '9:16', duration: 10, resolution: '720p',
      generationMode: 'frame_mode',
      references: { images: [{ role: 'reference_image', url: 'https://x.example.com/i.png' }], videos: [], audios: [] },
    });
    strictAssert.equal(result.valid, false);
  });

  it('rejects more than 9 image references before transport', () => {
    const images = Array.from({ length: REFERENCE_LIMITS_SEEDANCE.reference_image + 1 }, (_, i) => ({
      role: 'reference_image', url: `https://x.example.com/${i}.png`,
    }));
    const result = validateSeedancePayload({
      modelId: SEEDANCE_MODEL_IDS.STANDARD,
      prompt: 'x', ratio: '9:16', duration: 10, resolution: '720p',
      generationMode: 'reference_mode', references: { images, videos: [], audios: [] },
    });
    strictAssert.equal(result.valid, false);
    strictAssert.ok(result.errors.some(e => /Too many image references/.test(e)));
  });

  it('rejects audio-only submissions before transport', () => {
    const result = validateSeedancePayload({
      modelId: SEEDANCE_MODEL_IDS.STANDARD,
      prompt: 'x', ratio: '9:16', duration: 10, resolution: '720p',
      generationMode: 'reference_mode',
      references: { images: [], videos: [], audios: [{ role: 'reference_audio', url: 'https://x.example.com/a.wav' }] },
    });
    strictAssert.equal(result.valid, false);
    strictAssert.ok(result.errors.some(e => /Reference audio requires at least one reference image or reference video/.test(e)));
  });

  it('accepts the official WSTV default configuration', () => {
    const result = validateSeedancePayload({
      modelId: SEEDANCE_MODEL_IDS.STANDARD,
      prompt: 'lioness in tall grass, cinematic',
      ratio: '9:16', duration: 15, resolution: '720p',
      generationMode: 'reference_mode',
      references: { images: [{ role: 'reference_image', url: 'https://x.example.com/master.png' }], videos: [], audios: [] },
    });
    strictAssert.equal(result.valid, true);
  });
});
