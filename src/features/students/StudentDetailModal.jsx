import { useEffect, useState, useRef } from 'react';
import { AVAILABILITY_LABELS } from './studentValidation.js';
import styles from './StudentDiscovery.module.css';

export default function StudentDetailModal({ profile, onClose, onEdit }) {
  const [copied, setCopied] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    modalRef.current?.focus();
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!profile) return null;

  const handleCopyId = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(profile.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.modalContent}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
        tabIndex={-1}
        ref={modalRef}
      >
        <header className={styles.modalHeader}>
          <div>
            <span className={styles.eyebrow}>Candidate Profile</span>
            <h2 id="detail-modal-title" className={styles.modalTitle}>{profile.name}</h2>
          </div>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Close profile details"
          >
            ✕
          </button>
        </header>

        <div className={styles.modalBody}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Candidate ID (for Matching & Recruitment)</span>
            <div className={styles.idBox}>
              <span>{profile.id}</span>
              <button
                type="button"
                className={styles.copyBtn}
                onClick={handleCopyId}
                aria-label="Copy candidate ID"
              >
                {copied ? 'Copied ✓' : 'Copy ID'}
              </button>
            </div>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Team Preference</span>
            <div style={{ marginTop: '2px' }}>
              <span className={`${styles.badge} ${profile.openToTeam ? styles.badgeOpen : styles.badgeNotOpen}`}>
                {profile.openToTeam ? 'Looking for team' : 'Not seeking team at this time'}
              </span>
            </div>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Availability</span>
            <p className={styles.detailValue} style={{ margin: 0 }}>
              {AVAILABILITY_LABELS[profile.availability] || profile.availability}
            </p>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Technical & Domain Skills</span>
            <div className={styles.tagList} style={{ marginTop: '4px' }}>
              {profile.skills.map((skill) => (
                <span key={skill} className={styles.skillTag}>
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {profile.interests && profile.interests.length > 0 && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Project & Hackathon Interests</span>
              <div className={styles.tagList} style={{ marginTop: '4px' }}>
                {profile.interests.map((interest) => (
                  <span key={interest} className={styles.interestTag}>
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className={styles.disclaimerBanner} style={{ marginTop: '8px' }}>
            <span>
              <strong>Local Browser Record:</strong> This candidate profile was created in this browser session. It can be consumed by Explainable Matching and the Recruitment Board.
            </span>
          </div>
        </div>

        <footer className={styles.modalFooter}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => {
              onClose();
              onEdit(profile);
            }}
          >
            Edit Candidate
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onClose}
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}

