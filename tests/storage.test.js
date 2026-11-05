import test from 'node:test';
import assert from 'node:assert/strict';
import { readStoredData, saveStoredData } from '../src/services/storage.js';

const isValid = (data) => data !== null && data.schemaVersion === 1;

test('missing data is distinct from invalid data', () => {
  assert.deepEqual(readStoredData('workspace', isValid, { getItem: () => null }), { status: 'missing' });
});

test('valid data is parsed and checked by the feature validator', () => {
  const data = { schemaVersion: 1 };
  assert.deepEqual(readStoredData('workspace', isValid, { getItem: () => JSON.stringify(data) }), { status: 'success', data });
});

test('malformed and unsupported data return errors without writing', () => {
  for (const raw of ['{broken', 'null', '{"schemaVersion":2}']) {
    const storage = { getItem: () => raw, setItem: () => assert.fail('must not overwrite stored data') };
    assert.equal(readStoredData('workspace', isValid, storage).status, 'error');
  }
});

test('blocked reads and writes return errors', () => {
  const storage = {
    getItem() { throw new Error('Storage blocked'); },
    setItem() { throw new Error('Storage full'); },
  };
  assert.equal(readStoredData('workspace', isValid, storage).status, 'error');
  assert.equal(saveStoredData('workspace', {}, storage).status, 'error');
});

test('saving writes JSON and reports success only after the write', () => {
  let saved;
  const storage = { setItem: (key, value) => { saved = { key, value }; } };
  assert.equal(saveStoredData('workspace', { schemaVersion: 1 }, storage).status, 'success');
  assert.deepEqual(saved, { key: 'workspace', value: '{"schemaVersion":1}' });
});

test('unserializable data does not report success', () => {
  const circular = {};
  circular.self = circular;
  assert.equal(saveStoredData('workspace', circular, {}).status, 'error');
  assert.equal(saveStoredData('workspace', undefined, {}).status, 'error');
});
