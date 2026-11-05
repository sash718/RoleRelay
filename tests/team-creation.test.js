import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TEAM_STORAGE_KEY,
  validateTeam,
  validateTeamForm,
  createBlankTeam,
  addMemberToTeam,
  removeMemberFromTeam,
  addSkillToTeam,
  removeSkillFromTeam,
  toMatchingTeam,
} from '../src/features/teams/teamModel.js';
import { readStoredData, saveStoredData } from '../src/services/storage.js';
import { CANDIDATE_PROFILES, getCandidateProfileMap } from '../src/features/students/profiles.js';
import { rankCandidates } from '../src/features/matching/matching.js';

test('1. Create a valid team', () => {
  const team = {
    id: 'team-101',
    name: 'Hackathon Pioneers',
    opportunityId: 'opp-1',
    maxMembers: 4,
    requiredSkills: ['React', 'Python'],
    memberIds: ['student-1'],
  };
  assert.equal(validateTeam(team), true);

  const formCheck = validateTeamForm(team);
  assert.equal(formCheck.isValid, true);
  assert.deepEqual(formCheck.errors, {});
});

test('2. Reject an empty team name', () => {
  const emptyNameTeam = {
    id: 'team-102',
    name: '   ',
    opportunityId: null,
    maxMembers: 4,
    requiredSkills: [],
    memberIds: [],
  };
  assert.equal(validateTeam(emptyNameTeam), false);

  const formCheck = validateTeamForm(emptyNameTeam);
  assert.equal(formCheck.isValid, false);
  assert.equal(formCheck.errors.name, 'Team name cannot be empty.');
});

test('3. Reject invalid capacity', () => {
  // Negative or zero capacity
  assert.equal(validateTeam({ id: 't1', name: 'Alpha', opportunityId: null, maxMembers: 0, requiredSkills: [], memberIds: [] }), false);
  assert.equal(validateTeam({ id: 't1', name: 'Alpha', opportunityId: null, maxMembers: -2, requiredSkills: [], memberIds: [] }), false);
  assert.equal(validateTeam({ id: 't1', name: 'Alpha', opportunityId: null, maxMembers: 3.5, requiredSkills: [], memberIds: [] }), false);

  // Capacity smaller than existing memberIds
  const undersizedTeam = {
    id: 't2',
    name: 'Beta',
    opportunityId: null,
    maxMembers: 1,
    requiredSkills: [],
    memberIds: ['student-1', 'student-2'],
  };
  assert.equal(validateTeam(undersizedTeam), false);

  const formCheck = validateTeamForm(undersizedTeam);
  assert.equal(formCheck.isValid, false);
  assert.match(formCheck.errors.maxMembers, /cannot be smaller than current membership/i);
});

test('4. Add an existing profile as a member', () => {
  const initial = createBlankTeam('opp-1');
  initial.name = 'Gamma';

  const result = addMemberToTeam(initial, 'student-1');
  assert.equal(result.success, true);
  assert.deepEqual(result.team.memberIds, ['student-1']);
});

test('5. Prevent duplicate membership', () => {
  const team = {
    id: 'team-105',
    name: 'Delta',
    opportunityId: null,
    maxMembers: 4,
    requiredSkills: [],
    memberIds: ['student-1'],
  };

  const result = addMemberToTeam(team, 'student-1');
  assert.equal(result.success, false);
  assert.equal(result.error, 'Member is already on this team.');
  assert.equal(result.team.memberIds.length, 1);
});

test('6. Prevent overfilling the team beyond capacity', () => {
  const fullTeam = {
    id: 'team-106',
    name: 'Epsilon',
    opportunityId: null,
    maxMembers: 2,
    requiredSkills: [],
    memberIds: ['student-1', 'student-2'],
  };

  const result = addMemberToTeam(fullTeam, 'cand-a');
  assert.equal(result.success, false);
  assert.match(result.error, /capacity reached/i);
  assert.equal(result.team.memberIds.length, 2);
});

