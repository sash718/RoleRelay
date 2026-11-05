const navigationPatterns = [
  ['Opportunity dossier', 'A researched event brief with source, freshness, and external registration context.'],
  ['Team map', 'A clear view of the roles, requirements, contributors, and gaps in one plan.'],
  ['Contribution ledger', 'A factual explanation of what a candidate adds and what still needs work.'],
];

const interfaceStates = [
  { title: 'Known', description: 'Sourced information with a visible freshness date.', type: 'known' },
  { title: 'Needs input', description: 'A local candidate or team plan needs more detail.', type: 'input' },
  { title: 'Missing', description: 'A team requirement is not yet covered.', type: 'missing' },
];

export default function DesignPrototype() {
  return (
    <section className="design-showcase" aria-labelledby="prototype-title">
      <header className="showcase-intro">
        <div>
          <p className="section-label">RoleRelay / visual direction</p>
          <h1 id="prototype-title">Builder intelligence,<br />without the dashboard theatre.</h1>
        </div>
        <div className="intro-note">
          <span className="prototype-badge">Prototype only</span>
          <p>This page establishes the interface language. It contains no live events, real students, team data, or feature logic.</p>
        </div>
      </header>

      <section className="direction-statement" aria-label="Design direction">
        <p>Builder Intelligence Workspace</p>
        <span>A calm editorial workspace for choosing an opportunity, mapping what a team needs, and making a reasoned next decision.</span>
      </section>

      <section className="showcase-layout" aria-label="Interface preview">
        <article className="dossier-panel">
          <div className="panel-topline"><span>Future screen / Opportunities</span><span>Visual preview</span></div>
          <div className="dossier-heading">
            <div><p className="section-label">Opportunity dossier</p><h2>Start with evidence.</h2></div>
            <button type="button" disabled>Browse sources</button>
          </div>
          <div className="dossier-search"><span>Search sourced opportunities</span><kbd>⌘ K</kbd></div>
          <div className="dossier-record">
            <div className="record-index">01</div>
            <div className="record-copy"><span className="placeholder-line placeholder-title">Source-backed opportunity title</span><span className="placeholder-line">Organiser · format · eligibility · published team rules</span></div>
            <div className="record-state"><span>Freshness</span><strong>Shown clearly</strong></div>
          </div>
          <div className="dossier-footnote"><span className="state-dot known" aria-hidden="true" />Official source and last-checked information stay attached to the decision.</div>
        </article>

        <aside className="context-panel">
          <p className="section-label">Local plan context</p>
          <h2>Nothing is assumed.</h2>
          <p>A future team plan starts blank and becomes useful only as requirements and contributors are added.</p>
          <dl>
            <div><dt>Opportunity</dt><dd>Not selected</dd></div>
            <div><dt>Team requirements</dt><dd>Not defined</dd></div>
            <div><dt>Candidate comparison</dt><dd>Unavailable until gaps exist</dd></div>
          </dl>
        </aside>
      </section>

      <section className="artifact-grid" aria-label="Core product patterns">
        <article className="artifact artifact-map">
          <div className="artifact-heading"><div><p className="section-label">Future screen / Team plan</p><h2>Team map</h2></div><span>Skill coverage</span></div>
          <div className="team-map">
            <div className="map-core"><span>Project<br />direction</span></div>
            <div className="map-node covered-node"><span className="state-dot known" aria-hidden="true" />Requirement covered</div>
            <div className="map-node missing-node"><span className="state-dot missing" aria-hidden="true" />Requirement missing</div>
            <div className="map-node neutral-node"><span className="state-dot input" aria-hidden="true" />Needs definition</div>
            <i className="map-link link-one" /><i className="map-link link-two" /><i className="map-link link-three" />
          </div>
          <p className="artifact-note">A map, not a percentage: people should see which responsibilities are filled and which require attention.</p>
        </article>

        <article className="artifact artifact-ledger">
          <div className="artifact-heading"><div><p className="section-label">Future screen / Match lab</p><h2>Contribution ledger</h2></div><span>Explainable by design</span></div>
          <div className="ledger-row ledger-head"><span>Decision factor</span><span>What the interface explains</span></div>
          <div className="ledger-row"><span><i className="state-dot known" /> Skill contribution</span><span>Which currently missing requirement could be covered</span></div>
          <div className="ledger-row"><span><i className="state-dot input" /> Availability</span><span>Whether requested sessions overlap or need input</span></div>
          <div className="ledger-row"><span><i className="state-dot missing" /> Remaining gap</span><span>What still needs another contributor</span></div>
          <p className="artifact-note">Future recommendations will show reasons, not opaque compatibility claims.</p>
        </article>
      </section>

      <section className="language-section" aria-labelledby="language-title">
        <div><p className="section-label">System language</p><h2 id="language-title">The interface makes uncertainty visible.</h2></div>
        <div className="state-specimens">
          {interfaceStates.map((state) => (
            <article className={`state-specimen ${state.type}`} key={state.title}>
              <span className={`state-dot ${state.type}`} aria-hidden="true" />
              <h3>{state.title}</h3>
              <p>{state.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="patterns-section" aria-labelledby="patterns-title">
        <div className="patterns-header"><div><p className="section-label">Screen principles</p><h2 id="patterns-title">Five routes, one decision system.</h2></div><span>All examples are visual placeholders</span></div>
        <div className="pattern-list">
          {navigationPatterns.map(([title, description], index) => (
            <article key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <i aria-hidden="true">↗</i>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
