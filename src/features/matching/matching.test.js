import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSkill,
  normalizeSkillList,
  getMemberId,
  getSkillCoverage,
  checkCandidateEligibility,
  evaluateCandidate,
  rankCandidates
} from './matching.js';

test('normalizeSkill handles whitespace, casing, and empty values predictably', () => {
  assert.equal(normalizeSkill('  React.js  '), 'react.js');
  assert.equal(normalizeSkill('Node   JS'), 'node js');
  assert.equal(normalizeSkill(''), '');
  assert.equal(normalizeSkill(null), '');
  assert.equal(normalizeSkill(undefined), '');
  assert.equal(normalizeSkill(123), '');
});

test('getMemberId extracts id from strings or member objects', () => {
  assert.equal(getMemberId('student-1'), 'student-1');
  assert.equal(getMemberId({ id: 'student-2', role: 'Dev' }), 'student-2');
  assert.equal(getMemberId(null), null);
  assert.equal(getMemberId({}), null);
});

test('normalizeSkillList de-duplicates and normalizes skill entries', () => {
  const input = ['React', '  react ', 'Python', '', null, 'PYTHON'];
  assert.deepEqual(normalizeSkillList(input), ['react', 'python']);
  assert.deepEqual(normalizeSkillList(null), []);
});

test('getSkillCoverage correctly identifies covered and missing skills', () => {
  const team = {
    requiredSkills: ['React', 'Python', 'Figma', 'Node.js'],
    members: ['student-1', 'student-2']
  };

  const profiles = [
    { id: 'student-1', name: 'Alice', skills: ['React', 'TypeScript'] },
    { id: 'student-2', name: 'Bob', skills: ['Python'] },
    { id: 'student-3', name: 'Charlie', skills: ['Figma'] }
  ];

  const coverage = getSkillCoverage(team, profiles);

  assert.deepEqual(coverage.requiredSkills, ['react', 'python', 'figma', 'node.js']);
  assert.deepEqual(coverage.coveredSkills, ['react', 'python']);
  assert.deepEqual(coverage.missingSkills, ['figma', 'node.js']);
  assert.equal(coverage.totalRequired, 4);
  assert.equal(coverage.totalCovered, 2);
  assert.equal(coverage.totalMissing, 2);
  assert.equal(coverage.coverageRatio, 0.5);
  assert.equal(coverage.isFullyCovered, false);
  assert.deepEqual(coverage.unmatchedMemberSkills, ['typescript']);
});

test('getSkillCoverage handles missing or invalid member references gracefully without fabricating data', () => {
  const team = {
    requiredSkills: ['React', 'Figma'],
    members: ['non-existent-member', null, { id: 'valid-member' }]
  };
  const profiles = [
    { id: 'valid-member', name: 'Dana', skills: ['React'] }
  ];

  const coverage = getSkillCoverage(team, profiles);
  assert.deepEqual(coverage.coveredSkills, ['react']);
  assert.deepEqual(coverage.missingSkills, ['figma']);
  assert.equal(coverage.memberCoverage.length, 2);
  assert.equal(coverage.memberCoverage[0].profileFound, false);
  assert.equal(coverage.memberCoverage[1].profileFound, true);
});

test('checkCandidateEligibility excludes existing members, inactive, and malformed candidates', () => {
  const memberIds = new Set(['m1', 'm2']);

  assert.equal(checkCandidateEligibility({ id: 'm1' }, memberIds).eligible, false);
  assert.equal(checkCandidateEligibility({ id: 'c1', isAvailable: false }, memberIds).eligible, false);
  assert.equal(checkCandidateEligibility({ id: 'c2', status: 'unavailable' }, memberIds).eligible, false);
  assert.equal(checkCandidateEligibility({ id: 'c3', status: 'inactive' }, memberIds).eligible, false);
  assert.equal(checkCandidateEligibility(null, memberIds).eligible, false);
  assert.equal(checkCandidateEligibility({}, memberIds).eligible, false);
  assert.equal(checkCandidateEligibility({ id: 'c4', status: 'seeking' }, memberIds).eligible, true);
});

