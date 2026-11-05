import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import OpportunityDiscovery from './features/opportunities/OpportunityDiscovery.jsx';
import MatchingExplorer from './features/matching/MatchingExplorer.jsx';
import StudentDiscovery from './features/students/StudentDiscovery.jsx';
import TeamCreation from './features/teams/TeamCreation.jsx';
import RecruitmentWorkspace from './features/recruitment/RecruitmentWorkspace.jsx';

const navItems = [
  {
    path: '/opportunities',
    label: 'Opportunities',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    path: '/students',
    label: 'Students',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    path: '/team',
    label: 'Team Plan',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    path: '/matching',
    label: 'Match Lab',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10 2v7.31M14 9.3V2M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0" />
      </svg>
    ),
  },
  {
    path: '/workspace',
    label: 'Recruitment Board',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
      </svg>
    ),
  },
];

export default function App() {
  const { pathname } = useLocation();
  const mainRef = useRef(null);

  const [isNavCollapsed, setIsNavCollapsed] = useState(() => {
    try {
      return localStorage.getItem('rolerelay_nav_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleNavCollapse = () => {
    setIsNavCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('rolerelay_nav_collapsed', String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  useEffect(() => {
    const item = navItems.find((n) => n.path === pathname);
    const pageTitle = pathname.startsWith('/opportunities/') ? 'Opportunities' : item?.label ?? 'Page not found';
    document.title = `${pageTitle} | RoleRelay`;
    mainRef.current?.focus();
  }, [pathname]);

  return (
    <div className={`app-frame ${isNavCollapsed ? 'nav-collapsed' : ''}`}>
      <a className="skip-link" href="#main-content" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>Skip to content</a>
      <header className="site-header">
        <div className="rail-topbar">
          <div className="rail-brand">
            <Link className="brand" to="/opportunities">
              {isNavCollapsed ? (
                <span className="brand-collapsed">R<span>●</span></span>
              ) : (
                <>Role<span>Relay</span></>
              )}
            </Link>
            {!isNavCollapsed && (
              <p>Find the opportunity.<br />Form the right team.</p>
            )}
          </div>
          <button
            type="button"
            className="nav-toggle-btn"
            onClick={toggleNavCollapse}
            aria-label={isNavCollapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
            title={isNavCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ transform: isNavCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        <nav aria-label="Main navigation">
          {!isNavCollapsed && <p className="nav-label">Workspace</p>}
          <div className="nav-links">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                title={isNavCollapsed ? item.label : undefined}
                className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-item-icon">{item.icon}</span>
                {!isNavCollapsed && <span className="nav-item-text">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>
      <div className="app-stage">
        <main id="main-content" ref={mainRef} tabIndex={-1} className="page-shell">
          <Routes>
            <Route path="/" element={<Navigate to="/opportunities" replace />} />
            <Route path="/opportunities" element={<OpportunityDiscovery />} />
            <Route path="/opportunities/:opportunityId" element={<OpportunityDiscovery />} />
            <Route path="/students" element={<StudentDiscovery />} />
            <Route path="/team" element={<TeamCreation />} />
            <Route path="/matching" element={<MatchingExplorer />} />
            <Route path="/workspace" element={<RecruitmentWorkspace />} />
            <Route path="*" element={<section><h1>Page not found</h1><p>This address does not match a RoleRelay page.</p><Link to="/opportunities">Return to opportunities</Link></section>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
