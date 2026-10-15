import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

export default function SpotlightCarousel({ items = [], label = 'Featured highlights', autoPlay = true }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!autoPlay || paused || items.length < 2) return undefined;
    const timer = window.setInterval(() => setIndex(i => (i + 1) % items.length), 6500);
    return () => window.clearInterval(timer);
  }, [autoPlay, paused, items.length]);

  if (!items.length) return null;
  const item = items[index];
  const move = (delta) => setIndex(i => (i + delta + items.length) % items.length);

  return (
    <section className="spotlightCarousel" aria-label={label}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false); }}>
      <div className="spotlightTexture" aria-hidden="true" />
      <div className="spotlightCopy" key={index}>
        <span className="spotlightEyebrow"><Sparkles size={14}/>{item.eyebrow || label}</span>
        <h2>{item.title}</h2>
        <p>{item.description}</p>
        {item.action && <button className="spotlightAction" onClick={item.action.onClick}>{item.action.label}<ArrowRight size={16}/></button>}
      </div>
      <div className="spotlightControls">
        <span className="spotlightCount">{String(index + 1).padStart(2, '0')} <i>/</i> {String(items.length).padStart(2, '0')}</span>
        <div className="spotlightDots" aria-label="Choose slide">
          {items.map((x, i) => <button key={x.title || i} className={i === index ? 'active' : ''} aria-label={`Show slide ${i + 1}`} aria-current={i === index ? 'true' : undefined} onClick={() => setIndex(i)} />)}
        </div>
        <button className="spotlightArrow" aria-label="Previous highlight" onClick={() => move(-1)}><ArrowLeft size={18}/></button>
        <button className="spotlightArrow" aria-label="Next highlight" onClick={() => move(1)}><ArrowRight size={18}/></button>
      </div>
    </section>
  );
}
