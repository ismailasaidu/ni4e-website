import React, { useEffect, useState } from 'react';
import { BuildStyles, ScrollTop, Header, PageLoader, Footer, Toast, SearchOverlay } from './components';
import Home from './pages/Home';
import About from './pages/About';
import Membership from './pages/Membership';
import MemberDirectory from './pages/MemberDirectory';
import Leadership from './pages/Leadership';
import Presidents from './pages/Presidents';
import Events from './pages/Events';
import Publications from './pages/Publications';
import Chapters from './pages/Chapters';
import News from './pages/News';
import ContentDirectory from './pages/ContentDirectory';
import Contact from './pages/Contact';
import Fellowship from './pages/Fellowship';
import Login from './member/Login';
import Register from './member/Register';
import Dashboard from './member/Dashboard';
import Admin from './admin/Admin';
import Payments from './member/Payments';
import MembershipStatus from './member/MembershipStatus';
import PortalSection from './member/PortalSection';
import Certificates from './member/Certificates';
import MemberProfile from './member/MemberProfile';
import MemberSettings from './member/MemberSettings';
import './styles.css';
import ProtectedRoute from './firebase/ProtectedRoute';

const ROUTES = {
  home: '/',
  about: '/about',
  membership: '/membership',
  memberDirectory: '/membership/directory',
  leadership: '/leadership',
  presidents: '/past-presidents',
  events: '/events',
  publications: '/publications',
  chapters: '/chapters',
  news: '/news',
  projects: '/projects',
  technicalDivisions: '/technical-divisions',
  committees: '/committees',
  contact: '/contact',
  register: '/membership/register',
  fellowship: '/membership/fellowship',
  login: '/login',
  payment: '/membership/payment',
  membershipStatus: '/membership/status',
  dashboard: '/member/dashboard',
  memberProfile: '/member/profile',
  memberMembership: '/member/membership',
  memberPayments: '/member/payments',
  memberEvents: '/member/events',
  memberResources: '/member/resources',
  memberCertificates: '/member/certificates',
  memberSettings: '/member/settings',
  admin: '/admin'
};

const PAGE_BY_PATH = Object.fromEntries(Object.entries(ROUTES).map(([page, path]) => [path, page]));

function pageFromLocation() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return PAGE_BY_PATH[path] || 'home';
}

function pathForPage(page) {
  return ROUTES[page] || '/';
}

export default function App() {
  const [page, setPage] = useState(pageFromLocation);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = (title, text) => {
    setToast({ title, text });
    window.setTimeout(() => setToast(null), 3400);
  };

  // Keep the browser URL/history in sync with the SPA. This makes the browser
  // Back/Forward buttons move through NI4E pages instead of leaving the site.
  useEffect(() => {
    const handlePopState = () => {
      setSearch(false);
      setLoading(false);
      setPage(pageFromLocation());
      window.scrollTo({ top: 0, behavior: 'auto' });
    };

    window.history.replaceState({ page: pageFromLocation() }, '', pathForPage(pageFromLocation()) + window.location.search + window.location.hash);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (nextPage) => {
    if (!ROUTES[nextPage] || nextPage === page) return;
    // Preserve the intended destination when a visitor must sign in before applying.
    if (nextPage === 'register') { try { window.sessionStorage.setItem('ni4e_after_login', 'register'); } catch {} }
    setSearch(false);
    setLoading(true);
    window.history.pushState({ page: nextPage }, '', pathForPage(nextPage));

    window.setTimeout(() => {
      setPage(nextPage);
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 520);
  };

  useEffect(() => {
    const key = (event) => {
      if (event.key === 'Escape') setSearch(false);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  let content;
  switch (page) {
    case 'home': content = <Home setPage={navigate} />; break;
    case 'about': content = <About setPage={navigate} />; break;
    case 'membership': content = <Membership setPage={navigate} />; break;
    case 'memberDirectory': content = <MemberDirectory />; break;
    case 'leadership': content = <Leadership setPage={navigate} />; break;
    case 'presidents': content = <Presidents setPage={navigate} />; break;
    case 'events': content = <Events setPage={navigate} />; break;
    case 'publications': content = <Publications setPage={navigate} />; break;
    case 'chapters': content = <Chapters setPage={navigate} />; break;
    case 'news': content = <News setPage={navigate} />; break;
    case 'projects': content = <ContentDirectory contentType="project" setPage={navigate} />; break;
    case 'technicalDivisions': content = <ContentDirectory contentType="technical_division" setPage={navigate} />; break;
    case 'committees': content = <ContentDirectory contentType="committee" setPage={navigate} />; break;
    case 'contact': content = <Contact setPage={navigate} />; break;
    case 'register': content = <ProtectedRoute setPage={navigate} allowApplicants><Register setPage={navigate} notify={notify} /></ProtectedRoute>; break;
    case 'fellowship': content = <Fellowship setPage={navigate} notify={notify} />; break;
    case 'login': content = <Login setPage={navigate} notify={notify} />; break;
    case 'payment': content = <Payments setPage={navigate} />; break;
    case 'membershipStatus': content = <ProtectedRoute setPage={navigate} allowApplicants><MembershipStatus setPage={navigate} /></ProtectedRoute>; break;
    case 'dashboard': content = <ProtectedRoute setPage={navigate} publicGate><Dashboard setPage={navigate} /></ProtectedRoute>; break;
    case 'memberProfile': content = <ProtectedRoute setPage={navigate} publicGate><MemberProfile setPage={navigate} /></ProtectedRoute>; break;
    case 'memberSettings': content = <ProtectedRoute setPage={navigate} publicGate><MemberSettings setPage={navigate} /></ProtectedRoute>; break;
    case 'memberMembership': case 'memberPayments': case 'memberEvents': case 'memberResources': content = <ProtectedRoute setPage={navigate} publicGate><PortalSection page={page} setPage={navigate} /></ProtectedRoute>; break;
    case 'memberCertificates': content = <ProtectedRoute setPage={navigate} publicGate><Certificates setPage={navigate} /></ProtectedRoute>; break;
    case 'admin': content = <ProtectedRoute setPage={navigate} requiredRole="admin"><Admin setPage={navigate} /></ProtectedRoute>; break;
    default: content = <Home setPage={navigate} />;
  }

  // Every route transition starts at the top, including direct state changes.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [page]);

  // Embedded detail panels should become visible when a user opens a profile or item.
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const panel = document.querySelector('.publicModalBackdrop .publicDetailModal, .modalBackdrop .detailModal');
      if (panel && panel.dataset.ni4eOpened !== 'true') {
        panel.dataset.ni4eOpened = 'true';
        window.requestAnimationFrame(() => panel.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }));
      }
    });
    observer.observe(document.querySelector('main') || document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [page]);

  const isPortal = ['dashboard', 'memberProfile', 'memberMembership', 'memberPayments', 'memberEvents', 'memberResources', 'memberCertificates', 'memberSettings', 'admin'].includes(page);

  return (
    <>
      <BuildStyles />
      <ScrollTop />
      <Header setPage={navigate} onSearch={() => setSearch(true)} />
      {loading && <PageLoader />}
      <main key={page} className={`siteMain pageTransition ${isPortal ? 'portalMain' : ''}`}>{content}</main>
      {!isPortal && <Footer setPage={navigate} />}
      <Toast toast={toast} />
      {search && <SearchOverlay close={() => setSearch(false)} setPage={navigate} />}
    </>
  );
}
