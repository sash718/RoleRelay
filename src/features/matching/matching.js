/**
 * Explainable Matching Algorithm for RoleRelay
 * 
 * Deterministic, transparent, and pure matching calculations.
 * No machine learning, no AI predictions, no localStorage, no React dependencies.
 */

/**
 * Normalizes a skill string for consistent, case-insensitive comparison.
 * Trims whitespace, collapses internal multiple spaces, and converts to lowercase.
 * 
 * @param {string} skill 
 * @returns {string}
 */
export function normalizeSkill(skill) {
  if (typeof skill !== 'string') return '';
  return skill.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Normalizes an array of skills, filtering out empty entries and removing duplicates.
 * 
 * @param {string[]} skills 
 * @returns {string[]}
 */
export function normalizeSkillList(skills) {
  if (!Array.isArray(skills)) return [];
  const seen = new Set();
  const normalized = [];
  for (const s of skills) {
    const norm = normalizeSkill(s);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      normalized.push(norm);
    }
  }
  return normalized;
}

/**
 * Common canonical skill names mapping for clean presentation in UI and explanations.
 */
const CANONICAL_SKILL_NAMES = {
  'react': 'React',
  'react.js': 'React',
  'node.js': 'Node.js',
  'nodejs': 'Node.js',
  'python': 'Python',
  'figma': 'Figma',
  'typescript': 'TypeScript',
  'javascript': 'JavaScript',
  'ui/ux': 'UI/UX',
  'css': 'CSS',
  'html': 'HTML',
  'sql': 'SQL',
  'graphql': 'GraphQL',
  'aws': 'AWS',
  'docker': 'Docker',
  'express': 'Express',
  'vue': 'Vue',
  'angular': 'Angular',
  'tailwind': 'Tailwind CSS',
  'django': 'Django'
};

/**
 * Formats a normalized skill for human-readable display.
 * 
 * @param {string} skill 
 * @returns {string}
 */
