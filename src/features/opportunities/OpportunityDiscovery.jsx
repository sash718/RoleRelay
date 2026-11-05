import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { loadOpportunityCatalog } from './catalog.js';
import styles from './OpportunityDiscovery.module.css';

function formatDate(value) {
  if (!value) return 'Not published';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(value));
}

function matchesFilters(event, searchTerm, category, mode, upcomingOnly) {
  const searchableText = `${event.title} ${event.organizer} ${event.category}`.toLowerCase();
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

  const categories = useMemo(
    () => [...new Set(events.map((event) => event.category))].sort(),
    [events],
  );
  const visibleEvents = useMemo(
    () => events.filter((event) => matchesFilters(event, searchTerm, category, mode, upcomingOnly)),
    [events, searchTerm, category, mode, upcomingOnly],
  );
  const selectedEvent = events.find((event) => event.id === opportunityId);

  if (opportunityId) {
    return <OpportunityDetails event={selectedEvent} status={status} errorMessage={errorMessage} onRetry={fetchCatalog} />;
  }

  return (
    <section className={styles.discovery} aria-labelledby="opportunities-title">
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.heroEyebrow}><span /> Opportunity board <span className={styles.eyebrowDivider}>/</span> 2027</p>
          <h1 id="opportunities-title">Ideas are everywhere.<br /><span>Build one.</span></h1>
          <p>Find a challenge that sparks something. Explore the sample briefs, picture your team, and start with an idea worth making real.</p>
          <div className={styles.heroFooter}>
            <span className={styles.demoIndicator}><span /> Demo catalogue</span>
            <span>Fictional examples · Not open for registration</span>
          </div>
        </div>
        <div className={styles.heroArt} aria-hidden="true">
          <div className={styles.artOrbit} />
          <div className={styles.artOrb}><span>R</span></div>
          <div className={`${styles.artTag} ${styles.artTagTop}`}>THINK<br />BIGGER</div>
          <div className={`${styles.artTag} ${styles.artTagBottom}`}>MAKE IT<br />MATTER <span>↗</span></div>
          <span className={`${styles.artSpark} ${styles.artSparkOne}`} />
          <span className={`${styles.artSpark} ${styles.artSparkTwo}`} />
        </div>
      </header>

      <section className={styles.browseSection} aria-label="Browse opportunities">
        <div className={styles.browseHeading}>
          <div>
            <p className={styles.sectionEyebrow}>A good place to start</p>
            <h2>Pick a challenge.<br /><span>Make it yours.</span></h2>
          </div>
          <p className={styles.browseIntro}>A few starting points for curious people who would rather build than just brainstorm.</p>
        </div>

        <section className={styles.filters} aria-label="Filter opportunities">
          <label className={styles.searchLabel}>
            <span>Find your next idea</span>
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search title, organiser, or category" type="search" />
          </label>
          <label>
            <span>Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">All categories</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>Format</span>
            <select value={mode} onChange={(event) => setMode(event.target.value)}>
              <option value="all">All formats</option>
              <option value="online">Online</option>
              <option value="offline">In person</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </label>
          <label className={styles.checkboxLabel}>
            <input checked={upcomingOnly} onChange={(event) => setUpcomingOnly(event.target.checked)} type="checkbox" />
            <span>Upcoming only</span>
          </label>
        </section>
      </section>

      {status === 'loading' && <StatusPanel title="Loading the catalog" message="Retrieving the locally maintained opportunity catalog." />}
      {status === 'error' && <StatusPanel title="Catalog unavailable" message={errorMessage} action={<button type="button" onClick={fetchCatalog}>Try again</button>} />}
      {status === 'ready' && events.length === 0 && <StatusPanel title="No opportunities to show" message="There are no opportunities in the catalogue right now. Check back when it has been updated." />}
      {status === 'ready' && events.length > 0 && visibleEvents.length === 0 && <StatusPanel title="No opportunities match these filters" message="Try a broader search or clear one of the filters." action={<button type="button" onClick={() => { setSearchTerm(''); setCategory('all'); setMode('all'); setUpcomingOnly(true); }}>Reset filters</button>} />}
      {status === 'ready' && visibleEvents.length > 0 && (
        <div className={styles.results} id="opportunity-results" aria-live="polite">
          <div className={styles.resultsHeading}>
            <p><span>{String(visibleEvents.length).padStart(2, '0')}</span> {visibleEvents.length === 1 ? 'opportunity' : 'opportunities'} to explore</p>
            <span>DEMO BRIEFS</span>
          </div>
          <div className={styles.cardGrid}>{visibleEvents.map((event, index) => <OpportunityCard event={event} index={index} key={event.id} />)}</div>
        </div>
      )}
    </section>
  );
}

