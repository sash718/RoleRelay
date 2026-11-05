import React from 'react';
import styles from './Recruitment.module.css';
import {
  RECRUITMENT_STATUSES,
  STATUS_DISPLAY_LABELS
} from './recruitmentValidation.js';
import { formatSkill, formatSkillList } from '../matching/matching.js';

/**
 * Shortlist component
 * 
 * Manages locally shortlisted candidates:
 * - Status updating (Shortlisted / Under consideration)
 * - Comparing up to two candidates
 * - Manually adding shortlisted candidate to the team plan
 * - Removing candidate from shortlist
 */
export default function Shortlist({
  shortlist,
  profiles,
  teamMembers,
  selectedComparisonIds,
  onToggleComparison,
  onChangeStatus,
  onAddToTeam,
  onRemoveFromShortlist,
  isTeamFull
}) {
  // Map profiles by ID for fast lookup
  const profileMap = new Map((profiles || []).map((p) => [String(p.id), p]));
  const existingMemberIds = new Set((teamMembers || []).map((m) => (typeof m === 'string' ? m : m?.id)));

  // Filter out any entries marked as removed
  const activeEntries = (shortlist || []).filter(
    (item) => item.status !== RECRUITMENT_STATUSES.REMOVED_FROM_SHORTLIST
  );

  return (
    <section className={styles.shortlistSection} aria-labelledby="shortlist-heading">
      <div className={styles.shortlistHeader}>
        <div>
          <span className="eyebrow">Recruitment Shortlist</span>
          <h2 id="shortlist-heading" className={styles.sectionHeading}>
            Shortlisted Candidates ({activeEntries.length})
          </h2>
          <p className={styles.sectionDescription}>
            Evaluate and select up to 2 candidates to compare side-by-side against open team gaps.
          </p>
        </div>

        {selectedComparisonIds.length > 0 && (
          <div className={styles.comparisonBadge}>
            <span>{selectedComparisonIds.length} of 2 selected for comparison</span>
          </div>
        )}
      </div>

      {activeEntries.length === 0 ? (
        <div className={styles.emptyCard}>
          <p className={styles.emptyText}>
            No candidates are currently on your shortlist. Browse recommendations below and click &quot;Shortlist Candidate&quot; to review them here.
          </p>
        </div>
      ) : (
        <div className={styles.shortlistGrid}>
          {activeEntries.map((record) => {
            const profile = profileMap.get(record.candidateId);
            if (!profile) return null;

            const isSelectedForCompare = selectedComparisonIds.includes(profile.id);
            const isAlreadyOnTeam = existingMemberIds.has(profile.id);
            const isAddedStatus = record.status === RECRUITMENT_STATUSES.ADDED_TO_TEAM;

            return (
              <article
                key={record.id}
                className={`${styles.shortlistCard} ${isSelectedForCompare ? styles.cardSelected : ''}`}
                aria-labelledby={`shortlist-name-${profile.id}`}
              >
                <div className={styles.shortlistCardTop}>
                  <label className={styles.compareCheckboxLabel}>
                    <input
                      type="checkbox"
                      checked={isSelectedForCompare}
                      disabled={!isSelectedForCompare && selectedComparisonIds.length >= 2}
                      onChange={() => onToggleComparison(profile.id)}
                      className={styles.compareCheckbox}
                      aria-label={`Select ${profile.name} for comparison`}
                    />
                    <span className={styles.compareLabelText}>Compare</span>
                  </label>

                  <div className={styles.statusControlGroup}>
                    <span
                      className={`${styles.statusBadge} ${
                        isAddedStatus
                          ? styles.statusBadgeAdded
                          : record.status === RECRUITMENT_STATUSES.UNDER_CONSIDERATION
                          ? styles.statusBadgeReview
                          : styles.statusBadgeShortlisted
                      }`}
                    >
                      {STATUS_DISPLAY_LABELS[record.status] || record.status}
                    </span>

                    {!isAddedStatus && !isAlreadyOnTeam && (
                      <select
                        value={record.status}
                        onChange={(e) => onChangeStatus(record.candidateId, e.target.value)}
                        className={styles.statusSelect}
                        aria-label={`Update recruitment status for ${profile.name}`}
                      >
                        <option value={RECRUITMENT_STATUSES.SHORTLISTED}>Shortlisted</option>
                        <option value={RECRUITMENT_STATUSES.UNDER_CONSIDERATION}>
                          Under consideration
                        </option>
                      </select>
                    )}
                  </div>
                </div>

                <div className={styles.candidateDetails}>
                  <h3 id={`shortlist-name-${profile.id}`} className={styles.candidateCardName}>
                    {profile.name}
                  </h3>
                  <p className={styles.candidateCardRole}>{profile.role || 'Candidate'}</p>

                  <div className={styles.candidateSkillsBlock}>
                    <span className={styles.subtleLabel}>Skills:</span>
                    <ul className={styles.pillsList}>
                      {formatSkillList(profile.skills || []).map((skill) => (
                        <li key={skill} className={`${styles.tag} ${styles.tagNeutral}`}>
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={styles.availabilityRow}>
                    <span className={styles.subtleLabel}>Availability:</span>
                    <span className={styles.availabilityText}>
                      {Array.isArray(profile.availability)
                        ? profile.availability.map(formatSkill).join(', ')
                        : profile.availability || 'Not specified'}
                    </span>
                  </div>
                </div>

                <div className={styles.cardActionsRow}>
                  {isAlreadyOnTeam ? (
                    <span className={styles.onTeamNotice}>✓ Member of current team</span>
                  ) : (
                    <button
                      type="button"
                      disabled={isTeamFull}
                      onClick={() => onAddToTeam(profile)}
                      className={styles.primaryButton}
                      title={
                        isTeamFull
                          ? 'Team is at maximum capacity'
                          : `Confirm adding ${profile.name} to team roster`
                      }
                    >
                      {isTeamFull ? 'Team Full' : 'Add to Team'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onRemoveFromShortlist(record.candidateId)}
                    className={styles.textButtonDanger}
                    aria-label={`Remove ${profile.name} from shortlist`}
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