test('evaluateCandidate calculates exact weighted breakdown for illustrative example', () => {
  const coverage = {
    requiredSkills: ['react', 'python', 'figma', 'node.js'],
    coveredSkills: ['react', 'python'],
    missingSkills: ['figma', 'node.js'],
    totalRequired: 4
  };

  const preferences = {
    availability: ['weekends'],
    interests: ['fintech']
  };

  // Candidate A: Figma (fills 1 of 2 missing = 50% * 60 = 30 pts), weekend avail (100% * 25 = 25 pts), fintech (100% * 15 = 15 pts) -> 70 pts
  const candA = {
    id: 'cand-a',
    name: 'Candidate A',
    skills: ['Figma', 'UI/UX'],
    availability: 'weekends',
    interests: ['Fintech']
  };

  const evalA = evaluateCandidate(candA, coverage, preferences);
  assert.equal(evalA.scoreBreakdown.skills.score, 30);
  assert.equal(evalA.scoreBreakdown.availability.score, 25);
  assert.equal(evalA.scoreBreakdown.interests.score, 15);
  assert.equal(evalA.overallScore, 70);
  assert.deepEqual(evalA.skillsContributed, ['figma']);
  assert.deepEqual(evalA.skillsRedundant, []);
  assert.deepEqual(evalA.skillsExtra, ['ui/ux']);
  assert.match(evalA.explanation, /Figma/);

  // Candidate B: React, CSS (contributes 0 missing skills = 0 pts), weekend avail (25 pts), no interests (0 pts) -> 25 pts
  const candB = {
    id: 'cand-b',
    name: 'Candidate B',
    skills: ['React', 'CSS'],
    availability: 'weekends',
    interests: []
  };

  const evalB = evaluateCandidate(candB, coverage, preferences);
  assert.equal(evalB.scoreBreakdown.skills.score, 0);
  assert.equal(evalB.scoreBreakdown.availability.score, 25);
  assert.equal(evalB.scoreBreakdown.interests.score, 0);
  assert.equal(evalB.overallScore, 25);
  assert.deepEqual(evalB.skillsContributed, []);
  assert.deepEqual(evalB.skillsRedundant, ['react']);
});

test('rankCandidates orders candidates by complement and explains differences', () => {
  const team = {
    requiredSkills: ['React', 'Python', 'Figma', 'Node.js'],
    members: ['student-1', 'student-2'],
    availability: ['weekends'],
    interests: ['Fintech']
  };

  const profiles = [
    { id: 'student-1', name: 'Member 1', skills: ['React'] },
    { id: 'student-2', name: 'Member 2', skills: ['Python'] },
    { id: 'cand-a', name: 'Candidate A', skills: ['Figma', 'UI/UX'], availability: 'weekends', interests: ['Fintech'] },
    { id: 'cand-b', name: 'Candidate B', skills: ['React', 'CSS'], availability: 'weekends', interests: ['Fintech'] },
    { id: 'cand-c', name: 'Candidate C', skills: ['Node.js', 'Express'], availability: 'weekdays', interests: ['Fintech'] }
  ];

  const result = rankCandidates(team, profiles);

  assert.equal(result.status, 'ok');
  assert.equal(result.rankedCandidates.length, 3);

  // Candidate A (Figma + weekend + fintech = 30 + 25 + 15 = 70)
  // Candidate C (Node.js + weekday(0) + fintech(15) = 30 + 0 + 15 = 45)
  // Candidate B (React(0) + weekend(25) + fintech(15) = 0 + 25 + 15 = 40)
  assert.equal(result.rankedCandidates[0].id, 'cand-a');
  assert.equal(result.rankedCandidates[1].id, 'cand-c');
  assert.equal(result.rankedCandidates[2].id, 'cand-b');

  // Verify exclusions
  const excludedIds = result.excludedCandidates.map((e) => e.id);
  assert.ok(excludedIds.includes('student-1'));
  assert.ok(excludedIds.includes('student-2'));
});

