import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RECRUITMENT_STATUSES,
  VALID_STATUS_LIST,
  STATUS_DISPLAY_LABELS,
  createRecruitmentRecord,
  validateCandidateForShortlist,
  validateCandidateForTeamAddition,
  compareCandidates,
  isValidRecruitmentWorkspace
} from '../src/features/recruitment/recruitmentValidation.js';
import { getSkillCoverage, rankCandidates } from '../src/features/matching/matching.js';
import { readStoredData, saveStoredData } from '../src/services/storage.js';

const DEMO_PROFILES = [
  {
    id: 'student-1',
    name: 'Alice Chen',
    skills: ['React', 'TypeScript', 'CSS'],
    availability: ['weekends'],
    interests: ['Fintech'],
    isAvailable: true
  },
  {
    id: 'student-2',
    name: 'Bob Smith',
    skills: ['Python', 'SQL'],
    availability: ['weekends'],
    interests: ['Fintech'],
    isAvailable: true
  },
  {
    id: 'cand-a',
    name: 'Maya Lin',
    skills: ['Figma', 'UI/UX'],
    availability: ['weekends'],
    interests: ['Fintech'],
    isAvailable: true
  },
  {
    id: 'cand-b',
    name: 'David Park',
    skills: ['Node.js', 'Express', 'SQL'],
    availability: ['weekends'],
    interests: ['Fintech'],
    isAvailable: true
  },
  {
    id: 'cand-c',
    name: 'Samira Khan',
    skills: ['Node.js', 'React'],
    availability: ['weekdays'],
    interests: ['Open Source'],
    isAvailable: true
  },
  {
    id: 'cand-unavailable',
    name: 'Unavailable Student',
    skills: ['Python'],
    isAvailable: false
  }
];

const BASE_TEAM = {
  id: 'team-1',
  name: 'Fintech Explorers',
  capacity: 3,
  requiredSkills: ['React', 'Python', 'Figma', 'Node.js'],
  members: ['student-1', 'student-2'],
  availability: ['weekends'],
  interests: ['Fintech']
};

test('1. candidate shortlisting validation creates valid recruitment record with honest local status', () => {
  const candidate = DEMO_PROFILES[2]; // Maya Lin
  const result = validateCandidateForShortlist(candidate, BASE_TEAM, []);
  assert.equal(result.valid, true);

  const record = createRecruitmentRecord(BASE_TEAM.id, candidate.id);
  assert.equal(record.teamId, 'team-1');
  assert.equal(record.candidateId, 'cand-a');
  assert.equal(record.status, RECRUITMENT_STATUSES.SHORTLISTED);
  assert.equal(typeof record.updatedAt, 'string');
});

test('2. duplicate shortlist is prevented for active candidates', () => {
  const candidate = DEMO_PROFILES[2];
  const activeShortlist = [
    createRecruitmentRecord(BASE_TEAM.id, candidate.id, RECRUITMENT_STATUSES.SHORTLISTED)
  ];

  const result = validateCandidateForShortlist(candidate, BASE_TEAM, activeShortlist);
  assert.equal(result.valid, false);
  assert.match(result.error, /already on your active shortlist/i);
});

test('3. candidate removed from shortlist or inactive can be re-shortlisted', () => {
  const candidate = DEMO_PROFILES[2];
  const archivedShortlist = [
    createRecruitmentRecord(BASE_TEAM.id, candidate.id, RECRUITMENT_STATUSES.REMOVED_FROM_SHORTLIST)
  ];

  const result = validateCandidateForShortlist(candidate, BASE_TEAM, archivedShortlist);
  assert.equal(result.valid, true);
});

test('4. candidate comparison accurately compares two candidates without mutating team membership', () => {
  const candidateA = DEMO_PROFILES[2]; // Maya Lin (Figma, UI/UX)
  const candidateB = DEMO_PROFILES[3]; // David Park (Node.js, Express, SQL)
  const originalMembersCount = BASE_TEAM.members.length;

  const comparison = compareCandidates(candidateA, candidateB, BASE_TEAM, DEMO_PROFILES);

  // Assert inputs were not mutated
  assert.equal(BASE_TEAM.members.length, originalMembersCount);

  // Current missing skills: Figma and Node.js
  assert.deepEqual(comparison.currentCoverage.missingSkills, ['figma', 'node.js']);

  // Candidate A contributes Figma (1 of 2 missing) -> 3/4 covered (75%)
  assert.deepEqual(comparison.candidateA.uniqueContributedSkills, ['figma']);
  assert.equal(comparison.candidateA.projectedCoverageRatio, 0.75);
  assert.deepEqual(comparison.candidateA.projectedMissingSkills, ['node.js']);

  // Candidate B contributes Node.js (1 of 2 missing) -> 3/4 covered (75%)
  assert.deepEqual(comparison.candidateB.uniqueContributedSkills, ['node.js']);
  assert.equal(comparison.candidateB.projectedCoverageRatio, 0.75);
  assert.deepEqual(comparison.candidateB.projectedMissingSkills, ['figma']);

  assert.deepEqual(comparison.sharedContributedSkills, []);
});

