import { useState, useMemo } from 'react';
import { readStoredData, saveStoredData } from '../../services/storage.js';
import {
  isValidStudentsData,
  filterStudents,
  VALID_AVAILABILITIES,
  AVAILABILITY_LABELS,
} from './studentValidation.js';
import StudentCard from './StudentCard.jsx';
import StudentProfileForm from './StudentProfileForm.jsx';
import StudentDetailModal from './StudentDetailModal.jsx';
import styles from './StudentDiscovery.module.css';

const STORAGE_KEY = 'rolerelay_students';

// Curated demonstration records labeled honestly per project rules in AGENTS.md
const DEMO_PROFILES = [
  {
    id: 'cand_demo_alex',
    name: 'Alex Rivera',
    skills: ['React', 'JavaScript', 'CSS', 'Vite'],
    interests: ['FinTech', 'UI/UX Design', 'Web3'],
    availability: 'weekends',
    openToTeam: true,
  },
  {
    id: 'cand_demo_samira',
    name: 'Samira Khan',
    skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker'],
    interests: ['HealthTech', 'Climate Tech', 'AI/ML'],
    availability: 'part-time',
    openToTeam: true,
  },
  {
    id: 'cand_demo_jordan',
    name: 'Jordan Lee',
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
    interests: ['EdTech', 'DevTools', 'Open Source'],
    availability: 'full-time',
    openToTeam: false,
  },
];

function loadInitialState() {
  const result = readStoredData(STORAGE_KEY, isValidStudentsData);
  if (result.status === 'success') {
    return { profiles: result.data.profiles || [], storageError: null };
  }
  if (result.status === 'missing') {
    return { profiles: [], storageError: null };
  }
  return {
    profiles: [],
    storageError: result.message || 'Saved student data has an unsupported structure.',
  };
}