export function formatSkill(skill) {
  if (!skill) return '';
  const norm = normalizeSkill(skill);
  if (CANONICAL_SKILL_NAMES[norm]) return CANONICAL_SKILL_NAMES[norm];
  // Capitalize each word
  return norm.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Formats a list of skills for display.
 * 
 * @param {string[]} skills 
 * @returns {string[]}
 */
export function formatSkillList(skills) {
  return (skills || []).map(formatSkill);
}

/**
 * Safely extracts member ID from a member entry (supports string ID or object with id).
 * 
 * @param {string|object} member 
 * @returns {string|null}
 */
export function getMemberId(member) {
  if (typeof member === 'string') return member.trim();
  if (member && typeof member === 'object' && typeof member.id === 'string') {
    return member.id.trim();
  }
  return null;
}

/**
 * Analyzes team requirements against current team members' profiles.
 * Pure function: does not mutate inputs.
 * 
 * @param {object} team - { requiredSkills?: string[], members?: Array<string|object> }
 * @param {object[]|Map<string, object>} profiles - Array of profiles or Map of id -> profile
 * @returns {object} Skill coverage analysis
 */
export function getSkillCoverage(team, profiles) {
  const safeTeam = team && typeof team === 'object' ? team : {};
  const requiredSkills = normalizeSkillList(safeTeam.requiredSkills || []);
  const rawMembers = Array.isArray(safeTeam.members) ? safeTeam.members : [];

  // Index profiles for O(1) lookups
  const profileMap = new Map();
  if (profiles instanceof Map) {
    for (const [k, v] of profiles.entries()) {
      if (v && typeof v === 'object' && v.id) profileMap.set(String(v.id), v);
      else if (v && typeof v === 'object') profileMap.set(String(k), v);
    }
  } else if (Array.isArray(profiles)) {
    for (const p of profiles) {
      if (p && typeof p === 'object' && p.id != null) {
        profileMap.set(String(p.id), p);
      }
    }
  }

  const reqSet = new Set(requiredSkills);
  const coveredSet = new Set();
  const memberCoverage = [];
  const allTeamSkills = new Set();

  for (const rawMember of rawMembers) {
    const memberId = getMemberId(rawMember);
    if (!memberId) continue;

    const profile = profileMap.get(memberId);
    const memberSkills = profile ? normalizeSkillList(profile.skills || []) : [];
    const coveredByThisMember = [];

    for (const skill of memberSkills) {
      allTeamSkills.add(skill);
      if (reqSet.has(skill)) {
        coveredSet.add(skill);
        coveredByThisMember.push(skill);
      }
    }

    memberCoverage.push({
      memberId,
      name: profile?.name || memberId,
      profileFound: Boolean(profile),
      skills: memberSkills,
      coveredRequirements: coveredByThisMember
    });
  }

  const coveredSkills = requiredSkills.filter((skill) => coveredSet.has(skill));
  const missingSkills = requiredSkills.filter((skill) => !coveredSet.has(skill));
  const unmatchedMemberSkills = Array.from(allTeamSkills).filter((skill) => !reqSet.has(skill));

  const totalRequired = requiredSkills.length;
  const coverageRatio = totalRequired === 0 ? 1.0 : coveredSkills.length / totalRequired;

  return {
    requiredSkills,
    coveredSkills,
    missingSkills,
    coverageRatio,
    memberCoverage,
    unmatchedMemberSkills,
    isFullyCovered: totalRequired > 0 ? missingSkills.length === 0 : true,
    totalRequired,
    totalCovered: coveredSkills.length,
    totalMissing: missingSkills.length
  };
}

/**
 * Checks if a candidate is eligible for recruitment recommendation.
 * 
 * Rules:
 * 1. Must be a valid object with an ID.
 * 2. Cannot already be in team.members.
 * 3. Must not be explicitly unavailable (isAvailable === false or status === 'unavailable'/'inactive').
 * 
 * @param {object} candidate 
 * @param {Set<string>} existingMemberIds 
 * @returns {{ eligible: boolean, reason?: string }}
 */
export function checkCandidateEligibility(candidate, existingMemberIds) {
  if (!candidate || typeof candidate !== 'object') {
    return { eligible: false, reason: 'Invalid candidate profile structure' };
  }
  const id = candidate.id != null ? String(candidate.id).trim() : '';
  if (!id) {
    return { eligible: false, reason: 'Missing candidate ID' };
  }
  if (existingMemberIds.has(id)) {
    return { eligible: false, reason: 'Already a member of this team' };
  }
  if (candidate.isAvailable === false) {
    return { eligible: false, reason: 'Candidate marked unavailable' };
  }
  const status = typeof candidate.status === 'string' ? candidate.status.trim().toLowerCase() : '';
  if (status === 'unavailable' || status === 'inactive' || status === 'busy') {
    return { eligible: false, reason: 'Candidate status is inactive or unavailable' };
  }
  return { eligible: true };
}

/**
 * Evaluates a single candidate against team gaps and preferences.
 * 
 * Weights (normalized sum = 1.0):
 * - Missing-skill fit: default 0.60
 * - Availability fit: default 0.25
 * - Interests fit: default 0.15
 * 
 * @param {object} candidate 
 * @param {object} coverage - Result of getSkillCoverage
 * @param {object} [teamPreferences] - { availability?: string[], interests?: string[], weights?: object }
 * @returns {object} Detailed candidate evaluation
 */
export function evaluateCandidate(candidate, coverage, teamPreferences = {}) {
  const missingSkillsSet = new Set(coverage.missingSkills);
  const coveredSkillsSet = new Set(coverage.coveredSkills);
  const requiredSkillsSet = new Set(coverage.requiredSkills);

  const candidateSkills = normalizeSkillList(candidate.skills || []);
  const skillsContributed = candidateSkills.filter((s) => missingSkillsSet.has(s));
  const skillsRedundant = candidateSkills.filter((s) => coveredSkillsSet.has(s));
  const skillsExtra = candidateSkills.filter((s) => !requiredSkillsSet.has(s));

  // Weights configuration
  const weights = {
    skills: 0.60,
    availability: 0.25,
    interests: 0.15,
    ...(teamPreferences.weights || {})
  };

  // 1. Missing-skill fit: [0, 1]
  let skillFitRatio;
  if (coverage.missingSkills.length > 0) {
    skillFitRatio = skillsContributed.length / coverage.missingSkills.length;
  } else {
    // If team has no missing skills or no requirements, candidate adds 0 missing skills
    skillFitRatio = 0;
  }
  const skillScore = Math.round(skillFitRatio * (weights.skills * 100));

  // 2. Availability compatibility: [0, 1]
  const targetAvailability = normalizeSkillList(teamPreferences.availability || []);
  const candidateAvailability = normalizeSkillList(
    Array.isArray(candidate.availability)
      ? candidate.availability
      : typeof candidate.availability === 'string'
      ? [candidate.availability]
      : []
  );

  let availabilityRatio;
  let availabilityMatched = [];
  let availabilityDetail;

  if (targetAvailability.length === 0) {
    // If team specifies no availability restrictions, any stated availability is compatible
    if (candidateAvailability.length > 0) {
      availabilityRatio = 1.0;
      availabilityDetail = `Available (${candidateAvailability.join(', ')})`;
      availabilityMatched = candidateAvailability;
    } else {
      // If neither specified, neutral 0.5 (stated clearly)
      availabilityRatio = 0.5;
      availabilityDetail = 'No team schedule constraint; candidate schedule unspecified';
    }
  } else {
    // Team has specific target slots
    const targetSet = new Set(targetAvailability);
    const hasFlexible = candidateAvailability.some((a) =>
      ['flexible', 'any', 'open', 'full-time', 'fulltime'].includes(a)
    );

    if (hasFlexible) {
      availabilityRatio = 1.0;
      availabilityMatched = targetAvailability;
      availabilityDetail = 'Fully flexible availability matches team needs';
    } else if (candidateAvailability.length === 0) {
      availabilityRatio = 0;
      availabilityDetail = 'Candidate availability not specified';
    } else {
      availabilityMatched = candidateAvailability.filter((a) => targetSet.has(a));
      availabilityRatio = availabilityMatched.length / targetAvailability.length;
      if (availabilityRatio === 1) {
        availabilityDetail = `Matches all preferred times (${availabilityMatched.join(', ')})`;
      } else if (availabilityRatio > 0) {
        availabilityDetail = `Matches partial times (${availabilityMatched.join(', ')})`;
      } else {
        availabilityDetail = `Does not match target times (${targetAvailability.join(', ')})`;
      }
    }
  }
  const availabilityScore = Math.round(availabilityRatio * (weights.availability * 100));

  // 3. Relevant interests overlap: [0, 1]
  const targetInterests = normalizeSkillList(teamPreferences.interests || []);
  const candidateInterests = normalizeSkillList(
    Array.isArray(candidate.interests)
      ? candidate.interests
      : typeof candidate.interests === 'string'
      ? [candidate.interests]
      : []
  );

  let interestRatio;
  let interestsMatched = [];
  let interestDetail;

  if (targetInterests.length === 0) {
    if (candidateInterests.length > 0) {
      interestRatio = 0.5; // neutral baseline when team has no preferred theme
      interestDetail = `Candidate interested in: ${candidateInterests.join(', ')}`;
    } else {
      interestRatio = 0;
      interestDetail = 'No project interests specified by team or candidate';
    }
  } else {
    const targetIntSet = new Set(targetInterests);
    interestsMatched = candidateInterests.filter((i) => targetIntSet.has(i));
    interestRatio = interestsMatched.length / targetInterests.length;
    if (interestRatio === 1) {
      interestDetail = `Matches all target themes (${interestsMatched.join(', ')})`;
    } else if (interestRatio > 0) {
      interestDetail = `Shared themes: ${interestsMatched.join(', ')}`;
    } else {
      interestDetail = 'No shared project themes';
    }
  }
  const interestScore = Math.round(interestRatio * (weights.interests * 100));

  // Overall score: integer sum capped at 100
  const overallScore = Math.min(100, Math.max(0, skillScore + availabilityScore + interestScore));

  // Plain-language reasons & caveats
  const matchReasons = [];
  const cautionNotes = [];

  const displayContributed = formatSkillList(skillsContributed);
  const displayRedundant = formatSkillList(skillsRedundant);

  if (skillsContributed.length > 0) {
    matchReasons.push(
      `Fills ${skillsContributed.length} of ${coverage.missingSkills.length} missing team ${
        skillsContributed.length === 1 ? 'skill' : 'skills'
      }: ${displayContributed.join(', ')}.`
    );
  } else if (coverage.missingSkills.length > 0) {
    cautionNotes.push('Does not contribute any currently missing team skills.');
  } else if (coverage.totalRequired > 0) {
    cautionNotes.push('Team requirements are already fully satisfied; no new skills needed.');
  }

  if (availabilityRatio >= 0.75) {
    matchReasons.push(`Availability aligns well: ${availabilityDetail}.`);
  } else if (availabilityRatio > 0) {
    matchReasons.push(`Partial availability overlap: ${availabilityDetail}.`);
  } else if (targetAvailability.length > 0) {
    cautionNotes.push(`Availability mismatch: ${availabilityDetail}.`);
  }

  if (interestsMatched.length > 0) {
    matchReasons.push(`Shared domain interest: ${interestsMatched.join(', ')}.`);
  }

  if (skillsRedundant.length > 0) {
    cautionNotes.push(
      `Brings redundant ${skillsRedundant.length === 1 ? 'skill' : 'skills'} already covered by team: ${displayRedundant.join(', ')}.`
    );
  }

  // Plain-language summary explanation
  let explanation;
  if (skillsContributed.length > 0) {
    explanation = `${candidate.name || candidate.id} directly fills missing ${
      skillsContributed.length === 1 ? 'skill' : 'skills'
    } (${displayContributed.join(', ')}) with ${Math.round(availabilityRatio * 100)}% schedule alignment.`;
  } else if (coverage.missingSkills.length === 0 && coverage.totalRequired > 0) {
    explanation = `${candidate.name || candidate.id} shares ${
      interestsMatched.length > 0 ? interestsMatched.join(', ') : 'project interest'
    }, but the team has already satisfied all required skills.`;
  } else {
    explanation = `${candidate.name || candidate.id} offers related experience (${candidateSkills.slice(0, 3).map(formatSkill).join(', ') || 'general'}), but does not fill current skill gaps.`;
  }

  return {
    id: String(candidate.id),
    name: candidate.name || String(candidate.id),
    overallScore,
    scoreBreakdown: {
      skills: {
        score: skillScore,
        maxScore: Math.round(weights.skills * 100),
        rawRatio: Number(skillFitRatio.toFixed(3)),
        weight: weights.skills,
        matched: skillsContributed,
        missingTotal: coverage.missingSkills.length
      },
      availability: {
        score: availabilityScore,
        maxScore: Math.round(weights.availability * 100),
        rawRatio: Number(availabilityRatio.toFixed(3)),
        weight: weights.availability,
        matched: availabilityMatched,
        detail: availabilityDetail
      },
      interests: {
        score: interestScore,
        maxScore: Math.round(weights.interests * 100),
        rawRatio: Number(interestRatio.toFixed(3)),
        weight: weights.interests,
        matched: interestsMatched,
        detail: interestDetail
      }
    },
    skillsContributed,
    skillsRedundant,
    skillsExtra,
    matchReasons,
    cautionNotes,
    explanation
  };
}

/**
 * Deterministically ranks candidates based on team skill gaps, availability, and interests.
 * 
 * Pure function:
 * - Independent of React.
 * - No localStorage access.
 * - Zero input mutations.
 * - Deterministic tie-breaking:
 *   1. Higher overall score
 *   2. More missing skills contributed
 *   3. Higher availability score
 *   4. Higher interest score
 *   5. Fewer redundant skills
 *   6. Alphabetical by candidate ID
 * 
 * @param {object} team - Team plan with requirements and members
 * @param {object[]} profiles - Available candidate profiles
 * @param {object} [preferences] - Optional preferences (capacity, availability, interests, weights)
 * @returns {object} Ranked results, excluded candidates, and team coverage summary
 */
export function rankCandidates(team, profiles, preferences = {}) {
  const safeTeam = team && typeof team === 'object' ? team : {};
  const rawProfiles = Array.isArray(profiles) ? profiles : [];

  // Team capacity check
  const rawMembers = Array.isArray(safeTeam.members) ? safeTeam.members : [];
  const memberIds = new Set();
  for (const m of rawMembers) {
    const id = getMemberId(m);
    if (id) memberIds.add(id);
  }

  const capacity = typeof safeTeam.capacity === 'number'
    ? safeTeam.capacity
    : typeof preferences.capacity === 'number'
    ? preferences.capacity
    : null;

  const isTeamFull = capacity !== null && memberIds.size >= capacity;

  // Calculate skill coverage
  const coverage = getSkillCoverage(safeTeam, rawProfiles);

  // If team is full, return clean status without evaluating recruitments
  if (isTeamFull) {
    return {
      status: 'team_full',
      message: `Team has reached maximum capacity (${memberIds.size}/${capacity} members).`,
      coverage,
      teamSummary: {
        memberCount: memberIds.size,
        capacity,
        isFull: true,
        ...coverage
      },
      rankedCandidates: [],
      excludedCandidates: []
    };
  }

  // Filter candidates by eligibility
  const eligibleCandidates = [];
  const excludedCandidates = [];

  for (const candidate of rawProfiles) {
    const check = checkCandidateEligibility(candidate, memberIds);
    if (check.eligible) {
      eligibleCandidates.push(candidate);
    } else {
      excludedCandidates.push({
        id: candidate?.id != null ? String(candidate.id) : 'unknown',
        name: candidate?.name || 'Unknown Candidate',
        reason: check.reason
      });
    }
  }

  // Team preferences merging
  const teamPreferences = {
    availability: safeTeam.availability || preferences.availability || [],
    interests: safeTeam.interests || preferences.interests || [],
    weights: preferences.weights
  };

  // Evaluate each eligible candidate
  const evaluated = eligibleCandidates.map((c) =>
    evaluateCandidate(c, coverage, teamPreferences)
  );

  // Deterministic sorting
  evaluated.sort((a, b) => {
    // 1. Overall score (descending)
    if (b.overallScore !== a.overallScore) {
      return b.overallScore - a.overallScore;
    }
    // 2. Count of missing skills contributed (descending)
    if (b.skillsContributed.length !== a.skillsContributed.length) {
      return b.skillsContributed.length - a.skillsContributed.length;
    }
    // 3. Availability score (descending)
    if (b.scoreBreakdown.availability.score !== a.scoreBreakdown.availability.score) {
      return b.scoreBreakdown.availability.score - a.scoreBreakdown.availability.score;
    }
    // 4. Interests score (descending)
    if (b.scoreBreakdown.interests.score !== a.scoreBreakdown.interests.score) {
      return b.scoreBreakdown.interests.score - a.scoreBreakdown.interests.score;
    }
    // 5. Redundant skills count (ascending: fewer duplicates preferred)
    if (a.skillsRedundant.length !== b.skillsRedundant.length) {
      return a.skillsRedundant.length - b.skillsRedundant.length;
    }
    // 6. Deterministic tie-breaker: candidate ID (ascending)
    return a.id.localeCompare(b.id);
  });

  let status = 'ok';
  let message = 'Recommendations generated successfully.';
  if (evaluated.length === 0) {
    status = 'no_candidates';
    message = 'No eligible candidates available to evaluate.';
  } else if (coverage.totalRequired === 0) {
    status = 'no_requirements';
    message = 'Team has not specified required skills yet.';
  } else if (coverage.isFullyCovered) {
    status = 'fully_covered';
    message = 'All team skill requirements are already covered by current members.';
  }

  return {
    status,
    message,
    coverage,
    teamSummary: {
      memberCount: memberIds.size,
      capacity,
      isFull: false,
      ...coverage
    },
    rankedCandidates: evaluated,
    excludedCandidates
  };
}
