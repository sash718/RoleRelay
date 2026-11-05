/**
 * Pure domain model, schema validation, and state transforms for Team Creation.
 * 
 * Rules:
 * - Deterministic and pure (no React, no DOM, no localStorage inside this file).
 * - Honest validation: rejected data is never silently repaired or fabricated.
 */

export const TEAM_STORAGE_KEY = 'rolerelay_team_plan';

/**
 * Normalizes a skill string for case-insensitive duplicate prevention.
 * 
 * @param {string} skill 
 * @returns {string}
 */
export function normalizeSkill(skill) {
  if (typeof skill !== 'string') return '';
  return skill.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Schema and domain validator for stored team plan records.
 * Passed to readStoredData(key, validateTeam).
 * 
 * @param {unknown} data 
 * @returns {boolean}
 */
export function validateTeam(data) {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return false;
  }

  // 1. id: must be non-empty string
  if (typeof data.id !== 'string' || data.id.trim().length === 0) {
    return false;
  }

  // 2. name: must be non-empty string
  if (typeof data.name !== 'string' || data.name.trim().length === 0) {
    return false;
  }

  // 3. opportunityId: nullable string (null or string)
  if (data.opportunityId !== null && typeof data.opportunityId !== 'string') {
    return false;
  }

  // 4. maxMembers: valid positive integer
  if (!Number.isInteger(data.maxMembers) || data.maxMembers <= 0) {
    return false;
  }

  // 5. requiredSkills: array of strings with no duplicates (case-insensitive)
  if (!Array.isArray(data.requiredSkills)) {
    return false;
  }
  const seenSkills = new Set();
  for (const s of data.requiredSkills) {
    if (typeof s !== 'string' || s.trim().length === 0) return false;
    const norm = normalizeSkill(s);
    if (seenSkills.has(norm)) return false;
    seenSkills.add(norm);
  }

  // 6. memberIds: array of strings with no duplicate IDs
  if (!Array.isArray(data.memberIds)) {
    return false;
  }
  const seenMembers = new Set();
  for (const m of data.memberIds) {
    if (typeof m !== 'string' || m.trim().length === 0) return false;
    if (seenMembers.has(m)) return false;
    seenMembers.add(m);
  }

  // 7. Capacity constraint: membership cannot exceed maxMembers
  if (data.memberIds.length > data.maxMembers) {
    return false;
  }

  return true;
}

/**
 * Creates an empty, valid initial team object.
 * 
 * @param {string|null} [initialOpportunityId=null] 
 * @returns {object}
 */
export function createBlankTeam(initialOpportunityId = null) {
  return {
    id: `team-${Date.now()}`,
    name: '',
    opportunityId: initialOpportunityId || null,
    maxMembers: 4,
    requiredSkills: [],
    memberIds: [],
  };
}

/**
 * Validates team form input values and returns inline field-level errors.
 * 
 * @param {object} team 
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateTeamForm(team) {
  const errors = {};

  if (!team || typeof team !== 'object') {
    return { isValid: false, errors: { form: 'Invalid team data structure.' } };
  }

  // Team name validation
  if (typeof team.name !== 'string' || team.name.trim().length === 0) {
    errors.name = 'Team name cannot be empty.';
  }

  // Maximum size validation
  const max = Number(team.maxMembers);
  if (!Number.isInteger(max) || max <= 0) {
    errors.maxMembers = 'Maximum size must be a valid positive integer.';
  } else if (Array.isArray(team.memberIds) && max < team.memberIds.length) {
    errors.maxMembers = `Maximum size cannot be smaller than current membership (${team.memberIds.length}).`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Pure function to add a member to the team, verifying capacity and avoiding duplicates.
 * 
 * @param {object} team 
 * @param {string} memberId 
 * @returns {{ success: boolean, team: object, error?: string }}
 */
export function addMemberToTeam(team, memberId) {
  if (typeof memberId !== 'string' || memberId.trim().length === 0) {
    return { success: false, team, error: 'Invalid member ID.' };
  }

  const trimmedId = memberId.trim();
  const currentMembers = Array.isArray(team.memberIds) ? team.memberIds : [];

  if (currentMembers.includes(trimmedId)) {
    return { success: false, team, error: 'Member is already on this team.' };
  }

  if (currentMembers.length >= team.maxMembers) {
    return { success: false, team, error: `Team capacity reached (${team.maxMembers} max).` };
  }

  return {
    success: true,
    team: {
      ...team,
      memberIds: [...currentMembers, trimmedId],
    },
  };
}

/**
 * Pure function to remove a member from the team.
 * 
 * @param {object} team 
 * @param {string} memberId 
 * @returns {object} updated team
 */
export function removeMemberFromTeam(team, memberId) {
  const currentMembers = Array.isArray(team.memberIds) ? team.memberIds : [];
  return {
    ...team,
    memberIds: currentMembers.filter((id) => id !== memberId),
  };
}

/**
 * Pure function to add a required skill, checking for case-insensitive duplicates.
 * 
 * @param {object} team 
 * @param {string} skill 
 * @returns {{ success: boolean, team: object, error?: string }}
 */
export function addSkillToTeam(team, skill) {
  if (typeof skill !== 'string' || skill.trim().length === 0) {
    return { success: false, team, error: 'Skill cannot be empty.' };
  }

  const trimmed = skill.trim();
  const norm = normalizeSkill(trimmed);
  const currentSkills = Array.isArray(team.requiredSkills) ? team.requiredSkills : [];

  if (currentSkills.some((s) => normalizeSkill(s) === norm)) {
    return { success: false, team, error: `Skill "${trimmed}" is already required.` };
  }

  return {
    success: true,
    team: {
      ...team,
      requiredSkills: [...currentSkills, trimmed],
    },
  };
}

/**
 * Pure function to remove a required skill.
 * 
 * @param {object} team 
 * @param {string} skillToRemove 
 * @returns {object} updated team
 */
export function removeSkillFromTeam(team, skillToRemove) {
  const norm = normalizeSkill(skillToRemove);
  const currentSkills = Array.isArray(team.requiredSkills) ? team.requiredSkills : [];
  return {
    ...team,
    requiredSkills: currentSkills.filter((s) => normalizeSkill(s) !== norm),
  };
}

/**
 * Adapts the shared team model for Explainable Matching and Recruitment.
 * Ensures downstream modules receive members and capacity keys cleanly.
 * 
 * @param {object} team 
 * @returns {object}
 */
export function toMatchingTeam(team) {
  if (!team || typeof team !== 'object') return {};
  return {
    ...team,
    members: Array.isArray(team.memberIds) ? team.memberIds : [],
    capacity: typeof team.maxMembers === 'number' ? team.maxMembers : 4,
  };
}

