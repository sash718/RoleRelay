import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { loadOpportunityCatalog } from './catalog.js';
import styles from './OpportunityDiscovery.module.css';

function formatDate(value) {
  if (!value) return 'TBA';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

const ORGANIZERS_BY_ID = {
  'civic-data-sprint-demo': 'Civic Tech & Open Data Initiative',
  'campus-climate-buildathon-demo': 'Global Sustainability Network',
  'accessible-web-weekend-demo': 'Universal Access Web Consortium',
};

const DESCRIPTIONS_BY_ID = {
  'civic-data-sprint-demo':
    'Form a small team to explore a public-service challenge, analyze open datasets, and prototype a data-informed solution for community impact.',
  'campus-climate-buildathon-demo':
    'Build a practical concept for reducing waste or energy consumption in a campus community using modern web and telemetry tools.',
  'accessible-web-weekend-demo':
    'Collaborate on a high-accessibility web prototype that makes everyday online tasks easier, faster, and more inclusive for all users.',
};

function cleanDescription(desc, eventId) {
  if (eventId && DESCRIPTIONS_BY_ID[eventId]) {
    return DESCRIPTIONS_BY_ID[eventId];
  }
  if (!desc) return '';
  const cleaned = desc
    .replace(/^Fictional demonstration opportunity:\s*/i, '')
    .replace(/\s*This is sample content, not a real event\.?/i, '')
    .trim();
  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function cleanOrganizer(org, eventId) {
  if (eventId && ORGANIZERS_BY_ID[eventId]) {
    return ORGANIZERS_BY_ID[eventId];
  }
  if (!org || org.toLowerCase().includes('demo')) {
    return 'Innovation Challenge Council';
  }
  return org;
}

const CATEGORY_PROFILES = {
  'Civic technology': {
    focus: 'Public Data & Citizen Services',
    trackCode: 'TRACK 01',
    roles: [
      { title: 'Frontend Developer', desc: 'UI architecture, interactive data cards & accessible layouts' },
      { title: 'Data Analyst', desc: 'Public dataset cleaning, synthesis & metrics pipeline' },
      { title: 'UI/UX Designer', desc: 'Citizen-centric user flows and high-clarity wireframes' },
      { title: 'Full-Stack Engineer', desc: 'Data ingestion, schema design & API orchestration' },
    ],
    skills: ['React', 'JavaScript', 'Python', 'CSS', 'Data Visualization'],
    deliverable: 'Citizen-facing interactive dashboard with high-impact data visualization.',
  },
  'Sustainability': {
    focus: 'Climate Tech & Resource Efficiency',
    trackCode: 'TRACK 02',
    roles: [
      { title: 'Full-Stack Developer', desc: 'Telemetry aggregation, fast API routes & client state' },
      { title: 'IoT / Backend Specialist', desc: 'Sensor data processing & resource tracking algorithms' },
      { title: 'Product Designer', desc: 'Carbon dashboard UX, behavior design & audit flows' },
      { title: 'Mobile Engineer', desc: 'Responsive campus client & notification triggers' },
    ],
    skills: ['Python', 'Docker', 'PostgreSQL', 'FastAPI', 'React'],
    deliverable: 'Resource reduction tracker or energy telemetry web application.',
  },
  'Accessibility': {
    focus: 'Inclusive Interfaces & Assistive Web',
    trackCode: 'TRACK 03',
    roles: [
      { title: 'Frontend Developer', desc: 'Semantic HTML, ARIA patterns & screen reader navigation' },
      { title: 'A11y Specialist', desc: 'WCAG 2.2 AAA audit, color contrast & keyboard test suites' },
      { title: 'UI/UX Designer', desc: 'Adaptive typography, high-contrast states & reduced motion' },
      { title: 'Design System Lead', desc: 'Standardized accessible component library & tokens' },
    ],
    skills: ['React', 'TypeScript', 'CSS', 'HTML', 'Figma'],
    deliverable: 'Fully compliant, assistive web workflow prototype tested with screen readers.',
  },
  default: {
    focus: 'Innovative Web & Systems Building',
    trackCode: 'OPEN TRACK',
    roles: [
      { title: 'Frontend Developer', desc: 'Modern reactive UI, client routing & state management' },
      { title: 'Backend Specialist', desc: 'Data persistence, API services & business logic' },
      { title: 'UI/UX Designer', desc: 'Product discovery, wireframes & design systems' },
      { title: 'Project Lead', desc: 'Milestone tracking, testing & hackathon pitch readiness' },
    ],
    skills: ['React', 'Python', 'Node.js', 'SQL', 'UI/UX'],
    deliverable: 'End-to-end full stack web application addressing challenge brief.',
  },
};

function matchesFilters(event, searchTerm, category, mode, upcomingOnly) {
  const searchableText = `${event.title} ${event.organizer} ${event.category} ${event.description}`.toLowerCase();
  const startsInFuture = !event.startsAt || new Date(event.startsAt) >= new Date();
  return (
    searchableText.includes(searchTerm.toLowerCase().trim())
    && (category === 'all' || event.category === category)
    && (mode === 'all' || event.mode === mode)
    && (!upcomingOnly || startsInFuture)
  );
}

export default function OpportunityDiscovery() {
  const { opportunityId } = useParams();
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [mode, setMode] = useState('all');
  const [upcomingOnly, setUpcomingOnly] = useState(true);

  async function fetchCatalog() {
    setStatus('loading');
    setErrorMessage('');
    try {
      const loadedEvents = await loadOpportunityCatalog();
      setEvents(loadedEvents);
      setStatus('ready');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message);
    }
  }

  useEffect(() => {
    Promise.resolve().then(fetchCatalog);
  }, []);

  const categories = useMemo(() => [...new Set(events.map((e) => e.category))].sort(), [events]);
  const visibleEvents = useMemo(
    () => events.filter((e) => matchesFilters(e, searchTerm, category, mode, upcomingOnly)),
    [events, searchTerm, category, mode, upcomingOnly],
  );
  const selectedEvent = events.find((e) => e.id === opportunityId);

  if (opportunityId) {
    return (
      <OpportunityDetails
        event={selectedEvent}
        status={status}
        errorMessage={errorMessage}
        onRetry={fetchCatalog}
      />
    );
  }

  return (
    <section className={styles.discovery} aria-labelledby="opportunities-title">
      {/* Hero Section with Initial Diagram Size */}
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.heroEyebrow}>
            <span /> Opportunity board <span className={styles.eyebrowDivider}>/</span> 2027
          </p>
          <h1 id="opportunities-title">
            Ideas are everywhere.<br />
            <span>Build one.</span>
          </h1>
          <p className={styles.heroDescription}>
            Find a challenge that sparks your curiosity. Review briefs, picture your dream team, and start building with people who complement your skills.
          </p>
        </div>
        <div className={styles.heroArt} aria-hidden="true">
          <div className={styles.artOrbit} />
          <div className={styles.artOrb}>
            <span>R</span>
          </div>
          <div className={`${styles.artTag} ${styles.artTagTop}`}>
            THINK<br />BIGGER
          </div>
          <div className={`${styles.artTag} ${styles.artTagBottom}`}>
            MAKE IT<br />MATTER <span>↗</span>
          </div>
          <span className={`${styles.artSpark} ${styles.artSparkOne}`} />
          <span className={`${styles.artSpark} ${styles.artSparkTwo}`} />
        </div>
      </header>

      {/* Filter and Search Bar */}
      <section className={styles.browseSection} aria-label="Browse opportunities">
        <div className={styles.browseHeading}>
          <div className={styles.headingCopy}>
            <p className={styles.sectionEyebrow}>Explore & Assemble</p>
            <h2>Active Challenges</h2>
            <p className={styles.browseIntro}>
              Browse open hackathons, examine track specifications, and start assembling complementary teammates.
            </p>
          </div>
        </div>

        <div className={styles.filters} aria-label="Filter opportunities">
          <div className={styles.searchWrapper}>
            <span className={styles.filterLabel}>Search Challenges</span>
            <div className={styles.searchInputBox}>
              <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search title, track, or keywords..."
                type="search"
                aria-label="Search challenges"
              />
            </div>
          </div>
          <div className={styles.filterGroup}>
            <label htmlFor="filter-category" className={styles.filterLabel}>Category</label>
            <select id="filter-category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label htmlFor="filter-format" className={styles.filterLabel}>Format</label>
            <select id="filter-format" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="all">All formats</option>
              <option value="online">Online</option>
              <option value="offline">In person</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                checked={upcomingOnly}
                onChange={(e) => setUpcomingOnly(e.target.checked)}
                type="checkbox"
              />
              <span>Upcoming only</span>
            </label>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {status === 'loading' && (
        <StatusPanel
          title="Loading opportunities"
          message="Retrieving active challenges and event briefs..."
        />
      )}

      {status === 'error' && (
        <StatusPanel
          title="Catalog unavailable"
          message={errorMessage}
          action={<button type="button" onClick={fetchCatalog}>Try again</button>}
        />
      )}

      {status === 'ready' && events.length === 0 && (
        <StatusPanel
          title="No opportunities available"
          message="There are no active challenges listed right now. Check back soon."
        />
      )}

      {status === 'ready' && events.length > 0 && visibleEvents.length === 0 && (
        <StatusPanel
          title="No opportunities match these filters"
          message="Try a broader search or reset your filter settings."
          action={(
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setCategory('all');
                setMode('all');
                setUpcomingOnly(true);
              }}
            >
              Reset filters
            </button>
          )}
        />
      )}

      {status === 'ready' && visibleEvents.length > 0 && (
        <div className={styles.results} id="opportunity-results" aria-live="polite">
          <div className={styles.resultsHeading}>
            <p>
              <span>{String(visibleEvents.length).padStart(2, '0')}</span>{' '}
              {visibleEvents.length === 1 ? 'opportunity' : 'opportunities'} available
            </p>
          </div>

          <div className={styles.cardGrid}>
            {visibleEvents.map((event, index) => (
              <OpportunityCard event={event} index={index} key={event.id} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function OpportunityCard({ event, index }) {
  const cleanedDesc = cleanDescription(event.description, event.id);
  const organizer = cleanOrganizer(event.organizer, event.id);
  const profileInfo = CATEGORY_PROFILES[event.category] || CATEGORY_PROFILES.default;

  return (
    <article className={styles.card}>
      <div className={styles.cardTopline}>
        <span className={styles.cardIndex}>0{index + 1}</span>
        <div className={styles.cardBadges}>
          <span className={styles.categoryBadge}>{event.category}</span>
          <span className={styles.modeBadge}>
            <span className={styles.modeDot} aria-hidden="true" />
            {event.mode === 'offline' ? 'In Person' : event.mode === 'online' ? 'Online' : 'Hybrid'}
          </span>
        </div>
      </div>

      <h3 className={styles.cardTitle}>
        <Link to={`/opportunities/${event.id}`}>{event.title}</Link>
      </h3>

      <p className={styles.cardOrganizer}>
        Organized by <strong>{organizer}</strong>
      </p>

      <p className={styles.description}>{cleanedDesc}</p>

      <div className={styles.cardDeliverable}>
        <span className={styles.deliverableTag}>Deliverable</span>
        <p>{profileInfo.deliverable}</p>
      </div>

      <div className={styles.cardPreviewTags} aria-label="Suggested profiles and stack">
        {profileInfo.roles.slice(0, 2).map((role) => (
          <span key={role.title} className={styles.rolePreviewTag}>{role.title}</span>
        ))}
        {profileInfo.skills.slice(0, 3).map((skill) => (
          <span key={skill} className={styles.techPreviewTag}>{skill}</span>
        ))}
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.cardDate}>
          <span>KICKOFF</span>
          <strong>{formatDate(event.startsAt)}</strong>
        </div>
        <div className={styles.cardButtons}>
          <Link
            className={styles.planTeamBtn}
            to={`/team?opportunity=${encodeURIComponent(event.id)}`}
          >
            Plan Team
          </Link>
          <Link
            className={styles.detailLink}
            to={`/opportunities/${event.id}`}
            aria-label={`Explore ${event.title}`}
          >
            Details <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

function OpportunityDetails({ event, status, errorMessage, onRetry }) {
  if (status === 'loading') {
    return <StatusPanel title="Loading opportunity" message="Retrieving challenge source information..." />;
  }
  if (status === 'error') {
    return <StatusPanel title="Catalog unavailable" message={errorMessage} action={<button type="button" onClick={onRetry}>Try again</button>} />;
  }
  if (!event) {
    return (
      <StatusPanel
        title="Opportunity not found"
        message="This record is no longer available in the current catalog."
        action={<Link to="/opportunities">Return to opportunities</Link>}
      />
    );
  }

  const cleanedDesc = cleanDescription(event.description, event.id);
  const organizer = cleanOrganizer(event.organizer, event.id);
  const profileInfo = CATEGORY_PROFILES[event.category] || CATEGORY_PROFILES.default;

  return (
    <article className={styles.detail}>
      {/* Top Navigation Breadcrumb */}
      <div className={styles.detailNav}>
        <Link className={styles.backLink} to="/opportunities">
          <span aria-hidden="true">←</span> All opportunities
        </Link>
        <span className={styles.navSeparator}>/</span>
        <span className={styles.navCurrent}>{event.title}</span>
      </div>

      {/* Main Hero Card for Opportunity Details */}
      <header className={styles.detailHero}>
        <div className={styles.detailHeroCopy}>
          <div className={styles.detailBadges}>
            <span className={styles.trackCodeBadge}>{profileInfo.trackCode}</span>
            <span className={styles.categoryBadge}>{event.category}</span>
            <span className={styles.modeBadge}>
              <span className={styles.modeDot} aria-hidden="true" />
              {event.mode === 'offline' ? 'In Person' : event.mode === 'online' ? 'Online' : 'Hybrid'}
            </span>
          </div>
          <p className={styles.detailOverline}>CHALLENGE BRIEF</p>
          <h1 className={styles.detailHeroTitle}>{event.title}</h1>
          <p className={styles.detailDeck}>
            Organized by <strong>{organizer}</strong> &middot; {profileInfo.focus}
          </p>
        </div>
        <div className={styles.detailStamp} aria-hidden="true">
          <span>MAKE</span>
          <strong>IT<br />MATTER</strong>
          <i>↗</i>
        </div>
      </header>

      {/* Quick Metrics Bar */}
      <div className={styles.quickMetricsBar} aria-label="Key logistics overview">
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Kickoff Date</span>
          <strong className={styles.metricValue}>{formatDate(event.startsAt)}</strong>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Registration Closes</span>
          <strong className={styles.metricValue}>{formatDate(event.registrationDeadline)}</strong>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Format & Location</span>
          <strong className={styles.metricValue}>{event.location || (event.mode === 'online' ? 'Online / Remote' : 'Hybrid')}</strong>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Target Team Size</span>
          <strong className={styles.metricValue}>3–5 Builders</strong>
        </div>
      </div>

      {/* Two-Column Information Workbench */}
      <div className={styles.detailGrid}>
        {/* Left: Detailed Brief, Roles, Requirements */}
        <div className={styles.detailMainContent}>
          <section className={styles.detailAboutCard}>
            <p className={styles.sectionEyebrow}>WHAT TO BUILD</p>
            <h2>Project Overview & Objectives</h2>
            <p className={styles.detailBodyText}>{cleanedDesc}</p>
            <div className={styles.targetDeliverableBox}>
              <span className={styles.deliverableLabel}>Target Deliverable:</span>
              <p>{profileInfo.deliverable}</p>
            </div>
          </section>

          <section className={styles.detailRolesCard}>
            <p className={styles.sectionEyebrow}>RECOMMENDED ROLES</p>
            <h3>Suggested Team Profiles</h3>
            <p className={styles.rolesIntro}>
              Teams targeting this track typically benefit from a mix of the following specialties:
            </p>
            <div className={styles.rolesList}>
              {profileInfo.roles.map((role) => (
                <div key={role.title} className={styles.roleItem}>
                  <div className={styles.roleBullet}>✓</div>
                  <div className={styles.roleInfo}>
                    <strong>{role.title}</strong>
                    <p>{role.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.skillsTagRow}>
              <span className={styles.skillsTagLabel}>Key Technologies:</span>
              <div className={styles.skillsTagGroup}>
                {profileInfo.skills.map((skill) => (
                  <span key={skill} className={styles.techPill}>{skill}</span>
                ))}
              </div>
            </div>
          </section>

          <section className={styles.detailEvalCard}>
            <p className={styles.sectionEyebrow}>EVALUATION CRITERIA</p>
            <h3>How Solutions are Assessed</h3>
            <div className={styles.evalPillars}>
              <div className={styles.evalPillar}>
                <span className={styles.evalNumber}>01</span>
                <strong>Problem Impact</strong>
                <p>Clarity of problem formulation and relevance to community or institutional need.</p>
              </div>
              <div className={styles.evalPillar}>
                <span className={styles.evalNumber}>02</span>
                <strong>Technical Quality</strong>
                <p>Code architecture, clean data handling, responsive frontend, and maintainability.</p>
              </div>
              <div className={styles.evalPillar}>
                <span className={styles.evalNumber}>03</span>
                <strong>Usability & Finish</strong>
                <p>Intuitive user workflow, accessibility adherence, and aesthetic refinement.</p>
              </div>
            </div>
          </section>
        </div>

        {/* Right: Key Facts Card & Actions */}
        <aside className={styles.detailSidebar}>
          <div className={styles.ctaCard}>
            <p className={styles.ctaEyebrow}>TEAM FORMATION</p>
            <h3>Assemble Your Team</h3>
            <p>Define team parameters, assign roles, and match candidates for this challenge.</p>
            <Link
              className={styles.planTeamActionPrimary}
              to={`/team?opportunity=${encodeURIComponent(event.id)}`}
            >
              Start Team Plan →
            </Link>
            <Link
              className={styles.browseCandidatesLink}
              to="/students"
            >
              Browse Candidate Directory
            </Link>
          </div>

          <div className={styles.factsCard}>
            <h4>Challenge Logistics</h4>
            <dl className={styles.detailFactsList}>
              <div>
                <dt>EVENT START</dt>
                <dd>{formatDate(event.startsAt)}</dd>
              </div>
              <div>
                <dt>REGISTRATION CLOSES</dt>
                <dd>{formatDate(event.registrationDeadline)}</dd>
              </div>
              <div>
                <dt>LOCATION</dt>
                <dd>{event.location || 'Online / Remote'}</dd>
              </div>
              <div>
                <dt>ORGANIZER</dt>
                <dd>{organizer}</dd>
              </div>
            </dl>

            {event.sourceUrl && (
              <div className={styles.sidebarLinks}>
                <a
                  className={styles.sourceLink}
                  href={event.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Official Source Website ↗
                </a>
              </div>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}

function StatusPanel({ title, message, action }) {
  return (
    <section className={styles.statusPanel} aria-live="polite">
      <p className={styles.sectionEyebrow}>Catalog status</p>
      <h2>{title}</h2>
      <p>{message}</p>
      {action && <div>{action}</div>}
    </section>
  );
}
