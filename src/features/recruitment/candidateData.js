/**
 * Curated demonstration student profiles for local recruitment planning.
 * Honestly labeled demonstration data for RoleRelay.
 */
export const DEMO_CANDIDATE_PROFILES = [
  {
    id: 'student-1',
    name: 'Alice Chen',
    role: 'Frontend Developer',
    skills: ['React', 'TypeScript', 'CSS', 'HTML'],
    availability: ['weekends', 'weekday evenings'],
    interests: ['Fintech', 'Education'],
    isAvailable: true
  },
  {
    id: 'student-2',
    name: 'Bob Smith',
    role: 'Backend Developer',
    skills: ['Python', 'Django', 'SQL'],
    availability: ['weekends'],
    interests: ['Fintech', 'AI/ML'],
    isAvailable: true
  },
  {
    id: 'cand-a',
    name: 'Maya Lin',
    role: 'Product Designer',
    skills: ['Figma', 'UI/UX', 'CSS'],
    availability: ['weekends'],
    interests: ['Fintech', 'Accessibility'],
    isAvailable: true
  },
  {
    id: 'cand-b',
    name: 'David Park',
    role: 'Frontend Junior',
    skills: ['React', 'CSS', 'JavaScript'],
    availability: ['weekends'],
    interests: ['Fintech'],
    isAvailable: true
  },
  {
    id: 'cand-c',
    name: 'Samira Khan',
    role: 'Backend Specialist',
    skills: ['Node.js', 'Express', 'SQL'],
    availability: ['weekdays'],
    interests: ['Fintech', 'Open Source'],
    isAvailable: true
  },
  {
    id: 'cand-d',
    name: 'Elena Rostova',
    role: 'Full-Stack Developer',
    skills: ['Node.js', 'React', 'Docker'],
    availability: ['flexible'],
    interests: ['AI/ML', 'Cloud'],
    isAvailable: true
  },
  {
    id: 'cand-e',
    name: 'Marcus Johnson',
    role: 'Data Scientist',
    skills: ['Python', 'SQL', 'Docker'],
    availability: ['weekends'],
    interests: ['Healthcare'],
    isAvailable: false // explicitly unavailable profile for testing and realism
  }
];

export const INITIAL_TEAM_PLAN = {
  id: 'team-fintech-2026',
  name: 'Fintech Explorers',
  opportunityTitle: 'Open Climate & Financial Tech Hackathon',
  capacity: 4,
  requiredSkills: ['React', 'Python', 'Figma', 'Node.js'],
  members: [
    {
      id: 'student-1',
      name: 'Alice Chen',
      role: 'Frontend Developer',
      skills: ['React', 'TypeScript', 'CSS', 'HTML']
    },
    {
      id: 'student-2',
      name: 'Bob Smith',
      role: 'Backend Developer',
      skills: ['Python', 'Django', 'SQL']
    }
  ],
  availability: ['weekends'],
  interests: ['Fintech']
};

