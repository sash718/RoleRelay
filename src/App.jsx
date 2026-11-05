import { useEffect, useRef } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import FeatureIntro from './components/FeatureIntro.jsx';

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
    path: '/team',
    label: 'Team Builder',
    title: 'Plan the right team.',
    description: 'Define the skills and roles your project needs before filling the roster.',
    owner: 'Member 2',
    scope: 'Team and member forms, validation, skill and role selection, and local saving.',
  },
  {
    path: '/matching',
    label: 'Matching Explorer',
    title: 'Understand the missing skills.',
    description: 'Evaluate how a candidate could contribute to your local team plan.',
    owner: 'Member 3',
    scope: 'Skill-gap calculations, candidate ranking, recommendation explanations, and algorithm tests.',
  },
  {
    path: '/workspace',
    label: 'Workspace',
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
    document.title = `${feature?.label ?? 'Page not found'} | RoleRelay`;
    mainRef.current?.focus();
  }, [pathname]);

  return (
    <>
      <a className="skip-link" href="#main-content" onClick={(event) => {
        event.preventDefault();
        mainRef.current?.focus();
      }}>Skip to content</a>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/opportunities">RoleRelay<span>Find the opportunity. Form the right team.</span></Link>
          <nav aria-label="Main navigation">
            {features.map((feature) => (
              <NavLink key={feature.path} to={feature.path}>{feature.label}</NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="main-content" ref={mainRef} tabIndex={-1} className="page-shell">
        <Routes>
          <Route path="/" element={<Navigate to="/opportunities" replace />} />
          {features.map((feature) => (
            <Route key={feature.path} path={feature.path} element={<FeatureIntro {...feature} />} />
          ))}
          <Route path="*" element={<section><h1>Page not found</h1><p>This address does not match a RoleRelay page.</p><Link to="/opportunities">Return to opportunities</Link></section>} />
        </Routes>
      </main>
      <footer className="site-footer">
        <p>FSD I · Project foundation</p>
        <p>Future team plans will be stored in this browser. No accounts or shared workspace.</p>
      </footer>
    </>
  );
}
