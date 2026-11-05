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
        <h2>Team parameters</h2>
        <p>Define the project identity, target challenge, and required technical skills.</p>
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="team-name" className={styles.fieldLabel}>
          Team name <span className={styles.requiredAsterisk}>*</span>
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
          Target opportunity (Hackathon)
        </label>
        <select
          id="team-opportunity"
          className={styles.selectInput}
          value={team.opportunityId ?? ''}
          onChange={handleOpportunityChange}
        >
          <option value="">Independent team (No hackathon selected)</option>
          {opportunities.map((opp) => (
            <option key={opp.id} value={opp.id}>
              {opp.title} — {opp.organizer} ({opp.mode})
            </option>
          ))}
        </select>
        {catalogStatus === 'loading' && (
          <span className={styles.helpText}>Loading available opportunities from catalog...</span>
        )}
        {selectedOpportunity && (
          <div className={styles.selectedOppSummary}>
            <span className={styles.oppCategory}>{selectedOpportunity.category}</span>
            <span className={styles.oppMode}>{selectedOpportunity.mode}</span>
            <p>{selectedOpportunity.description}</p>
          </div>
        )}
        {!team.opportunityId && (
          <span className={styles.helpText}>
            Independent creation allowed: You can build a roster without an assigned event.
          </span>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="team-capacity" className={styles.fieldLabel}>
          Maximum team capacity <span className={styles.requiredAsterisk}>*</span>
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
            Current roster: {team.memberIds.length} {team.memberIds.length === 1 ? 'member' : 'members'}
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
          Required skills ({team.requiredSkills.length})
        </label>
        <p className={styles.fieldDescription}>
          Skills needed for this project. Downstream Explainable Matching uses these to identify coverage gaps.
        </p>

        <form onSubmit={handleAddSkill} className={styles.skillInputRow}>
          <input
            id="skill-input"
            type="text"
            className={`${styles.textInput} ${skillError ? styles.inputError : ''}`}
            placeholder="e.g. React, Python, Figma, Docker"
            value={skillInput}
            onChange={(e) => {
              setSkillInput(e.target.value);
              setSkillError('');
            }}
          />
          <button type="submit" className={styles.secondaryButton}>
            Add skill
          </button>
        </form>

        {skillError && (
          <p className={styles.errorText} role="alert">
            {skillError}
          </p>
        )}

        <div className={styles.skillPillsContainer}>
          {team.requiredSkills.length === 0 ? (
            <p className={styles.emptyNotice}>No skills required yet. Add skills to define what your team needs.</p>
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

