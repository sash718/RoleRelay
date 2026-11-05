import { AVAILABILITY_LABELS } from './studentValidation.js';
import styles from './StudentDiscovery.module.css';

export default function StudentCard({ profile, onView, onEdit, onRemove }) {
  const { id, name, skills, interests, availability, openToTeam } = profile;

  return (
    <article className={styles.card} aria-labelledby={`card-title-${id}`}>
      <div>
        <div className={styles.cardHeader}>
          <div>
            <h3 id={`card-title-${id}`} className={styles.cardName}>{name}</h3>
            <span className={styles.candidateIdBadge} title="Candidate ID for Matching and Recruitment">
              ID: {id}
            </span>
          </div>
          <div className={styles.badgeStack}>
            <span
              className={`${styles.badge} ${openToTeam ? styles.badgeOpen : styles.badgeNotOpen}`}
              aria-label={`Team status: ${openToTeam ? 'Looking for team' : 'Not looking'}`}
            >
              {openToTeam ? 'Looking for team' : 'Not seeking team'}
            </span>
            <span className={styles.availabilityBadge}>
              {AVAILABILITY_LABELS[availability] || availability}
            </span>
          </div>
        </div>

        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className={styles.tagSection}>
            <p className={styles.tagSectionTitle}>Skills</p>
            <div className={styles.tagList}>
              {skills && skills.length > 0 ? (
                skills.map((skill) => (
                  <span key={skill} className={styles.skillTag}>
                    {skill}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>No skills listed</span>
              )}
            </div>
          </div>

          {interests && interests.length > 0 && (
            <div className={styles.tagSection}>
              <p className={styles.tagSectionTitle}>Interests</p>
              <div className={styles.tagList}>
                {interests.map((interest) => (
                  <span key={interest} className={styles.interestTag}>
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className={styles.cardActions}>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={() => onView(profile)}
          aria-label={`View details for ${name}`}
        >
          View Profile
        </button>
        <div className={styles.cardActionButtons}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => onEdit(profile)}
            aria-label={`Edit profile for ${name}`}
          >
            Edit
          </button>
          <button
            type="button"
            className={styles.textBtn}
            onClick={() => onRemove(profile)}
            aria-label={`Remove profile for ${name}`}
          >
            Remove
          </button>
        </div>
      </footer>
    </article>
  );
}