export default function StudentDiscovery() {
  const [directoryState, setDirectoryState] = useState(loadInitialState);
  const { profiles, storageError } = directoryState;
  const [feedback, setFeedback] = useState(null);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [selectedInterest, setSelectedInterest] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [openToTeamOnly, setOpenToTeamOnly] = useState(false);

  // Compute unique skills and interests dynamically for filter dropdowns
  const availableSkills = useMemo(() => {
    const set = new Set();
    for (const p of profiles) {
      if (Array.isArray(p.skills)) {
        for (const s of p.skills) set.add(s);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [profiles]);

  const availableInterests = useMemo(() => {
    const set = new Set();
    for (const p of profiles) {
      if (Array.isArray(p.interests)) {
        for (const i of p.interests) set.add(i);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [profiles]);

  // Derived filtered profiles (Pure calculation, no useEffect sync)
  const filteredProfiles = useMemo(() => {
    return filterStudents(profiles, {
      searchQuery,
      selectedSkill,
      selectedInterest,
      selectedAvailability,
      openToTeamOnly,
    });
  }, [profiles, searchQuery, selectedSkill, selectedInterest, selectedAvailability, openToTeamOnly]);

  const showTemporaryFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 3500);
  };

  // Persist helper
  const persistProfiles = (nextProfiles, successMessage) => {
    const payload = {
      schemaVersion: 1,
      profiles: nextProfiles,
    };

    if (!isValidStudentsData(payload)) {
      showTemporaryFeedback('error', 'Cannot save: profile collection failed validation check.');
      return false;
    }

    const saveResult = saveStoredData(STORAGE_KEY, payload);
    if (saveResult.status === 'success') {
      setDirectoryState({ profiles: nextProfiles, storageError: null });
      if (successMessage) {
        showTemporaryFeedback('success', successMessage);
      }
      return true;
    } else {
      showTemporaryFeedback('error', saveResult.message || 'Changes could not be saved to browser storage.');
      return false;
    }
  };

  // Add / Edit Profile
  const handleSaveProfile = (profile) => {
    let nextProfiles;
    const exists = profiles.some((p) => p.id === profile.id);

    if (exists) {
      nextProfiles = profiles.map((p) => (p.id === profile.id ? profile : p));
    } else {
      nextProfiles = [profile, ...profiles];
    }

    const success = persistProfiles(
      nextProfiles,
      exists ? `Updated profile for "${profile.name}".` : `Added "${profile.name}" to directory.`
    );

    if (success) {
      setIsFormOpen(false);
      setEditingProfile(null);
    }
  };

  // Remove Profile
  const handleRemoveProfile = (profile) => {
    const confirmed = window.confirm(`Remove "${profile.name}" from the local directory?`);
    if (!confirmed) return;

    const nextProfiles = profiles.filter((p) => p.id !== profile.id);
    persistProfiles(nextProfiles, `Removed "${profile.name}" from local directory.`);

    if (viewingProfile?.id === profile.id) {
      setViewingProfile(null);
    }
  };

  // Load Demonstration Candidates
  const handleLoadDemoProfiles = () => {
    const existingIds = new Set(profiles.map((p) => p.id));
    const newDemoProfiles = DEMO_PROFILES.filter((demo) => !existingIds.has(demo.id));

    if (newDemoProfiles.length === 0) {
      showTemporaryFeedback('success', 'Sample profiles are already in your directory.');
      return;
    }

    const nextProfiles = [...profiles, ...newDemoProfiles];
    persistProfiles(nextProfiles, `Loaded ${newDemoProfiles.length} sample candidate profiles.`);
  };

  // Explicit storage recovery (per AGENTS.md rule: user must explicitly choose recovery)
  const handleResetCorruptStorage = () => {
    const confirmed = window.confirm(
      'Existing stored student data is unreadable or malformed. Resetting will clear damaged data and initialize a clean directory. Proceed?'
    );
    if (!confirmed) return;

    persistProfiles([], 'Student directory has been reset.');
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSkill('all');
    setSelectedInterest('all');
    setSelectedAvailability('all');
    setOpenToTeamOnly(false);
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    selectedSkill !== 'all' ||
    selectedInterest !== 'all' ||
    selectedAvailability !== 'all' ||
    openToTeamOnly
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Candidate Directory</p>
        <h1 className={styles.title}>Find your teammates.</h1>
        <p className={styles.description}>
          Browse candidate profiles by skills, availability, and interests. Add contributors to your local directory and feed them into the Match Lab.
        </p>
      </header>

      {storageError && (
        <div className={styles.storageAlert} role="alert">
          <div>
            <strong>Storage issue: </strong>
            <span>{storageError} Existing data has not been modified.</span>
          </div>
          <button type="button" className={styles.dangerButton} onClick={handleResetCorruptStorage}>
            Reset storage
          </button>
        </div>
      )}

      {feedback && (
        <div
          className={`${styles.feedbackBanner} ${feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}`}
          role="status"
        >
          {feedback.message}
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.directoryStats}>
          Showing <strong>{filteredProfiles.length}</strong> of <strong>{profiles.length}</strong> candidate{profiles.length === 1 ? '' : 's'}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {profiles.length === 0 && (
            <button type="button" className={styles.secondaryBtn} onClick={handleLoadDemoProfiles}>
              Load sample profiles
            </button>
          )}
          <button type="button" className={styles.primaryButton} onClick={() => { setEditingProfile(null); setIsFormOpen(true); }}>
            + Add candidate
          </button>
        </div>
      </div>

      <section className={styles.controlsPanel} aria-label="Candidate search and filter">
        <div className={styles.searchRow}>
          <div className={styles.searchInputWrapper}>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search by name or skill…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search candidate by name or skill"
            />
            {searchQuery && (
              <button type="button" className={styles.clearSearchBtn} onClick={() => setSearchQuery('')} aria-label="Clear search">✕</button>
            )}
          </div>
        </div>
        <div className={styles.filtersRow}>
          <div className={styles.filterGroup}>
            <label htmlFor="filter-skill" className={styles.filterLabel}>Skill</label>
            <select id="filter-skill" className={styles.selectInput} value={selectedSkill} onChange={(e) => setSelectedSkill(e.target.value)}>
              <option value="all">All skills</option>
              {availableSkills.map((skill) => <option key={skill} value={skill}>{skill}</option>)}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label htmlFor="filter-interest" className={styles.filterLabel}>Interest</label>
            <select id="filter-interest" className={styles.selectInput} value={selectedInterest} onChange={(e) => setSelectedInterest(e.target.value)}>
              <option value="all">All interests</option>
              {availableInterests.map((interest) => <option key={interest} value={interest}>{interest}</option>)}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label htmlFor="filter-availability" className={styles.filterLabel}>Availability</label>
            <select id="filter-availability" className={styles.selectInput} value={selectedAvailability} onChange={(e) => setSelectedAvailability(e.target.value)}>
              <option value="all">All</option>
              {VALID_AVAILABILITIES.map((avail) => <option key={avail} value={avail}>{AVAILABILITY_LABELS[avail]}</option>)}
            </select>
          </div>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" className={styles.checkboxInput} checked={openToTeamOnly} onChange={(e) => setOpenToTeamOnly(e.target.checked)} />
            Open to team
          </label>
          {hasActiveFilters && (
            <button type="button" className={styles.resetButton} onClick={handleResetFilters}>Clear filters</button>
          )}
        </div>
      </section>

      {filteredProfiles.length > 0 ? (
        <section className={styles.cardsGrid} aria-label="Candidate directory">
          {filteredProfiles.map((profile) => (
            <StudentCard
              key={profile.id}
              profile={profile}
              onView={(p) => setViewingProfile(p)}
              onEdit={(p) => { setEditingProfile(p); setIsFormOpen(true); }}
              onRemove={handleRemoveProfile}
            />
          ))}
        </section>
      ) : (
        <section className={styles.emptyState}>
          {profiles.length === 0 ? (
            <>
              <h2 className={styles.emptyStateTitle}>Your directory is empty</h2>
              <p className={styles.emptyStateText}>
                Add candidate profiles to start discovering potential teammates. You can also load sample profiles to explore the layout.
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button type="button" className={styles.secondaryBtn} onClick={handleLoadDemoProfiles}>Load sample profiles</button>
                <button type="button" className={styles.primaryButton} onClick={() => { setEditingProfile(null); setIsFormOpen(true); }}>+ Add first candidate</button>
              </div>
            </>
          ) : (
            <>
              <h2 className={styles.emptyStateTitle}>No candidates match</h2>
              <p className={styles.emptyStateText}>Try adjusting or clearing your search and filter criteria.</p>
              <button type="button" className={styles.secondaryBtn} style={{ marginTop: '12px' }} onClick={handleResetFilters}>Clear all filters</button>
            </>
          )}
        </section>
      )}

      {isFormOpen && (
        <StudentProfileForm
          initialData={editingProfile}
          onSave={handleSaveProfile}
          onCancel={() => { setIsFormOpen(false); setEditingProfile(null); }}
        />
      )}
      {viewingProfile && (
        <StudentDetailModal
          profile={viewingProfile}
          onClose={() => setViewingProfile(null)}
          onEdit={(p) => { setViewingProfile(null); setEditingProfile(p); setIsFormOpen(true); }}
        />
      )}
    </div>
  );
}
