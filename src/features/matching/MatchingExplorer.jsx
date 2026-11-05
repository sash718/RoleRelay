import React, { useState, useMemo } from 'react';
import styles from './MatchingExplorer.module.css';
import CandidateMatchCard from './CandidateMatchCard.jsx';
import { rankCandidates, formatSkill, formatSkillList } from './matching.js';

// Curated demonstration candidate profiles (honestly labeled demonstration data)
const DEMO_PROFILES = [
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
    name: 'Candidate A (Maya Lin)',
    role: 'Product Designer',
    skills: ['Figma', 'UI/UX', 'CSS'],
    availability: ['weekends'],
    interests: ['Fintech', 'Accessibility'],
    isAvailable: true
  },
  {
    id: 'cand-b',
    name: 'Candidate B (David Park)',
    role: 'Frontend Junior',
    skills: ['React', 'CSS', 'JavaScript'],
    availability: ['weekends'],
    interests: ['Fintech'],
    isAvailable: true
  },
  {
    id: 'cand-c',
    name: 'Candidate C (Samira Khan)',
    role: 'Backend Specialist',
    skills: ['Node.js', 'Express', 'SQL'],
    availability: ['weekdays'],
    interests: ['Fintech', 'Open Source'],
    isAvailable: true
  },
  {
    id: 'cand-d',
    name: 'Candidate D (Elena Rostova)',
    role: 'Full-Stack Developer',
    skills: ['Node.js', 'React', 'Docker'],
    availability: ['flexible'],
    interests: ['AI/ML', 'Cloud'],
    isAvailable: true
  },
  {
    id: 'cand-e',
    name: 'Candidate E (Marcus Johnson)',
    role: 'Data Scientist',
    skills: ['Python', 'SQL', 'Docker'],
    availability: ['weekends'],
    interests: ['Healthcare'],
    isAvailable: false // explicitly unavailable
  }
];

