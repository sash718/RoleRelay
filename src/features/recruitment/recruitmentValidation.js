import { getMemberId, getSkillCoverage, evaluateCandidate, normalizeSkillList } from '../matching/matching.js';

export const RECRUITMENT_STATUSES = Object.freeze({
  SHORTLISTED: 'shortlisted',
  UNDER_CONSIDERATION: 'under_consideration',
  ADDED_TO_TEAM: 'added_to_team',
  REMOVED_FROM_SHORTLIST: 'removed_from_shortlist'
});

export const VALID_STATUS_LIST = Object.freeze(Object.values(RECRUITMENT_STATUSES));

/**
 * Human-readable status labels for display in the UI.
 * Distinctly reflects browser-local planning decisions without simulating real invitations.
 */
export const STATUS_DISPLAY_LABELS = Object.freeze({
  [RECRUITMENT_STATUSES.SHORTLISTED]: 'Shortlisted',
  [RECRUITMENT_STATUSES.UNDER_CONSIDERATION]: 'Under consideration',
  [RECRUITMENT_STATUSES.ADDED_TO_TEAM]: 'Added to team',
  [RECRUITMENT_STATUSES.REMOVED_FROM_SHORTLIST]: 'Removed from shortlist'
});

/**
 * Creates a valid local recruitment record.
 * 
 * @param {string} teamId 
 * @param {string} candidateId 
 * @param {string} [status] 
 * @returns {object}
 */
