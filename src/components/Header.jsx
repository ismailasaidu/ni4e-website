import React, { useEffect, useRef, useState } from 'react';
import { Menu, X, Search, LogIn, UserRound, ChevronDown, ClipboardList, ShieldCheck, LogOut, CreditCard, LayoutDashboard } from 'lucide-react';
import { nav } from '../data/site';
import logo from '../assets/ni4e-logo.png';
import { useAuth } from '../firebase/auth';

export default function Header({ setPage, onSearch }) {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const accountRef = useRef(null);
  const { user, profile, loading: authLoading, logout } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const isActiveMember = profile?.membershipStatus === 'active';
  const accountLabel = isAdmin ? 'Administrator' : isActiveMember ? 'Active member' : 'Applicant account';
  const [mobileGroup, setMobileGroup] = useState('');

  const go = (page) => {
    setMobileGroup('');
    setOpen(false);
    setAccountOpen(false);
    setPage(page);
  };

  const signOut = async () => {
    try {
      await logout();
      setOpen(false);
      setAccountOpen(false);
      setPage('home');
    } catch (error) {
      console.error('NI4E sign out failed', error);
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    const onResize = () => { if (window.innerWidth > 980) setOpen(false); };
    const onPointerDown = (event) => { if (accountRef.current && !accountRef.current.contains(event.target)) setAccountOpen(false); };
    const onKeyDown = (event) => { if (event.key === 'Escape') { setAccountOpen(false); setOpen(false); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('menu-open', open);
    return () => document.body.classList.remove('menu-open');
  }, [open]);

  const accountActions = () => (
    <>
      {user ? (
        <>
          <div className="accountDropdownIdentity">
            <span className="accountAvatar"><UserRound size={17} /></span>
            <span><b>{profile?.fullName || user.email || 'NI4E account'}</b><small>{accountLabel}</small></span>
          </div>
          {!isAdmin && <button className="accountDropdownItem" onClick={() => go('dashboard')}><ClipboardList size={17} /><span>Membership application</span></button>}
          {!isAdmin && isActiveMember && <button className="accountDropdownItem" onClick={() => go('dashboard')}><LayoutDashboard size={17} /><span>Member portal</span></button>}
          {isAdmin && <button className="accountDropdownItem" onClick={() => go('admin')}><ShieldCheck size={17} /><span>Admin panel</span></button>}
          {!isAdmin && <button className="accountDropdownItem" onClick={() => go('payment')}><CreditCard size={17} /><span>Membership payment</span></button>}
          <div className="accountDropdownDivider" />
          <button className="accountDropdownItem accountSignOut" onClick={signOut}><LogOut size={17} /><span>Sign out</span></button>
        </>
      ) : (
        <>
          <button className="accountDropdownItem accountPrimary" onClick={() => go('login')}><LogIn size={17} /><span>Sign in</span></button>
          <button className="accountDropdownItem" onClick={() => go('membership')}><ShieldCheck size={17} /><span>Membership information</span></button>
          <button className="accountDropdownItem" onClick={() => go('register')}><ClipboardList size={17} /><span>Register / create account</span></button>
        </>
      )}
      {authLoading && <div className="accountDropdownLoading"><span className="buttonSpinner" /> Checking session…</div>}
    </>
  );

  const mobileGroups = [
    { title: 'Institution', items: nav.slice(0, 3) },
    { title: 'Resources & activities', items: nav.slice(3, 10) },
    { title: 'Contact', items: nav.slice(10) }
  ];

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="navwrap">
        <button className="brand" onClick={() => go('home')} aria-label="NI4E home">
          <img src={logo} alt="NI4E logo" />
          <span><b>NI4E</b><small>The Nigerian Institution of Energy,<br />Electrical & Electronics Engineers<br /><em>A Division of the Nigerian Society of Engineers (NSE)</em></small></span>
        </button>
        <nav className={open ? 'open' : ''} aria-label="Main navigation">
          <div className="desktopNavItems">{nav.map(([label, page]) => <button key={page} onClick={() => go(page)}>{label}</button>)}</div>
          <div className="mobileNavGroups">{mobileGroups.map(group => <section className="mobileNavGroup" key={group.title}><button type="button" className="mobileNavGroupToggle" aria-expanded={mobileGroup === group.title} onClick={() => setMobileGroup(current => current === group.title ? '' : group.title)}><span>{group.title}</span><ChevronDown size={16} className={mobileGroup === group.title ? 'accountChevron open' : 'accountChevron'} /></button>{mobileGroup === group.title && <div className="mobileNavGroupItems">{group.items.map(([label, page]) => <button key={page} onClick={() => go(page)}>{label}</button>)}</div>}</section>)}</div>
          <div className="mobileAccountBlock">
            <div className="mobileAccountTitle"><UserRound size={17} /><span>Account</span></div>
            {accountActions()}
          </div>
        </nav>
        <div className="navactions">
          <button className="iconbtn" onClick={onSearch} aria-label="Search NI4E"><Search size={18} /></button>
          <div className="accountMenuWrap" ref={accountRef}>
            <button className={`accountMenuTrigger ${accountOpen ? 'active' : ''}`} onClick={() => setAccountOpen(value => !value)} aria-expanded={accountOpen} aria-haspopup="menu">
              <UserRound size={17} /><span>Account</span><ChevronDown size={15} className={accountOpen ? 'accountChevron open' : 'accountChevron'} />
            </button>
            {accountOpen && <div className="accountDropdown" role="menu">{accountActions()}</div>}
          </div>
          <button className="mobile" onClick={() => setOpen(value => !value)} aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={open}>{open ? <X /> : <Menu />}</button>
        </div>
      </div>
    </header>
  );
}
