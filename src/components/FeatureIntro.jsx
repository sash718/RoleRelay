export default function FeatureIntro({ label, title, description, owner, scope }) {
  return (
    <section aria-labelledby="page-title">
      <p className="eyebrow">{label}</p>
      <h1 id="page-title">{title}</h1>
      <p className="page-description">{description}</p>
      <div className="foundation-panel">
        <span className="status-label">Foundation only</span>
        <h2>This feature is not implemented yet.</h2>
        <p>This route is ready for its contributor. No event, student, or team records are loaded or saved here.</p>
        <dl>
          <div><dt>Feature ownership</dt><dd>{owner}</dd></div>
          <div><dt>Next implementation</dt><dd>{scope}</dd></div>
        </dl>
      </div>
    </section>
  );
}