export function createRecruitmentRecord(teamId, candidateId, status = RECRUITMENT_STATUSES.SHORTLISTED) {
  return {
    id: `rec-${teamId}-${candidateId}`,
    teamId: String(teamId).trim(),
    candidateId: String(candidateId).trim(),
    status,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Validates whether a candidate profile is eligible to be shortlisted for a team.
 * 
 * Rules:
 * - Candidate profile exists and has valid ID.
 * - Candidate is not marked unavailable.
 * - Candidate is not already in the team's member roster.
 * - Candidate is not currently actively shortlisted (status 'shortlisted' or 'under_consideration').
 * 
 * @param {object} candidate 
 * @param {object} team 
 * @param {Array<object>} shortlist 
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateCandidateForShortlist(candidate, team, shortlist = []) {
  if (!candidate || typeof candidate !== 'object') {
    return { valid: false, error: 'Candidate profile data is missing or invalid.' };
  }
  const candidateId = candidate.id != null ? String(candidate.id).trim() : '';
  if (!candidateId) {
    return { valid: false, error: 'Candidate profile does not have a valid identifier.' };
  }
  if (candidate.isAvailable === false) {
    return { valid: false, error: 'Candidate has indicated they are currently unavailable.' };
  }

  const teamMembers = Array.isArray(team?.members) ? team.members : [];
  const isAlreadyMember = teamMembers.some((m) => getMemberId(m) === candidateId);
  if (isAlreadyMember) {
    return { valid: false, error: `${candidate.name || candidateId} is already a member of this team.` };
  }

  const activeRecord = shortlist.find(
    (record) => record.candidateId === candidateId &&
      (record.status === RECRUITMENT_STATUSES.SHORTLISTED || record.status === RECRUITMENT_STATUSES.UNDER_CONSIDERATION)
  );

  if (activeRecord) {
    return { valid: false, error: `${candidate.name || candidateId} is already on your active shortlist.` };
  }

  return { valid: true };
}

/**
 * Validates whether a candidate can be officially added to the local team plan.
 * 
 * Rules:
 * - Team exists with valid capacity.
 * - Candidate exists with valid ID.
 * - Team has not reached maximum capacity.
 * - Candidate is not already a member of the team.
 * 
 * @param {object} candidate 
 * @param {object} team 
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateCandidateForTeamAddition(candidate, team) {
  if (!team || typeof team !== 'object') {
    return { valid: false, error: 'No active team plan was provided.' };
  }

  if (!candidate || typeof candidate !== 'object') {
    return { valid: false, error: 'Candidate profile data is invalid.' };
  }

  const candidateId = candidate.id != null ? String(candidate.id).trim() : '';
  if (!candidateId) {
    return { valid: false, error: 'Candidate has an invalid or missing identifier.' };
  }

  const teamMembers = Array.isArray(team.members) ? team.members : [];
  const capacity = typeof team.capacity === 'number' ? team.capacity : 4;

  if (teamMembers.length >= capacity) {
    return {
      valid: false,
      error: `Team has reached maximum capacity (${teamMembers.length} of ${capacity} members). Remove a member or expand team capacity before adding.`
    };
  }

  const isAlreadyMember = teamMembers.some((m) => getMemberId(m) === candidateId);
  if (isAlreadyMember) {
    return { valid: false, error: `${candidate.name || candidateId} is already a member of this team.` };
  }

  return { valid: true };
}

/**
 * Pure comparison function evaluating two shortlisted candidates side-by-side.
 * Guarantees zero mutation of team or candidate inputs.
 * 
 * Computes:
 * - Missing skills contributed by Candidate A vs Candidate B
 * - Resulting team skill coverage if Candidate A vs Candidate B is added
 * - Availability schedule compatibility
 * - Remaining open uncovered skills for each candidate
 * 
 * @param {object} candidateA 
 * @param {object} candidateB 
 * @param {object} team 
 * @param {Array<object>} profiles 
 * @returns {object} Comparative evaluation
 */
export function compareCandidates(candidateA, candidateB, team, profiles = []) {
  const currentCoverage = getSkillCoverage(team, profiles);

  const teamPreferences = {
    availability: team?.availability || [],
    interests: team?.interests || []
  };

  const evalA = candidateA ? evaluateCandidate(candidateA, currentCoverage, teamPreferences) : null;
  const evalB = candidateB ? evaluateCandidate(candidateB, currentCoverage, teamPreferences) : null;

  // Hypothetical coverage if Candidate A were added to team (WITHOUT mutating team)
  const hypotheticalTeamA = {
    ...team,
    members: [...(team?.members || []), candidateA]
  };
  const coverageIfAddedA = candidateA ? getSkillCoverage(hypotheticalTeamA, profiles) : currentCoverage;

  // Hypothetical coverage if Candidate B were added to team (WITHOUT mutating team)
  const hypotheticalTeamB = {
    ...team,
    members: [...(team?.members || []), candidateB]
  };
  const coverageIfAddedB = candidateB ? getSkillCoverage(hypotheticalTeamB, profiles) : currentCoverage;

  const skillsA = new Set(normalizeSkillList(candidateA?.skills || []));
  const skillsB = new Set(normalizeSkillList(candidateB?.skills || []));

  const skillsUniqueToA = (evalA?.skillsContributed || []).filter((s) => !skillsB.has(s));
  const skillsUniqueToB = (evalB?.skillsContributed || []).filter((s) => !skillsA.has(s));
  const skillsSharedContributed = (evalA?.skillsContributed || []).filter((s) => skillsB.has(s));

  return {
    candidateA: {
      profile: candidateA,
      evaluation: evalA,
      projectedCoverageRatio: coverageIfAddedA.coverageRatio,
      projectedMissingSkills: coverageIfAddedA.missingSkills,
      projectedCoveredCount: coverageIfAddedA.totalCovered,
      uniqueContributedSkills: skillsUniqueToA
    },
    candidateB: {
      profile: candidateB,
      evaluation: evalB,
      projectedCoverageRatio: coverageIfAddedB.coverageRatio,
      projectedMissingSkills: coverageIfAddedB.missingSkills,
      projectedCoveredCount: coverageIfAddedB.totalCovered,
      uniqueContributedSkills: skillsUniqueToB
    },
    sharedContributedSkills: skillsSharedContributed,
    currentCoverage
  };
}

/**
 * Validates the recruitment workspace data structure read from localStorage.
 * Follows RoleRelay schema verification standards (schemaVersion 1).
 * 
 * @param {unknown} data 
 * @returns {boolean}
 */
export function isValidRecruitmentWorkspace(data) {
  if (data === null || typeof data !== 'object') return false;
  if (data.schemaVersion !== 1) return false;

  const team = data.team;
  if (!team || typeof team !== 'object') return false;
  if (typeof team.id !== 'string' || team.id.trim() === '') return false;
  if (typeof team.name !== 'string' || team.name.trim() === '') return false;
  if (typeof team.capacity !== 'number' || team.capacity < 1) return false;
  if (!Array.isArray(team.requiredSkills)) return false;
  if (!Array.isArray(team.members)) return false;

  for (const m of team.members) {
    if (!m) return false;
    if (typeof m === 'string') {
      if (m.trim() === '') return false;
    } else if (typeof m === 'object') {
      if (typeof m.id !== 'string' || m.id.trim() === '') return false;
    } else {
      return false;
    }
  }

  if (!Array.isArray(data.shortlist)) return false;

  for (const item of data.shortlist) {
    if (!item || typeof item !== 'object') return false;
    if (typeof item.id !== 'string' || item.id.trim() === '') return false;
    if (typeof item.teamId !== 'string' || item.teamId.trim() === '') return false;
    if (typeof item.candidateId !== 'string' || item.candidateId.trim() === '') return false;
    if (!VALID_STATUS_LIST.includes(item.status)) return false;
  }

  return true;
}
