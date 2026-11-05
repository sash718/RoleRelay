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
        <div>
          <p className="eyebrow">Opportunity dossier</p>
          <h1 id="opportunities-title">Find an opportunity worth building for.</h1>
          <p>Browse a manually curated catalog. Each record keeps its official source and last-check date visible.</p>
        </div>
        <p className={styles.catalogNote}>Not a live feed<br /><span>Information may change at the official source.</span></p>
      </header>

      <section className={styles.filters} aria-label="Filter opportunities">
        <label className={styles.searchLabel}>
          <span>Search the catalog</span>
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Title, organiser, or category" type="search" />
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

      {status === 'loading' && <StatusPanel title="Loading the catalog" message="Retrieving the locally maintained opportunity catalog." />}
      {status === 'error' && <StatusPanel title="Catalog unavailable" message={errorMessage} action={<button type="button" onClick={fetchCatalog}>Try again</button>} />}
      {status === 'ready' && events.length === 0 && <StatusPanel title="No sourced opportunities yet" message="The catalog is ready, but no event has been added until its official details can be checked. Check back after the catalog is updated." />}
      {status === 'ready' && events.length > 0 && visibleEvents.length === 0 && <StatusPanel title="No opportunities match these filters" message="Try a broader search or clear one of the filters." action={<button type="button" onClick={() => { setSearchTerm(''); setCategory('all'); setMode('all'); setUpcomingOnly(true); }}>Reset filters</button>} />}
      {status === 'ready' && visibleEvents.length > 0 && (
        <div className={styles.results} aria-live="polite">
          <p>{visibleEvents.length} {visibleEvents.length === 1 ? 'opportunity' : 'opportunities'} shown</p>
          <div className={styles.cardGrid}>{visibleEvents.map((event) => <OpportunityCard event={event} key={event.id} />)}</div>
        </div>
      )}
    </section>
  );
}

function OpportunityCard({ event }) {
  return (
    <article className={styles.card}>
      <div className={styles.cardMeta}><span>{event.category}</span><span>{event.mode}</span></div>
      <h2>{event.title}</h2>
      <p className={styles.organizer}>{event.organizer}</p>
      <p className={styles.description}>{event.description}</p>
      <dl className={styles.facts}>
        <div><dt>Starts</dt><dd>{formatDate(event.startsAt)}</dd></div>
        <div><dt>Location</dt><dd>{event.location || 'See official source'}</dd></div>
      </dl>
      <Link className={styles.detailLink} to={`/opportunities/${event.id}`}>View opportunity <span aria-hidden="true">→</span></Link>
    </article>
  );
}

function OpportunityDetails({ event, status, errorMessage, onRetry }) {
  if (status === 'loading') return <StatusPanel title="Loading opportunity" message="Retrieving its source information." />;
  if (status === 'error') return <StatusPanel title="Catalog unavailable" message={errorMessage} action={<button type="button" onClick={onRetry}>Try again</button>} />;
  if (!event) return <StatusPanel title="Opportunity not found" message="This record is no longer in the current catalog." action={<Link to="/opportunities">Return to opportunities</Link>} />;

  return (
    <article className={styles.detail}>
      <Link className={styles.backLink} to="/opportunities">← All opportunities</Link>
      <header>
        <p className="eyebrow">{event.category} · {event.mode}</p>
        <h1>{event.title}</h1>
        <p className={styles.organizer}>{event.organizer}</p>
      </header>
      <div className={styles.detailGrid}>
        <section><h2>About this opportunity</h2><p>{event.description}</p></section>
        <dl className={styles.detailFacts}>
          <div><dt>Starts</dt><dd>{formatDate(event.startsAt)}</dd></div>
          <div><dt>Registration deadline</dt><dd>{formatDate(event.registrationDeadline)}</dd></div>
          <div><dt>Location</dt><dd>{event.location || 'See official source'}</dd></div>
          <div><dt>Last checked</dt><dd>{formatDate(event.lastVerifiedAt)}</dd></div>
        </dl>
      </div>
      <section className={styles.actions} aria-label="Opportunity actions">
        <a href={event.sourceUrl} target="_blank" rel="noreferrer">Official source <span aria-hidden="true">↗</span></a>
        {event.registrationUrl && <a href={event.registrationUrl} target="_blank" rel="noreferrer">External registration <span aria-hidden="true">↗</span></a>}
        <Link to={`/team?opportunity=${encodeURIComponent(event.id)}`}>Build a team</Link>
      </section>
    </article>
  );
}

function StatusPanel({ title, message, action }) {
  return <section className={styles.statusPanel} aria-live="polite"><p className="eyebrow">Catalog status</p><h2>{title}</h2><p>{message}</p>{action && <div>{action}</div>}</section>;
}
