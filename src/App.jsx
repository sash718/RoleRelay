import { useEffect, useRef } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import FeatureIntro from './components/FeatureIntro.jsx';
import DesignPrototype from './components/DesignPrototype.jsx';
import OpportunityDiscovery from './features/opportunities/OpportunityDiscovery.jsx';
import MatchingExplorer from './features/matching/MatchingExplorer.jsx';
import StudentDiscovery from './features/students/StudentDiscovery.jsx';

const features = [
  {
    path: '/opportunities',
    label: 'Opportunities',
    title: 'Find the opportunity.',
    description: 'Discover a challenge worth building for, then follow its official source.',
    owner: 'Member 1',
    scope: 'Event discovery, search, filters, fetch integration, and request states.',
  },
  {
    path: '/students',
    label: 'Students',
    title: 'Explore possible contributors.',
    description: 'Future local candidate discovery will live here.',
    owner: 'Member 2',
    scope: 'Local candidate profiles, skill filters, and contribution details.',
  },
  {
    path: '/team',
    label: 'Team plan',
    title: 'Plan the right team.',
    description: 'Define the skills and roles your project needs before filling the roster.',
    owner: 'Member 2',
    scope: 'Team and member forms, validation, skill and role selection, and local saving.',
  },
  {
    path: '/matching',
    label: 'Match lab',
    title: 'Understand the missing skills.',
    description: 'Evaluate how a candidate could contribute to your local team plan.',
    owner: 'Member 3',
    scope: 'Skill-gap calculations, candidate ranking, recommendation explanations, and algorithm tests.',
  },
  {
    path: '/workspace',
    label: 'Recruitment board',
    title: 'Compare your next addition.',
    description: 'Review candidate contributions and continue a saved team plan.',
    owner: 'Member 4',
    scope: 'Candidate comparison, saved workspace, dynamic coverage, and UI integration tests.',
  },
];

export default function App() {
  const { pathname } = useLocation();
  const mainRef = useRef(null);

  useEffect(() => {
    const feature = features.find((item) => item.path === pathname);
    const pageTitle = pathname === '/design' ? 'Design preview' : feature?.label ?? 'Page not found';
    document.title = `${pageTitle} | RoleRelay`;
    mainRef.current?.focus();
  }, [pathname]);

  return (
    <div className="app-frame">
      <a className="skip-link" href="#main-content" onClick={(event) => {
        event.preventDefault();
        mainRef.current?.focus();
      }}>Skip to content</a>
      <header className="site-header">
        <div className="rail-brand">
          <Link className="brand" to="/opportunities">Role<span>Relay</span></Link>
          <p>Find the opportunity.<br />Form the right team.</p>
        </div>
        <nav aria-label="Main navigation">
          <p className="nav-label">Workspace</p>
          <div className="nav-links">
            {features.map((feature) => (
              <NavLink key={feature.path} to={feature.path}><span className="nav-marker" aria-hidden="true" />{feature.label}</NavLink>
            ))}
          </div>
          <p className="nav-label design-label">Design system</p>
          <NavLink className="design-link" to="/design"><span className="nav-marker" aria-hidden="true" />Visual direction</NavLink>
        </nav>
      </header>
      <div className="app-stage">
        <div className="stage-header"><span>Builder intelligence workspace</span><span>Frontend foundation · Browser-local planning</span></div>
        <main id="main-content" ref={mainRef} tabIndex={-1} className="page-shell">
        <Routes>
          <Route path="/" element={<Navigate to="/opportunities" replace />} />
          <Route path="/opportunities" element={<OpportunityDiscovery />} />
          <Route path="/opportunities/:opportunityId" element={<OpportunityDiscovery />} />
          <Route path="/students" element={<StudentDiscovery />} />
          <Route path="/matching" element={<MatchingExplorer />} />
          {features
            .filter((feature) => !['/opportunities', '/students', '/matching'].includes(feature.path))
            .map((feature) => (
              <Route key={feature.path} path={feature.path} element={<FeatureIntro {...feature} />} />
            ))}
          <Route path="/design" element={<DesignPrototype />} />
          <Route path="*" element={<section><h1>Page not found</h1><p>This address does not match a RoleRelay page.</p><Link to="/opportunities">Return to opportunities</Link></section>} />
        </Routes>
        </main>
        <footer className="site-footer">
          <p>RoleRelay / Design foundation</p>
          <p>Local planning only. No accounts, messaging, or shared workspace.</p>
        </footer>
      </div>
    </div>
  );
}
