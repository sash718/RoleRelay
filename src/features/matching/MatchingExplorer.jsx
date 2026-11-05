import React, { useState, useMemo } from 'react';
import styles from './MatchingExplorer.module.css';
import CandidateMatchCard from './CandidateMatchCard.jsx';
import { rankCandidates, formatSkill, formatSkillList } from './matching.js';

const CANDIDATE_PROFILES = [
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
    name: 'Maya Lin',
    role: 'Product Designer',
    skills: ['Figma', 'UI/UX', 'CSS'],
    availability: ['weekends'],
    interests: ['Fintech', 'Accessibility'],
    isAvailable: true,
  },
  {
    id: 'cand-b',
    name: 'David Park',
    role: 'Frontend Developer',
    skills: ['React', 'CSS', 'JavaScript'],
    availability: ['weekends'],
    interests: ['Fintech'],
    isAvailable: true,
  },
  {
    id: 'cand-c',
    name: 'Samira Khan',
    role: 'Backend Specialist',
    skills: ['Node.js', 'Express', 'SQL'],
    availability: ['weekdays'],
    interests: ['Fintech', 'Open Source'],
    isAvailable: true,
  },
  {
    id: 'cand-d',
    name: 'Elena Rostova',
    role: 'Full-Stack Developer',
    skills: ['Node.js', 'React', 'Docker'],
    availability: ['flexible'],
    interests: ['AI/ML', 'Cloud'],
    isAvailable: true,
  },
  {
    id: 'cand-e',
    name: 'Marcus Johnson',
    role: 'Data Scientist',
    skills: ['Python', 'SQL', 'Docker'],
    availability: ['weekends'],
    interests: ['Healthcare'],
    isAvailable: false,
  },
];

