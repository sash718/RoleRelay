/**
 * Curated demonstration student candidate profiles.
 * Labeled honestly as demonstration data for browser-local planning.
 */

export const CANDIDATE_PROFILES = [
  {
    id: 'student-1',
    name: 'Alice Chen',
    role: 'Frontend Developer',
    skills: ['React', 'TypeScript', 'CSS', 'HTML'],
    availability: ['weekends', 'weekday evenings'],
    interests: ['Fintech', 'Education'],
    isAvailable: true,
  },
  {
    id: 'student-2',
    name: 'Bob Smith',
    role: 'Backend Developer',
    skills: ['Python', 'Django', 'SQL'],
    availability: ['weekends'],
    interests: ['Fintech', 'AI/ML'],
    isAvailable: true,
  },
  {
    id: 'cand-a',
    name: 'Candidate A (Maya Lin)',
    role: 'Product Designer',
    skills: ['Figma', 'UI/UX', 'CSS'],
    availability: ['weekends'],
    interests: ['Fintech', 'Accessibility'],
    isAvailable: true,
  },
  {
    id: 'cand-b',
    name: 'Candidate B (David Park)',
    role: 'Frontend Junior',
    skills: ['React', 'CSS', 'JavaScript'],
    availability: ['weekends'],
    interests: ['Fintech'],
    isAvailable: true,
  },
  {
    id: 'cand-c',
    name: 'Candidate C (Samira Khan)',
    role: 'Backend Specialist',
    skills: ['Node.js', 'Express', 'SQL'],
    availability: ['weekdays'],
    interests: ['Fintech', 'Open Source'],
    isAvailable: true,
  },
  {
    id: 'cand-d',
    name: 'Candidate D (Elena Rostova)',
    role: 'Full-Stack Developer',
    skills: ['Node.js', 'React', 'Docker'],
    availability: ['flexible'],
    interests: ['AI/ML', 'Cloud'],
    isAvailable: true,
  },
  {
    id: 'cand-e',
    name: 'Candidate E (Marcus Johnson)',
    role: 'Data Scientist',
    skills: ['Python', 'SQL', 'Docker'],
    availability: ['weekends'],
    interests: ['Healthcare'],
    isAvailable: false,
  },
];

/**
 * Retrieves candidate profiles, indexed by id for O(1) lookups.
 * 
 * @returns {Map<string, object>}
 */
export function getCandidateProfileMap() {
  const map = new Map();
  for (const profile of CANDIDATE_PROFILES) {
    map.set(profile.id, profile);
  }
  return map;
}

