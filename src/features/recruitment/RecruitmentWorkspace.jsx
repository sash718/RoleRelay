import React, { useState, useMemo, useEffect, useCallback } from 'react';
import styles from './Recruitment.module.css';
import Shortlist from './Shortlist.jsx';
import CandidateComparison from './CandidateComparison.jsx';
import {
  DEMO_CANDIDATE_PROFILES,
  INITIAL_TEAM_PLAN
} from './candidateData.js';
import {
  RECRUITMENT_STATUSES,
  createRecruitmentRecord,
  validateCandidateForShortlist,
  validateCandidateForTeamAddition,
  isValidRecruitmentWorkspace
} from './recruitmentValidation.js';
import {
  getSkillCoverage,
  rankCandidates,
  formatSkillList,
  getMemberId
} from '../matching/matching.js';
import { readStoredData, saveStoredData } from '../../services/storage.js';

const STORAGE_KEY = 'rolerelay_recruitment_workspace';

export default function RecruitmentWorkspace() {
  // Initial storage retrieval
  const [initialLoadResult] = useState(() => {
    return readStoredData(STORAGE_KEY, isValidRecruitmentWorkspace);
  });

  const [team, setTeam] = useState(() => {
    if (initialLoadResult.status === 'success' && initialLoadResult.data?.team) {
      return initialLoadResult.data.team;
    }
    return INITIAL_TEAM_PLAN;
  });

  const [shortlist, setShortlist] = useState(() => {
    if (initialLoadResult.status === 'success' && Array.isArray(initialLoadResult.data?.shortlist)) {
      return initialLoadResult.data.shortlist;
    }
    // Default initial demonstration shortlist (honestly labeled)
    return [
      createRecruitmentRecord(INITIAL_TEAM_PLAN.id, 'cand-a', RECRUITMENT_STATUSES.SHORTLISTED),
      createRecruitmentRecord(INITIAL_TEAM_PLAN.id, 'cand-b', RECRUITMENT_STATUSES.UNDER_CONSIDERATION)
    ];
  });

  const [storageError, setStorageError] = useState(() => {
    if (initialLoadResult.status === 'error') {
      return initialLoadResult.message || 'Saved recruitment workspace could not be read.';
    }
    return null;
  });

  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [selectedComparisonIds, setSelectedComparisonIds] = useState(['cand-a', 'cand-b']);

  // Pure dynamic calculations
  const profiles = DEMO_CANDIDATE_PROFILES;

  const coverage = useMemo(() => {
    return getSkillCoverage(team, profiles);
  }, [team, profiles]);

  const matchingResult = useMemo(() => {
    return rankCandidates(team, profiles);
  }, [team, profiles]);

  const existingMemberIds = useMemo(() => {
    return new Set((team?.members || []).map((m) => getMemberId(m)).filter(Boolean));
  }, [team]);

  const isTeamFull = (team?.members?.length || 0) >= (team?.capacity || 4);

  // Helper to persist state to browser storage
  const persistWorkspace = useCallback((updatedTeam, updatedShortlist) => {
    const payload = {
      schemaVersion: 1,
      team: updatedTeam,
      shortlist: updatedShortlist
    };
    const res = saveStoredData(STORAGE_KEY, payload);
    if (res.status === 'error') {
      setStorageError(res.message || 'Browser storage is unavailable or quota was exceeded.');
    } else {
      setStorageError(null);
    }
  }, []);

  // Clear temporary feedback message after a delay
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  // Handle Shortlisting a candidate
  const handleShortlistCandidate = (candidate) => {
    setValidationError(null);
    const validation = validateCandidateForShortlist(candidate, team, shortlist);
    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }

    const newRecord = createRecruitmentRecord(team.id, candidate.id, RECRUITMENT_STATUSES.SHORTLISTED);
    const updatedShortlist = [
      ...shortlist.filter((r) => r.candidateId !== candidate.id),
      newRecord
    ];

    setShortlist(updatedShortlist);
    setFeedbackMessage(`Shortlisted ${candidate.name} for local planning.`);
    persistWorkspace(team, updatedShortlist);
  };

  // Handle changing status on shortlisted candidate
  const handleChangeStatus = (candidateId, newStatus) => {
    setValidationError(null);
    const updatedShortlist = shortlist.map((item) => {
      if (item.candidateId === candidateId) {
        return { ...item, status: newStatus, updatedAt: new Date().toISOString() };
      }
      return item;
    });

    setShortlist(updatedShortlist);
    persistWorkspace(team, updatedShortlist);
  };

  // Handle removing a candidate from the shortlist
  const handleRemoveFromShortlist = (candidateId) => {
    setValidationError(null);
    const updatedShortlist = shortlist.filter((item) => item.candidateId !== candidateId);
    setShortlist(updatedShortlist);
    setSelectedComparisonIds((prev) => prev.filter((id) => id !== candidateId));
    setFeedbackMessage('Candidate removed from recruitment shortlist.');
    persistWorkspace(team, updatedShortlist);
  };

  // Handle adding a candidate to the team roster
  const handleAddToTeam = (candidate) => {
    setValidationError(null);
    const validation = validateCandidateForTeamAddition(candidate, team);
    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }

    const newMember = {
      id: candidate.id,
      name: candidate.name,
      role: candidate.role || 'Contributor',
      skills: candidate.skills || []
    };

    const updatedTeam = {
      ...team,
      members: [...(team.members || []), newMember]
    };

    // Update recruitment record status to 'added_to_team'
    const updatedShortlist = shortlist.map((item) => {
      if (item.candidateId === candidate.id) {
        return { ...item, status: RECRUITMENT_STATUSES.ADDED_TO_TEAM, updatedAt: new Date().toISOString() };
      }
      return item;
    });

    // If candidate was not in shortlist, add them as added_to_team
    if (!updatedShortlist.some((item) => item.candidateId === candidate.id)) {
      updatedShortlist.push(
        createRecruitmentRecord(team.id, candidate.id, RECRUITMENT_STATUSES.ADDED_TO_TEAM)
      );
    }

    setTeam(updatedTeam);
    setShortlist(updatedShortlist);
    setFeedbackMessage(`Successfully added ${candidate.name} to local team roster.`);
    persistWorkspace(updatedTeam, updatedShortlist);
  };

  // Handle removing a member from the team
  const handleRemoveMember = (memberId) => {
    setValidationError(null);
    const updatedMembers = (team.members || []).filter((m) => getMemberId(m) !== memberId);
    const updatedTeam = {
      ...team,
      members: updatedMembers
    };

    // Update shortlist record back to 'shortlisted' if present
    const updatedShortlist = shortlist.map((item) => {
      if (item.candidateId === memberId) {
        return { ...item, status: RECRUITMENT_STATUSES.SHORTLISTED, updatedAt: new Date().toISOString() };
      }
      return item;
    });

    setTeam(updatedTeam);
    setShortlist(updatedShortlist);
    setFeedbackMessage('Member removed from team roster; open skill gaps updated.');
    persistWorkspace(updatedTeam, updatedShortlist);
  };

  // Toggle selection for side-by-side candidate comparison
  const handleToggleComparison = (candidateId) => {
    setSelectedComparisonIds((prev) => {
      if (prev.includes(candidateId)) {
        return prev.filter((id) => id !== candidateId);
      }
      if (prev.length >= 2) {
        return [prev[1], candidateId];
      }
      return [...prev, candidateId];
    });
  };

  const handleClearComparison = () => {
    setSelectedComparisonIds([]);
  };

  // Handle storage error recovery (explicit reset)
  const handleResetWorkspace = () => {
    setTeam(INITIAL_TEAM_PLAN);
    const defaultShortlist = [
      createRecruitmentRecord(INITIAL_TEAM_PLAN.id, 'cand-a', RECRUITMENT_STATUSES.SHORTLISTED),
      createRecruitmentRecord(INITIAL_TEAM_PLAN.id, 'cand-b', RECRUITMENT_STATUSES.UNDER_CONSIDERATION)
    ];
    setShortlist(defaultShortlist);
    setStorageError(null);
    setFeedbackMessage('Workspace reset to default configuration.');
    persistWorkspace(INITIAL_TEAM_PLAN, defaultShortlist);
  };

  // Comparison candidates lookup
  const comparisonCandidateA = profiles.find((p) => p.id === selectedComparisonIds[0]);
  const comparisonCandidateB = profiles.find((p) => p.id === selectedComparisonIds[1]);

  return (
    <div className={styles.workspaceContainer}>
      <header className={styles.introSection}>
        <p className="eyebrow">Recruitment & Team Formation</p>
        <h1 className={styles.headerTitle}>Recruitment Board</h1>
        <p className={styles.headerSubtitle}>
          Shortlist candidate profiles, compare complementary skills, confirm additions to your local team plan, and monitor open requirements.
        </p>
      </header>



      {/* Storage Error Alert */}
      {storageError && (
        <div className={styles.errorBanner} role="alert">
          <div>
            <strong>Storage Issue:</strong> {storageError}
          </div>
          <button
            type="button"
            onClick={handleResetWorkspace}
            className={styles.primaryButton}
            style={{ fontSize: '0.74rem', padding: '4px 10px' }}
          >
            Reset Workspace
          </button>
        </div>
      )}

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div className={styles.feedbackBanner} role="status">
          <span>{feedbackMessage}</span>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className={styles.dismissButton}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      {/* Validation Error Alert */}
      {validationError && (
        <div className={styles.errorBanner} role="alert">
          <span>{validationError}</span>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            className={styles.dismissButton}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Section 1: Team Plan & Skill Coverage */}
      <section className={styles.teamSummaryCard} aria-labelledby="team-heading">
        <div className={styles.teamTopRow}>
          <div className={styles.teamTitleGroup}>
            <span className="eyebrow">Active Team Plan</span>
            <h2 id="team-heading">{team.name}</h2>
            <span className={styles.opportunityBadge}>
              Target: <strong>{team.opportunityTitle}</strong>
            </span>
          </div>

          <div className={styles.capacityBlock} aria-label="Team capacity tracker">
            <div className={styles.capacityMeta}>
              <span>Team Capacity</span>
              <span className={styles.capacityValue}>
                {team.members.length} / {team.capacity} Members
              </span>
            </div>
            <div className={styles.progressBarBg}>
              <div
                className={`${styles.progressBarFill} ${
                  isTeamFull ? styles.progressBarFillFull : ''
                }`}
                style={{ width: `${Math.min(100, (team.members.length / team.capacity) * 100)}%` }}
              />
            </div>
            {isTeamFull && (
              <span style={{ fontSize: '0.72rem', color: 'var(--warning)', fontWeight: 700 }}>
                Team is at full capacity
              </span>
            )}
          </div>
        </div>

        {/* Skill Coverage Ledger */}
        <div className={styles.ledgerGrid}>
          <div className={styles.ledgerCol}>
            <span className={styles.ledgerLabel}>
              Required Skills ({coverage.totalRequired})
            </span>
            <ul className={styles.pillsList}>
              {formatSkillList(coverage.requiredSkills).map((s) => (
                <li key={s} className={`${styles.tag} ${styles.tagNeutral}`}>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.ledgerCol}>
            <span className={styles.ledgerLabel}>
              Covered by Current Team ({coverage.totalCovered})
            </span>
            <ul className={styles.pillsList}>
              {coverage.coveredSkills.length > 0 ? (
                formatSkillList(coverage.coveredSkills).map((s) => (
                  <li key={s} className={`${styles.tag} ${styles.tagContributed}`}>
                    ✓ {s}
                  </li>
                ))
              ) : (
                <li className={styles.mutedText}>No required skills covered yet</li>
              )}
            </ul>
          </div>

          <div className={styles.ledgerCol}>
            <span className={styles.ledgerLabel}>
              Missing Gaps ({coverage.totalMissing})
            </span>
            <ul className={styles.pillsList}>
              {coverage.missingSkills.length > 0 ? (
                formatSkillList(coverage.missingSkills).map((s) => (
                  <li key={s} className={`${styles.tag} ${styles.tagMissing}`}>
                    ! {s}
                  </li>
                ))
              ) : (
                <li className={styles.successText}>All required skills satisfied!</li>
              )}
            </ul>
          </div>
        </div>

        {/* Current Team Roster */}
        <div className={styles.rosterSection}>
          <h3 className={styles.rosterHeading}>Current Team Roster ({team.members.length})</h3>
          <div className={styles.rosterGrid}>
            {team.members.map((member) => {
              const memberId = getMemberId(member);
              const name = typeof member === 'object' ? member.name : memberId;
              const role = typeof member === 'object' ? member.role : 'Member';
              const memberSkills = typeof member === 'object' && Array.isArray(member.skills)
                ? member.skills
                : [];

              return (
                <article key={memberId} className={styles.memberCard}>
                  <div className={styles.memberCardHeader}>
                    <div>
                      <h4 className={styles.memberName}>{name}</h4>
                      <p className={styles.memberRole}>{role}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(memberId)}
                      className={styles.removeMemberBtn}
                      aria-label={`Remove ${name} from team`}
                    >
                      Remove
                    </button>
                  </div>
                  {memberSkills.length > 0 && (
                    <ul className={styles.pillsList}>
                      {formatSkillList(memberSkills.slice(0, 4)).map((s) => (
                        <li key={s} className={`${styles.tag} ${styles.tagNeutral}`}>
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 2: Candidate Comparison (visible when 2 candidates are selected) */}
      {comparisonCandidateA && comparisonCandidateB && (
        <CandidateComparison
          candidateA={comparisonCandidateA}
          candidateB={comparisonCandidateB}
          team={team}
          profiles={profiles}
          onAddToTeam={handleAddToTeam}
          onClearComparison={handleClearComparison}
          isTeamFull={isTeamFull}
        />
      )}

      {/* Section 3: Recruitment Shortlist */}
      <Shortlist
        shortlist={shortlist}
        profiles={profiles}
        teamMembers={team.members}
        selectedComparisonIds={selectedComparisonIds}
        onToggleComparison={handleToggleComparison}
        onChangeStatus={handleChangeStatus}
        onAddToTeam={handleAddToTeam}
        onRemoveFromShortlist={handleRemoveFromShortlist}
        isTeamFull={isTeamFull}
      />

      {/* Section 4: Discover & Shortlist Recommendations */}
      <section className={styles.recommendationsSection} aria-labelledby="discover-heading">
        <span className="eyebrow">Explainable Matching Pool</span>
        <h2 id="discover-heading" className={styles.sectionHeading}>
          Candidate Recommendations
        </h2>
        <p className={styles.sectionDescription}>
          Complementary student profiles ranked deterministically by missing skill contribution, availability, and interests.
        </p>

        <div className={styles.recommendationsGrid}>
          {matchingResult.rankedCandidates.map((evaluated) => {
            const isAlreadyShortlisted = shortlist.some(
              (r) => r.candidateId === evaluated.id && r.status !== RECRUITMENT_STATUSES.REMOVED_FROM_SHORTLIST
            );
            const isOnTeam = existingMemberIds.has(evaluated.id);
            const rawProfile = profiles.find((p) => p.id === evaluated.id);

            return (
              <article key={evaluated.id} className={styles.poolCard}>
                <div className={styles.poolCardHeader}>
                  <div>
                    <h3 className={styles.candidateCardName}>{evaluated.name}</h3>
                    <p className={styles.candidateCardRole}>ID: {evaluated.id}</p>
                  </div>
                  <span className={styles.scorePill}>{evaluated.overallScore} / 100</span>
                </div>

                <p className={styles.detailText}>{evaluated.explanation}</p>

                {evaluated.skillsContributed.length > 0 && (
                  <div>
                    <span className={styles.subtleLabel}>Fills Missing Skills:</span>
                    <ul className={styles.pillsList}>
                      {formatSkillList(evaluated.skillsContributed).map((s) => (
                        <li key={s} className={`${styles.tag} ${styles.tagContributed}`}>
                          + {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className={styles.cardActionsRow}>
                  {isOnTeam ? (
                    <span className={styles.onTeamNotice}>✓ On Team</span>
                  ) : isAlreadyShortlisted ? (
                    <span className={styles.mutedText}>On Shortlist</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleShortlistCandidate(rawProfile)}
                      className={styles.secondaryButton}
                    >
                      + Shortlist Candidate
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