test('7. Edit required skills (add, prevent duplicate, remove)', () => {
  let team = createBlankTeam();
  team.name = 'Zeta';

  // Add React
  const add1 = addSkillToTeam(team, 'React');
  assert.equal(add1.success, true);
  team = add1.team;
  assert.deepEqual(team.requiredSkills, ['React']);

  // Add duplicate case-insensitively
  const addDup = addSkillToTeam(team, 'react ');
  assert.equal(addDup.success, false);
  assert.match(addDup.error, /already required/i);
  assert.deepEqual(team.requiredSkills, ['React']);

  // Add Node.js
  const add2 = addSkillToTeam(team, 'Node.js');
  team = add2.team;
  assert.deepEqual(team.requiredSkills, ['React', 'Node.js']);

  // Remove React
  team = removeSkillFromTeam(team, 'react');
  assert.deepEqual(team.requiredSkills, ['Node.js']);
});

test('8. Remove members from team plan', () => {
  const team = {
    id: 'team-108',
    name: 'Eta',
    opportunityId: null,
    maxMembers: 3,
    requiredSkills: [],
    memberIds: ['student-1', 'student-2'],
  };

  const updated = removeMemberFromTeam(team, 'student-1');
  assert.deepEqual(updated.memberIds, ['student-2']);
});

test('9. Restore team after refresh with storage utility', () => {
  const team = {
    id: 'team-109',
    name: 'Restored Pioneers',
    opportunityId: 'opp-99',
    maxMembers: 5,
    requiredSkills: ['Figma', 'TypeScript'],
    memberIds: ['student-1'],
  };

  let mockStore = {};
  const mockStorage = {
    getItem: (key) => mockStore[key] ?? null,
    setItem: (key, val) => { mockStore[key] = val; },
  };

  // Save team
  const saveRes = saveStoredData(TEAM_STORAGE_KEY, team, mockStorage);
  assert.equal(saveRes.status, 'success');

  // Read team back
  const readRes = readStoredData(TEAM_STORAGE_KEY, validateTeam, mockStorage);
  assert.equal(readRes.status, 'success');
  assert.deepEqual(readRes.data, team);
});

test('10. Handle missing profiles gracefully without throwing or fabricating records', () => {
  const profileMap = getCandidateProfileMap();
  const deletedMemberId = 'deleted-student-999';

  assert.equal(profileMap.has(deletedMemberId), false);

  // When UI looks up the profile, it gracefully knows it is missing:
  const foundProfile = profileMap.get(deletedMemberId) ?? null;
  assert.equal(foundProfile, null);
});

test('11. Handle corrupted storage safely', () => {
  // Case A: Corrupted JSON
  const corruptedStorageA = {
    getItem: () => '{invalid-json',
    setItem: () => assert.fail('should not write'),
  };
  const resA = readStoredData(TEAM_STORAGE_KEY, validateTeam, corruptedStorageA);
  assert.equal(resA.status, 'error');

  // Case B: Schema violation (e.g., negative capacity)
  const corruptedStorageB = {
    getItem: () => JSON.stringify({ id: 't1', name: 'Corrupt', maxMembers: -5, requiredSkills: [], memberIds: [] }),
    setItem: () => assert.fail('should not write'),
  };
  const resB = readStoredData(TEAM_STORAGE_KEY, validateTeam, corruptedStorageB);
  assert.equal(resB.status, 'error');
  assert.match(resB.message, /unsupported structure/i);

  // Case C: Missing storage
  const emptyStorage = {
    getItem: () => null,
  };
  const resC = readStoredData(TEAM_STORAGE_KEY, validateTeam, emptyStorage);
  assert.equal(resC.status, 'missing');
});

test('12. Pass correct team data structure to matching', () => {
  const team = {
    id: 'team-112',
    name: 'Matching Ready Team',
    opportunityId: 'opp-1',
    maxMembers: 3,
    requiredSkills: ['React', 'Python'],
    memberIds: ['student-1'], // Alice has React
  };

  // Adapt team for Explainable Matching
  const matchingTeam = toMatchingTeam(team);
  assert.deepEqual(matchingTeam.members, ['student-1']);
  assert.equal(matchingTeam.capacity, 3);

  // Run downstream Explainable Matching algorithm
  const result = rankCandidates(matchingTeam, CANDIDATE_PROFILES);
  assert.equal(result.status, 'ok');
  assert.equal(result.coverage.totalRequired, 2);
  assert.equal(result.coverage.totalCovered, 1); // React covered by Alice
  assert.deepEqual(result.coverage.missingSkills, ['python']);
  // Candidate Bob Smith (who has Python) should be recommended top
  assert.equal(result.rankedCandidates[0].id, 'student-2');
});