export default function MatchingExplorer() {
  // Team plan state
  const [requiredSkills, setRequiredSkills] = useState(['React', 'Python', 'Figma', 'Node.js']);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [memberIds, setMemberIds] = useState(['student-1', 'student-2']);
  const [teamAvailability, setTeamAvailability] = useState(['weekends']);
  const [teamInterests, setTeamInterests] = useState(['Fintech']);
  const [teamCapacity, setTeamCapacity] = useState(4);

  // Add required skill
  const handleAddSkill = (e) => {
    e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (trimmed && !requiredSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setRequiredSkills((prev) => [...prev, trimmed]);
      setNewSkillInput('');
    }
  };

  // Remove required skill
  const handleRemoveSkill = (skillToRemove) => {
    setRequiredSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  // Toggle member on team
  const handleToggleMember = (id) => {
    setMemberIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  // Construct team object for pure algorithm
  const team = useMemo(() => ({
    requiredSkills,
    members: memberIds,
    availability: teamAvailability,
    interests: teamInterests,
    capacity: teamCapacity
  }), [requiredSkills, memberIds, teamAvailability, teamInterests, teamCapacity]);

  // Recalculate candidate ranking dynamically whenever team or profiles change
  const matchingResult = useMemo(() => {
    return rankCandidates(team, DEMO_PROFILES);
  }, [team]);

  const { coverage, rankedCandidates, excludedCandidates, status, message } = matchingResult;

  return (
    <div className={styles.explorerContainer}>
      <header className={styles.introSection}>
        <p className="eyebrow">Explainable Matching</p>
        <h1 className={styles.headerTitle}>Match Lab</h1>
        <p className={styles.headerSubtitle}>
          Evaluate how candidates complement your team plan. Transparent, deterministic calculations based on missing skills, availability, and project interests.
        </p>
        <div className={styles.modelBadge}>
          <span>Deterministic Algorithm</span> · <span>Zero Machine Learning</span>
        </div>
      </header>

      <div className={styles.workbench}>
        {/* Left column: Interactive Team Controls */}
        <aside className={styles.configPanel} aria-label="Team Plan Settings">
          <div>
            <h2 className={styles.configSectionHeading}>Team Plan Context</h2>
            <p className={styles.configDescription}>
              Update required skills or toggle members to watch recommendations recalculate instantly.
            </p>
          </div>

          {/* Required Skills Management */}
          <div className={styles.controlGroup}>
            <label htmlFor="new-skill-input" className={styles.controlLabel}>
              Required Skills ({requiredSkills.length})
            </label>
            <form onSubmit={handleAddSkill} className={styles.inputRow}>
              <input
                id="new-skill-input"
                type="text"
                className={styles.textInput}
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                placeholder="e.g. GraphQL, Figma"
              />
              <button type="submit" className={styles.addButton}>
                Add
              </button>
            </form>

            <ul className={styles.pillsList} aria-label="Currently required skills">
              {requiredSkills.map((skill) => (
                <li key={skill} className={styles.pillItem}>
                  <span>{formatSkill(skill)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className={styles.pillRemoveBtn}
                    aria-label={`Remove required skill ${skill}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Current Team Members Toggle */}
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>
              Team Roster ({memberIds.length} / {teamCapacity} Members)
            </span>
            <ul className={styles.memberToggleList} aria-label="Team member selection">
              {DEMO_PROFILES.slice(0, 4).map((student) => {
                const isSelected = memberIds.includes(student.id);
                return (
                  <li key={student.id}>
                    <label
                      className={`${styles.memberToggleItem} ${
                        isSelected ? styles.memberToggleItemActive : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleMember(student.id)}
                        className={styles.memberCheckbox}
                      />
                      <div className={styles.memberToggleContent}>
                        <span className={styles.memberToggleName}>
                          {student.name} {isSelected && '(On Team)'}
                        </span>
                        <span className={styles.memberToggleSkills}>
                          Skills: {student.skills.map(formatSkill).join(', ')}
                        </span>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Team Capacity Control */}
          <div className={styles.controlGroup}>
            <label htmlFor="team-capacity-input" className={styles.controlLabel}>
              Team Target Capacity
            </label>
            <input
              id="team-capacity-input"
              type="number"
              min="1"
              max="10"
              className={styles.textInput}
              value={teamCapacity}
              onChange={(e) => setTeamCapacity(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
          </div>

          {/* Team Schedule & Track */}
          <div className={styles.controlGroup}>
            <label htmlFor="team-schedule-select" className={styles.controlLabel}>Team Schedule Constraint</label>
            <select
              id="team-schedule-select"
              className={styles.textInput}
              value={teamAvailability[0] || 'weekends'}
              onChange={(e) => setTeamAvailability([e.target.value])}
            >
              <option value="weekends">Weekends only</option>
              <option value="weekdays">Weekdays</option>
              <option value="weekday evenings">Weekday evenings</option>
            </select>
          </div>

          <div className={styles.controlGroup}>
            <label htmlFor="team-track-select" className={styles.controlLabel}>Track / Domain Theme</label>
            <select
              id="team-track-select"
              className={styles.textInput}
              value={teamInterests[0] || 'Fintech'}
              onChange={(e) => setTeamInterests([e.target.value])}
            >
              <option value="Fintech">Fintech</option>
              <option value="AI/ML">AI/ML</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
            </select>
          </div>
        </aside>

        {/* Right column: Skill Coverage Ledger & Ranked Recommendations */}
        <main className={styles.resultsArea} aria-live="polite">
          {/* Skill Coverage Summary */}
          <section className={styles.coverageLedger} aria-labelledby="coverage-summary-heading">
            <div className={styles.ledgerHeader}>
              <h2 id="coverage-summary-heading" className={styles.ledgerTitle}>
                Skill Coverage Ledger
              </h2>
              <span className={styles.coverageRatioTag}>
                {Math.round(coverage.coverageRatio * 100)}% Covered
              </span>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Required</div>
                <div className={styles.statValue}>{coverage.totalRequired}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Covered</div>
                <div className={styles.statValue}>{coverage.totalCovered}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Missing Gaps</div>
                <div className={styles.statValue}>{coverage.totalMissing}</div>
              </div>
            </div>

            <div className={styles.gapListSection}>
              <div className={styles.gapCategory}>
                <strong>Covered Requirements:</strong>
                {coverage.coveredSkills.length > 0 ? (
                  <span className={styles.pillsList}>
                    {formatSkillList(coverage.coveredSkills).map((s) => (
                      <span key={s} className={`${styles.tag} ${styles.tagContributed}`}>
                        ✓ {s}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>None yet</span>
                )}
              </div>

              <div className={styles.gapCategory}>
                <strong>Unfilled Missing Gaps:</strong>
                {coverage.missingSkills.length > 0 ? (
                  <span className={styles.pillsList}>
                    {formatSkillList(coverage.missingSkills).map((s) => (
                      <span key={s} className={`${styles.tag} ${styles.tagRedundant}`}>
                        ! {s}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span style={{ color: 'var(--signal)', fontSize: '0.8rem', fontWeight: 700 }}>
                    All skill requirements covered!
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Candidates List / State Messages */}
          <section aria-labelledby="candidates-heading">
            <h2 id="candidates-heading" className={styles.configSectionHeading}>
              Ranked Candidate Recommendations ({rankedCandidates.length})
            </h2>

            {status === 'team_full' && (
              <div className={styles.emptyNotice}>
                <h3 className={styles.emptyHeading}>Team is at Full Capacity</h3>
                <p className={styles.emptyText}>
                  {message} Adjust team size or remove a member to explore new additions.
                </p>
              </div>
            )}

            {status === 'no_requirements' && (
              <div className={styles.emptyNotice}>
                <h3 className={styles.emptyHeading}>No Skills Required Yet</h3>
                <p className={styles.emptyText}>
                  Add required skills in the team panel to calculate missing gaps and evaluate complementary candidates.
                </p>
              </div>
            )}

            {status === 'fully_covered' && (
              <div style={{ marginBottom: 'var(--s4)' }} className={styles.explanationBox}>
                <p className={styles.explanationText}>
                  <strong>Notice:</strong> All team skill requirements are satisfied by current members. Candidate scores reflect availability and domain alignment without inflating skill recruitment scores.
                </p>
              </div>
            )}

            {rankedCandidates.length > 0 && (
              <div className={styles.candidateList}>
                {rankedCandidates.map((candidate, index) => (
                  <CandidateMatchCard
                    key={candidate.id}
                    candidate={candidate}
                    rank={index + 1}
                    isTopPick={index === 0 && candidate.skillsContributed.length > 0}
                  />
                ))}
              </div>
            )}

            {rankedCandidates.length === 0 && status === 'ok' && (
              <div className={styles.emptyNotice}>
                <h3 className={styles.emptyHeading}>No Eligible Candidates</h3>
                <p className={styles.emptyText}>
                  All available profiles are either already on the team or currently inactive.
                </p>
              </div>
            )}
          </section>

          {/* Excluded Candidates Transparency */}
          {excludedCandidates.length > 0 && (
            <aside aria-label="Excluded candidate log" style={{ borderTop: 'var(--line)', paddingTop: 'var(--s4)' }}>
              <p className={styles.controlLabel}>Excluded Profiles ({excludedCandidates.length})</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'grid', gap: '6px' }}>
                {excludedCandidates.map((ex) => (
                  <li key={ex.id} style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                    <strong>{ex.name}</strong> ({ex.id}): {ex.reason}
                  </li>
                ))}
              </ul>
            </aside>
          )}

          {/* Explainable Methodology Note */}
          <footer className={styles.methodologySection}>
            <h3 className={styles.methodologyHeading}>How This Score is Calculated</h3>
            <p className={styles.methodologyText}>
              Recommendations use a deterministic 3-factor weighted model: <strong>60% Missing-Skill Fit</strong> (proportion of missing gaps covered), <strong>25% Schedule Compatibility</strong> (overlap with requested team hours), and <strong>15% Domain Interests</strong> (shared track preferences). Ties are deterministically resolved by missing-skill count, then schedule fit, then interest fit, and finally unique ID. No machine learning or opaque black-box scoring is used.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}