export default function MatchingExplorer() {
  const [requiredSkills, setRequiredSkills] = useState(['React', 'Python', 'Figma', 'Node.js']);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [memberIds, setMemberIds] = useState(['student-1', 'student-2']);
  const [teamAvailability, setTeamAvailability] = useState(['weekends']);
  const [teamInterests, setTeamInterests] = useState(['Fintech']);
  const [teamCapacity, setTeamCapacity] = useState(4);

  const handleAddSkill = (e) => {
    e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (trimmed && !requiredSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setRequiredSkills((prev) => [...prev, trimmed]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setRequiredSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleToggleMember = (id) => {
    setMemberIds((prev) => (prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]));
  };

  const team = useMemo(() => ({
    requiredSkills,
    members: memberIds,
    availability: teamAvailability,
    interests: teamInterests,
    capacity: teamCapacity,
  }), [requiredSkills, memberIds, teamAvailability, teamInterests, teamCapacity]);

  const matchingResult = useMemo(() => {
    return rankCandidates(team, CANDIDATE_PROFILES);
  }, [team]);

  const { coverage, rankedCandidates, excludedCandidates, status, message } = matchingResult;

  const coveragePercent = Math.round(coverage.coverageRatio * 100);

  return (
    <div className={styles.explorerContainer}>
      {/* Header */}
      <header className={styles.introSection}>
        <div className={styles.introContent}>
          <p className="eyebrow">Smart Matching</p>
          <h1 className={styles.headerTitle}>Match Lab</h1>
          <p className={styles.headerSubtitle}>
            Evaluate how candidates complement your team plan. Transparent scoring based on missing skill gaps, availability, and track alignment.
          </p>
        </div>
      </header>

      {/* Top Coverage Dashboard Summary */}
      <section className={styles.coverageSummaryCard} aria-labelledby="coverage-heading">
        <div className={styles.coverageTopRow}>
          <div>
            <span className={styles.cardEyebrow}>Team Skill Coverage</span>
            <h2 id="coverage-heading" className={styles.coverageHeading}>
              {coverage.totalCovered} of {coverage.totalRequired} Required Skills Covered
            </h2>
          </div>
          <div className={styles.coverageMeterWrap}>
            <div className={styles.coverageRatioBadge}>
              <span className={styles.coverageNumber}>{coveragePercent}%</span>
              <span className={styles.coverageLabel}>Covered</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={styles.coverageProgressBarBg} aria-hidden="true">
          <div
            className={styles.coverageProgressBarFill}
            style={{ width: `${coveragePercent}%` }}
          />
        </div>

        {/* Covered vs Missing Pills Grid */}
        <div className={styles.gapsSummaryRow}>
          <div className={styles.gapCol}>
            <span className={styles.gapColTitle}>
              <span className={styles.checkDot}>✓</span> Covered by Current Members ({coverage.coveredSkills.length})
            </span>
            <div className={styles.gapPillsList}>
              {coverage.coveredSkills.length > 0 ? (
                formatSkillList(coverage.coveredSkills).map((s) => (
                  <span key={s} className={styles.tagCovered}>✓ {s}</span>
                ))
              ) : (
                <span className={styles.emptyGapNotice}>None covered yet</span>
              )}
            </div>
          </div>

          <div className={styles.gapCol}>
            <span className={styles.gapColTitle}>
              <span className={styles.alertDot}>!</span> Unfilled Missing Gaps ({coverage.missingSkills.length})
            </span>
            <div className={styles.gapPillsList}>
              {coverage.missingSkills.length > 0 ? (
                formatSkillList(coverage.missingSkills).map((s) => (
                  <span key={s} className={styles.tagMissing}>! {s}</span>
                ))
              ) : (
                <span className={styles.allCoveredNotice}>All required skills covered!</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Two Column Workbench */}
      <div className={styles.workbench}>
        {/* Left Column: Team Controls */}
        <aside className={styles.configPanel} aria-label="Team Plan Settings">
          <div className={styles.panelHead}>
            <h2 className={styles.configSectionHeading}>Team Parameters</h2>
            <p className={styles.configDescription}>
              Adjust required skills, toggle roster members, or change team constraints.
            </p>
          </div>

          {/* Required Skills Manager */}
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
                placeholder="e.g. GraphQL, Figma, Docker"
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

          {/* Team Members Toggle */}
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>
              Current Roster ({memberIds.length} / {teamCapacity})
            </span>
            <ul className={styles.memberToggleList} aria-label="Team member selection">
              {CANDIDATE_PROFILES.slice(0, 4).map((student) => {
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
                          {student.name} {isSelected && <span className={styles.onTeamBadge}>On Team</span>}
                        </span>
                        <span className={styles.memberToggleSkills}>
                          {student.skills.map(formatSkill).join(', ')}
                        </span>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Constraints Grid */}
          <div className={styles.constraintsGrid}>
            <div className={styles.controlGroup}>
              <label htmlFor="team-capacity-input" className={styles.controlLabel}>
                Capacity
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

            <div className={styles.controlGroup}>
              <label htmlFor="team-schedule-select" className={styles.controlLabel}>
                Schedule
              </label>
              <select
                id="team-schedule-select"
                className={styles.selectInput}
                value={teamAvailability[0] || 'weekends'}
                onChange={(e) => setTeamAvailability([e.target.value])}
              >
                <option value="weekends">Weekends only</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekday evenings">Weekday evenings</option>
              </select>
            </div>
          </div>

          <div className={styles.controlGroup}>
            <label htmlFor="team-track-select" className={styles.controlLabel}>
              Track Theme
            </label>
            <select
              id="team-track-select"
              className={styles.selectInput}
              value={teamInterests[0] || 'Fintech'}
              onChange={(e) => setTeamInterests([e.target.value])}
            >
              <option value="Fintech">FinTech</option>
              <option value="AI/ML">AI / Machine Learning</option>
              <option value="Healthcare">HealthTech</option>
              <option value="Education">EdTech</option>
            </select>
          </div>
        </aside>

        {/* Right Column: Ranked Recommendations */}
        <main className={styles.resultsArea} aria-live="polite">
          <div className={styles.resultsHeader}>
            <div>
              <h2 className={styles.resultsTitle}>
                Ranked Recommendations ({rankedCandidates.length})
              </h2>
              <p className={styles.resultsSubtitle}>
                Candidates ranked by how effectively they cover missing skills and align with team availability.
              </p>
            </div>
          </div>

          {status === 'team_full' && (
            <div className={styles.emptyNotice}>
              <h3 className={styles.emptyHeading}>Team is at Full Capacity</h3>
              <p className={styles.emptyText}>
                {message} Increase team capacity or remove a member to explore new additions.
              </p>
            </div>
          )}

          {status === 'no_requirements' && (
            <div className={styles.emptyNotice}>
              <h3 className={styles.emptyHeading}>No Skills Required Yet</h3>
              <p className={styles.emptyText}>
                Add required skills in the team panel to evaluate candidate complement and fill coverage gaps.
              </p>
            </div>
          )}

          {status === 'fully_covered' && (
            <div className={styles.explanationNoticeBox}>
              <p>
                <strong>Notice:</strong> All team skill requirements are covered by existing members. Candidate scores reflect availability and track alignment.
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

          {/* Excluded Candidates transparency */}
          {excludedCandidates.length > 0 && (
            <div className={styles.excludedCard}>
              <span className={styles.controlLabel}>Excluded Profiles ({excludedCandidates.length})</span>
              <ul className={styles.excludedList}>
                {excludedCandidates.map((ex) => (
                  <li key={ex.id}>
                    <strong>{ex.name}</strong>: {ex.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
