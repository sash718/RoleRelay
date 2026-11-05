import React, { useState } from 'react';
import { addMemberToTeam, removeMemberFromTeam } from './teamModel.js';
import { CANDIDATE_PROFILES, getCandidateProfileMap } from '../students/profiles.js';
import styles from './TeamCreation.module.css';

export default function TeamMembers({
  team,
  onChange,
}) {
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [memberError, setMemberError] = useState('');

  const profileMap = getCandidateProfileMap();
  const currentMemberCount = team.memberIds.length;
  const isFull = currentMemberCount >= team.maxMembers;

  // Filter available candidate profiles that are not yet on this team
  const availableCandidates = CANDIDATE_PROFILES.filter(
    (profile) => !team.memberIds.includes(profile.id),
  );

  const handleAddMember = (e) => {
    e.preventDefault();
    setMemberError('');

    if (!selectedCandidateId) {
      setMemberError('Please select a student profile to add.');
      return;
    }

    const result = addMemberToTeam(team, selectedCandidateId);
    if (!result.success) {
      setMemberError(result.error);
      return;
    }

    onChange(result.team);
    setSelectedCandidateId('');
  };

  const handleRemoveMember = (memberId) => {
    setMemberError('');
    onChange(removeMemberFromTeam(team, memberId));
  };

  const capacityRatio = Math.min(100, Math.round((currentMemberCount / (team.maxMembers || 1)) * 100));

  return (
    <div className={styles.membersSection}>
      <div className={styles.sectionHeading}>
        <h2>Team membership & capacity</h2>
        <p>Assign local student profiles to the team and track available roster capacity.</p>
      </div>

      {/* Capacity Indicator Meter */}
      <div className={styles.capacityCard}>
        <div className={styles.capacityMeta}>
          <div>
            <span className={styles.capacityLabel}>Current roster</span>
            <strong className={styles.capacityValue}>
              {currentMemberCount} / {team.maxMembers} {team.maxMembers === 1 ? 'member' : 'members'}
            </strong>
          </div>
          <span className={`${styles.statusBadge} ${isFull ? styles.statusBadgeFull : styles.statusBadgeOpen}`}>
            {isFull ? 'Full capacity' : `${team.maxMembers - currentMemberCount} open spots`}
          </span>
        </div>
        <div className={styles.progressBarBg} aria-hidden="true">
          <div
            className={`${styles.progressBarFill} ${isFull ? styles.progressBarFillFull : ''}`}
            style={{ width: `${capacityRatio}%` }}
          />
        </div>
      </div>

      {/* Add Member Form */}
      <div className={styles.addMemberBlock}>
        <label htmlFor="member-select" className={styles.fieldLabel}>
          Add team member from local profiles
        </label>
        {isFull ? (
          <p className={styles.warningNote}>
            Team has reached maximum capacity ({team.maxMembers} members). Increase maximum capacity above to add more members.
          </p>
        ) : availableCandidates.length === 0 ? (
          <p className={styles.emptyNotice}>All available demonstration profiles have been added to this team.</p>
        ) : (
          <form onSubmit={handleAddMember} className={styles.addMemberForm}>
            <select
              id="member-select"
              className={styles.selectInput}
              value={selectedCandidateId}
              onChange={(e) => {
                setSelectedCandidateId(e.target.value);
                setMemberError('');
              }}
              disabled={isFull}
            >
              <option value="">Choose a student profile...</option>
              {availableCandidates.map((cand) => (
                <option key={cand.id} value={cand.id}>
                  {cand.name} — {cand.role} ({cand.skills.slice(0, 3).join(', ')})
                </option>
              ))}
            </select>
            <button
              type="submit"
              className={styles.secondaryButton}
              disabled={isFull || !selectedCandidateId}
            >
              Add to team
            </button>
          </form>
        )}

        {memberError && (
          <p className={styles.errorText} role="alert">
            {memberError}
          </p>
        )}
      </div>

      {/* Current Team Members Roster */}
      <div className={styles.rosterContainer}>
        <h3 className={styles.rosterHeading}>
          Assigned contributors ({currentMemberCount})
        </h3>

        {currentMemberCount === 0 ? (
          <div className={styles.emptyRosterCard}>
            <span className={styles.emptyRosterIcon} aria-hidden="true">👥</span>
            <h4>No members added yet</h4>
            <p>Select profiles from the candidate directory to fill open slots on this team.</p>
          </div>
        ) : (
          <ul className={styles.rosterList} aria-label="Current team members">
            {team.memberIds.map((memberId) => {
              const profile = profileMap.get(memberId);

              // Graceful handling for deleted or unavailable profiles (Rule 10)
              if (!profile) {
                return (
                  <li key={memberId} className={`${styles.memberCard} ${styles.missingMemberCard}`}>
                    <div className={styles.memberInfo}>
                      <div className={styles.memberNameRow}>
                        <span className={styles.missingBadge}>Unavailable Profile</span>
                        <span className={styles.memberIdTag}>ID: {memberId}</span>
                      </div>
                      <p className={styles.missingNotice}>
                        This profile reference no longer exists in the directory. You can keep or remove this placeholder.
                      </p>
                    </div>
                    <button
                      type="button"
                      className={styles.removeMemberButton}
                      onClick={() => handleRemoveMember(memberId)}
                      aria-label={`Remove unavailable profile ${memberId}`}
                    >
                      Remove
                    </button>
                  </li>
                );
              }

              return (
                <li key={memberId} className={styles.memberCard}>
                  <div className={styles.memberInfo}>
                    <div className={styles.memberNameRow}>
                      <strong className={styles.memberName}>{profile.name}</strong>
                      <span className={styles.memberRole}>{profile.role}</span>
                    </div>
                    <div className={styles.memberSkillsRow}>
                      <span className={styles.skillsTagLabel}>Skills:</span>
                      {profile.skills.map((skill) => (
                        <span key={skill} className={styles.memberSkillTag}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.removeMemberButton}
                    onClick={() => handleRemoveMember(memberId)}
                    aria-label={`Remove ${profile.name} from team`}
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

