export default function FeatureIntro({ label, title, description, scope }) {
  return (
    <section aria-labelledby="page-title">
      <p className="eyebrow">{label}</p>
      <h1 id="page-title">{title}</h1>
      <p className="page-description">{description}</p>
      <div className="foundation-panel">
        <span className="status-label">Workspace preview</span>
        <h2>Explore the planned workflow.</h2>
        <p>This screen is a foundation preview. Records and actions are not connected here yet.</p>
        <dl>
          <div><dt>Area</dt><dd>{label}</dd></div>
          <div><dt>Planned workflow</dt><dd>{scope}</dd></div>
        </dl>
      </div>
    </section>
  );
}
