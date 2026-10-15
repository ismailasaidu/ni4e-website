import React from 'react';
import logo from '../assets/ni4e-logo.png';

export default function PageLoader() {
  return (
    <div className="pageLoader" role="status" aria-live="polite" aria-label="Loading page">
      <div className="loaderMark">
        <img src={logo} alt="NI4E" />
        <span />
      </div>
      <p>Preparing your NI4E experience</p>
      <div className="loaderTrack"><span /></div>
    </div>
  );
}