test('rankCandidates stops recommendations when team reaches full capacity', () => {
  const team = {
    requiredSkills: ['React', 'Node.js'],
    members: ['m1', 'm2', 'm3', 'm4'],
    capacity: 4
  };

  const profiles = [
    { id: 'm1', skills: ['React'] },
    { id: 'm2', skills: [] },
    { id: 'm3', skills: [] },
    { id: 'm4', skills: [] },
    { id: 'c1', skills: ['Node.js'] }
  ];

  const result = rankCandidates(team, profiles);
  assert.equal(result.status, 'team_full');
  assert.equal(result.rankedCandidates.length, 0);
  assert.match(result.message, /maximum capacity/i);
});

test('rankCandidates ensures deterministic tie-breaking', () => {
  const team = {
    requiredSkills: ['Docker'],
    members: [],
    availability: ['weekends'],
    interests: ['Cloud']
  };

  // Both have identical scores: Docker(60) + weekends(25) + Cloud(15) = 100
  // Tie-breaker: ID alphabetical ('cand-alpha' before 'cand-beta')
  const profiles = [
    { id: 'cand-beta', skills: ['Docker'], availability: 'weekends', interests: ['Cloud'] },
    { id: 'cand-alpha', skills: ['Docker'], availability: 'weekends', interests: ['Cloud'] }
  ];

  const result = rankCandidates(team, profiles);
  assert.equal(result.rankedCandidates[0].id, 'cand-alpha');
  assert.equal(result.rankedCandidates[1].id, 'cand-beta');
});

test('rankCandidates does not mutate inputs (Immutability guarantee)', () => {
  const team = Object.freeze({
    requiredSkills: Object.freeze(['React', 'Node.js']),
    members: Object.freeze(['m1']),
    availability: Object.freeze(['weekends']),
    interests: Object.freeze(['AI'])
  });

  const profiles = Object.freeze([
    Object.freeze({ id: 'm1', skills: Object.freeze(['React']) }),
    Object.freeze({ id: 'c1', skills: Object.freeze(['Node.js']), availability: Object.freeze(['weekends']) })
  ]);

  const preferences = Object.freeze({
    weights: Object.freeze({ skills: 0.6, availability: 0.25, interests: 0.15 })
  });

  assert.doesNotThrow(() => {
    rankCandidates(team, profiles, preferences);
  });
});

test('rankCandidates dynamically updates recommendations when membership changes', () => {
  const profiles = [
    { id: 'm1', skills: ['React'] },
    { id: 'c-node', name: 'Node Specialist', skills: ['Node.js'] },
    { id: 'c-figma', name: 'Figma Specialist', skills: ['Figma'] }
  ];

  // Stage 1: Team needs Node.js and Figma
  const team1 = {
    requiredSkills: ['React', 'Node.js', 'Figma'],
    members: ['m1']
  };
  const result1 = rankCandidates(team1, profiles);
  assert.deepEqual(result1.coverage.missingSkills, ['node.js', 'figma']);
  assert.equal(result1.rankedCandidates.length, 2);

  // Stage 2: Member 2 with Node.js joins
  const profilesWithM2 = [
    ...profiles,
    { id: 'm2', skills: ['Node.js'] }
  ];
  const team2 = {
    requiredSkills: ['React', 'Node.js', 'Figma'],
    members: ['m1', 'm2']
  };
  const result2 = rankCandidates(team2, profilesWithM2);

  // Missing skills now only Figma
  assert.deepEqual(result2.coverage.missingSkills, ['figma']);
  // c-figma now fills 100% of missing skills, while c-node fills 0% of missing skills
  assert.equal(result2.rankedCandidates[0].id, 'c-figma');
  assert.equal(result2.rankedCandidates[0].skillsContributed.length, 1);
  assert.equal(result2.rankedCandidates[1].id, 'c-node');
  assert.equal(result2.rankedCandidates[1].skillsContributed.length, 0);
});

