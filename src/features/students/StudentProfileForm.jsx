import { useState, useEffect, useRef } from 'react';
import {
  VALID_AVAILABILITIES,
  AVAILABILITY_LABELS,
  normalizeTags,
  validateProfileInput,
  generateCandidateId,
} from './studentValidation.js';
import styles from './StudentDiscovery.module.css';

export default function StudentProfileForm({ initialData = null, onSave, onCancel }) {
  const isEditing = Boolean(initialData?.id);
  const modalRef = useRef(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    skillsInput: initialData?.skills ? initialData.skills.join(', ') : '',
    interestsInput: initialData?.interests ? initialData.interests.join(', ') : '',
    availability: initialData?.availability || 'weekends',
    openToTeam: typeof initialData?.openToTeam === 'boolean' ? initialData.openToTeam : true,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onCancel();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    modalRef.current?.focus();
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validation = validateProfileInput({
      name: formData.name,
      skills: formData.skillsInput,
      availability: formData.availability,
    });
    if (validation.errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: validation.errors[field] }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const normalizedSkills = normalizeTags(formData.skillsInput);
    const normalizedInterests = normalizeTags(formData.interestsInput);

    const validation = validateProfileInput({
      name: formData.name,
      skills: normalizedSkills,
      availability: formData.availability,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      setTouched({ name: true, skills: true, availability: true });
      return;
    }

    const profile = {
      id: isEditing ? initialData.id : generateCandidateId(),
      name: formData.name.trim(),
      skills: normalizedSkills,
      interests: normalizedInterests,
      availability: formData.availability,
      openToTeam: Boolean(formData.openToTeam),
    };

    onSave(profile);
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className={styles.modalContent}
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-dialog-title"
        tabIndex={-1}
        ref={modalRef}
      >
        <header className={styles.modalHeader}>
          <div>
            <span className={styles.eyebrow}>{isEditing ? 'Update Directory' : 'Local Directory'}</span>
            <h2 id="form-dialog-title" className={styles.modalTitle}>
              {isEditing ? 'Edit Candidate Profile' : 'Add Student Candidate'}
            </h2>
          </div>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onCancel}
            aria-label="Cancel and close dialog"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.modalBody}>
            {isEditing && (
              <div className={styles.idBox}>
                <span>Candidate ID: {initialData.id} (stable)</span>
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="student-name" className={styles.formLabel}>
                Full Name *
              </label>
              <input
                id="student-name"
                type="text"
                className={`${styles.formInput} ${errors.name && touched.name ? styles.inputError : ''}`}
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                placeholder="e.g. Jaswanth Tangella"
                autoFocus
                required
              />
              {errors.name && touched.name && (
                <span className={styles.errorMessage} role="alert">
                  {errors.name}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="student-skills" className={styles.formLabel}>
                Skills * (comma separated)
              </label>
              <input
                id="student-skills"
                type="text"
                className={`${styles.formInput} ${errors.skills && touched.skills ? styles.inputError : ''}`}
                value={formData.skillsInput}
                onChange={(e) => handleChange('skillsInput', e.target.value)}
                onBlur={() => handleBlur('skills')}
                placeholder="e.g. React, JavaScript, CSS, Python"
                required
              />
              <span className={styles.formHint}>
                Enter one or more skills separated by commas. Duplicates are cleaned automatically.
              </span>
              {errors.skills && touched.skills && (
                <span className={styles.errorMessage} role="alert">
                  {errors.skills}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="student-interests" className={styles.formLabel}>
                Project & Hackathon Interests (optional, comma separated)
              </label>
              <input
                id="student-interests"
                type="text"
                className={styles.formInput}
                value={formData.interestsInput}
                onChange={(e) => handleChange('interestsInput', e.target.value)}
                placeholder="e.g. FinTech, AI/ML, HealthTech, Open Source"
              />
              <span className={styles.formHint}>
                Domains or tracks this candidate wants to build for.
              </span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="student-availability" className={styles.formLabel}>
                Availability *
              </label>
              <select
                id="student-availability"
                className={styles.formSelect}
                value={formData.availability}
                onChange={(e) => handleChange('availability', e.target.value)}
              >
                {VALID_AVAILABILITIES.map((avail) => (
                  <option key={avail} value={avail}>
                    {AVAILABILITY_LABELS[avail]}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup} style={{ marginTop: '4px' }}>
              <label className={styles.checkboxLabel} style={{ marginLeft: 0 }}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={formData.openToTeam}
                  onChange={(e) => handleChange('openToTeam', e.target.checked)}
                />
                Actively looking for a team / open to join
              </label>
              <span className={styles.formHint}>
                Candidates open to teams will be marked and discoverable in the Match Lab.
              </span>
            </div>

            <div className={styles.disclaimerBanner} style={{ marginTop: '4px' }}>
              <span>
                <strong>Note:</strong> Profiles are saved to this browser&apos;s localStorage for team matching and recruitment planning.
              </span>
            </div>
          </div>

          <footer className={styles.modalFooter}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
            >
              {isEditing ? 'Save Changes' : 'Create Profile'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