function OpportunityCard({ event, index }) {
  return (
    <article className={styles.card}>
      <div className={styles.cardTopline}>
        <span className={styles.cardIndex}>0{index + 1}</span>
        <span className={styles.demoBadge}>Demo brief</span>
      </div>
      <div className={styles.cardMeta}><span>{event.category}</span><span>{event.mode === 'offline' ? 'In person' : event.mode}</span></div>
      <h3>{event.title}</h3>
      <p className={styles.description}>{event.description}</p>
      <div className={styles.cardFooter}>
        <div className={styles.cardDate}><span>STARTING</span><strong>{formatDate(event.startsAt)}</strong></div>
        <Link className={styles.detailLink} to={`/opportunities/${event.id}`} aria-label={`Explore ${event.title}`}>Explore <span aria-hidden="true">↗</span></Link>
      </div>
    </article>
  );
}

function OpportunityDetails({ event, status, errorMessage, onRetry }) {
  if (status === 'loading') return <StatusPanel title="Loading opportunity" message="Retrieving its source information." />;
  if (status === 'error') return <StatusPanel title="Catalog unavailable" message={errorMessage} action={<button type="button" onClick={onRetry}>Try again</button>} />;
  if (!event) return <StatusPanel title="Opportunity not found" message="This record is no longer in the current catalog." action={<Link to="/opportunities">Return to opportunities</Link>} />;

  return (
    <article className={styles.detail}>
      <Link className={styles.backLink} to="/opportunities"><span aria-hidden="true">←</span> All opportunities</Link>
      <header className={styles.detailHero}>
        <div className={styles.detailHeroCopy}>
          <div className={styles.detailBadges}>
            <span>{event.category}</span>
            <span>{event.mode === 'offline' ? 'In person' : event.mode}</span>
            {event.isDemo && <span className={styles.detailDemoBadge}>Demo brief</span>}
          </div>
          <p className={styles.detailOverline}>THE CHALLENGE</p>
          <h1>{event.title}</h1>
          <p className={styles.detailDeck}>A starting point for your next big idea.</p>
        </div>
        <div className={styles.detailStamp} aria-hidden="true"><span>MAKE</span><strong>IT<br />MATTER</strong><i>↗</i></div>
      </header>
      <div className={styles.detailGrid}>
        <section className={styles.detailAbout}>
          <p className={styles.sectionEyebrow}>THE BRIEF</p>
          <h2>What could you make?</h2>
          <p>{event.description}</p>
          {event.isDemo && <p className={styles.demoNotice}>This is fictional demonstration content—not a real event. Dates, organiser, and links are examples only.</p>}
        </section>
        <dl className={styles.detailFacts}>
          <div><dt>WHEN</dt><dd>{formatDate(event.startsAt)}</dd></div>
          <div><dt>REGISTRATION CLOSES</dt><dd>{formatDate(event.registrationDeadline)}</dd></div>
          <div><dt>WHERE</dt><dd>{event.location || 'See opportunity details'}</dd></div>
          <div><dt>ORGANISER</dt><dd>{event.organizer}</dd></div>
        </dl>
      </div>
      <section className={styles.actions} aria-label="Opportunity actions">
        {!event.isDemo && <a href={event.sourceUrl} target="_blank" rel="noreferrer">Official source <span aria-hidden="true">↗</span></a>}
        {event.registrationUrl && <a href={event.registrationUrl} target="_blank" rel="noreferrer">External registration <span aria-hidden="true">↗</span></a>}
        <Link to={`/team?opportunity=${encodeURIComponent(event.id)}`}>Plan a team <span aria-hidden="true">↗</span></Link>
      </section>
    </article>
  );
}

function StatusPanel({ title, message, action }) {
  return <section className={styles.statusPanel} aria-live="polite"><p className="eyebrow">Catalog status</p><h2>{title}</h2><p>{message}</p>{action && <div>{action}</div>}</section>;
}
