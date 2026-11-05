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
      showTemporaryFeedback('success', 'Demonstration profiles are already in your directory.');
      return;
    }

    const nextProfiles = [...profiles, ...newDemoProfiles];
    persistProfiles(nextProfiles, `Loaded ${newDemoProfiles.length} demonstration candidate profiles.`);
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
        <p className={styles.eyebrow}>Candidate Discovery</p>
        <h1 className={styles.title}>Explore possible contributors</h1>
        <p className={styles.description}>
          Discover potential teammates by skill sets, availability, and interests. Saved candidates provide stable IDs for the Match Lab and Recruitment Board.
        </p>

        <div className={styles.disclaimerBanner} role="note">
          <span>
            <strong>Browser-Local Directory:</strong> Candidate profiles are created and stored inside this browser&apos;s localStorage. They are not cloud-registered accounts, globally discoverable users, or verified real-time university students.
          </span>
        </div>
      </header>

      {storageError && (
        <div className={styles.storageAlert} role="alert">
          <div>
            <strong>Storage Issue: </strong>
            <span>{storageError} Existing data has not been modified.</span>
          </div>
          <button
            type="button"
            className={styles.dangerButton}
            onClick={handleResetCorruptStorage}
          >
            Reset Damaged Storage
          </button>
        </div>
      )}

      {feedback && (
        <div
          className={`${styles.feedbackBanner} ${
            feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError
          }`}
          role="status"
        >
          {feedback.message}
        </div>
      )}

      {/* Action Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.directoryStats}>
          Showing <strong>{filteredProfiles.length}</strong> of <strong>{profiles.length}</strong> local candidate{profiles.length === 1 ? '' : 's'}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {profiles.length === 0 && (
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={handleLoadDemoProfiles}
              title="Add 3 curated sample profiles labeled honestly as demo data"
            >
              Load Demo Candidates
            </button>
          )}
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => {
              setEditingProfile(null);
              setIsFormOpen(true);
            }}
          >
            + Add Candidate Profile
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <section className={styles.controlsPanel} aria-label="Candidate search and filter controls">
        <div className={styles.searchRow}>
          <div className={styles.searchInputWrapper}>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search candidate by name or skill (e.g. Alex, React, Python)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search candidate by name or skill"
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => setSearchQuery('')}
                aria-label="Clear search input"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className={styles.filtersRow}>
          <div className={styles.filterGroup}>
            <label htmlFor="filter-skill" className={styles.filterLabel}>
              Skill:
            </label>
            <select
              id="filter-skill"
              className={styles.selectInput}
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
            >
              <option value="all">All Skills ({availableSkills.length})</option>
              {availableSkills.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="filter-interest" className={styles.filterLabel}>
              Interest:
            </label>
            <select
              id="filter-interest"
              className={styles.selectInput}
              value={selectedInterest}
              onChange={(e) => setSelectedInterest(e.target.value)}
            >
              <option value="all">All Interests ({availableInterests.length})</option>
              {availableInterests.map((interest) => (
                <option key={interest} value={interest}>
                  {interest}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="filter-availability" className={styles.filterLabel}>
              Availability:
            </label>
            <select
              id="filter-availability"
              className={styles.selectInput}
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
            >
              <option value="all">All Availabilities</option>
              {VALID_AVAILABILITIES.map((avail) => (
                <option key={avail} value={avail}>
                  {AVAILABILITY_LABELS[avail]}
                </option>
              ))}
            </select>
          </div>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              className={styles.checkboxInput}
              checked={openToTeamOnly}
              onChange={(e) => setOpenToTeamOnly(e.target.checked)}
            />
            Open to Team Only
          </label>

          {hasActiveFilters && (
            <button
              type="button"
              className={styles.resetButton}
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          )}
        </div>
      </section>

      {/* Directory Grid */}
      {filteredProfiles.length > 0 ? (
        <section className={styles.cardsGrid} aria-label="Student candidate directory">
          {filteredProfiles.map((profile) => (
            <StudentCard
              key={profile.id}
              profile={profile}
              onView={(p) => setViewingProfile(p)}
              onEdit={(p) => {
                setEditingProfile(p);
                setIsFormOpen(true);
              }}
              onRemove={handleRemoveProfile}
            />
          ))}
        </section>
      ) : (
        <section className={styles.emptyState}>
          {profiles.length === 0 ? (
            <>
              <h2 className={styles.emptyStateTitle}>Local directory is empty</h2>
              <p className={styles.emptyStateText}>
                No candidate profiles have been added yet in this browser. Add your first candidate profile or load demonstration profiles to start discovering teammates.
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={handleLoadDemoProfiles}
                >
                  Load Demo Candidates
                </button>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => {
                    setEditingProfile(null);
                    setIsFormOpen(true);
                  }}
                >
                  + Add First Candidate
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className={styles.emptyStateTitle}>No matching candidates</h2>
              <p className={styles.emptyStateText}>
                No student profiles matched your current search and filter criteria. Try adjusting or resetting your filters.
              </p>
              <button
                type="button"
                className={styles.secondaryBtn}
                style={{ marginTop: '10px' }}
                onClick={handleResetFilters}
              >
                Clear all filters
              </button>
            </>
          )}
        </section>
      )}

      {/* Create / Edit Form Modal */}
      {isFormOpen && (
        <StudentProfileForm
          initialData={editingProfile}
          onSave={handleSaveProfile}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingProfile(null);
          }}
        />
      )}

      {/* Detail Modal */}
      {viewingProfile && (
        <StudentDetailModal
          profile={viewingProfile}
          onClose={() => setViewingProfile(null)}
          onEdit={(p) => {
            setViewingProfile(null);
            setEditingProfile(p);
            setIsFormOpen(true);
          }}
        />
      )}
    </div>
  );
}
