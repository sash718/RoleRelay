import React, { useState } from 'react';
import styles from './MatchingExplorer.module.css';
import { formatSkill } from './matching.js';

/**
 * CandidateMatchCard displays a single candidate recommendation with:
 * - Transparent overall score
 * - Visible score breakdown (missing skills, availability, interests)
 * - Explicit skill tags (contributed, redundant, extra)
 * - Plain-language explanations of recommendation reasons and cautions
 */
export default function CandidateMatchCard({ candidate, rank, isTopPick }) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const {
    name,
    overallScore,
    scoreBreakdown,
    skillsContributed,
    skillsRedundant,
    skillsExtra,
    matchReasons,
    cautionNotes,
    explanation
  } = candidate;

  return (
    <article
      className={`${styles.candidateCard} ${isTopPick ? styles.topCandidate : ''}`}
      aria-labelledby={`candidate-heading-${candidate.id}`}
    >
      <div className={styles.cardHeader}>
        <div className={styles.candidateMeta}>
          <span className={styles.rankBadge} aria-label={`Rank ${rank}`}>
            #{rank}
          </span>
          <div>
            <h3 id={`candidate-heading-${candidate.id}`} className={styles.candidateName}>
              {name}
            </h3>
            <p className={styles.candidateIdTag}>Candidate ID: {candidate.id}</p>
          </div>
        </div>

        <div className={styles.scoreContainer}>
          <div className={styles.scoreBadge} aria-label={`Overall compatibility score: ${overallScore} out of 100`}>
            <span className={styles.scoreValue}>{overallScore}</span>
            <span className={styles.scoreMax}>/ 100</span>
          </div>
          <span className={styles.scoreLabel}>Match Score</span>
        </div>
      </div>

      {/* Plain language explanation banner */}
      <div className={styles.explanationBox}>
        <p className={styles.explanationText}>
          <strong>Summary:</strong> {explanation}
        </p>
      </div>

      {/* Skill Contribution Tags */}
      <div className={styles.skillsSection}>
        {skillsContributed.length > 0 && (
          <div className={styles.skillGroup}>
            <span className={styles.skillGroupLabel}>
              <span className={`${styles.dot} ${styles.dotKnown}`} aria-hidden="true" />
              Fills Missing Team Skills ({skillsContributed.length}):
            </span>
            <ul className={styles.tagList} aria-label="Contributed missing skills">
              {skillsContributed.map((skill) => (
                <li key={skill} className={`${styles.tag} ${styles.tagContributed}`}>
                  + {formatSkill(skill)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {skillsRedundant.length > 0 && (
          <div className={styles.skillGroup}>
            <span className={styles.skillGroupLabel}>
              <span className={`${styles.dot} ${styles.dotMuted}`} aria-hidden="true" />
              Already Covered by Team ({skillsRedundant.length}):
            </span>
            <ul className={styles.tagList} aria-label="Redundant skills">
              {skillsRedundant.map((skill) => (
                <li key={skill} className={`${styles.tag} ${styles.tagRedundant}`}>
                  = {formatSkill(skill)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {skillsExtra.length > 0 && (
          <div className={styles.skillGroup}>
            <span className={styles.skillGroupLabel}>
              <span className={`${styles.dot} ${styles.dotExtra}`} aria-hidden="true" />
              Additional Candidate Skills ({skillsExtra.length}):
            </span>
            <ul className={styles.tagList} aria-label="Additional skills">
              {skillsExtra.map((skill) => (
                <li key={skill} className={`${styles.tag} ${styles.tagExtra}`}>
                  {formatSkill(skill)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Plain Language Reasons & Caveats */}
      <div className={styles.reasonsSection}>
        {matchReasons.length > 0 && (
          <ul className={styles.reasonsList} aria-label="Recommendation reasons">
            {matchReasons.map((reason, idx) => (
              <li key={idx} className={styles.reasonItem}>
                <span className={styles.reasonMarker}>✓</span> {reason}
              </li>
            ))}
          </ul>
        )}

        {cautionNotes.length > 0 && (
          <ul className={styles.cautionList} aria-label="Considerations and caveats">
            {cautionNotes.map((note, idx) => (
              <li key={idx} className={styles.cautionItem}>
                <span className={styles.cautionMarker}>ℹ</span> {note}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Expandable Mathematical Breakdown */}
      <div className={styles.breakdownToggleContainer}>
        <button
          type="button"
          className={styles.breakdownButton}
          onClick={() => setShowBreakdown((prev) => !prev)}
          aria-expanded={showBreakdown}
          aria-controls={`breakdown-${candidate.id}`}
        >
          {showBreakdown ? 'Hide score breakdown' : 'View score breakdown'}
        </button>

        {showBreakdown && (
          <div id={`breakdown-${candidate.id}`} className={styles.breakdownPanel}>
            <div className={styles.breakdownRow}>
              <div>
                <strong>Missing-Skill Fit (60% weight)</strong>
                <p className={styles.breakdownDetail}>
                  Matches {skillsContributed.length} of {scoreBreakdown.skills.missingTotal} missing team skills ({Math.round(scoreBreakdown.skills.rawRatio * 100)}% coverage)
                </p>
              </div>
              <span className={styles.breakdownScore}>
                {scoreBreakdown.skills.score} / {scoreBreakdown.skills.maxScore} pts
              </span>
            </div>

            <div className={styles.breakdownRow}>
              <div>
                <strong>Availability Compatibility (25% weight)</strong>
                <p className={styles.breakdownDetail}>{scoreBreakdown.availability.detail}</p>
              </div>
              <span className={styles.breakdownScore}>
                {scoreBreakdown.availability.score} / {scoreBreakdown.availability.maxScore} pts
              </span>
            </div>

            <div className={styles.breakdownRow}>
              <div>
                <strong>Domain Interests (15% weight)</strong>
                <p className={styles.breakdownDetail}>{scoreBreakdown.interests.detail}</p>
              </div>
              <span className={styles.breakdownScore}>
                {scoreBreakdown.interests.score} / {scoreBreakdown.interests.maxScore} pts
              </span>
            </div>

            <div className={styles.breakdownTotal}>
              <span>Total Calculated Score</span>
              <strong>{overallScore} / 100</strong>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

