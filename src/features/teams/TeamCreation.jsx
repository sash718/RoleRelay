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
      // If user navigated with a specific opportunity query and saved team has none, attach it
      if (opportunityQuery && !stored.data.opportunityId) {
        return { ...stored.data, opportunityId: opportunityQuery };
      }
      return stored.data;
    }
    return createBlankTeam(opportunityQuery);
  });

  const [storageStatus, setStorageStatus] = useState(() => {
    const stored = readStoredData(TEAM_STORAGE_KEY, validateTeam);
    if (stored.status === 'success') {
      return {
        type: 'info',
        message: `Restored saved team plan "${stored.data.name || 'Untitled'}" from local browser storage.`,
      };
    }
    if (stored.status === 'error') {
      return {
        type: 'error',
        message: stored.message || 'Saved team data is damaged or corrupted. Unreadable data has been preserved without changes.',
      };
    }
    return {
      type: 'idle',
      message: opportunityQuery
        ? 'Starting a new team plan for the selected opportunity.'
        : 'No saved team plan found. Create an independent team or link to a hackathon below.',
    };
  });

  const [opportunities, setOpportunities] = useState([]);
  const [catalogStatus, setCatalogStatus] = useState('loading');
  const [fieldErrors, setFieldErrors] = useState({});

  // Fetch available opportunities catalog from static JSON
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

  // Handle saving to localStorage
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
        message: `Team "${team.name}" saved successfully to browser storage.`,
      });
    } else {
      setStorageStatus({
        type: 'error',
        message: saveResult.message || 'Failed to save team plan to browser storage.',
      });
    }
  };

  // Handle resetting team plan
  const handleResetTeam = () => {
    if (window.confirm('Reset team plan? Any unsaved edits will be discarded.')) {
      setTeam(createBlankTeam(opportunityQuery));
      setFieldErrors({});
      setStorageStatus({
        type: 'info',
        message: 'Team plan reset to blank state. (Previous saved storage unchanged until you click Save).',
      });
    }
  };

  const selectedOpp = opportunities.find((o) => o.id === team.opportunityId);

  return (
    <div className={styles.container} aria-labelledby="team-creation-title">
      {/* Editorial Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <p className="eyebrow">Team Formation & Planning</p>
          <h1 id="team-creation-title">Plan the right team.</h1>
          <p className={styles.headerSubtitle}>
            Define your project vision, target hackathon, required skills, and roster capacity.
            Changes remain browser-local and feed directly into Explainable Matching.
          </p>
        </div>
        <div className={styles.headerMetaCard}>
          <span className={styles.metaLabel}>Planning Mode</span>
          <strong className={styles.metaValue}>
            {team.opportunityId ? 'Challenge Targeted' : 'Independent Builder'}
          </strong>
          {selectedOpp ? (
            <span className={styles.metaOppName}>Linked: {selectedOpp.title}</span>
          ) : (
            <span className={styles.metaOppName}>No opportunity assigned</span>
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
              // Clear field-level error when edited
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
              // Re-check capacity errors if members change
              if (fieldErrors.maxMembers && updated.maxMembers >= updated.memberIds.length) {
                setFieldErrors((prev) => ({ ...prev, maxMembers: undefined }));
              }
            }}
          />
        </section>
      </div>

      {/* Sticky Bottom Actions Bar */}
      <footer className={styles.actionsBar} aria-label="Team Actions">
        <div className={styles.actionsInfo}>
          <strong>{team.name ? team.name : 'Untitled Team Plan'}</strong>
          <span>
            {team.memberIds.length} of {team.maxMembers} members · {team.requiredSkills.length} required skills
          </span>
        </div>
        <div className={styles.actionsButtons}>
          <button
            type="button"
            onClick={handleResetTeam}
            className={styles.resetButton}
          >
            Reset to blank
          </button>
          <button
            type="button"
            onClick={handleSaveTeam}
            className={styles.primaryButton}
          >
            Save team plan
          </button>
          <Link to="/matching" className={styles.navLinkButton}>
            Go to Match Lab →
          </Link>
        </div>
      </footer>
    </div>
  );
}