test('when all required skills are covered, avoids producing misleadingly high skill recruitment scores', () => {
  const team = {
    requiredSkills: ['React', 'Node.js'],
    members: ['m1', 'm2']
  };
  const profiles = [
    { id: 'm1', skills: ['React'] },
    { id: 'm2', skills: ['Node.js'] },
    { id: 'cand-x', skills: ['React', 'Node.js', 'Python'], availability: 'weekends', interests: ['Web'] }
  ];

  const result = rankCandidates(team, profiles, { availability: ['weekends'] });
  assert.equal(result.status, 'fully_covered');
  assert.equal(result.coverage.isFullyCovered, true);
  // Missing skill score must be 0
  assert.equal(result.rankedCandidates[0].scoreBreakdown.skills.score, 0);
  assert.match(result.rankedCandidates[0].cautionNotes[0], /already fully satisfied/);
});

test('rankCandidates handles edge cases: null team, empty required skills, empty profiles', () => {
  // Edge Case 1: Null team
  const res1 = rankCandidates(null, []);
  assert.equal(res1.status, 'no_candidates');
  assert.equal(res1.rankedCandidates.length, 0);
  assert.equal(res1.coverage.requiredSkills.length, 0);

  // Edge Case 2: No required skills defined
  const res2 = rankCandidates({ requiredSkills: [], members: [] }, [{ id: 'c1', skills: ['Python'] }]);
  assert.equal(res2.status, 'no_requirements');
  assert.equal(res2.rankedCandidates.length, 1);
  assert.equal(res2.rankedCandidates[0].scoreBreakdown.skills.score, 0);

  // Edge Case 3: Empty candidates list
  const res3 = rankCandidates({ requiredSkills: ['React'] }, []);
  assert.equal(res3.status, 'no_candidates');
  assert.equal(res3.rankedCandidates.length, 0);

  // Edge Case 4: All candidates already on team
  const res4 = rankCandidates(
    { requiredSkills: ['React'], members: ['m1', 'm2'] },
    [{ id: 'm1', skills: ['React'] }, { id: 'm2', skills: [] }]
  );
  assert.equal(res4.status, 'no_candidates');
  assert.equal(res4.excludedCandidates.length, 2);

  // Edge Case 5: Candidates with completely missing availability and interests
  const res5 = rankCandidates(
    { requiredSkills: ['React'], members: [] },
    [{ id: 'c-bare', skills: ['React'] }]
  );
  assert.equal(res5.status, 'ok');
  assert.equal(res5.rankedCandidates[0].scoreBreakdown.skills.score, 60);
  assert.equal(res5.rankedCandidates[0].scoreBreakdown.availability.score, 13); // neutral 0.5 * 25 = 12.5 -> 13
  assert.equal(res5.rankedCandidates[0].scoreBreakdown.interests.score, 0);
});

test('rankCandidates breaks ties by missing skills count before availability, interests, or id', () => {
  const team = {
    requiredSkills: ['React', 'Figma', 'Node.js', 'Python'],
    members: [],
    availability: ['weekends'],
    interests: ['AI']
  };

  // Suppose Candidate X fills 2 missing skills (50% skills = 30 pts) + 0 avail + 0 int = 30 pts
  // Suppose Candidate Y fills 1 missing skill (25% skills = 15 pts) + 15 int (15 pts) = 30 pts
  // Overall score is tied at 30 pts.
  // Candidate X fills 2 missing skills, Y fills 1 missing skill.
  // X should rank higher because missing skills contributed takes priority!
  const profiles = [
    { id: 'cand-y', skills: ['React'], availability: 'none', interests: ['AI'] },
    { id: 'cand-x', skills: ['React', 'Figma'], availability: 'none', interests: [] }
  ];

  const result = rankCandidates(team, profiles);
  assert.equal(result.rankedCandidates[0].id, 'cand-x');
  assert.equal(result.rankedCandidates[1].id, 'cand-y');
});

