import React from 'react';
import styles from './Recruitment.module.css';
import { compareCandidates } from './recruitmentValidation.js';
import { formatSkill, formatSkillList } from '../matching/matching.js';

/**
 * CandidateComparison component
 * 
 * Displays a side-by-side differential analysis of two shortlisted candidates:
 * - Missing skills contributed
 * - Resulting team skill coverage
 * - Availability alignment
 * - Remaining uncovered skills
 * 
 * Comparison is purely analytical and does NOT mutate team membership.
 */
export default function CandidateComparison({
  candidateA,
  candidateB,
  team,
  profiles,
  onAddToTeam,
  onClearComparison,
  isTeamFull
}) {
  if (!candidateA || !candidateB) {
    return null;
  }

  const comparison = compareCandidates(candidateA, candidateB, team, profiles);
  const { candidateA: resA, candidateB: resB, currentCoverage, sharedContributedSkills } = comparison;

  return (
    <section className={styles.comparisonSection} aria-labelledby="comparison-heading">
      <div className={styles.comparisonHeader}>
        <div>
          <span className="eyebrow">Differential Evaluation</span>
          <h2 id="comparison-heading" className={styles.comparisonTitle}>
            Candidate Comparison
          </h2>
          <p className={styles.comparisonSubtitle}>
            Comparing potential additions against open team gaps. Evaluating does not alter your team roster.
          </p>
        </div>
        <button
          type="button"
          onClick={onClearComparison}
          className={styles.secondaryButton}
          aria-label="Close candidate comparison view"
        >
          Exit Comparison
        </button>
      </div>

      <div className={styles.comparisonGrid}>
        {/* Candidate A Column */}
        <article className={styles.comparisonCard} aria-labelledby={`compare-head-${candidateA.id}`}>
          <div className={styles.candidateHeaderRow}>
            <div>
              <h3 id={`compare-head-${candidateA.id}`} className={styles.candidateCardName}>
                {candidateA.name}
              </h3>
              <p className={styles.candidateCardRole}>{candidateA.role || 'Contributor'}</p>
            </div>
            <span className={styles.scorePill}>
              {resA.evaluation?.overallScore ?? 0} / 100 Match
            </span>
          </div>

          <div className={styles.projectedMetric}>
            <span className={styles.metricLabel}>Projected Team Coverage</span>
            <div className={styles.progressBarBg}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${Math.round(resA.projectedCoverageRatio * 100)}%` }}
              />
            </div>
            <span className={styles.metricValue}>
              {Math.round(resA.projectedCoverageRatio * 100)}% ({resA.projectedCoveredCount} of {currentCoverage.totalRequired} skills)
            </span>
          </div>

          <div className={styles.comparisonRow}>
            <strong>Unique Missing Skills Contributed:</strong>
            {resA.uniqueContributedSkills.length > 0 ? (
              <ul className={styles.pillsList}>
                {formatSkillList(resA.uniqueContributedSkills).map((s) => (
                  <li key={s} className={`${styles.tag} ${styles.tagContributed}`}>
                    + {s}
                  </li>
                ))}
              </ul>
            ) : (
              <span className={styles.mutedText}>None unique</span>
            )}
          </div>

          <div className={styles.comparisonRow}>
            <strong>All Contributed Skills:</strong>
            {resA.evaluation?.skillsContributed?.length > 0 ? (
              <ul className={styles.pillsList}>
                {formatSkillList(resA.evaluation.skillsContributed).map((s) => (
                  <li key={s} className={`${styles.tag} ${styles.tagContributed}`}>
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <span className={styles.mutedText}>None</span>
            )}
          </div>

          <div className={styles.comparisonRow}>
            <strong>Availability Schedule:</strong>
            <p className={styles.detailText}>
              {Array.isArray(candidateA.availability)
                ? candidateA.availability.map(formatSkill).join(', ')
                : candidateA.availability || 'Not specified'}
            </p>
          </div>

          <div className={styles.comparisonRow}>
            <strong>Remaining Gaps if Added:</strong>
            {resA.projectedMissingSkills.length > 0 ? (
              <ul className={styles.pillsList}>
                {formatSkillList(resA.projectedMissingSkills).map((s) => (
                  <li key={s} className={`${styles.tag} ${styles.tagMissing}`}>
                    ! {s}
                  </li>
                ))}
              </ul>
            ) : (
              <span className={styles.successText}>All team skills covered!</span>
            )}
          </div>

          <div className={styles.actionRow}>
            <button
              type="button"
              disabled={isTeamFull}
              onClick={() => onAddToTeam(candidateA)}
              className={styles.primaryButton}
              title={isTeamFull ? 'Team has reached maximum capacity' : `Add ${candidateA.name} to team`}
            >
              Add {candidateA.name} to Team
            </button>
          </div>
        </article>

        {/* Candidate B Column */}
        <article className={styles.comparisonCard} aria-labelledby={`compare-head-${candidateB.id}`}>
          <div className={styles.candidateHeaderRow}>
            <div>
              <h3 id={`compare-head-${candidateB.id}`} className={styles.candidateCardName}>
                {candidateB.name}
              </h3>
              <p className={styles.candidateCardRole}>{candidateB.role || 'Contributor'}</p>
            </div>
            <span className={styles.scorePill}>
              {resB.evaluation?.overallScore ?? 0} / 100 Match
            </span>
          </div>

          <div className={styles.projectedMetric}>
            <span className={styles.metricLabel}>Projected Team Coverage</span>
            <div className={styles.progressBarBg}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${Math.round(resB.projectedCoverageRatio * 100)}%` }}
              />
            </div>
            <span className={styles.metricValue}>
              {Math.round(resB.projectedCoverageRatio * 100)}% ({resB.projectedCoveredCount} of {currentCoverage.totalRequired} skills)
            </span>
          </div>

          <div className={styles.comparisonRow}>
            <strong>Unique Missing Skills Contributed:</strong>
            {resB.uniqueContributedSkills.length > 0 ? (
              <ul className={styles.pillsList}>
                {formatSkillList(resB.uniqueContributedSkills).map((s) => (
                  <li key={s} className={`${styles.tag} ${styles.tagContributed}`}>
                    + {s}
                  </li>
                ))}
              </ul>
            ) : (
              <span className={styles.mutedText}>None unique</span>
            )}
          </div>

          <div className={styles.comparisonRow}>
            <strong>All Contributed Skills:</strong>
            {resB.evaluation?.skillsContributed?.length > 0 ? (
              <ul className={styles.pillsList}>
                {formatSkillList(resB.evaluation.skillsContributed).map((s) => (
                  <li key={s} className={`${styles.tag} ${styles.tagContributed}`}>
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <span className={styles.mutedText}>None</span>
            )}
          </div>

          <div className={styles.comparisonRow}>
            <strong>Availability Schedule:</strong>
            <p className={styles.detailText}>
              {Array.isArray(candidateB.availability)
                ? candidateB.availability.map(formatSkill).join(', ')
                : candidateB.availability || 'Not specified'}
            </p>
          </div>

          <div className={styles.comparisonRow}>
            <strong>Remaining Gaps if Added:</strong>
            {resB.projectedMissingSkills.length > 0 ? (
              <ul className={styles.pillsList}>
                {formatSkillList(resB.projectedMissingSkills).map((s) => (
                  <li key={s} className={`${styles.tag} ${styles.tagMissing}`}>
                    ! {s}
                  </li>
                ))}
              </ul>
            ) : (
              <span className={styles.successText}>All team skills covered!</span>
            )}
          </div>

          <div className={styles.actionRow}>
            <button
              type="button"
              disabled={isTeamFull}
              onClick={() => onAddToTeam(candidateB)}
              className={styles.primaryButton}
              title={isTeamFull ? 'Team has reached maximum capacity' : `Add ${candidateB.name} to team`}
            >
              Add {candidateB.name} to Team
            </button>
          </div>
        </article>
      </div>

      {sharedContributedSkills.length > 0 && (
        <div className={styles.comparisonFooterNote}>
          <p>
            <strong>Shared Skill Contributions:</strong> Both candidates contribute{' '}
            {formatSkillList(sharedContributedSkills).join(', ')}.
          </p>
        </div>
      )}
    </section>
  );
}

