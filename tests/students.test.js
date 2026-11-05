import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeTags,
  generateCandidateId,
  validateProfileInput,
  isValidProfile,
  isValidStudentsData,
  filterStudents,
  VALID_AVAILABILITIES,
} from '../src/features/students/studentValidation.js';
import { readStoredData, saveStoredData } from '../src/services/storage.js';

const sampleProfile1 = {
  id: 'cand_1',
  name: 'Alex Rivera',
  skills: ['React', 'JavaScript', 'CSS'],
  interests: ['FinTech', 'AI'],
  availability: 'weekends',
  openToTeam: true,
};

const sampleProfile2 = {
  id: 'cand_2',
  name: 'Samira Khan',
  skills: ['Python', 'FastAPI', 'PostgreSQL'],
  interests: ['HealthTech', 'Climate'],
  availability: 'part-time',
  openToTeam: false,
};

const sampleProfile3 = {
  id: 'cand_3',
  name: 'Jordan Lee',
  skills: ['React', 'TypeScript', 'Node.js'],
  interests: ['EdTech', 'AI'],
  availability: 'full-time',
  openToTeam: true,
};

test('normalizeTags handles string input with whitespace and case duplicates', () => {
  const result = normalizeTags(' React, react , Python,  FASTAPI , python ');
  assert.deepEqual(result, ['React', 'Python', 'FASTAPI']);
});

test('normalizeTags handles array input and removes empty items', () => {
  const result = normalizeTags(['Docker', '  ', 'Kubernetes', 'docker']);
  assert.deepEqual(result, ['Docker', 'Kubernetes']);
});

test('normalizeTags handles falsy or non-string inputs safely', () => {
  assert.deepEqual(normalizeTags(null), []);
  assert.deepEqual(normalizeTags(''), []);
  assert.deepEqual(normalizeTags(undefined), []);
});

test('generateCandidateId generates unique candidate IDs with prefix', () => {
  const id1 = generateCandidateId();
  const id2 = generateCandidateId();
  assert.match(id1, /^cand_/);
  assert.notEqual(id1, id2);
});

test('validateProfileInput rejects invalid or empty fields', () => {
  assert.equal(validateProfileInput({ name: '', skills: 'React', availability: 'weekends' }).isValid, false);
  assert.equal(validateProfileInput({ name: '   ', skills: 'React', availability: 'weekends' }).isValid, false);
  assert.equal(validateProfileInput({ name: 'A', skills: 'React', availability: 'weekends' }).isValid, false);
  assert.equal(validateProfileInput({ name: 'Alex', skills: '   ', availability: 'weekends' }).isValid, false);
  assert.equal(validateProfileInput({ name: 'Alex', skills: 'React', availability: 'invalid-choice' }).isValid, false);
});

test('validateProfileInput accepts valid form data', () => {
  const validation = validateProfileInput({
    name: 'Taylor Swift',
    skills: 'Singing, Writing',
    availability: 'flexible',
  });
  assert.equal(validation.isValid, true);
  assert.deepEqual(validation.errors, {});
});

test('isValidProfile validates complete profile objects strictly', () => {
  assert.equal(isValidProfile(sampleProfile1), true);
  assert.equal(isValidProfile({ ...sampleProfile1, id: '' }), false);
  assert.equal(isValidProfile({ ...sampleProfile1, name: ' ' }), false);
  assert.equal(isValidProfile({ ...sampleProfile1, skills: [] }), false);
  assert.equal(isValidProfile({ ...sampleProfile1, availability: 'unknown' }), false);
  assert.equal(isValidProfile({ ...sampleProfile1, openToTeam: 'yes' }), false);
});

test('isValidStudentsData enforces schema version 1 and unique IDs', () => {
  const validData = {
    schemaVersion: 1,
    profiles: [sampleProfile1, sampleProfile2],
  };
  assert.equal(isValidStudentsData(validData), true);

  // Rejects invalid schemaVersion
  assert.equal(isValidStudentsData({ schemaVersion: 2, profiles: [sampleProfile1] }), false);

  // Rejects non-array profiles
  assert.equal(isValidStudentsData({ schemaVersion: 1, profiles: null }), false);

  // Rejects duplicate IDs
  const duplicateIdData = {
    schemaVersion: 1,
    profiles: [sampleProfile1, { ...sampleProfile2, id: 'cand_1' }],
  };
  assert.equal(isValidStudentsData(duplicateIdData), false);
});

test('filterStudents filters by search query on name and skills', () => {
  const profiles = [sampleProfile1, sampleProfile2, sampleProfile3];

  const searchByName = filterStudents(profiles, { searchQuery: 'Samira' });
  assert.equal(searchByName.length, 1);
  assert.equal(searchByName[0].name, 'Samira Khan');

  const searchBySkill = filterStudents(profiles, { searchQuery: 'react' });
  assert.equal(searchBySkill.length, 2);
  assert.deepEqual(searchBySkill.map((p) => p.name), ['Alex Rivera', 'Jordan Lee']);
});