test('5. candidate added to team validates capacity, non-membership, and data integrity', () => {
  const candidate = DEMO_PROFILES[2]; // Maya Lin
  const result = validateCandidateForTeamAddition(candidate, BASE_TEAM);
  assert.equal(result.valid, true);
});

test('6. team capacity is strictly enforced when team is already full', () => {
  const fullTeam = {
    ...BASE_TEAM,
    capacity: 2, // 2 members already
    members: ['student-1', 'student-2']
  };

  const candidate = DEMO_PROFILES[2];
  const result = validateCandidateForTeamAddition(candidate, fullTeam);
  assert.equal(result.valid, false);
  assert.match(result.error, /reached maximum capacity/i);
});

test('7. duplicate team membership is blocked', () => {
  const candidate = DEMO_PROFILES[0]; // student-1 already on team
  const result = validateCandidateForTeamAddition(candidate, BASE_TEAM);
  assert.equal(result.valid, false);
  assert.match(result.error, /already a member/i);
});

test('8. skill coverage and matching recommendations dynamically recalculate after member added or removed', () => {
  // Initial coverage with student-1 and student-2
  const initialCoverage = getSkillCoverage(BASE_TEAM, DEMO_PROFILES);
  assert.deepEqual(initialCoverage.missingSkills, ['figma', 'node.js']);
  assert.equal(initialCoverage.coverageRatio, 0.5);

  // Add Maya Lin (student-3 with Figma)
  const updatedTeam = {
    ...BASE_TEAM,
    members: [...BASE_TEAM.members, 'cand-a']
  };

  const newCoverage = getSkillCoverage(updatedTeam, DEMO_PROFILES);
  assert.deepEqual(newCoverage.coveredSkills, ['react', 'python', 'figma']);
  assert.deepEqual(newCoverage.missingSkills, ['node.js']);
  assert.equal(newCoverage.coverageRatio, 0.75);

  // Recommendations should now prioritize Node.js contributors
  const rankResult = rankCandidates(updatedTeam, DEMO_PROFILES);
  assert.equal(rankResult.status, 'team_full'); // capacity was 3, now full (3/3)
  assert.equal(rankResult.rankedCandidates.length, 0);

  // Now simulate removing a member (freeing capacity)
  const reducedTeam = {
    ...BASE_TEAM,
    members: ['student-1'] // removed student-2 (Python)
  };
  const reducedCoverage = getSkillCoverage(reducedTeam, DEMO_PROFILES);
  assert.deepEqual(reducedCoverage.missingSkills, ['python', 'figma', 'node.js']);
  assert.equal(reducedCoverage.coverageRatio, 0.25);
});

test('9. workspace schema validator checks required fields and rejects invalid data', () => {
  const validWorkspace = {
    schemaVersion: 1,
    team: BASE_TEAM,
    shortlist: [
      {
        id: 'rec-1',
        teamId: 'team-1',
        candidateId: 'cand-a',
        status: 'shortlisted'
      }
    ]
  };
  assert.equal(isValidRecruitmentWorkspace(validWorkspace), true);

  // Missing schemaVersion
  assert.equal(isValidRecruitmentWorkspace({ ...validWorkspace, schemaVersion: 2 }), false);

  // Invalid team
  assert.equal(isValidRecruitmentWorkspace({ ...validWorkspace, team: null }), false);

  // Corrupted shortlist status
  const invalidStatusWorkspace = {
    ...validWorkspace,
    shortlist: [{ id: 'rec-1', teamId: 'team-1', candidateId: 'cand-a', status: 'fake_accepted_invitation' }]
  };
  assert.equal(isValidRecruitmentWorkspace(invalidStatusWorkspace), false);
});

test('10. saved recruitment plan survives serialization and deserialization via storage helpers', () => {
  let mockDisk = null;
  const mockStorage = {
    getItem: () => mockDisk,
    setItem: (_key, val) => { mockDisk = val; }
  };

  const plan = {
    schemaVersion: 1,
    team: BASE_TEAM,
    shortlist: [
      {
        id: 'rec-1',
        teamId: 'team-1',
        candidateId: 'cand-a',
        status: 'shortlisted'
      }
    ]
  };

  const saveRes = saveStoredData('rolerelay_recruitment_workspace', plan, mockStorage);
  assert.equal(saveRes.status, 'success');

  const readRes = readStoredData('rolerelay_recruitment_workspace', isValidRecruitmentWorkspace, mockStorage);
  assert.equal(readRes.status, 'success');
  assert.deepEqual(readRes.data, plan);
});

test('11. corrupted storage returns explicit error without mutating or fabricating data', () => {
  const corruptedStorage = {
    getItem: () => '{"schemaVersion": 1, "team": { "invalid": true }}',
    setItem: () => assert.fail('Must not write to corrupted storage')
  };

  const res = readStoredData('rolerelay_recruitment_workspace', isValidRecruitmentWorkspace, corruptedStorage);
  assert.equal(res.status, 'error');
  assert.match(res.message, /Saved data has an unsupported structure/);
});

test('12. statuses strictly adhere to local planning decisions without simulated external behavior', () => {
  for (const status of VALID_STATUS_LIST) {
    assert.ok(STATUS_DISPLAY_LABELS[status], `Missing label for status: ${status}`);
    assert.doesNotMatch(status, /invite|message|accept|declined|sent|inbox/i);
  }
});

