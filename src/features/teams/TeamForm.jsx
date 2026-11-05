import React, { useState } from 'react';
import { addSkillToTeam, removeSkillFromTeam } from './teamModel.js';
import styles from './TeamCreation.module.css';

export default function TeamForm({
  team,
  onChange,
  opportunities = [],
  catalogStatus = 'ready',
  fieldErrors = {},
}) {
  const [skillInput, setSkillInput] = useState('');
  const [skillError, setSkillError] = useState('');

  const handleNameChange = (e) => {
    onChange({ ...team, name: e.target.value });
  };

  const handleOpportunityChange = (e) => {
    const val = e.target.value;
    onChange({ ...team, opportunityId: val === '' ? null : val });
  };

  const handleCapacityChange = (e) => {
    const val = parseInt(e.target.value, 10);
    onChange({
      ...team,
      maxMembers: Number.isNaN(val) ? '' : val,
    });
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    setSkillError('');

    const trimmed = skillInput.trim();
    if (!trimmed) {
      setSkillError('Please enter a skill name.');
      return;
    }

    const result = addSkillToTeam(team, trimmed);
    if (!result.success) {
      setSkillError(result.error);
      return;
    }

    onChange(result.team);
    setSkillInput('');
  };

  const handleRemoveSkill = (skill) => {
    setSkillError('');
    onChange(removeSkillFromTeam(team, skill));
  };

  const selectedOpportunity = opportunities.find((o) => o.id === team.opportunityId);

  return (
    <div className={styles.formSection}>
      <div className={styles.sectionHeading}>
        <h2>Team Specifications</h2>
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="team-name" className={styles.fieldLabel}>
          Team Name <span className={styles.requiredAsterisk}>*</span>
        </label>
        <input
          id="team-name"
          type="text"
          className={`${styles.textInput} ${fieldErrors.name ? styles.inputError : ''}`}
          placeholder="e.g. Neural Builders, AlgoCraft"
          value={team.name}
          onChange={handleNameChange}
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? 'team-name-error' : undefined}
        />
        {fieldErrors.name && (
          <p id="team-name-error" className={styles.errorText} role="alert">
            {fieldErrors.name}
          </p>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="team-opportunity" className={styles.fieldLabel}>
          Target Challenge
        </label>
        <select
          id="team-opportunity"
          className={styles.selectInput}
          value={team.opportunityId ?? ''}
          onChange={handleOpportunityChange}
        >
          <option value="">No challenge selected (Open team)</option>
          {opportunities.map((opp) => (
            <option key={opp.id} value={opp.id}>
              {opp.title} ({opp.category} &middot; {opp.mode})
            </option>
          ))}
        </select>
        {catalogStatus === 'loading' && (
          <span className={styles.helpText}>Loading challenges...</span>
        )}
        {selectedOpportunity && (
          <div className={styles.selectedOppSummary}>
            <span className={styles.oppCategory}>{selectedOpportunity.category}</span>
            <span className={styles.oppMode}>
              {selectedOpportunity.mode === 'offline' ? 'In Person' : selectedOpportunity.mode === 'online' ? 'Online' : 'Hybrid'}
            </span>
          </div>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="team-capacity" className={styles.fieldLabel}>
          Target Capacity <span className={styles.requiredAsterisk}>*</span>
        </label>
        <div className={styles.capacityInputRow}>
          <input
            id="team-capacity"
            type="number"
            min={Math.max(1, team.memberIds.length)}
            max={20}
            className={`${styles.numberInput} ${fieldErrors.maxMembers ? styles.inputError : ''}`}
            value={team.maxMembers}
            onChange={handleCapacityChange}
            aria-invalid={Boolean(fieldErrors.maxMembers)}
            aria-describedby={fieldErrors.maxMembers ? 'team-capacity-error' : undefined}
          />
          <span className={styles.capacityHint}>
            ({team.memberIds.length} currently assigned)
          </span>
        </div>
        {fieldErrors.maxMembers && (
          <p id="team-capacity-error" className={styles.errorText} role="alert">
            {fieldErrors.maxMembers}
          </p>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="skill-input" className={styles.fieldLabel}>
          Required Skills ({team.requiredSkills.length})
        </label>

        <form onSubmit={handleAddSkill} className={styles.skillInputRow}>
          <input
            id="skill-input"
            type="text"
            className={`${styles.textInput} ${skillError ? styles.inputError : ''}`}
            placeholder="Add a required skill (e.g. React, Python, Docker)..."
            value={skillInput}
            onChange={(e) => {
              setSkillInput(e.target.value);
              setSkillError('');
            }}
          />
          <button type="submit" className={styles.secondaryButton}>
            Add
          </button>
        </form>

        {skillError && (
          <p className={styles.errorText} role="alert">
            {skillError}
          </p>
        )}

        <div className={styles.skillPillsContainer}>
          {team.requiredSkills.length === 0 ? (
            <p className={styles.emptyNotice}>No required skills added yet.</p>
          ) : (
            <ul className={styles.skillList} aria-label="Required skills list">
              {team.requiredSkills.map((skill) => (
                <li key={skill} className={styles.skillPill}>
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className={styles.skillRemoveButton}
                    aria-label={`Remove skill ${skill}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
