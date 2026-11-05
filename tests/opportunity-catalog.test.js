import assert from 'node:assert/strict';
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
      lastVerifiedAt: '2026-11-05',
    }],
  };

  assert.throws(() => validateOpportunityCatalog(catalog), /unsupported structure/);
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
