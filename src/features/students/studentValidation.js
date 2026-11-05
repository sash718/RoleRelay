export const VALID_AVAILABILITIES = ['full-time', 'part-time', 'weekends', 'flexible'];

export const AVAILABILITY_LABELS = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  weekends: 'Weekends only',
  flexible: 'Flexible hours',
};

/**
 * Normalizes comma-separated or array tags into trimmed, deduplicated strings.
 * Deduplication is case-insensitive while preserving initial casing.
 */
export function normalizeTags(input) {
  if (!input) return [];

  const rawList = Array.isArray(input)
    ? input
    : String(input).split(',');

  const seen = new Set();
  const normalized = [];

  for (const item of rawList) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed) continue;

    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      normalized.push(trimmed);
    }
  }

  return normalized;
}

/**
 * Generates a stable unique candidate ID.
 */
export function generateCandidateId() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `cand_${timestamp}_${randomPart}`;
}

/**
 * Validates inputs from the profile creation / editing form.
 * Returns { isValid, errors }.
 */
export function validateProfileInput(formData) {
  const errors = {};

  const name = typeof formData?.name === 'string' ? formData.name.trim() : '';
  if (!name) {
    errors.name = 'Candidate name is required.';
  } else if (name.length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  } else if (name.length > 60) {
    errors.name = 'Name cannot exceed 60 characters.';
  }

  const skills = normalizeTags(formData?.skills);
  if (skills.length === 0) {
    errors.skills = 'Please specify at least one skill.';
  }

  const availability = formData?.availability;
  if (!availability || !VALID_AVAILABILITIES.includes(availability)) {
    errors.availability = 'Please select a valid availability option.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Schema validator for an individual StudentProfile object.
 */
export function isValidProfile(profile) {
  if (!profile || typeof profile !== 'object') return false;

  const hasValidId = typeof profile.id === 'string' && profile.id.trim().length > 0;
  const hasValidName = typeof profile.name === 'string' && profile.name.trim().length > 0;
  const hasValidSkills = Array.isArray(profile.skills) &&
    profile.skills.length > 0 &&
    profile.skills.every((s) => typeof s === 'string' && s.trim().length > 0);
  const hasValidInterests = Array.isArray(profile.interests) &&
    profile.interests.every((i) => typeof i === 'string' && i.trim().length > 0);
  const hasValidAvailability = typeof profile.availability === 'string' &&
    VALID_AVAILABILITIES.includes(profile.availability);
  const hasValidOpenToTeam = typeof profile.openToTeam === 'boolean';

  return (
    hasValidId &&
    hasValidName &&
    hasValidSkills &&
    hasValidInterests &&
    hasValidAvailability &&
    hasValidOpenToTeam
  );
}

/**
 * Schema validator for the entire students storage container payload.
 */
export function isValidStudentsData(data) {
  if (!data || typeof data !== 'object') return false;
  if (data.schemaVersion !== 1) return false;
  if (!Array.isArray(data.profiles)) return false;

  // Verify unique IDs across all profiles
  const ids = new Set();
  for (const profile of data.profiles) {
    if (!isValidProfile(profile)) return false;
    if (ids.has(profile.id)) return false;
    ids.add(profile.id);
  }

  return true;
}

/**
 * Pure filter function for the student profiles directory.
 */
export function filterStudents(profiles, {
  searchQuery = '',
  selectedSkill = 'all',
  selectedInterest = 'all',
  selectedAvailability = 'all',
  openToTeamOnly = false,
} = {}) {
  if (!Array.isArray(profiles)) return [];

  const query = searchQuery.trim().toLowerCase();

  return profiles.filter((student) => {
    // 1. Text search on name or skills
    if (query) {
      const nameMatch = student.name.toLowerCase().includes(query);
      const skillMatch = student.skills.some((s) => s.toLowerCase().includes(query));
      if (!nameMatch && !skillMatch) {
        return false;
      }
    }

    // 2. Skill filter
    if (selectedSkill && selectedSkill !== 'all') {
      const hasSkill = student.skills.some(
        (s) => s.toLowerCase() === selectedSkill.toLowerCase()
      );
      if (!hasSkill) return false;
    }

    // 3. Interest filter
    if (selectedInterest && selectedInterest !== 'all') {
      const hasInterest = student.interests.some(
        (i) => i.toLowerCase() === selectedInterest.toLowerCase()
      );
      if (!hasInterest) return false;
    }

    // 4. Availability filter
    if (selectedAvailability && selectedAvailability !== 'all') {
      if (student.availability !== selectedAvailability) {
        return false;
      }
    }

    // 5. Open to team filter
    if (openToTeamOnly && !student.openToTeam) {
      return false;
    }

    return true;
  });
}

