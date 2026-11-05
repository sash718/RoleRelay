import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { loadOpportunityCatalog, validateOpportunityCatalog } from '../src/features/opportunities/catalog.js';

const emptyCatalog = {
  catalogVersion: 1,
  lastCheckedAt: '2026-11-05',
  events: [],
};

function createResponse(data, ok = true) {
  return { ok, json: async () => data };
}

test('accepts an empty, valid opportunity catalog', () => {
  assert.deepEqual(validateOpportunityCatalog(emptyCatalog), []);
});

test('rejects an event without a required official source', () => {
  const catalog = {
    ...emptyCatalog,
    events: [{
      id: 'example-event',
      title: 'Example event',
      organizer: 'Example organiser',
      category: 'Software development',
      mode: 'online',
      location: null,
      startsAt: null,
      registrationDeadline: null,
      description: 'This record is intentionally incomplete for validation testing.',
      sourceUrl: '',
      registrationUrl: null,
      lastVerifiedAt: null,
      isDemo: true,
    }],
  };

  assert.throws(() => validateOpportunityCatalog(catalog), /unsupported structure/);
});

test('the published catalog contains clearly marked demo opportunities', async () => {
  const contents = await readFile(new URL('../public/events.json', import.meta.url), 'utf8');
  const events = validateOpportunityCatalog(JSON.parse(contents));

  assert.ok(events.length >= 3);
  assert.ok(events.every((event) => event.isDemo && event.lastVerifiedAt === null));
  assert.ok(events.every((event) => event.description.includes('not a real event')));
});

test('loads and validates a catalog through fetch', async () => {
  const events = await loadOpportunityCatalog(async () => createResponse(emptyCatalog));

  assert.deepEqual(events, []);
});

test('reports an unavailable catalog when fetch fails or returns an error status', async () => {
  await assert.rejects(
    loadOpportunityCatalog(async () => { throw new Error('Network unavailable'); }),
    /catalog is unavailable/,
  );
  await assert.rejects(loadOpportunityCatalog(async () => createResponse(emptyCatalog, false)), /catalog is unavailable/);
});

test('reports malformed JSON without providing fallback records', async () => {
  await assert.rejects(
    loadOpportunityCatalog(async () => ({ ok: true, json: async () => { throw new SyntaxError('Invalid JSON'); } })),
    /catalog could not be read/,
  );
});
