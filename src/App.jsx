import React, { useEffect, useState } from 'react';
import { BuildStyles, ScrollTop, Header, PageLoader, Footer, Toast, SearchOverlay } from './components';
import Home from './pages/Home';
import About from './pages/About';
import Membership from './pages/Membership';
import Leadership from './pages/Leadership';
import Presidents from './pages/Presidents';
import Events from './pages/Events';
import Publications from './pages/Publications';
import Chapters from './pages/Chapters';
import News from './pages/News';
import Contact from './pages/Contact';
import Fellowship from './pages/Fellowship';
import Login from './member/Login';
import Register from './member/Register';
import Dashboard from './member/Dashboard';
import Admin from './admin/Admin';
import './styles.css';

const ROUTES = {
  home: '/',
  about: '/about',
  membership: '/membership',
  leadership: '/leadership',
  presidents: '/past-presidents',
  events: '/events',
  publications: '/publications',
  chapters: '/chapters',
  news: '/news',
  contact: '/contact',
  register: '/membership/register',
  fellowship: '/membership/fellowship',
  login: '/login',
  dashboard: '/member/dashboard',
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

    window.history.replaceState({ page: pageFromLocation() }, '', pathForPage(pageFromLocation()));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (nextPage) => {
    if (!ROUTES[nextPage] || nextPage === page) return;
    setSearch(false);
    setLoading(true);
    window.history.pushState({ page: nextPage }, '', pathForPage(nextPage));

    window.setTimeout(() => {
      setPage(nextPage);
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 220);
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
    case 'leadership': content = <Leadership setPage={navigate} />; break;
    case 'presidents': content = <Presidents setPage={navigate} />; break;
    case 'events': content = <Events setPage={navigate} />; break;
    case 'publications': content = <Publications setPage={navigate} />; break;
    case 'chapters': content = <Chapters setPage={navigate} />; break;
    case 'news': content = <News setPage={navigate} />; break;
    case 'contact': content = <Contact setPage={navigate} />; break;
    case 'register': content = <Register setPage={navigate} notify={notify} />; break;
    case 'fellowship': content = <Fellowship setPage={navigate} notify={notify} />; break;
    case 'login': content = <Login setPage={navigate} notify={notify} />; break;
    case 'dashboard': content = <Dashboard setPage={navigate} />; break;
    case 'admin': content = <Admin setPage={navigate} />; break;
    default: content = <Home setPage={navigate} />;
  }

  const isPortal = ['dashboard', 'admin'].includes(page);

  return (
    <>
      <BuildStyles />
      <ScrollTop />
      <Header setPage={navigate} onSearch={() => setSearch(true)} />
      {loading && <PageLoader />}
      <main className={`siteMain ${isPortal ? 'portalMain' : ''}`}>{content}</main>
      {!isPortal && <Footer setPage={navigate} />}
      <Toast toast={toast} />
      {search && <SearchOverlay close={() => setSearch(false)} setPage={navigate} />}
    </>
  );
}
