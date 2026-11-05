import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  TEAM_STORAGE_KEY,
  validateTeam,
  validateTeamForm,
  createBlankTeam,
} from './teamModel.js';
import TeamForm from './TeamForm.jsx';
import TeamMembers from './TeamMembers.jsx';
import { readStoredData, saveStoredData } from '../../services/storage.js';
import { loadOpportunityCatalog } from '../opportunities/catalog.js';
import styles from './TeamCreation.module.css';

export default function TeamCreation() {
  const [searchParams] = useSearchParams();
  const opportunityQuery = searchParams.get('opportunity');

  // Read storage once synchronously on initialization to avoid cascading renders
  const [team, setTeam] = useState(() => {
    const stored = readStoredData(TEAM_STORAGE_KEY, validateTeam);
    if (stored.status === 'success') {
      if (opportunityQuery && !stored.data.opportunityId) {
        return { ...stored.data, opportunityId: opportunityQuery };
      }
      return stored.data;
    }
    return createBlankTeam(opportunityQuery);
  });

  const [storageStatus, setStorageStatus] = useState({
    type: 'idle',
    message: '',
  });

  const [opportunities, setOpportunities] = useState([]);
  const [catalogStatus, setCatalogStatus] = useState('loading');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let isMounted = true;
    async function fetchOpportunities() {
      try {
        const events = await loadOpportunityCatalog();
        if (isMounted) {
          setOpportunities(events);
          setCatalogStatus('ready');
        }
      } catch {
        if (isMounted) {
          setCatalogStatus('error');
        }
      }
    }
    fetchOpportunities();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveTeam = () => {
    const validation = validateTeamForm(team);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setStorageStatus({
        type: 'error',
        message: 'Please resolve form validation issues before saving.',
      });
      return;
    }

    setFieldErrors({});
    const saveResult = saveStoredData(TEAM_STORAGE_KEY, team);

    if (saveResult.status === 'success') {
      setStorageStatus({
        type: 'success',
        message: `Team "${team.name}" saved successfully.`,
      });
    } else {
      setStorageStatus({
        type: 'error',
        message: saveResult.message || 'Failed to save team plan.',
      });
    }
  };

  const handleResetTeam = () => {
    if (window.confirm('Reset team plan? Any unsaved edits will be discarded.')) {
      setTeam(createBlankTeam(opportunityQuery));
      setFieldErrors({});
      setStorageStatus({
        type: 'info',
        message: 'Team plan reset to blank state.',
      });
    }
  };

  const selectedOpp = opportunities.find((o) => o.id === team.opportunityId);

  return (
    <div className={styles.container} aria-labelledby="team-creation-title">
      {/* Clean, Spacious Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <p className="eyebrow">Team Builder</p>
          <h1 id="team-creation-title">Team Parameters</h1>
          <p className={styles.headerSubtitle}>
            Configure target challenge, technical skills, and roster capacity.
          </p>
          {selectedOpp && (
            <div className={styles.linkedChallengePill}>
              <span>Target Challenge:</span>
              <strong>{selectedOpp.title}</strong>
              <small>({selectedOpp.category} &middot; {selectedOpp.mode})</small>
            </div>
          )}
        </div>
      </header>

      {/* Storage and feedback notifications */}
      {storageStatus.message && (
        <aside
          className={`${styles.notificationBanner} ${
            storageStatus.type === 'error'
              ? styles.notificationError
              : storageStatus.type === 'success'
              ? styles.notificationSuccess
              : styles.notificationInfo
          }`}
          role="status"
          aria-live="polite"
        >
          <span className={styles.notificationDot} aria-hidden="true" />
          <p>{storageStatus.message}</p>
        </aside>
      )}

      {/* Main Two-Column Workbench Layout */}
      <div className={styles.workbenchGrid}>
        {/* Left Column: Form Settings */}
        <section className={styles.cardPanel} aria-label="Team Configuration">
          <TeamForm
            team={team}
            onChange={(updated) => {
              setTeam(updated);
              if (fieldErrors.name && updated.name?.trim()) {
                setFieldErrors((prev) => ({ ...prev, name: undefined }));
              }
              if (fieldErrors.maxMembers && updated.maxMembers >= updated.memberIds.length) {
                setFieldErrors((prev) => ({ ...prev, maxMembers: undefined }));
              }
            }}
            opportunities={opportunities}
            catalogStatus={catalogStatus}
            fieldErrors={fieldErrors}
          />
        </section>

        {/* Right Column: Roster & Members */}
        <section className={styles.cardPanel} aria-label="Team Members & Capacity">
          <TeamMembers
            team={team}
            onChange={(updated) => {
              setTeam(updated);
              if (fieldErrors.maxMembers && updated.maxMembers >= updated.memberIds.length) {
                setFieldErrors((prev) => ({ ...prev, maxMembers: undefined }));
              }
            }}
          />
        </section>
      </div>

      {/* Bottom Actions Bar */}
      <footer className={styles.actionsBar} aria-label="Team Actions">
        <div className={styles.actionsInfo}>
          <strong>{team.name ? team.name : 'Untitled Team Plan'}</strong>
          <span>
            {team.memberIds.length} of {team.maxMembers} members &middot; {team.requiredSkills.length} required skills
          </span>
        </div>
        <div className={styles.actionsButtons}>
          <button
            type="button"
            onClick={handleResetTeam}
            className={styles.resetButton}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSaveTeam}
            className={styles.primaryButton}
          >
            Save Team Plan
          </button>
          <Link to="/matching" className={styles.navLinkButton}>
            Go to Match Lab →
          </Link>
        </div>
      </footer>
    </div>
  );
}