test('filterStudents filters by specific skill, interest, availability, and openToTeam', () => {
  const profiles = [sampleProfile1, sampleProfile2, sampleProfile3];

  const skillFiltered = filterStudents(profiles, { selectedSkill: 'TypeScript' });
  assert.equal(skillFiltered.length, 1);
  assert.equal(skillFiltered[0].name, 'Jordan Lee');

  const interestFiltered = filterStudents(profiles, { selectedInterest: 'AI' });
  assert.equal(interestFiltered.length, 2);

  const availabilityFiltered = filterStudents(profiles, { selectedAvailability: 'part-time' });
  assert.equal(availabilityFiltered.length, 1);
  assert.equal(availabilityFiltered[0].name, 'Samira Khan');

  const openToTeamFiltered = filterStudents(profiles, { openToTeamOnly: true });
  assert.equal(openToTeamFiltered.length, 2);
});

test('filterStudents handles combined filters accurately', () => {
  const profiles = [sampleProfile1, sampleProfile2, sampleProfile3];

  const combined = filterStudents(profiles, {
    selectedSkill: 'React',
    selectedInterest: 'AI',
    openToTeamOnly: true,
    selectedAvailability: 'weekends',
  });
  assert.equal(combined.length, 1);
  assert.equal(combined[0].name, 'Alex Rivera');
});

test('storage roundtrip works safely with isValidStudentsData', () => {
  const mockStorageMap = new Map();
  const mockStorage = {
    getItem: (key) => mockStorageMap.get(key) ?? null,
    setItem: (key, val) => mockStorageMap.set(key, val),
  };

  const initialRead = readStoredData('rolerelay_students', isValidStudentsData, mockStorage);
  assert.equal(initialRead.status, 'missing');

  const payload = {
    schemaVersion: 1,
    profiles: [sampleProfile1, sampleProfile2],
  };

  const saveResult = saveStoredData('rolerelay_students', payload, mockStorage);
  assert.equal(saveResult.status, 'success');

  const secondRead = readStoredData('rolerelay_students', isValidStudentsData, mockStorage);
  assert.equal(secondRead.status, 'success');
  assert.equal(secondRead.data.profiles.length, 2);
  assert.equal(secondRead.data.profiles[0].name, 'Alex Rivera');
});

test('profile editing updates profile while preserving stable ID', () => {
  const original = { ...sampleProfile1 };
  const updated = {
    ...original,
    name: 'Alex Rivera (Updated)',
    skills: ['React', 'Next.js', 'TypeScript'],
    availability: 'flexible',
  };

  assert.equal(updated.id, original.id);
  assert.equal(isValidProfile(updated), true);

  const profiles = [sampleProfile2, original];
  const nextProfiles = profiles.map((p) => (p.id === updated.id ? updated : p));

  assert.equal(nextProfiles.length, 2);
  assert.equal(nextProfiles[1].name, 'Alex Rivera (Updated)');
  assert.deepEqual(nextProfiles[1].skills, ['React', 'Next.js', 'TypeScript']);
});

test('profile removal removes targeted profile without mutating or fabricating data', () => {
  const profiles = [sampleProfile1, sampleProfile2, sampleProfile3];
  const nextProfiles = profiles.filter((p) => p.id !== 'cand_2');

  assert.equal(nextProfiles.length, 2);
  assert.deepEqual(nextProfiles.map((p) => p.id), ['cand_1', 'cand_3']);
  assert.equal(isValidStudentsData({ schemaVersion: 1, profiles: nextProfiles }), true);
});

test('corrupted storage returns error and can be explicitly recovered', () => {
  const mockStorageMap = new Map();
  const mockStorage = {
    getItem: (key) => mockStorageMap.get(key) ?? null,
    setItem: (key, val) => mockStorageMap.set(key, val),
  };

  // Set malformed JSON
  mockStorage.setItem('rolerelay_students', '{malformed-json');
  const errorRead = readStoredData('rolerelay_students', isValidStudentsData, mockStorage);
  assert.equal(errorRead.status, 'error');

  // Recovery: explicitly reset to empty clean directory
  const resetPayload = { schemaVersion: 1, profiles: [] };
  const resetSave = saveStoredData('rolerelay_students', resetPayload, mockStorage);
  assert.equal(resetSave.status, 'success');

  const cleanRead = readStoredData('rolerelay_students', isValidStudentsData, mockStorage);
  assert.equal(cleanRead.status, 'success');
  assert.deepEqual(cleanRead.data.profiles, []);
});

test('candidate ID conforms to integration requirements for Explainable Matching', () => {
  const id = generateCandidateId();
  assert.equal(typeof id, 'string');
  assert.ok(id.startsWith('cand_'));

  const candidate = {
    id,
    name: 'Morgan Blake',
    skills: ['Python', 'PyTorch'],
    interests: ['AI Research'],
    availability: 'weekends',
    openToTeam: true,
  };

  assert.equal(isValidProfile(candidate), true);
  // Member 3 and Member 4 can consume `candidate.id` directly
  assert.ok(candidate.id.length > 5);
});
